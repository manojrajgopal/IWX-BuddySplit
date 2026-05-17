import { IconShield, IconUsers, IconWallet, IconZap } from '@/components/auth/Icons';

/** Tiny shared trust strip used by login/reset pages. */
export function AuthTrust(): JSX.Element {
  return (
    <div className="auth-trust" role="region" aria-label="Security highlights">
      <div className="auth-trust__head">
        <span className="auth-trust__badge"><IconShield size={12} /></span>
        Your connection and credentials are secured
      </div>
      <div className="auth-trust__items">
        <span className="auth-trust__item"><IconShield size={12} /> Argon2id password hashing</span>
        <span className="auth-trust__item"><IconZap size={12} /> Rotating refresh tokens</span>
        <span className="auth-trust__item"><IconUsers size={12} /> No third-party trackers</span>
        <span className="auth-trust__item"><IconWallet size={12} /> No payment info ever stored</span>
      </div>
    </div>
  );
}
