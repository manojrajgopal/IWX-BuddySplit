import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { ExpenseEntity } from '@/modules/expenses/entities/expense.entity';
import { ExpenseSplitEntity } from '@/modules/expenses/entities/expense-split.entity';
import { SettlementEntity, SettlementStatus } from './entities/settlement.entity';
import { SettlementTransactionEntity } from './entities/settlement-transaction.entity';
import { WorkspaceEntity } from '@/modules/workspaces/entities/workspace.entity';
import { WorkspaceMemberEntity } from '@/modules/members/entities/workspace-member.entity';
import { Money, SettlementEngine, MemberNet, Transfer } from '@/core/money';
import { RealtimeGateway } from '@/core/realtime/realtime.gateway';
import { NotifyBus } from '@/core/database/notify.bus';

export interface BalanceSummary {
  workspaceId: string;
  epoch: number;
  currency: string;
  members: Array<{ memberId: string; paid: string; owed: string; net: string }>;
  transfers: Array<{ from: string; to: string; amount: string }>;
}

@Injectable()
export class SettlementsService {
  constructor(
    @InjectRepository(WorkspaceEntity)        private readonly workspaces: Repository<WorkspaceEntity>,
    @InjectRepository(WorkspaceMemberEntity)  private readonly members: Repository<WorkspaceMemberEntity>,
    @InjectRepository(ExpenseEntity)          private readonly expenses: Repository<ExpenseEntity>,
    @InjectRepository(ExpenseSplitEntity)     private readonly splits: Repository<ExpenseSplitEntity>,
    @InjectRepository(SettlementEntity)       private readonly settlements: Repository<SettlementEntity>,
    @InjectRepository(SettlementTransactionEntity)
      private readonly txns: Repository<SettlementTransactionEntity>,
    private readonly ds: DataSource,
    private readonly realtime: RealtimeGateway,
    private readonly bus: NotifyBus,
  ) {}

  async summarize(workspaceId: string): Promise<BalanceSummary> {
    const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
    if (!ws) throw new NotFoundException();

    const memberRows = await this.members.find({ where: { workspaceId, leftAt: IsNull() } });

    // Aggregate paid & owed for the current epoch.
    const paid = new Map<string, bigint>();
    const owed = new Map<string, bigint>();
    for (const m of memberRows) {
      paid.set(m.id, 0n);
      owed.set(m.id, 0n);
    }

    const expensesRows = await this.expenses.find({
      where: { workspaceId, epoch: ws.epoch, deletedAt: IsNull() },
    });
    if (expensesRows.length > 0) {
      for (const e of expensesRows) {
        paid.set(e.payerMemberId, (paid.get(e.payerMemberId) ?? 0n) + BigInt(e.totalMinor));
      }
      const splitRows = await this.splits
        .createQueryBuilder('s')
        .where('s.expense_id IN (:...ids)', { ids: expensesRows.map((e) => e.id) })
        .getMany();
      for (const s of splitRows) {
        owed.set(s.memberId, (owed.get(s.memberId) ?? 0n) + BigInt(s.shareMinor));
      }
    }

    // Apply completed/partial settlements (paid + owed adjustments).
    const settled = await this.settlements.find({
      where: { workspaceId, epoch: ws.epoch },
    });
    for (const s of settled) {
      const txnSum = await this.txns
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.amount_minor)::text, \'0\')', 'sum')
        .where('t.settlement_id = :sid', { sid: s.id })
        .getRawOne<{ sum: string }>();
      const settledAmt = BigInt(txnSum?.sum ?? '0');
      if (settledAmt > 0n) {
        // Debtor effectively "pays" creditor → reduces debtor's debt, reduces creditor's credit.
        paid.set(s.fromMemberId, (paid.get(s.fromMemberId) ?? 0n) + settledAmt);
        paid.set(s.toMemberId,   (paid.get(s.toMemberId) ?? 0n)   - settledAmt);
      }
    }

    const nets: MemberNet[] = memberRows.map((m) => ({
      memberId: m.id,
      net: Money.of((paid.get(m.id) ?? 0n) - (owed.get(m.id) ?? 0n), ws.baseCurrency),
    }));

    const transfers: Transfer[] = SettlementEngine.simplify(ws.baseCurrency, nets);

    return {
      workspaceId,
      epoch: ws.epoch,
      currency: ws.baseCurrency,
      members: nets.map((n) => ({
        memberId: n.memberId,
        paid: (paid.get(n.memberId) ?? 0n).toString(),
        owed: (owed.get(n.memberId) ?? 0n).toString(),
        net: n.net.amount.toString(),
      })),
      transfers: transfers.map((t) => ({
        from: t.from, to: t.to, amount: t.amount.amount.toString(),
      })),
    };
  }

  /** Persist the suggested chain as `pending` settlements (idempotent per epoch). */
  async suggest(workspaceId: string, actorUserId: string): Promise<SettlementEntity[]> {
    const ws = await this.workspaces.findOne({ where: { id: workspaceId } });
    if (!ws) throw new NotFoundException();
    const summary = await this.summarize(workspaceId);

    return this.ds.transaction(async (tx) => {
      // Remove existing pending suggestions for this epoch.
      await tx.getRepository(SettlementEntity)
        .createQueryBuilder()
        .delete()
        .where('workspace_id = :w AND epoch = :e AND status = \'pending\'', { w: workspaceId, e: ws.epoch })
        .execute();

      const rows = summary.transfers.map((t) =>
        tx.getRepository(SettlementEntity).create({
          workspaceId, epoch: ws.epoch,
          fromMemberId: t.from, toMemberId: t.to,
          amountMinor: t.amount, currency: ws.baseCurrency,
          status: 'pending', createdBy: actorUserId,
        }),
      );
      const saved = await tx.getRepository(SettlementEntity).save(rows);
      await this.realtime.emit(`workspace:${workspaceId}`, 'settlement.suggested', {
        workspaceId, transfers: summary.transfers,
      });
      return saved;
    });
  }

  /** Record a payment (supports partial). Recomputes status. */
  async record(input: {
    settlementId: string;
    amountMinor: string;
    method?: string;
    reference?: string;
    note?: string;
    actorUserId: string;
  }): Promise<{ settlement: SettlementEntity; remainingMinor: string }> {
    const s = await this.settlements.findOne({ where: { id: input.settlementId } });
    if (!s) throw new NotFoundException();
    if (s.status === 'completed' || s.status === 'cancelled') {
      throw new ConflictException(`Settlement already ${s.status}`);
    }
    const pay = BigInt(input.amountMinor);
    if (pay <= 0n) throw new BadRequestException('Amount must be positive');

    return this.ds.transaction(async (tx) => {
      const txnRepo = tx.getRepository(SettlementTransactionEntity);
      const sRepo = tx.getRepository(SettlementEntity);
      const sumRaw = await txnRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.amount_minor)::text, \'0\')', 'sum')
        .where('t.settlement_id = :id', { id: s.id })
        .getRawOne<{ sum: string }>();
      const already = BigInt(sumRaw?.sum ?? '0');
      const total = BigInt(s.amountMinor);
      if (already + pay > total) {
        throw new BadRequestException('Payment exceeds remaining amount');
      }
      await txnRepo.save(txnRepo.create({
        settlementId: s.id,
        amountMinor: pay.toString(),
        method: input.method ?? null,
        reference: input.reference ?? null,
        note: input.note ?? null,
        recordedBy: input.actorUserId,
      }));

      let newStatus: SettlementStatus = s.status;
      let completedAt: Date | null = s.completedAt;
      if (already + pay >= total) { newStatus = 'completed'; completedAt = new Date(); }
      else { newStatus = 'partial'; }
      await sRepo.update({ id: s.id }, { status: newStatus, completedAt });
      const fresh = await sRepo.findOne({ where: { id: s.id } });

      await this.realtime.emit(`workspace:${s.workspaceId}`, 'settlement.recorded', {
        workspaceId: s.workspaceId, settlementId: s.id, status: newStatus,
      });
      await this.bus.publish({
        channel: 'cache', event: 'invalidate-tag', payload: { tag: `ws:${s.workspaceId}` },
      });

      const remaining = total - (already + pay);
      return { settlement: fresh!, remainingMinor: remaining.toString() };
    });
  }

  async cancel(settlementId: string): Promise<SettlementEntity> {
    const s = await this.settlements.findOne({ where: { id: settlementId } });
    if (!s) throw new NotFoundException();
    if (s.status === 'completed') throw new ConflictException('Cannot cancel a completed settlement');
    await this.settlements.update({ id: settlementId }, { status: 'cancelled', cancelledAt: new Date() });
    return (await this.settlements.findOne({ where: { id: settlementId } }))!;
  }
}
