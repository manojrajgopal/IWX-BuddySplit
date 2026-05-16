import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';

export type MemberRole = 'owner' | 'admin' | 'editor' | 'viewer';

@Entity({ name: 'workspace_members' })
@Unique(['workspaceId', 'userId'])
export class WorkspaceMemberEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'workspace_id', type: 'uuid' }) workspaceId: string;
  @Column({ name: 'user_id', type: 'uuid' }) userId: string;

  @Column({
    type: 'enum',
    enum: ['owner','admin','editor','viewer'],
    enumName: 'member_role',
    default: 'editor',
  })
  role: MemberRole;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamptz' }) joinedAt: Date;
  @Column({ name: 'left_at', type: 'timestamptz', nullable: true }) leftAt: Date | null;
}
