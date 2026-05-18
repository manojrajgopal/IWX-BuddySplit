import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseEntity } from '@/modules/expenses/entities/expense.entity';
import { ExpenseSplitEntity } from '@/modules/expenses/entities/expense-split.entity';
import { WorkspaceMemberEntity } from '@/modules/members/entities/workspace-member.entity';
import { WorkspaceEntity } from '@/modules/workspaces/entities/workspace.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExpenseEntity, ExpenseSplitEntity, WorkspaceMemberEntity, WorkspaceEntity])],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
