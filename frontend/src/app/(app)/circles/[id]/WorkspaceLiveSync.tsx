'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSocket } from '@/lib/realtime/socket';

/** Subscribes to the workspace room and triggers a server-component refresh on any change. */
export function WorkspaceLiveSync({ workspaceId }: { workspaceId: string }): null {
  const router = useRouter();
  useEffect(() => {
    // Token is in an HttpOnly cookie — fetch a short-lived ws token from a helper route.
    let alive = true;
    void (async () => {
      const res = await fetch('/api/auth/ws-token').catch(() => null);
      if (!res || !res.ok || !alive) return;
      const { token } = (await res.json()) as { token?: string };
      if (!token) return;
      const socket = getSocket(token);
      socket.emit('join', { room: `workspace:${workspaceId}` });
      const onChange = (): void => router.refresh();
      socket.on('expense.created', onChange);
      socket.on('expense.updated', onChange);
      socket.on('expense.deleted', onChange);
      socket.on('settlement.changed', onChange);
      socket.on('workspace.changed', onChange);
    })();
    return () => { alive = false; };
  }, [workspaceId, router]);
  return null;
}
