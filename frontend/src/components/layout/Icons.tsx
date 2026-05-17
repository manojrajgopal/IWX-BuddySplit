/* App-shell icon set (sidebar + topbar). Stroke = currentColor. */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...rest }: IconProps): SVGProps<SVGSVGElement> & { width: number; height: number } {
  return {
    width: size, height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...rest,
  } as SVGProps<SVGSVGElement> & { width: number; height: number };
}

export function NavHome(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="m3 11 9-7 9 7"/><path d="M5 10v10h14V10"/></svg>;
}
export function NavCircles(p: IconProps): JSX.Element {
  return <svg {...base(p)}><circle cx="9" cy="9" r="5"/><circle cx="16" cy="15" r="5"/></svg>;
}
export function NavActivity(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M3 12h4l3-8 4 16 3-8h4"/></svg>;
}
export function NavReports(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-8"/><path d="M22 20H2"/></svg>;
}
export function NavFriends(p: IconProps): JSX.Element {
  return <svg {...base(p)}><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><circle cx="17" cy="7" r="3"/><path d="M22 19a5 5 0 0 0-7-4.6"/></svg>;
}
export function NavBell(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>;
}
export function NavSettings(p: IconProps): JSX.Element {
  return <svg {...base(p)}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
}
export function NavShield(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>;
}
export function NavUser(p: IconProps): JSX.Element {
  return <svg {...base(p)}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
}
export function NavHelp(p: IconProps): JSX.Element {
  return <svg {...base(p)}><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4"/><path d="M12 17h.01"/></svg>;
}
export function NavMail(p: IconProps): JSX.Element {
  return <svg {...base(p)}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
}
export function NavCog(p: IconProps): JSX.Element { return NavSettings(p); }

export function IconSearch(p: IconProps): JSX.Element {
  return <svg {...base(p)}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
}
export function IconPlus(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M12 5v14M5 12h14"/></svg>;
}
export function IconBell(p: IconProps): JSX.Element { return NavBell(p); }
export function IconChevDown(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="m6 9 6 6 6-6"/></svg>;
}
export function IconLogOut(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>;
}
export function IconMenu(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M3 6h18M3 12h18M3 18h18"/></svg>;
}
export function IconX(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M18 6 6 18M6 6l12 12"/></svg>;
}
export function IconUsers(p: IconProps): JSX.Element { return NavFriends(p); }
export function IconWallet(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M20 8H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2"/><path d="M16 12h4a2 2 0 0 1 0 4h-4z"/><path d="M4 8V6a2 2 0 0 1 2-2h12"/></svg>;
}
export function IconReceipt(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M4 2h16v20l-3-2-3 2-3-2-3 2-4-2z"/><path d="M8 7h8M8 11h8M8 15h5"/></svg>;
}
export function IconArrowRightUp(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>;
}
export function IconCheck(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="m5 13 4 4L19 7"/></svg>;
}
export function IconGlobe(p: IconProps): JSX.Element {
  return <svg {...base(p)}><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20"/><path d="M12 2a15 15 0 0 0 0 20"/></svg>;
}
export function IconBook(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 0-2 2z"/><path d="M8 7h7M8 11h7"/></svg>;
}
