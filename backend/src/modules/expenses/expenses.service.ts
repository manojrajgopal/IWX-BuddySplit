import {
  BadRequestException, ConflictException, ForbiddenException, forwardRef, Inject, Injectable, NotFoundException,
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
import { MailService } from '@/core/mail/mail.service';
import { SettlementsService } from '@/modules/settlements/settlements.service';

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
    private readonly mail: MailService,
    @Inject(forwardRef(() => SettlementsService))
    private readonly settlementsService: SettlementsService,
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

    const expense = await this.ds.transaction(async (tx) => {
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

    // Send email notification to all circle members (fire-and-forget)
    this.sendExpenseNotification(expense, ws, memberRows, memberById, shares, input).catch(() => {});

    return expense;
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

  private async sendExpenseNotification(
    expense: ExpenseEntity,
    workspace: WorkspaceEntity,
    memberRows: WorkspaceMemberEntity[],
    memberById: Map<string, WorkspaceMemberEntity>,
    shares: Array<{ memberId: string; share: Money }>,
    input: CreateExpenseInput,
  ): Promise<void> {
    // Resolve all member names and emails
    const userIds = memberRows.map(m => m.userId);
    const users: Array<{ id: string; email: string; display_name: string }> = userIds.length > 0
      ? await this.ds.query(`SELECT id, email, display_name FROM users WHERE id = ANY($1)`, [userIds])
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));
    const memberNameMap = new Map(memberRows.map(m => [m.id, userMap.get(m.userId)?.display_name ?? 'Unknown']));

    const payerName = memberNameMap.get(expense.payerMemberId) ?? 'Someone';
    const createdByMember = memberRows.find(m => m.userId === input.actorUserId);
    const createdByName = createdByMember ? (memberNameMap.get(createdByMember.id) ?? 'Someone') : 'Someone';

    // Format amount from minor units
    const digits = expense.currency === 'JPY' || expense.currency === 'KRW' ? 0 : 2;
    const totalNum = Number(BigInt(expense.totalMinor)) / Math.pow(10, digits);
    const formattedAmount = totalNum.toFixed(digits);

    // Build splits info
    const splitsForEmail = shares.map(s => {
      const shareNum = Number(s.share.amount) / Math.pow(10, digits);
      return {
        memberName: memberNameMap.get(s.memberId) ?? 'Unknown',
        formattedShare: shareNum.toFixed(digits),
        isPayer: s.memberId === expense.payerMemberId,
      };
    });

    // Calculate suggested transfers (for THIS expense only — who owes the payer)
    const suggestedTransfers: Array<{ from: string; to: string; formattedAmount: string }> = [];
    for (const s of shares) {
      if (s.memberId !== expense.payerMemberId && s.share.amount > BigInt(0)) {
        const shareNum = Number(s.share.amount) / Math.pow(10, digits);
        suggestedTransfers.push({
          from: memberNameMap.get(s.memberId) ?? 'Unknown',
          to: payerName,
          formattedAmount: shareNum.toFixed(digits),
        });
      }
    }

    // Calculate OVERALL suggested transfers (net across all expenses + settlements)
    // This is the same data shown on the Settlements page.
    const overallTransfers: Array<{ from: string; to: string; formattedAmount: string }> = [];
    const overallBalances: Array<{ memberName: string; formattedPaid: string; formattedOwed: string; formattedNet: string; netColor: string; netPrefix: string }> = [];
    try {
      const summary = await this.settlementsService.summarize(expense.workspaceId);
      for (const t of summary.transfers) {
        const amt = Number(BigInt(t.amount)) / Math.pow(10, digits);
        overallTransfers.push({
          from: memberNameMap.get(t.from) ?? 'Unknown',
          to: memberNameMap.get(t.to) ?? 'Unknown',
          formattedAmount: amt.toFixed(digits),
        });
      }
      for (const m of summary.members) {
        const paidN = Number(BigInt(m.paid)) / Math.pow(10, digits);
        const owedN = Number(BigInt(m.owed)) / Math.pow(10, digits);
        const netN = Number(BigInt(m.net)) / Math.pow(10, digits);
        overallBalances.push({
          memberName: memberNameMap.get(m.memberId) ?? 'Unknown',
          formattedPaid: paidN.toFixed(digits),
          formattedOwed: owedN.toFixed(digits),
          formattedNet: Math.abs(netN).toFixed(digits),
          netColor: netN > 0 ? '#0a7f3f' : netN < 0 ? '#c0392b' : '#999',
          netPrefix: netN < 0 ? '-' : netN > 0 ? '+' : '',
        });
      }
    } catch {
      // Non-fatal; skip overall section if summarize fails.
    }

    const occurredAt = expense.occurredAt.toLocaleDateString('en-IN', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });

    const webUrl = process.env.PUBLIC_WEB_URL ?? '';
    const expenseUrl = `${webUrl}/circles/${expense.workspaceId}/expenses`;

    // Send to all active members
    const recipients = memberRows
      .filter(m => !m.leftAt)
      .map(m => userMap.get(m.userId)?.email)
      .filter((email): email is string => !!email);

    if (recipients.length === 0) return;

    await this.mail.send({
      to: recipients,
      templateKey: 'expense.created',
      variables: {
        workspaceName: workspace.name,
        description: expense.description,
        currency: expense.currency,
        formattedAmount,
        payerName,
        createdByName,
        category: expense.category || 'Uncategorized',
        splitMode: expense.splitMode.charAt(0).toUpperCase() + expense.splitMode.slice(1),
        occurredAt,
        notes: (expense as any).notes ?? '',
        splits: splitsForEmail,
        suggestedTransfers,
        overallTransfers,
        overallBalances,
        hasOverall: overallTransfers.length > 0,
        expenseUrl,
      },
      fallbackSubject: `New expense in "${workspace.name}" — ${expense.description}`,
    });
  }
}
