import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { NotificationEntity, NotificationKind } from './entities/notification.entity';
import { RealtimeGateway } from '@/core/realtime/realtime.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
    private readonly realtime: RealtimeGateway,
  ) {}

  async push(input: {
    userId: string;
    kind: NotificationKind;
    title: string;
    body?: string;
    workspaceId?: string | null;
    payload?: Record<string, unknown>;
  }): Promise<NotificationEntity> {
    const n = await this.repo.save(this.repo.create({
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      workspaceId: input.workspaceId ?? null,
      payload: input.payload ?? null,
    }));
    await this.realtime.emit(`user:${input.userId}`, 'notification.new', {
      id: n.id, kind: n.kind, title: n.title, body: n.body,
      workspaceId: n.workspaceId, createdAt: n.createdAt,
    });
    return n;
  }

  async listForUser(userId: string, limit = 50): Promise<NotificationEntity[]> {
    return this.repo.find({
      where: { userId },
      order: { id: 'DESC' },
      take: limit,
    });
  }

  async markRead(userId: string, id: string): Promise<void> {
    await this.repo.update({ id, userId }, { readAt: new Date() });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ readAt: new Date() })
      .where('user_id = :u AND read_at IS NULL', { u: userId })
      .execute();
  }

  async unreadCount(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, readAt: IsNull() } });
  }
}
