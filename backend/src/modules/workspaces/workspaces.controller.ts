import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '@/common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  CreateWorkspaceDto, CreateWorkspaceSchema, SetStatusDto, SetStatusSchema,
} from './dto/workspace.dto';

@UseGuards(JwtAuthGuard)
@Controller({ path: 'workspaces', version: '1' })
export class WorkspacesController {
  constructor(private readonly service: WorkspacesService) {}

  @Get()
  list(@CurrentUser() u: AuthUser) { return this.service.listForUser(u.id); }

  @Post()
  create(
    @CurrentUser() u: AuthUser,
    @Body(new ZodValidationPipe(CreateWorkspaceSchema)) dto: CreateWorkspaceDto,
  ) {
    return this.service.create({ ...dto, ownerUserId: u.id });
  }

  @Get(':id')
  get(@Param('id') id: string) { return this.service.getById(id); }

  @Post(':id/status')
  setStatus(
    @Param('id') id: string,
    @CurrentUser() u: AuthUser,
    @Body(new ZodValidationPipe(SetStatusSchema)) dto: SetStatusDto,
  ) {
    return this.service.setStatus(id, dto.status, u.id);
  }
}
