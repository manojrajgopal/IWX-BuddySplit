import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '@/common/guards/workspace-member.guard';
import { MembersService } from './members.service';

@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
@Controller({ path: 'workspaces/:workspaceId/members', version: '1' })
export class MembersController {
  constructor(private readonly service: MembersService) {}

  @Get()
  list(@Param('workspaceId') wid: string) { return this.service.listForWorkspace(wid); }
}
