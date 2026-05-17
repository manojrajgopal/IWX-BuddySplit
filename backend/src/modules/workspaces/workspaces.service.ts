import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { WorkspaceEntity, WorkspaceKind, WorkspaceStatus } from './entities/workspace.entity';
import { WorkspaceMemberEntity } from '@/modules/members/entities/workspace-member.entity';
import { RealtimeGateway } from '@/core/realtime/realtime.gateway';
import { isSupportedCurrency } from '@/core/money';
import { NotifyBus } from '@/core/database/notify.bus';

interface CreateInput {
  name: string;
  kind: WorkspaceKind;
  baseCurrency: string;
  description?: string | null;
  coverColor?: string | null;
  ownerUserId: string;
}

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectRepository(WorkspaceEntity) private readonly workspaces: Repository<WorkspaceEntity>,
    @InjectRepository(WorkspaceMemberEntity) private readonly members: Repository<WorkspaceMemberEntity>,
    private readonly ds: DataSource,
    private readonly realtime: RealtimeGateway,
    private readonly bus: NotifyBus,
  ) {}

  async create(input: CreateInput): Promise<WorkspaceEntity> {
    if (!isSupportedCurrency(input.baseCurrency.toUpperCase())) {
      throw new BadRequestException('Invalid base currency');
    }
    return this.ds.transaction(async (tx) => {
      const slug = await this.uniqueSlug(input.name, tx);
      const ws = await tx.getRepository(WorkspaceEntity).save(
        tx.getRepository(WorkspaceEntity).create({
          name: input.name,
          kind: input.kind,
          baseCurrency: input.baseCurrency.toUpperCase(),
          description: input.description ?? null,
          coverColor: input.coverColor ?? null,
          ownerId: input.ownerUserId,
          slug,
          status: 'active',
        }),
      );
      await tx.getRepository(WorkspaceMemberEntity).save(
        tx.getRepository(WorkspaceMemberEntity).create({
          workspaceId: ws.id,
          userId: input.ownerUserId,
          role: 'owner',
        }),
      );
      return ws;
    });
  }

  async listForUser(userId: string): Promise<(WorkspaceEntity & { memberCount: number })[]> {
    const rows = await this.workspaces
      .createQueryBuilder('w')
      .innerJoin(WorkspaceMemberEntity, 'm', 'm.workspace_id = w.id AND m.left_at IS NULL')
      .addSelect((sub) =>
        sub.select('COUNT(*)')
          .from(WorkspaceMemberEntity, 'mc')
          .where('mc.workspace_id = w.id')
          .andWhere('mc.left_at IS NULL'),
        'member_count',
      )
      .where('m.user_id = :uid', { uid: userId })
      .andWhere('w.deleted_at IS NULL')
      .orderBy('w.updated_at', 'DESC')
      .groupBy('w.id')
      .getRawAndEntities();

    const countMap = new Map<string, number>();
    for (const raw of rows.raw) {
      countMap.set(raw.w_id, parseInt(raw.member_count, 10) || 0);
    }
    return rows.entities.map((e) => Object.assign(e, { memberCount: countMap.get(e.id) ?? 0 }));
  }

  async getById(id: string): Promise<WorkspaceEntity> {
    const ws = await this.workspaces.findOne({ where: { id } });
    if (!ws || ws.deletedAt) throw new NotFoundException('Workspace not found');
    return ws;
  }

  async setStatus(id: string, newStatus: WorkspaceStatus, actorUserId: string): Promise<WorkspaceEntity> {
    const ws = await this.getById(id);
    const allowed = transitions[ws.status]?.includes(newStatus);
    if (!allowed) throw new ConflictException(`Cannot transition ${ws.status} → ${newStatus}`);
    const member = await this.members.findOne({ where: { workspaceId: id, userId: actorUserId } });
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new ForbiddenException('Only owners/admins can change status');
    }
    const patch: Partial<WorkspaceEntity> = { status: newStatus };
    if (ws.status === 'completed' && newStatus === 'active') {
      // Reopen → new epoch.
      patch.epoch = ws.epoch + 1;
    }
    await this.workspaces.update({ id }, patch);
    const fresh = await this.getById(id);
    await this.realtime.emit(`workspace:${id}`, 'workspace.status.changed', {
      workspaceId: id, status: fresh.status, epoch: fresh.epoch,
    });
    await this.bus.publish({ channel: 'cache', event: 'invalidate-tag', payload: { tag: `ws:${id}` } });
    return fresh;
  }

  private async uniqueSlug(name: string, tx: EntityManager): Promise<string> {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48) || 'workspace';
    let slug = base;
    let i = 0;
    const repo = tx.getRepository(WorkspaceEntity);
    while (await repo.findOne({ where: { slug } })) {
      i += 1;
      slug = `${base}-${i}`;
      if (i > 100) { slug = `${base}-${Date.now().toString(36)}`; break; }
    }
    return slug;
  }
}

const transitions: Record<WorkspaceStatus, WorkspaceStatus[]> = {
  active:    ['paused', 'completed', 'archived'],
  paused:    ['active', 'completed', 'archived'],
  completed: ['active', 'archived'],
  archived:  [],
};
