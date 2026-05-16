import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@/common/guards/roles.guard';
import { Public } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '@/common/decorators/current-user.decorator';

@Controller({ path: 'settings', version: '1' })
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Public()
  @Get('public')
  getPublic() { return this.service.getPublic(); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':key')
  async update(
    @CurrentUser() u: AuthUser,
    @Param('key') key: string,
    @Body() body: { value: unknown; isPublic?: boolean; groupName?: string | null },
  ): Promise<{ ok: true }> {
    await this.service.upsert(key, body.value, {
      isPublic: body.isPublic, groupName: body.groupName ?? null, updatedBy: u.id,
    });
    return { ok: true };
  }
}
