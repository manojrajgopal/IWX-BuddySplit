import { BadRequestException, Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard, Public } from '@/common/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '@/common/guards/workspace-member.guard';
import { CurrentUser, AuthUser } from '@/common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { CreateInviteDto, CreateInviteSchema } from './dto/invitation.dto';

@Controller({ path: 'invitations', version: '1' })
export class InvitationsController {
  constructor(private readonly service: InvitationsService) {}

  @UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
  @Post('workspaces/:workspaceId')
  create(
    @CurrentUser() u: AuthUser,
    @Param('workspaceId') workspaceId: string,
    @Body(new ZodValidationPipe(CreateInviteSchema)) dto: CreateInviteDto,
  ) {
    return this.service.createInvite({
      workspaceId, email: dto.email, role: dto.role, ttlHours: dto.ttlHours,
      invitedByUserId: u.id,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('mine')
  mine(@CurrentUser() u: AuthUser) {
    return this.service.listPendingForUser(u.id);
  }

  @Public()
  @Get(':id')
  get(@Param('id') id: string, @Query('token') token: string) {
    return this.service.getInvitation(id, token);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  accept(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body('token') token?: string,
  ) {
    if (token) return this.service.accept(id, token, u.id);
    return this.service.acceptByUser(id, u.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/decline-auth')
  declineAuth(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
  ) {
    return this.service.declineByUser(id, u.id);
  }

  @Public()
  @Post(':id/decline')
  async decline(@Param('id') id: string, @Body('token') token: string): Promise<void> {
    await this.service.decline(id, token);
  }
}
