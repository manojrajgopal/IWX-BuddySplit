'use client';
import { usePathname } from 'next/navigation';
import { NavLink } from '@/components/layout/NavLink';

interface Tab { href: string; label: string }

export function WorkspaceTabs({ tabs }: { tabs: Tab[] }): JSX.Element {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === tabs[0]?.href) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
      {tabs.map((t) => (
        <NavLink
          key={t.href}
          href={t.href}
          className="btn btn--ghost"
          style={{
            borderRadius: 0,
            borderBottom: isActive(t.href) ? '2px solid var(--text-primary, #fff)' : '2px solid transparent',
            padding: '0.85rem 1.25rem',
            fontWeight: isActive(t.href) ? 600 : 400,
          }}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
