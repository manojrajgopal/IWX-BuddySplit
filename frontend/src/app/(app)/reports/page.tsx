import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';
import { formatMoney } from '@/lib/money/format';

export const metadata = { title: 'Reports' };

interface CategoryBucket { category: string; total: string }
interface MonthlyBucket { month: string; total: string }
interface ReportsData {
  currency: string;
  totalSpend: string;
  expenseCount: number;
  averageExpense: string;
  largestExpense: { description: string; amount: string; workspaceName: string } | null;
  byCategory: CategoryBucket[];
  byMonth: MonthlyBucket[];
  topWorkspaces: Array<{ id: string; name: string; total: string }>;
}

const EMPTY: ReportsData = {
  currency: 'INR', totalSpend: '0', expenseCount: 0, averageExpense: '0',
  largestExpense: null, byCategory: [], byMonth: [], topWorkspaces: [],
};

export default async function ReportsPage(): Promise<JSX.Element> {
  if (!(await getSession())) redirect('/login');
  const data = (await apiServer<ReportsData>('/v1/reports/overview', { revalidate: false, throwOnError: false }).catch(() => EMPTY)) ?? EMPTY;

  const maxMonth = data.byMonth.reduce((m, b) => {
    const v = Number(b.total);
    return v > m ? v : m;
  }, 0) || 1;
  const maxCategory = data.byCategory.reduce((m, b) => {
    const v = Number(b.total);
    return v > m ? v : m;
  }, 0) || 1;

  return (
    <AppShell>
      <header className="page-head">
        <div>
          <div className="page-head__eyebrow">Insights</div>
          <h1>Reports</h1>
          <p className="page-head__sub">Spending trends across every circle. Filtered to your share, in your base currency.</p>
        </div>
        <div className="page-head__actions">
          <Link href="/activity" className="btn btn--ghost btn--sm">Activity</Link>
          <Link href="/circles" className="btn btn--outline btn--sm">All circles</Link>
        </div>
      </header>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__label">Total spend</div>
          <div className="stat-card__value">{formatMoney(data.totalSpend, data.currency)}</div>
          <div className="stat-card__delta">Across {data.expenseCount} expense{data.expenseCount === 1 ? '' : 's'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Average expense</div>
          <div className="stat-card__value">{formatMoney(data.averageExpense, data.currency)}</div>
          <div className="stat-card__delta">Per logged entry</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Largest single</div>
          <div className="stat-card__value">{data.largestExpense ? formatMoney(data.largestExpense.amount, data.currency) : '—'}</div>
          <div className="stat-card__delta">{data.largestExpense ? `${data.largestExpense.description} · ${data.largestExpense.workspaceName}` : 'No expenses logged yet'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__label">Active circles</div>
          <div className="stat-card__value">{data.topWorkspaces.length}</div>
          <div className="stat-card__delta">With at least one expense</div>
        </div>
      </div>

      <section style={{ marginBottom: '2.5rem' }}>
        <h3 className="card__title" style={{ marginBottom: '1rem' }}>Spend by month</h3>
        {data.byMonth.length === 0 ? (
          <div className="empty-state">No monthly data yet.</div>
        ) : (
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(data.byMonth.length, 6)}, 1fr)`, gap: '0.75rem', alignItems: 'end', height: 180, padding: '0.5rem 0' }}>
              {data.byMonth.map((b) => {
                const pct = Math.max(8, Math.round((Number(b.total) / maxMonth) * 100));
                const label = b.month.length === 7
                  ? new Date(b.month + '-01').toLocaleString('en', { month: 'short', year: '2-digit' })
                  : b.month;
                return (
                  <div key={b.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', height: '100%' }}>
                    <div className="text-mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                      {formatMoney(b.total, data.currency)}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'end', width: '100%', maxWidth: 56 }}>
                      <div style={{ width: '100%', background: 'var(--accent)', opacity: 0.7, borderRadius: '6px 6px 0 0', height: `${pct}%`, transition: 'height 0.3s ease' }} />
                    </div>
                    <div className="text-mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section style={{ marginBottom: '2.5rem' }}>
        <h3 className="card__title" style={{ marginBottom: '1rem' }}>Spend by category</h3>
        {data.byCategory.length === 0 ? (
          <div className="empty-state">No categorized expenses yet.</div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {data.byCategory.map((c) => {
              const pct = Math.max(2, Math.round((Number(c.total) / maxCategory) * 100));
              return (
                <div key={c.category} style={{ padding: '0.85rem 1.1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                    <span>{c.category}</span>
                    <span className="text-mono">{formatMoney(c.total, data.currency)}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-surface-2)', borderRadius: 3 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--text-primary)', borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="card__title" style={{ marginBottom: '1rem' }}>Top circles by spend</h3>
        {data.topWorkspaces.length === 0 ? (
          <div className="empty-state">No active circles yet.</div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table className="table">
              <thead><tr><th>Circle</th><th style={{ textAlign: 'right' }}>Total spend</th></tr></thead>
              <tbody>
                {data.topWorkspaces.map((w) => (
                  <tr key={w.id}>
                    <td><Link href={`/circles/${w.id}`}>{w.name}</Link></td>
                    <td className="text-mono" style={{ textAlign: 'right' }}>{formatMoney(w.total, data.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppShell>
  );
}
