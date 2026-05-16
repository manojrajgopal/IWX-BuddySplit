import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { MemberRole } from '@/modules/members/entities/workspace-member.entity';

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';

@Entity({ name: 'invitations' })
export class InvitationEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column({ name: 'workspace_id', type: 'uuid' }) workspaceId: string;
  @Index() @Column({ type: 'citext' }) email: string;
  @Column({ name: 'invited_by', type: 'uuid' }) invitedBy: string;
  @Column({
    type: 'enum',
    enum: ['owner','admin','editor','viewer'],
    enumName: 'member_role',
    default: 'editor',
  })
  role: MemberRole;
  @Column({ name: 'token_hash', type: 'text' }) tokenHash: string;
  @Column({
    type: 'enum',
    enum: ['pending','accepted','declined','revoked','expired'],
    enumName: 'invite_status',
    default: 'pending',
  })
  status: InviteStatus;
  @Column({ name: 'expires_at', type: 'timestamptz' }) expiresAt: Date;
  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true }) acceptedAt: Date | null;
  @Column({ name: 'declined_at', type: 'timestamptz', nullable: true }) declinedAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
