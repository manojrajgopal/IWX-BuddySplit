'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { NavHome, NavCircles, NavActivity, NavReports, NavFriends, NavBell, NavMail, NavSettings, NavShield, NavUser, NavHelp } from './Icons';
import { NavLink } from './NavLink';

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  exact?: boolean;
  count?: number;
}
export interface SidebarGroup {
  title: string;
  items: SidebarNavItem[];
}

const ICONS = {
  home: NavHome,
  circles: NavCircles,
  activity: NavActivity,
  reports: NavReports,
  friends: NavFriends,
  mail: NavMail,
  bell: NavBell,
  settings: NavSettings,
  shield: NavShield,
  user: NavUser,
  help: NavHelp,
};

interface Props {
  groups: SidebarGroup[];
  footer?: ReactNode;
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ groups, footer, open = false, onClose }: Props): JSX.Element {
  const pathname = usePathname();

  return (
    <>
      {open && <div className="app-sidebar__scrim" onClick={onClose} aria-hidden />}
      <aside className={'app-sidebar' + (open ? ' app-sidebar--open' : '')}>
        {groups.map((group) => (
          <div key={group.title} className="app-sidebar__group">
            <div className="app-sidebar__group-title">{group.title}</div>
            {group.items.map((item) => {
              const Icon = ICONS[item.icon];
              const active = item.exact ? pathname === item.href : (pathname === item.href || pathname.startsWith(item.href + '/'));
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={'app-sidebar__link' + (active ? ' app-sidebar__link--active' : '') + (item.count && item.count > 0 ? ' app-sidebar__link--unread' : '')}
                >
                  <Icon size={18} />
                  <span className="app-sidebar__link-label">{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="app-sidebar__link-count">{item.count > 99 ? '99+' : item.count}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
        {footer && <div className="app-sidebar__footer">{footer}</div>}
      </aside>
    </>
  );
}
