import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettlementEntity } from './entities/settlement.entity';
import { SettlementTransactionEntity } from './entities/settlement-transaction.entity';
import { ExpenseEntity } from '@/modules/expenses/entities/expense.entity';
import { ExpenseSplitEntity } from '@/modules/expenses/entities/expense-split.entity';
import { WorkspaceEntity } from '@/modules/workspaces/entities/workspace.entity';
import { WorkspaceMemberEntity } from '@/modules/members/entities/workspace-member.entity';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';

@Module({
  imports: [TypeOrmModule.forFeature([
    SettlementEntity, SettlementTransactionEntity,
    ExpenseEntity, ExpenseSplitEntity, WorkspaceEntity, WorkspaceMemberEntity,
  ])],
  providers: [SettlementsService],
  controllers: [SettlementsController],
  exports: [SettlementsService],
})
export class SettlementsModule {}
