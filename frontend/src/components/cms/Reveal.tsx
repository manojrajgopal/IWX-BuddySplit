'use client';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'section' | 'article';
}

/**
 * Wraps content in a fade-in-on-scroll container.
 * Uses IntersectionObserver — adds `is-visible` class when entering viewport.
 */
export function Reveal({ children, className, delay = 0, as = 'div' }: Props): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const el = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Tag = as as 'div';
  return (
    <Tag
      ref={ref as never}
      className={'reveal' + (visible ? ' reveal--in' : '') + (className ? ' ' + className : '')}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
