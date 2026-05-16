'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/lib/cms';

export function DynamicNav({ items }: { items: NavItem[] }): JSX.Element {
  const pathname = usePathname();
  return (
    <nav className="nav-list">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.id}
            href={item.href}
            className={'nav-link' + (active ? ' nav-link--active' : '')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
