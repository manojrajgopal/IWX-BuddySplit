'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';

interface NavigationContextValue {
  isPending: boolean;
  startNavigation: (fn?: () => void) => void;
  stopNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextValue>({
  isPending: false,
  startNavigation: (fn) => fn?.(),
  stopNavigation: () => {},
});

const SAFETY_TIMEOUT_MS = 8000;
const MIN_VISIBLE_MS = 250;

export function NavigationProvider({ children }: { children: ReactNode }): JSX.Element {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const startedAtRef = useRef(0);
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minVisibleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pathname = usePathname();

  const clearTimers = () => {
    if (safetyTimerRef.current) { clearTimeout(safetyTimerRef.current); safetyTimerRef.current = null; }
    if (minVisibleTimerRef.current) { clearTimeout(minVisibleTimerRef.current); minVisibleTimerRef.current = null; }
  };

  const stopNavigation = useCallback(() => {
    if (!pendingRef.current) return;
    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    if (minVisibleTimerRef.current) clearTimeout(minVisibleTimerRef.current);
    minVisibleTimerRef.current = setTimeout(() => {
      pendingRef.current = false;
      setPending(false);
      clearTimers();
    }, remaining);
  }, []);

  const startNavigation = useCallback((fn?: () => void) => {
    if (!pendingRef.current) {
      pendingRef.current = true;
      startedAtRef.current = Date.now();
      setPending(true);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = setTimeout(() => {
        pendingRef.current = false;
        setPending(false);
        clearTimers();
      }, SAFETY_TIMEOUT_MS);
    }
    fn?.();
  }, []);

  // Whenever the URL changes, the new page has rendered — clear pending.
  useEffect(() => {
    stopNavigation();
  }, [pathname, stopNavigation]);

  // Reflect pending state on the body for global styling cues.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('is-navigating', pending);
    return () => { document.body.classList.remove('is-navigating'); };
  }, [pending]);

  // Global click interceptor: detect internal <a> clicks anywhere in the app
  // so existing next/link usages also trigger the progress indicator.
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const hrefAttr = anchor.getAttribute('href');
      if (!hrefAttr) return;
      if (/^(https?:|mailto:|tel:|javascript:)/i.test(hrefAttr)) return;
      if (hrefAttr.startsWith('#')) return;

      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        // Same URL → no real navigation.
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      } catch {
        /* ignore */
      }

      startNavigation();
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [startNavigation]);

  // Also catch programmatic navigation via history (router.push, router.replace).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { pushState, replaceState } = window.history;

    window.history.pushState = function (...args) {
      startNavigation();
      return pushState.apply(window.history, args as any);
    };
    window.history.replaceState = function (...args) {
      startNavigation();
      return replaceState.apply(window.history, args as any);
    };
    const onPop = () => startNavigation();
    window.addEventListener('popstate', onPop);

    return () => {
      window.history.pushState = pushState;
      window.history.replaceState = replaceState;
      window.removeEventListener('popstate', onPop);
    };
  }, [startNavigation]);

  useEffect(() => () => clearTimers(), []);

  return (
    <NavigationContext.Provider value={{ isPending: pending, startNavigation, stopNavigation }}>
      {children}
      <span className={'nav-progress' + (pending ? ' nav-progress--active' : '')} aria-hidden />
    </NavigationContext.Provider>
  );
}

export function useNavigationPending(): NavigationContextValue {
  return useContext(NavigationContext);
}
