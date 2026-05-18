'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconChevDown, IconLogOut, NavUser, NavSettings, NavShield, NavHelp, IconCheck } from './Icons';
import { NavLink } from './NavLink';

interface Props {
  email: string;
  displayName?: string | null;
  isAdmin?: boolean;
}

function initialsOf(input: string): string {
  const s = (input || '').trim();
  if (!s) return '?';
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]).join('').toUpperCase();
}

export function UserMenu({ email, displayName, isAdmin }: Props): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const name = displayName?.trim() || email.split('@')[0];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function onLogout(): Promise<void> {
    setOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span className="user-menu__avatar">{initialsOf(name)}</span>
        <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{name}</span>
        <span className="user-menu__chev"><IconChevDown size={14} /></span>
      </button>
      {open && (
        <div className="user-menu__panel" role="menu">
          <div className="user-menu__head">
            <span className="user-menu__avatar" style={{ width: 40, height: 40, fontSize: '0.92rem' }}>{initialsOf(name)}</span>
            <div style={{ minWidth: 0 }}>
              <div className="user-menu__head-name">{name}</div>
              <div className="user-menu__head-email">{email}</div>
              {isAdmin && (
                <div style={{ marginTop: '0.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--positive)' }}>
                  <IconCheck size={12} /> Admin
                </div>
              )}
            </div>
          </div>
          <NavLink href="/profile" className="user-menu__item" role="menuitem" onClick={() => setOpen(false)}>
            <NavUser size={16} /> Your profile
          </NavLink>
          <NavLink href="/settings" className="user-menu__item" role="menuitem" onClick={() => setOpen(false)}>
            <NavSettings size={16} /> Settings
          </NavLink>
          <NavLink href="/help" className="user-menu__item" role="menuitem" onClick={() => setOpen(false)}>
            <NavHelp size={16} /> Help & support
          </NavLink>
          {isAdmin && (
            <>
              <div className="user-menu__sep" />
              <NavLink href="/admin" className="user-menu__item" role="menuitem" onClick={() => setOpen(false)}>
                <NavShield size={16} /> Admin console
              </NavLink>
            </>
          )}
          <div className="user-menu__sep" />
          <button type="button" className="user-menu__item user-menu__item--danger" role="menuitem" onClick={onLogout}>
            <IconLogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
