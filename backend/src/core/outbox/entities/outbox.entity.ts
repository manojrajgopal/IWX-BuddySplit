import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'outbox' })
export class OutboxEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'text' }) kind: 'email' | 'realtime' | 'revalidate' | string;
  @Column({ type: 'jsonb' }) payload: Record<string, unknown>;
  @Column({ type: 'text', default: 'pending' }) status: 'pending' | 'sent' | 'failed';
  @Column({ type: 'int', default: 0 }) attempts: number;
  @Column({ name: 'last_error', type: 'text', nullable: true }) lastError: string | null;
  @Column({ name: 'available_at', type: 'timestamptz', default: () => 'now()' }) availableAt: Date;
  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true }) sentAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
