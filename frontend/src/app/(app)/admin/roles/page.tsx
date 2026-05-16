import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/AppShell';
import { apiServer } from '@/lib/api/server';
import { RolesClient, Role, RoleCatalog } from './RolesClient';

export const dynamic = 'force-dynamic';

export default async function RolesPage(): Promise<JSX.Element> {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'admin') redirect('/dashboard');

  const [roles, catalog] = await Promise.all([
    apiServer<Role[]>('/v1/admin/roles', { revalidate: false, throwOnError: false })
      .catch(() => [] as Role[]),
    apiServer<RoleCatalog>('/v1/admin/roles/catalog', { revalidate: false, throwOnError: false })
      .catch(() => ({ resources: [], actions: [] }) as RoleCatalog),
  ]);

  return (
    <AppShell>
      <header style={{ marginBottom: '1.5rem' }}>
        <div className="text-uppercase-label">Admin · Access</div>
        <h1>Roles & permissions</h1>
        <p className="text-secondary" style={{ maxWidth: 720 }}>
          Create custom roles and grant them fine-grained CRUD access to platform resources.
          Users with the built-in <code>admin</code> role always have full access.
        </p>
      </header>
      <RolesClient initial={roles ?? []} catalog={catalog} />
    </AppShell>
  );
}
