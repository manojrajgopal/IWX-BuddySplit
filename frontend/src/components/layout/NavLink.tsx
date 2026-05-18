'use client';

import Link, { type LinkProps } from 'next/link';
import { useRouter } from 'next/navigation';
import { forwardRef, type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { useNavigationPending } from './NavigationProvider';

type NavLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    children?: ReactNode;
  };

/**
 * Drop-in replacement for next/link that wraps navigation in a React transition.
 * The current page remains visible until the next page is ready — no spinner,
 * no flicker. A subtle top progress line is rendered globally by NavigationProvider.
 */
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { href, onClick, replace, scroll, prefetch, target, children, ...rest },
  ref,
) {
  const router = useRouter();
  const { startNavigation } = useNavigationPending();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    if (e.defaultPrevented) return;
    // Let the browser handle modified clicks, new tabs, downloads, external links.
    if (
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      (target && target !== '_self')
    ) {
      return;
    }
    const url = typeof href === 'string' ? href : (href as any)?.pathname ?? '';
    // Only intercept internal navigations.
    if (typeof url !== 'string' || /^(https?:|mailto:|tel:)/i.test(url)) return;

    e.preventDefault();
    startNavigation(() => {
      if (replace) router.replace(url, { scroll });
      else router.push(url, { scroll });
    });
  };

  return (
    <Link
      ref={ref}
      href={href}
      replace={replace}
      scroll={scroll}
      prefetch={prefetch}
      target={target}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </Link>
  );
});
