'use client';

import { ReactNode, useRef, useState, useCallback } from 'react';

interface FloatingDetailProps {
  children: ReactNode;
  detail: ReactNode;
  as?: 'div' | 'tr';
}

export function FloatingDetail({ children, detail, as: Tag = 'div' }: FloatingDetailProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(false), 150);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setPos({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <Tag
      ref={containerRef as any}
      className="floating-detail-trigger"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{ position: 'relative' }}
    >
      {children}
      {visible && (
        <div
          className="floating-detail-popover"
          style={{ left: pos.x, top: pos.y }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {detail}
        </div>
      )}
    </Tag>
  );
}
