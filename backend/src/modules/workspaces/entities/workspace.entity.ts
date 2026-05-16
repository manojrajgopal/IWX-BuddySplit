import {
  Column, CreateDateColumn, DeleteDateColumn, Entity, Index,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type WorkspaceStatus = 'active' | 'paused' | 'completed' | 'archived';
export type WorkspaceKind =
  | 'trip' | 'group' | 'roommates' | 'couple' | 'event'
  | 'team' | 'subscription' | 'temporary' | 'longterm' | 'business' | 'other';

@Entity({ name: 'workspaces' })
export class WorkspaceEntity {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({
    type: 'enum',
    enum: ['trip','group','roommates','couple','event','team','subscription','temporary','longterm','business','other'],
    enumName: 'workspace_kind',
    default: 'group',
  })
  kind: WorkspaceKind;

  @Column({ type: 'text' }) name: string;
  @Index({ unique: true }) @Column({ type: 'text' }) slug: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ name: 'base_currency', type: 'char', length: 3 }) baseCurrency: string;

  @Column({
    type: 'enum',
    enum: ['active','paused','completed','archived'],
    enumName: 'workspace_status',
    default: 'active',
  })
  status: WorkspaceStatus;

  @Column({ type: 'int', default: 1 }) epoch: number;
  @Column({ name: 'cover_color', type: 'text', nullable: true }) coverColor: string | null;
  @Column({ name: 'owner_id', type: 'uuid' }) ownerId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' }) deletedAt: Date | null;
}
