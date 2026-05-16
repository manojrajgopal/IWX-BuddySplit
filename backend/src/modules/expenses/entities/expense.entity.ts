import {
  Column, CreateDateColumn, DeleteDateColumn, Entity, Index,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type ExpenseSplitMode = 'equal' | 'exact' | 'percentage' | 'shares' | 'adjustment' | 'itemized';

@Entity({ name: 'expenses' })
export class ExpenseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'workspace_id', type: 'uuid' }) workspaceId: string;
  @Column({ type: 'int' }) epoch: number;
  @Column({ name: 'payer_member_id', type: 'uuid' }) payerMemberId: string;
  @Column({ type: 'text' }) description: string;
  @Column({ type: 'text', nullable: true }) category: string | null;
  @Column({ name: 'occurred_at', type: 'timestamptz' }) occurredAt: Date;

  /** BIGINT minor units. TypeORM returns bigints as strings; we convert in the service layer. */
  @Column({ name: 'total_minor', type: 'bigint' }) totalMinor: string;

  @Column({ type: 'char', length: 3 }) currency: string;

  @Column({
    name: 'split_mode',
    type: 'enum',
    enum: ['equal','exact','percentage','shares','adjustment','itemized'],
    enumName: 'expense_split_mode',
  })
  splitMode: ExpenseSplitMode;

  @Column({ name: 'split_config', type: 'jsonb' }) splitConfig: Record<string, unknown>;
  @Column({ type: 'text', nullable: true }) notes: string | null;

  @Column({ name: 'created_by', type: 'uuid' }) createdBy: string;
  @Column({ name: 'updated_by', type: 'uuid', nullable: true }) updatedBy: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' }) deletedAt: Date | null;
}
