import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type NotificationKind = 'expense' | 'settlement' | 'invitation' | 'workspace' | 'system' | 'reminder';

@Entity({ name: 'notifications' })
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'user_id', type: 'uuid' }) userId: string;
  @Column({ name: 'workspace_id', type: 'uuid', nullable: true }) workspaceId: string | null;
  @Column({
    type: 'enum',
    enum: ['expense','settlement','invitation','workspace','system','reminder'],
    enumName: 'notification_kind',
  })
  kind: NotificationKind;
  @Column({ type: 'text' }) title: string;
  @Column({ type: 'text', nullable: true }) body: string | null;
  @Column({ type: 'jsonb', nullable: true }) payload: Record<string, unknown> | null;
  @Column({ name: 'read_at', type: 'timestamptz', nullable: true }) readAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
