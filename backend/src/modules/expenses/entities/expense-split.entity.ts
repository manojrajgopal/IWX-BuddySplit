import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'expense_splits' })
@Unique(['expenseId', 'memberId'])
export class ExpenseSplitEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'expense_id', type: 'uuid' }) expenseId: string;
  @Index() @Column({ name: 'member_id', type: 'uuid' }) memberId: string;
  @Column({ name: 'share_minor', type: 'bigint' }) shareMinor: string;
  @Column({ type: 'jsonb', nullable: true }) meta: Record<string, unknown> | null;
}
