'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

/** Counts up from 0 to `value` when scrolled into view. */
export function AnimatedCounter({ value, duration = 1200, prefix = '', suffix = '' }: Props): JSX.Element {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const start = performance.now();
          const tick = (now: number): void => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(value * eased));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{prefix}{display.toLocaleString()}{suffix}</span>;
}
