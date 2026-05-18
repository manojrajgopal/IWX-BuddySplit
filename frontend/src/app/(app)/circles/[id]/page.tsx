import { apiServer } from '@/lib/api/server';
import { OverviewInteractive } from './OverviewInteractive';

interface Expense { id: string; totalMinor: string; currency: string }
interface Member { id: string; user: { displayName: string } }
interface BalanceSummary {
  currency: string;
  members: Array<{ memberId: string; paid: string; owed: string; net: string }>;
  transfers: Array<{ from: string; to: string; amount: string }>;
}

export default async function WorkspaceOverviewPage({ params }: { params: Promise<{ id: string }> }): Promise<JSX.Element> {
  const { id } = await params;
  const [expenses, members, settlements] = await Promise.all([
    apiServer<Expense[]>(`/v1/workspaces/${id}/expenses`, { revalidate: false, throwOnError: false }).catch(() => null),
    apiServer<Member[]>(`/v1/workspaces/${id}/members`, { revalidate: false, throwOnError: false }).catch(() => null),
    apiServer<BalanceSummary>(`/v1/workspaces/${id}/settlements/summary`, { revalidate: false, throwOnError: false }).catch(() => null),
  ]);
  const expenseList = expenses ?? [];
  const memberList = members ?? [];
  const balances = settlements?.members ?? [];
  const transfers = settlements?.transfers ?? [];
  const currency = settlements?.currency ?? 'INR';
  const nameMap = Object.fromEntries(memberList.map((m) => [m.id, m.user?.displayName ?? '']));

  const totalSpend = expenseList.reduce((sum, e) => sum + BigInt(e.totalMinor || '0'), 0n).toString();

  return (
    <OverviewInteractive
      expenseCount={expenseList.length}
      memberCount={memberList.length}
      totalSpend={totalSpend}
      currency={currency}
      balances={balances}
      transfers={transfers}
      nameMap={nameMap}
    />
  );
}
