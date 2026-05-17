'use client';
import { ChangeEvent, ClipboardEvent, KeyboardEvent, useRef } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
}

export function OtpGrid({ value, onChange, length = 6, autoFocus }: Props): JSX.Element {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  function setDigit(i: number, d: string): void {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join('').replace(/\s+/g, ''));
  }

  function onDigitChange(i: number, e: ChangeEvent<HTMLInputElement>): void {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    setDigit(i, v || ' ');
    if (v && i < length - 1) refs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Backspace' && !digits[i].trim() && i > 0) {
      setDigit(i - 1, ' ');
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>): void {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    const last = Math.min(text.length, length - 1);
    refs.current[last]?.focus();
  }

  return (
    <div className="otp-grid">
      {Array.from({ length }).map((_, i) => {
        const ch = digits[i].trim();
        return (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={ch}
            autoFocus={autoFocus && i === 0}
            onChange={(e) => onDigitChange(i, e)}
            onKeyDown={(e) => onKey(i, e)}
            onPaste={onPaste}
            aria-label={`Digit ${i + 1}`}
          />
        );
      })}
    </div>
  );
}
