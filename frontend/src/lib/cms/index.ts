import { apiServer } from '@/lib/api/server';

export interface SiteSetting { key: string; value: unknown }
export interface NavItem { id: string; location: 'primary'|'admin'|'footer'; label: string; href: string; sortOrder: number; visible: boolean; requiresRole?: 'user'|'admin'|null }
export interface BrandAsset { key: string; url: string; mime: string }

export async function getPublicSettings(): Promise<Record<string, unknown>> {
  const list = await apiServer<SiteSetting[]>('/v1/settings/public', {
    tags: ['cms:settings'], withAuth: false, throwOnError: false,
  });
  if (!Array.isArray(list)) return {};
  const map: Record<string, unknown> = {};
  for (const s of list) map[s.key] = s.value;
  return map;
}

export async function getNavigation(location: NavItem['location']): Promise<NavItem[]> {
  const list = await apiServer<NavItem[]>(`/v1/navigation?location=${location}`, {
    tags: ['cms:navigation'], withAuth: false, throwOnError: false,
  });
  return (Array.isArray(list) ? list : []).filter(n => n.visible).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getBranding(): Promise<Record<string, BrandAsset>> {
  const list = await apiServer<BrandAsset[]>('/v1/branding', {
    tags: ['cms:branding'], withAuth: false, throwOnError: false,
  });
  const map: Record<string, BrandAsset> = {};
  for (const b of (Array.isArray(list) ? list : [])) map[b.key] = b;
  return map;
}

export function settingString(map: Record<string, unknown>, key: string, fallback = ''): string {
  const v = map[key];
  return typeof v === 'string' ? v : fallback;
}

export function settingArray<T = unknown>(map: Record<string, unknown>, key: string): T[] {
  const v = map[key];
  return Array.isArray(v) ? (v as T[]) : [];
}
