import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { InvitationEntity, InviteStatus } from './entities/invitation.entity';
import { MemberRole, WorkspaceMemberEntity } from '@/modules/members/entities/workspace-member.entity';
import { UsersService } from '@/modules/users/users.service';
import { MembersService } from '@/modules/members/members.service';
import { WorkspacesService } from '@/modules/workspaces/workspaces.service';
import { CryptoService } from '@/core/crypto/crypto.service';
import { MailService } from '@/core/mail/mail.service';
import { RealtimeGateway } from '@/core/realtime/realtime.gateway';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(InvitationEntity)
    private readonly invites: Repository<InvitationEntity>,
    @InjectRepository(WorkspaceMemberEntity)
    private readonly members: Repository<WorkspaceMemberEntity>,
    private readonly ds: DataSource,
    private readonly users: UsersService,
    private readonly memberSvc: MembersService,
    private readonly workspaces: WorkspacesService,
    private readonly crypto: CryptoService,
    private readonly mail: MailService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async createInvite(input: {
    workspaceId: string;
    email: string;
    role?: MemberRole;
    invitedByUserId: string;
    ttlHours?: number;
  }): Promise<{ invitationId: string; expiresAt: Date }> {
    const ws = await this.workspaces.getById(input.workspaceId);
    await this.memberSvc.requireMember(ws.id, input.invitedByUserId);
    const email = input.email.toLowerCase();
    const token = this.crypto.generateUrlToken();
    const tokenHash = this.crypto.hashToken(token);
    const expiresAt = new Date(Date.now() + (input.ttlHours ?? 168) * 3600 * 1000);

    const inv = await this.invites.save(this.invites.create({
      workspaceId: ws.id,
      email,
      invitedBy: input.invitedByUserId,
      role: input.role ?? 'editor',
      tokenHash,
      expiresAt,
      status: 'pending',
    }));

    const inviter = await this.users.require(input.invitedByUserId);
    const acceptUrl = `${process.env.PUBLIC_WEB_URL}/invitations/${inv.id}?token=${encodeURIComponent(token)}`;
    await this.mail.send({
      to: email,
      templateKey: 'invite.sent',
      variables: {
        inviterName: inviter.displayName,
        workspaceName: ws.name,
        acceptUrl,
      },
      fallbackSubject: `${inviter.displayName} invited you to "${ws.name}"`,
      fallbackHtml: `<p>${inviter.displayName} invited you to join "<b>${ws.name}</b>" on IWX-BuddySplit.</p>
                     <p><a href="${acceptUrl}">Open invitation</a></p>`,
    });
    return { invitationId: inv.id, expiresAt };
  }

  async getInvitation(id: string, token: string): Promise<InvitationEntity> {
    const inv = await this.invites.findOne({ where: { id } });
    if (!inv) throw new NotFoundException('Invitation not found');
    if (inv.tokenHash !== this.crypto.hashToken(token)) throw new ForbiddenException('Invalid token');
    if (inv.expiresAt.getTime() < Date.now() && inv.status === 'pending') {
      await this.invites.update({ id }, { status: 'expired' });
      inv.status = 'expired';
    }
    return inv;
  }

  async accept(invitationId: string, token: string, acceptingUserId: string): Promise<{ workspaceId: string }> {
    return this.ds.transaction(async (tx) => {
      const inv = await tx.getRepository(InvitationEntity).findOne({ where: { id: invitationId } });
      if (!inv) throw new NotFoundException();
      if (inv.tokenHash !== this.crypto.hashToken(token)) throw new ForbiddenException('Invalid token');
      if (inv.status !== 'pending') throw new BadRequestException(`Invitation is ${inv.status}`);
      if (inv.expiresAt.getTime() < Date.now()) {
        await tx.getRepository(InvitationEntity).update({ id: inv.id }, { status: 'expired' });
        throw new BadRequestException('Invitation expired');
      }
      const user = await this.users.require(acceptingUserId);
      if (user.email.toLowerCase() !== inv.email.toLowerCase()) {
        throw new ForbiddenException('Invitation belongs to a different email');
      }
      await this.memberSvc.addByUserId(inv.workspaceId, acceptingUserId, inv.role);
      await tx.getRepository(InvitationEntity).update({ id: inv.id }, {
        status: 'accepted', acceptedAt: new Date(),
      });
      await this.realtime.emit(`workspace:${inv.workspaceId}`, 'workspace.member.changed', {
        workspaceId: inv.workspaceId, userId: acceptingUserId, action: 'joined',
      });
      return { workspaceId: inv.workspaceId };
    });
  }

  async decline(invitationId: string, token: string): Promise<void> {
    const inv = await this.getInvitation(invitationId, token);
    if (inv.status !== 'pending') throw new BadRequestException();
    await this.invites.update({ id: inv.id }, { status: 'declined', declinedAt: new Date() });
  }

  async revoke(invitationId: string, byUserId: string): Promise<void> {
    const inv = await this.invites.findOne({ where: { id: invitationId } });
    if (!inv) throw new NotFoundException();
    await this.memberSvc.requireMember(inv.workspaceId, byUserId);
    await this.invites.update({ id: inv.id }, { status: 'revoked' });
  }

  listPendingForEmail(email: string): Promise<InvitationEntity[]> {
    return this.invites.find({
      where: { email: email.toLowerCase(), status: 'pending', expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
  }
}
