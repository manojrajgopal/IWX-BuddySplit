'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

export function SettlementActions({ workspaceId }: { workspaceId: string }): JSX.Element {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function suggest(): Promise<void> {
    setError(null); setBusy(true);
    try {
      await apiClient(`/v1/workspaces/${workspaceId}/settlements/suggest`, { method: 'POST' });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setBusy(false); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
      <button className="btn btn--primary" onClick={suggest} disabled={busy}>
        {busy ? 'Computing…' : 'Recompute suggestions'}
      </button>
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
