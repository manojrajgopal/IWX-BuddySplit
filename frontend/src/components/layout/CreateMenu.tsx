'use client';
import { useEffect, useRef, useState } from 'react';
import { IconPlus, NavCircles, IconReceipt, IconUsers } from './Icons';
import { NavLink } from './NavLink';

const OPTIONS = [
  { href: '/circles/new',         label: 'New circle',     hint: 'Start a new trip, household, or event.', icon: NavCircles },
  { href: '/circles',             label: 'Add expense',    hint: 'Pick a circle and log a shared expense.', icon: IconReceipt },
  { href: '/friends?invite=1',    label: 'Invite buddy',   hint: 'Share an invite link with a friend.', icon: IconUsers },
];

export function CreateMenu(): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="create-menu" ref={ref}>
      <button
        type="button"
        className={'app-topbar__icon-btn' + (open ? ' app-topbar__icon-btn--active' : '')}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Create"
        onClick={() => setOpen(o => !o)}
      >
        <IconPlus size={20} />
      </button>
      {open && (
        <div className="create-menu__panel" role="menu">
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <NavLink key={opt.label} href={opt.href} className="create-menu__item" role="menuitem" onClick={() => setOpen(false)}>
                <span className="create-menu__icon"><Icon size={18} /></span>
                <span>
                  <div className="create-menu__label">{opt.label}</div>
                  <div className="create-menu__hint">{opt.hint}</div>
                </span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
