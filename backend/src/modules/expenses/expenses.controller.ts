import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '@/common/guards/workspace-member.guard';
import { CurrentUser, AuthUser } from '@/common/decorators/current-user.decorator';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { CreateExpenseDto, CreateExpenseSchema } from './dto/expense.dto';
import { Money } from '@/core/money';

@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
@Controller({ path: 'workspaces/:workspaceId/expenses', version: '1' })
export class ExpensesController {
  constructor(private readonly service: ExpensesService) {}

  @Get()
  list(@Param('workspaceId') wid: string) { return this.service.list(wid); }

  @Get(':id')
  detail(@Param('workspaceId') wid: string, @Param('id') id: string) {
    return this.service.detail(wid, id);
  }

  @Post()
  create(
    @CurrentUser() u: AuthUser,
    @Param('workspaceId') wid: string,
    @Body(new ZodValidationPipe(CreateExpenseSchema)) dto: CreateExpenseDto,
  ) {
    return this.service.create({
      workspaceId: wid,
      actorUserId: u.id,
      payerMemberId: dto.payerMemberId,
      description: dto.description,
      category: dto.category ?? null,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      total: Money.of(BigInt(dto.amount), dto.currency),
      notes: dto.notes ?? null,
      splitMode: dto.splitMode,
      splitConfig: dto.splitConfig,
      participantMemberIds: dto.participantMemberIds,
    });
  }

  @Delete(':id')
  async remove(
    @CurrentUser() u: AuthUser,
    @Param('id') id: string,
  ): Promise<{ ok: true }> {
    await this.service.softDelete(id, u.id);
    return { ok: true };
  }
}
