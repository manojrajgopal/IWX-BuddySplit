import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '@/common/guards/workspace-member.guard';
import { CurrentUser, AuthUser } from '@/common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { RecordSettlementSchema, RecordSettlementDto } from './dto/settlement.dto';

@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
@Controller({ path: 'workspaces/:workspaceId/settlements', version: '1' })
export class SettlementsController {
  constructor(private readonly service: SettlementsService) {}

  @Get('summary')
  summary(@Param('workspaceId') wid: string) { return this.service.summarize(wid); }

  @Post('suggest')
  suggest(@CurrentUser() u: AuthUser, @Param('workspaceId') wid: string) {
    return this.service.suggest(wid, u.id);
  }

  @Post(':id/record')
  record(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(RecordSettlementSchema)) dto: RecordSettlementDto,
  ) {
    return this.service.record({ settlementId: id, actorUserId: u.id, ...dto });
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) { return this.service.cancel(id); }
}
