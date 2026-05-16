import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type SettlementStatus = 'pending' | 'partial' | 'completed' | 'cancelled';

@Entity({ name: 'settlements' })
export class SettlementEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'workspace_id', type: 'uuid' }) workspaceId: string;
  @Column({ type: 'int' }) epoch: number;
  @Column({ name: 'from_member_id', type: 'uuid' }) fromMemberId: string;
  @Column({ name: 'to_member_id', type: 'uuid' }) toMemberId: string;
  @Column({ name: 'amount_minor', type: 'bigint' }) amountMinor: string;
  @Column({ type: 'char', length: 3 }) currency: string;
  @Column({
    type: 'enum',
    enum: ['pending','partial','completed','cancelled'],
    enumName: 'settlement_status',
    default: 'pending',
  })
  status: SettlementStatus;
  @CreateDateColumn({ name: 'suggested_at', type: 'timestamptz' }) suggestedAt: Date;
  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true }) completedAt: Date | null;
  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true }) cancelledAt: Date | null;
  @Column({ name: 'created_by', type: 'uuid', nullable: true }) createdBy: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
