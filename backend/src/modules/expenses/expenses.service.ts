import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { ExpenseEntity, ExpenseSplitMode } from './entities/expense.entity';
import { ExpenseSplitEntity } from './entities/expense-split.entity';
import { WorkspaceMemberEntity } from '@/modules/members/entities/workspace-member.entity';
import { WorkspaceEntity } from '@/modules/workspaces/entities/workspace.entity';
import { Money, SplitEngine, SplitInput, SplitParticipant } from '@/core/money';
import { RealtimeGateway } from '@/core/realtime/realtime.gateway';
import { NotifyBus } from '@/core/database/notify.bus';

export interface CreateExpenseInput {
  workspaceId: string;
  actorUserId: string;
  payerMemberId: string;
  description: string;
  category?: string | null;
  occurredAt?: Date;
  total: Money;
  notes?: string | null;
  splitMode: ExpenseSplitMode;
  // Raw split config — interpreted by the engine.
  splitConfig: Record<string, unknown>;
  // Participants by memberId (for modes that need them).
  participantMemberIds?: string[];
}

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(ExpenseEntity)        private readonly expenses: Repository<ExpenseEntity>,
    @InjectRepository(ExpenseSplitEntity)   private readonly splits:   Repository<ExpenseSplitEntity>,
    @InjectRepository(WorkspaceMemberEntity) private readonly members: Repository<WorkspaceMemberEntity>,
    @InjectRepository(WorkspaceEntity)       private readonly workspaces: Repository<WorkspaceEntity>,
    private readonly ds: DataSource,
    private readonly realtime: RealtimeGateway,
    private readonly bus: NotifyBus,
  ) {}

  async list(workspaceId: string): Promise<ExpenseEntity[]> {
    return this.expenses.find({
      where: { workspaceId, deletedAt: IsNull() },
      order: { occurredAt: 'DESC' },
    });
  }

  async getById(id: string): Promise<ExpenseEntity> {
    const e = await this.expenses.findOne({ where: { id } });
    if (!e || e.deletedAt) throw new NotFoundException('Expense not found');
    return e;
  }

  async detail(workspaceId: string, id: string) {
    const e = await this.expenses.findOne({ where: { id, workspaceId, deletedAt: IsNull() } });
    if (!e) throw new NotFoundException('Expense not found');
    const splits = await this.splits.find({ where: { expenseId: id } });
    const memberIds = [...new Set([e.payerMemberId, ...splits.map(s => s.memberId)])];
    const memberRows = await this.members.find({ where: { workspaceId } });
    const userIds = memberRows.filter(m => memberIds.includes(m.id)).map(m => m.userId);
    // Resolve display names via a raw query on the users table.
    const users: Array<{ id: string; display_name: string }> = userIds.length > 0
      ? await this.ds.query(`SELECT id, display_name FROM users WHERE id = ANY($1)`, [userIds])
      : [];
    const userNameMap = new Map(users.map(u => [u.id, u.display_name]));
    const memberNameMap = new Map(memberRows.map(m => [m.id, userNameMap.get(m.userId) ?? '']));
    return {
      ...e,
      payerName: memberNameMap.get(e.payerMemberId) ?? '',
      createdByName: memberNameMap.get(
        memberRows.find(m => m.userId === e.createdBy)?.id ?? '',
      ) ?? '',
      splits: splits.map(s => ({
        memberId: s.memberId,
        memberName: memberNameMap.get(s.memberId) ?? '',
        shareMinor: s.shareMinor,
      })),
    };
  }

  async create(input: CreateExpenseInput): Promise<ExpenseEntity> {
    const ws = await this.workspaces.findOne({ where: { id: input.workspaceId } });
    if (!ws) throw new NotFoundException('Workspace not found');
    if (ws.status !== 'active') throw new ConflictException(`Workspace is ${ws.status}`);
    if (input.total.currency !== ws.baseCurrency) {
      throw new BadRequestException('Expense currency must match workspace base currency');
    }
    const memberRows = await this.members.find({
      where: { workspaceId: ws.id, leftAt: IsNull() },
    });
    const memberById = new Map(memberRows.map((m) => [m.id, m]));
    if (!memberById.has(input.payerMemberId)) {
      throw new BadRequestException('Payer is not an active member');
    }

    // Build participants list (sorted deterministically by joined_at, id).
    const participantIds = input.participantMemberIds && input.participantMemberIds.length > 0
      ? input.participantMemberIds
      : memberRows.map((m) => m.id);
    for (const pid of participantIds) {
      if (!memberById.has(pid)) throw new BadRequestException(`Unknown participant ${pid}`);
    }
    const participants: SplitParticipant[] = participantIds
      .map((pid) => memberById.get(pid)!)
      .sort((a, b) => {
        const t = a.joinedAt.getTime() - b.joinedAt.getTime();
        return t !== 0 ? t : (a.id < b.id ? -1 : 1);
      })
      .map((m) => ({ memberId: m.id, orderKey: `${m.joinedAt.toISOString()}|${m.id}` }));

    const splitInput = this.parseSplitInput(input.splitMode, input.splitConfig, participants, input.total);
    const shares = SplitEngine.split(input.total, splitInput);

    return this.ds.transaction(async (tx) => {
      const e = await tx.getRepository(ExpenseEntity).save(
        tx.getRepository(ExpenseEntity).create({
          workspaceId: ws.id,
          epoch: ws.epoch,
          payerMemberId: input.payerMemberId,
          description: input.description,
          category: input.category ?? null,
          occurredAt: input.occurredAt ?? new Date(),
          totalMinor: input.total.amount.toString(),
          currency: input.total.currency,
          splitMode: input.splitMode,
          splitConfig: input.splitConfig,
          notes: input.notes ?? null,
          createdBy: input.actorUserId,
        }),
      );
      const rows = shares.map((s) => tx.getRepository(ExpenseSplitEntity).create({
        expenseId: e.id,
        memberId: s.memberId,
        shareMinor: s.share.amount.toString(),
      }));
      await tx.getRepository(ExpenseSplitEntity).save(rows);

      await this.afterMutation(ws.id, 'expense.created', { expenseId: e.id });
      return e;
    });
  }

  async softDelete(id: string, actorUserId: string): Promise<void> {
    const e = await this.getById(id);
    await this.expenses.update({ id }, { deletedAt: new Date(), updatedBy: actorUserId });
    await this.afterMutation(e.workspaceId, 'expense.deleted', { expenseId: id });
  }

  // ── helpers ────────────────────────────────────────────────────────────
  private parseSplitInput(
    mode: ExpenseSplitMode,
    cfg: Record<string, unknown>,
    participants: SplitParticipant[],
    total: Money,
  ): SplitInput {
    switch (mode) {
      case 'equal':
        return { mode: 'equal', participants };
      case 'shares': {
        const shares = (cfg.shares as Record<string, number>) ?? {};
        return { mode: 'shares', participants, shares };
      }
      case 'percentage': {
        const bp = (cfg.bp as Record<string, number>) ?? {};
        return { mode: 'percentage', participants, bp };
      }
      case 'exact': {
        const raw = (cfg.amounts as Record<string, string>) ?? {};
        const entries = Object.entries(raw).map(([memberId, amt]) => ({
          memberId, amount: Money.of(BigInt(amt), total.currency),
        }));
        return { mode: 'exact', entries };
      }
      case 'adjustment': {
        const raw = (cfg.adjustments as Record<string, string>) ?? {};
        const adjustments: Record<string, Money> = {};
        for (const [m, v] of Object.entries(raw)) {
          adjustments[m] = Money.of(BigInt(v), total.currency);
        }
        return { mode: 'adjustment', participants, adjustments };
      }
      case 'itemized': {
        const raw = (cfg.lines as Array<{ memberId: string; amount: string }>) ?? [];
        const lines = raw.map((l) => ({ memberId: l.memberId, amount: Money.of(BigInt(l.amount), total.currency) }));
        return { mode: 'itemized', lines };
      }
    }
  }

  private async afterMutation(workspaceId: string, event: string, data: Record<string, unknown>): Promise<void> {
    await this.realtime.emit(`workspace:${workspaceId}`, event, { workspaceId, ...data });
    await this.bus.publish({ channel: 'cache', event: 'invalidate-tag', payload: { tag: `ws:${workspaceId}` } });
  }
}
