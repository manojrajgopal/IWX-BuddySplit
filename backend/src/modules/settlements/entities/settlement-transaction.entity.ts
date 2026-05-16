import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'settlement_transactions' })
export class SettlementTransactionEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'settlement_id', type: 'uuid' }) settlementId: string;
  @Column({ name: 'amount_minor', type: 'bigint' }) amountMinor: string;
  @Column({ type: 'text', nullable: true }) method: string | null;
  @Column({ type: 'text', nullable: true }) reference: string | null;
  @Column({ type: 'text', nullable: true }) note: string | null;
  @Column({ name: 'recorded_by', type: 'uuid', nullable: true }) recordedBy: string | null;
  @CreateDateColumn({ name: 'recorded_at', type: 'timestamptz' }) recordedAt: Date;
}
