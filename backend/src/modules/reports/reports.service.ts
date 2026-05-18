import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ExpenseEntity } from '@/modules/expenses/entities/expense.entity';
import { ExpenseSplitEntity } from '@/modules/expenses/entities/expense-split.entity';
import { WorkspaceMemberEntity } from '@/modules/members/entities/workspace-member.entity';
import { WorkspaceEntity } from '@/modules/workspaces/entities/workspace.entity';

interface CategoryBucket { category: string; total: string }
interface MonthlyBucket { month: string; total: string }
interface TopWorkspace { id: string; name: string; total: string }

export interface ReportsOverview {
  currency: string;
  totalSpend: string;
  expenseCount: number;
  averageExpense: string;
  largestExpense: { description: string; amount: string; workspaceName: string } | null;
  byCategory: CategoryBucket[];
  byMonth: MonthlyBucket[];
  topWorkspaces: TopWorkspace[];
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ExpenseEntity) private readonly expenseRepo: Repository<ExpenseEntity>,
    @InjectRepository(ExpenseSplitEntity) private readonly splitRepo: Repository<ExpenseSplitEntity>,
    @InjectRepository(WorkspaceMemberEntity) private readonly memberRepo: Repository<WorkspaceMemberEntity>,
    @InjectRepository(WorkspaceEntity) private readonly workspaceRepo: Repository<WorkspaceEntity>,
  ) {}

  async getOverview(userId: string): Promise<ReportsOverview> {
    // Get all workspace IDs the user is a member of
    const memberships = await this.memberRepo.find({
      where: { userId, leftAt: IsNull() },
      select: ['workspaceId', 'id'],
    });

    if (memberships.length === 0) {
      return this.emptyOverview();
    }

    const workspaceIds = memberships.map((m) => m.workspaceId);
    const memberIds = memberships.map((m) => m.id);

    // Determine base currency from the first workspace (or user's most active)
    const firstWorkspace = await this.workspaceRepo.findOne({
      where: { id: workspaceIds[0] },
      select: ['baseCurrency'],
    });
    const currency = firstWorkspace?.baseCurrency ?? 'INR';

    // Get all expense splits for this user across their workspaces
    const userSplits = await this.splitRepo
      .createQueryBuilder('s')
      .innerJoin(ExpenseEntity, 'e', 'e.id = s.expense_id AND e.deleted_at IS NULL')
      .where('s.member_id IN (:...memberIds)', { memberIds })
      .andWhere('e.workspace_id IN (:...workspaceIds)', { workspaceIds })
      .andWhere('e.currency = :currency', { currency })
      .select(['s.share_minor AS share', 'e.id AS expense_id', 'e.description AS description', 'e.category AS category', 'e.occurred_at AS occurred_at', 'e.workspace_id AS workspace_id', 'e.total_minor AS total_minor'])
      .getRawMany();

    if (userSplits.length === 0) {
      return { ...this.emptyOverview(), currency };
    }

    // Calculate totals
    let totalSpend = BigInt(0);
    let largest: { description: string; amount: bigint; workspaceId: string } | null = null;

    const categoryMap = new Map<string, bigint>();
    const monthMap = new Map<string, bigint>();
    const workspaceSpendMap = new Map<string, bigint>();

    for (const row of userSplits) {
      const share = BigInt(row.share);
      totalSpend += share;

      // Track largest
      if (!largest || share > largest.amount) {
        largest = { description: row.description, amount: share, workspaceId: row.workspace_id };
      }

      // By category
      const cat = row.category || 'Uncategorized';
      categoryMap.set(cat, (categoryMap.get(cat) ?? BigInt(0)) + share);

      // By month
      const date = new Date(row.occurred_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) ?? BigInt(0)) + share);

      // By workspace
      const wid = row.workspace_id;
      workspaceSpendMap.set(wid, (workspaceSpendMap.get(wid) ?? BigInt(0)) + share);
    }

    const expenseCount = userSplits.length;
    const averageExpense = expenseCount > 0 ? totalSpend / BigInt(expenseCount) : BigInt(0);

    // Resolve largest expense workspace name
    let largestExpense: ReportsOverview['largestExpense'] = null;
    if (largest) {
      const ws = await this.workspaceRepo.findOne({
        where: { id: largest.workspaceId },
        select: ['name'],
      });
      largestExpense = {
        description: largest.description,
        amount: largest.amount.toString(),
        workspaceName: ws?.name ?? 'Unknown circle',
      };
    }

    // Build category buckets (sorted descending)
    const byCategory: CategoryBucket[] = [...categoryMap.entries()]
      .map(([category, total]) => ({ category, total: total.toString() }))
      .sort((a, b) => Number(BigInt(b.total) - BigInt(a.total)));

    // Build month buckets (sorted chronologically)
    const byMonth: MonthlyBucket[] = [...monthMap.entries()]
      .map(([month, total]) => ({ month, total: total.toString() }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Build top workspaces (sorted descending)
    const workspaceEntries = [...workspaceSpendMap.entries()]
      .sort((a, b) => Number(b[1] - a[1]))
      .slice(0, 10);

    const topWorkspaces: TopWorkspace[] = [];
    for (const [wid, total] of workspaceEntries) {
      const ws = await this.workspaceRepo.findOne({ where: { id: wid }, select: ['id', 'name'] });
      if (ws) {
        topWorkspaces.push({ id: ws.id, name: ws.name, total: total.toString() });
      }
    }

    return {
      currency,
      totalSpend: totalSpend.toString(),
      expenseCount,
      averageExpense: averageExpense.toString(),
      largestExpense,
      byCategory,
      byMonth,
      topWorkspaces,
    };
  }

  private emptyOverview(): ReportsOverview {
    return {
      currency: 'INR',
      totalSpend: '0',
      expenseCount: 0,
      averageExpense: '0',
      largestExpense: null,
      byCategory: [],
      byMonth: [],
      topWorkspaces: [],
    };
  }
}
