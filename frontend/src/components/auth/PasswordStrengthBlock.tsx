'use client';
import { IconCheck, IconX, IconShield, IconRefresh, IconKey } from '@/components/auth/Icons';
import { PasswordStrength } from '@/lib/password';

const RULES: Array<{ key: keyof PasswordStrength['checks']; label: string }> = [
  { key: 'length',     label: 'At least 8 characters' },
  { key: 'upper',      label: 'One uppercase letter' },
  { key: 'lower',      label: 'One lowercase letter' },
  { key: 'number',     label: 'One number' },
  { key: 'symbol',     label: 'One symbol (! @ # …)' },
  { key: 'notSimilar', label: 'Not similar to your email' },
];

interface Props {
  value: string;
  strength: PasswordStrength;
  onGenerate: () => void;
  onUseGenerated: (next: string) => void;
  generated: string | null;
}

export function PasswordStrengthBlock({ value, strength, onGenerate, onUseGenerated, generated }: Props): JSX.Element {
  return (
    <div className="pwd-meter">
      <div className="pwd-meter__bars" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={'pwd-meter__bar' + (strength.score >= i ? ` pwd-meter__bar--on-${strength.score}` : '')} />
        ))}
      </div>
      <div className="pwd-meter__meta">
        <span className="pwd-meter__label">
          Strength: <strong style={{ color: 'var(--text-primary)' }}>{value.length === 0 ? '—' : strength.label}</strong>
        </span>
        <span className="pwd-meter__count">{value.length} chars</span>
      </div>

      <div className="pwd-rules" role="list">
        {RULES.map((r) => {
          const ok = strength.checks[r.key];
          return (
            <div key={r.key} role="listitem" className={'pwd-rule' + (ok ? ' pwd-rule--ok' : '')}>
              <span className="pwd-rule__dot">{ok ? <IconCheck size={11} /> : <IconX size={11} />}</span>
              {r.label}
            </div>
          );
        })}
      </div>

      <div className="auth-trust" style={{ padding: '0.75rem 0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span className="auth-trust__badge" style={{ background: 'rgba(232,232,232,0.08)', color: 'var(--text-primary)' }}>
            <IconShield size={12} />
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1, minWidth: 160 }}>
            {generated ? (
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{generated}</code>
            ) : 'Need ideas? Generate a strong sample password.'}
          </span>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button type="button" onClick={onGenerate} className="btn btn--ghost btn--sm" style={{ padding: '0.4rem 0.7rem' }}>
              <IconRefresh size={12} /> {generated ? 'New' : 'Generate'}
            </button>
            {generated && (
              <button type="button" onClick={() => onUseGenerated(generated)} className="btn btn--primary btn--sm" style={{ padding: '0.4rem 0.7rem' }}>
                <IconKey size={12} /> Use this
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
