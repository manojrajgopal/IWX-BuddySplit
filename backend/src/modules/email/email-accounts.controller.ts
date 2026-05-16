import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe,
  Patch, Post, UseGuards, UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles, RolesGuard } from '@/common/guards/roles.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { EmailAccountsService } from './email-accounts.service';
import {
  emailAccountCreateSchema, emailAccountUpdateSchema,
  EmailAccountCreateDto, EmailAccountUpdateDto,
} from './dto/email-account.dto';
import { MailService } from '@/core/mail/mail.service';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
@Controller({ path: 'admin/email-accounts', version: '1' })
export class EmailAccountsController {
  constructor(
    private readonly svc: EmailAccountsService,
    private readonly mail: MailService,
  ) {}

  @Get()
  @RequirePermissions('email_accounts:read')
  list() { return this.svc.list(); }

  @Get(':id')
  @RequirePermissions('email_accounts:read')
  get(@Param('id', ParseUUIDPipe) id: string) { return this.svc.get(id); }

  @Post()
  @RequirePermissions('email_accounts:create')
  @UsePipes(new ZodValidationPipe(emailAccountCreateSchema))
  create(@Body() dto: EmailAccountCreateDto) { return this.svc.create(dto); }

  @Patch(':id')
  @RequirePermissions('email_accounts:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(emailAccountUpdateSchema)) dto: EmailAccountUpdateDto,
  ) { return this.svc.update(id, dto); }

  @Delete(':id')
  @RequirePermissions('email_accounts:delete')
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }

  @Post(':id/set-default')
  @RequirePermissions('email_accounts:update')
  setDefault(@Param('id', ParseUUIDPipe) id: string) { return this.svc.setDefault(id); }

  @Post(':id/test')
  @RequirePermissions('email_accounts:update')
  async test(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { to?: string },
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.mail.sendTest(id, body?.to ?? '');
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }
}
