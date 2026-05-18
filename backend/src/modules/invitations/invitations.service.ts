import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, MoreThan, Repository } from 'typeorm';
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
  private readonly logger = new Logger(InvitationsService.name);

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
    const ttlHours = input.ttlHours ?? 168;
    const expiresIn = ttlHours >= 24
      ? `${Math.round(ttlHours / 24)} day${Math.round(ttlHours / 24) === 1 ? '' : 's'}`
      : `${ttlHours} hour${ttlHours === 1 ? '' : 's'}`;
    const role = (input.role ?? 'editor');
    await this.mail.send({
      to: email,
      templateKey: 'invite.sent',
      variables: {
        inviterName: inviter.displayName,
        workspaceName: ws.name,
        role: role.charAt(0).toUpperCase() + role.slice(1),
        acceptUrl,
        expiresIn,
      },
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
      // Send member-joined email to all existing members (fire-and-forget)
      this.sendMemberJoinedNotification(inv.workspaceId, acceptingUserId, inv.role).catch(() => {});
      return { workspaceId: inv.workspaceId };
    });
  }

  async decline(invitationId: string, token: string): Promise<void> {
    const inv = await this.getInvitation(invitationId, token);
    if (inv.status !== 'pending') throw new BadRequestException();
    await this.invites.update({ id: inv.id }, { status: 'declined', declinedAt: new Date() });
  }

  async acceptByUser(invitationId: string, userId: string): Promise<{ workspaceId: string }> {
    return this.ds.transaction(async (tx) => {
      const inv = await tx.getRepository(InvitationEntity).findOne({ where: { id: invitationId } });
      if (!inv) throw new NotFoundException();
      if (inv.status !== 'pending') throw new BadRequestException(`Invitation is ${inv.status}`);
      if (inv.expiresAt.getTime() < Date.now()) {
        await tx.getRepository(InvitationEntity).update({ id: inv.id }, { status: 'expired' });
        throw new BadRequestException('Invitation expired');
      }
      const user = await this.users.require(userId);
      if (user.email.toLowerCase() !== inv.email.toLowerCase()) {
        throw new ForbiddenException('Invitation belongs to a different email');
      }
      await this.memberSvc.addByUserId(inv.workspaceId, userId, inv.role);
      await tx.getRepository(InvitationEntity).update({ id: inv.id }, {
        status: 'accepted', acceptedAt: new Date(),
      });
      await this.realtime.emit(`workspace:${inv.workspaceId}`, 'workspace.member.changed', {
        workspaceId: inv.workspaceId, userId, action: 'joined',
      });
      // Send member-joined email to all existing members (fire-and-forget)
      this.sendMemberJoinedNotification(inv.workspaceId, userId, inv.role).catch(() => {});
      return { workspaceId: inv.workspaceId };
    });
  }

  async declineByUser(invitationId: string, userId: string): Promise<void> {
    const inv = await this.invites.findOne({ where: { id: invitationId } });
    if (!inv) throw new NotFoundException();
    if (inv.status !== 'pending') throw new BadRequestException();
    const user = await this.users.require(userId);
    if (user.email.toLowerCase() !== inv.email.toLowerCase()) {
      throw new ForbiddenException('Invitation belongs to a different email');
    }
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

  async listPendingForUser(userId: string): Promise<Array<{
    id: string; workspaceId: string; workspaceName: string;
    inviterName: string; role: string; email: string;
    expiresAt: Date; createdAt: Date;
  }>> {
    const user = await this.users.require(userId);
    const invites = await this.invites.find({
      where: { email: user.email.toLowerCase(), status: 'pending', expiresAt: MoreThan(new Date()) },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(invites.map(async (inv) => {
      const [ws, inviter] = await Promise.all([
        this.workspaces.getById(inv.workspaceId).catch(() => null),
        this.users.findById(inv.invitedBy),
      ]);
      return {
        id: inv.id,
        workspaceId: inv.workspaceId,
        workspaceName: ws?.name ?? 'Unknown circle',
        inviterName: inviter?.displayName ?? 'Someone',
        role: inv.role,
        email: inv.email,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      };
    }));
  }

  private async sendMemberJoinedNotification(
    workspaceId: string,
    newUserId: string,
    role: MemberRole,
  ): Promise<void> {
    try {
      const [ws, newUser] = await Promise.all([
        this.workspaces.getById(workspaceId),
        this.users.require(newUserId),
      ]);

      // Get all active members including the new one
      const allMembers = await this.members.find({
        where: { workspaceId, leftAt: IsNull() },
      });

      // Resolve all user details
      const userIds = allMembers.map(m => m.userId);
      const usersData: Array<{ id: string; email: string; display_name: string }> = userIds.length > 0
        ? await this.ds.query(`SELECT id, email, display_name FROM users WHERE id = ANY($1)`, [userIds])
        : [];
      const userMap = new Map(usersData.map(u => [u.id, u]));

      // Build members list for the email
      const membersForEmail = allMembers.map(m => {
        const u = userMap.get(m.userId);
        return {
          name: u?.display_name ?? 'Unknown',
          role: m.role.charAt(0).toUpperCase() + m.role.slice(1),
          isNew: m.userId === newUserId,
        };
      });

      // Recipients: all members except the new one
      const recipients = allMembers
        .filter(m => m.userId !== newUserId)
        .map(m => userMap.get(m.userId)?.email)
        .filter((email): email is string => !!email);

      if (recipients.length === 0) return;

      const memberName = newUser.displayName || newUser.email;
      const memberInitial = (memberName.charAt(0) || '?').toUpperCase();
      const joinedAt = new Date().toLocaleDateString('en-IN', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      });
      const webUrl = process.env.PUBLIC_WEB_URL ?? '';
      const circleUrl = `${webUrl}/circles/${workspaceId}`;

      await this.mail.send({
        to: recipients,
        templateKey: 'member.joined',
        variables: {
          workspaceName: ws.name,
          memberName,
          memberEmail: newUser.email,
          memberInitial,
          role: role.charAt(0).toUpperCase() + role.slice(1),
          joinedAt,
          memberCount: allMembers.length,
          members: membersForEmail,
          circleUrl,
        },
        fallbackSubject: `${memberName} joined "${ws.name}" — IWX BuddySplit`,
      });
    } catch (err) {
      this.logger.warn(`member.joined notification failed: ${(err as Error).message}`);
    }
  }
}
