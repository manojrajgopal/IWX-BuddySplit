import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '@/common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) { return this.service.listForUser(u.id); }

  @Get('unread-count')
  async unread(@CurrentUser() u: AuthUser): Promise<{ count: number }> {
    return { count: await this.service.unreadCount(u.id) };
  }

  @Post(':id/read')
  async read(@CurrentUser() u: AuthUser, @Param('id') id: string): Promise<{ ok: true }> {
    await this.service.markRead(u.id, id);
    return { ok: true };
  }

  @Post('read-all')
  async readAll(@CurrentUser() u: AuthUser): Promise<{ ok: true }> {
    await this.service.markAllRead(u.id);
    return { ok: true };
  }
}
