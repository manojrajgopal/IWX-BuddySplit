/* Tiny inline SVG icon set used across auth pages. Stroke = currentColor. */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...rest }: IconProps): SVGProps<SVGSVGElement> & { width: number; height: number } {
  return {
    width: size,
    height: size,
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

export function IconMail(p: IconProps): JSX.Element {
  return <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
}
export function IconLock(p: IconProps): JSX.Element {
  return <svg {...base(p)}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
}
export function IconUser(p: IconProps): JSX.Element {
  return <svg {...base(p)}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
}
export function IconUserPlus(p: IconProps): JSX.Element {
  return <svg {...base(p)}><circle cx="10" cy="8" r="4"/><path d="M2 21a8 8 0 0 1 14.5-4.7"/><path d="M19 8v6M16 11h6"/></svg>;
}
export function IconEye(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>;
}
export function IconEyeOff(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M3 3l18 18"/><path d="M10.6 6.1A10.9 10.9 0 0 1 12 6c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4.1"/><path d="M6.2 7.3A17 17 0 0 0 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.7"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>;
}
export function IconCheck(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="m5 12 5 5 9-11"/></svg>;
}
export function IconX(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="m6 6 12 12M6 18 18 6"/></svg>;
}
export function IconAlertCircle(p: IconProps): JSX.Element {
  return <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>;
}
export function IconShield(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/></svg>;
}
export function IconArrowRight(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
}
export function IconArrowLeft(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
}
export function IconRefresh(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 21v-5h5"/></svg>;
}
export function IconWallet(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M3 7a2 2 0 0 1 2-2h12v4"/><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="17" cy="13.5" r="1.5"/></svg>;
}
export function IconUsers(p: IconProps): JSX.Element {
  return <svg {...base(p)}><circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 20a5 5 0 0 1 6-4.5"/></svg>;
}
export function IconZap(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>;
}
export function IconScale(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M12 3v18"/><path d="M5 7h14"/><path d="m5 7-3 7a4 4 0 0 0 6 0L5 7Z"/><path d="m19 7-3 7a4 4 0 0 0 6 0L19 7Z"/></svg>;
}
export function IconGlobe(p: IconProps): JSX.Element {
  return <svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
}
export function IconSparkle(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></svg>;
}
export function IconKey(p: IconProps): JSX.Element {
  return <svg {...base(p)}><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9"/><path d="m17 6 3 3"/><path d="m14 9 3 3"/></svg>;
}
export function IconHeart(p: IconProps): JSX.Element {
  return <svg {...base(p)}><path d="M12 20s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 5C19 15.5 12 20 12 20Z"/></svg>;
}
