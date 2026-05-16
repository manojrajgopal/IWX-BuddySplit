import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseEntity } from './entities/expense.entity';
import { ExpenseSplitEntity } from './entities/expense-split.entity';
import { WorkspaceMemberEntity } from '@/modules/members/entities/workspace-member.entity';
import { WorkspaceEntity } from '@/modules/workspaces/entities/workspace.entity';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseEntity, ExpenseSplitEntity, WorkspaceMemberEntity, WorkspaceEntity])],
  providers: [ExpensesService],
  controllers: [ExpensesController],
  exports: [ExpensesService, TypeOrmModule],
})
export class ExpensesModule {}
