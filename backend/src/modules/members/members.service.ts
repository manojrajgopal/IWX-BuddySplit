import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceMemberEntity, MemberRole } from './entities/workspace-member.entity';
import { UserEntity } from '@/modules/users/entities/user.entity';

export interface MemberWithUser {
  id: string;
  workspaceId: string;
  userId: string;
  role: MemberRole;
  joinedAt: Date;
  leftAt: Date | null;
  user: { id: string; email: string; displayName: string; avatarUrl: string | null };
}

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(WorkspaceMemberEntity) private readonly members: Repository<WorkspaceMemberEntity>,
    @InjectRepository(UserEntity) private readonly users: Repository<UserEntity>,
  ) {}

  async listForWorkspace(workspaceId: string): Promise<MemberWithUser[]> {
    const rows = await this.members
      .createQueryBuilder('m')
      .innerJoin(UserEntity, 'u', 'u.id = m.user_id')
      .where('m.workspace_id = :w', { w: workspaceId })
      .andWhere('m.left_at IS NULL')
      .select([
        'm.id AS id', 'm.workspace_id AS "workspaceId"', 'm.user_id AS "userId"',
        'm.role AS role', 'm.joined_at AS "joinedAt"', 'm.left_at AS "leftAt"',
        'u.email AS email', 'u.display_name AS "displayName"', 'u.avatar_url AS "avatarUrl"',
      ])
      .orderBy('m.joined_at', 'ASC')
      .getRawMany();
    return rows.map((r) => ({
      id: r.id, workspaceId: r.workspaceId, userId: r.userId,
      role: r.role, joinedAt: r.joinedAt, leftAt: r.leftAt,
      user: { id: r.userId, email: r.email, displayName: r.displayName, avatarUrl: r.avatarUrl },
    }));
  }

  async requireMember(workspaceId: string, userId: string): Promise<WorkspaceMemberEntity> {
    const m = await this.members.findOne({ where: { workspaceId, userId } });
    if (!m || m.leftAt) throw new ForbiddenException('Not a member');
    return m;
  }

  async addByUserId(workspaceId: string, userId: string, role: MemberRole = 'editor'): Promise<WorkspaceMemberEntity> {
    const existing = await this.members.findOne({ where: { workspaceId, userId } });
    if (existing) {
      if (existing.leftAt) {
        await this.members.update({ id: existing.id }, { leftAt: null, role });
        const updated = await this.members.findOne({ where: { id: existing.id } });
        return updated!;
      }
      return existing;
    }
    return this.members.save(this.members.create({ workspaceId, userId, role }));
  }

  async leave(workspaceId: string, userId: string): Promise<void> {
    const m = await this.requireMember(workspaceId, userId);
    if (m.role === 'owner') throw new ForbiddenException('Owner cannot leave; transfer ownership first');
    await this.members.update({ id: m.id }, { leftAt: new Date() });
  }
}
