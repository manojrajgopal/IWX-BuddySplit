/** Returns score 0–4 and per-rule booleans. Mirrors backend password policy intent. */
export interface PasswordChecks {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  symbol: boolean;
  notSimilar: boolean;
}
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  checks: PasswordChecks;
  allOk: boolean;
}

export const PASSWORD_MIN_LENGTH = 8;

export function evaluatePassword(pwd: string, similarTo: string[] = []): PasswordStrength {
  const checks: PasswordChecks = {
    length: pwd.length >= PASSWORD_MIN_LENGTH,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    symbol: /[^A-Za-z0-9]/.test(pwd),
    notSimilar: pwd.length > 0 && !similarTo.some((s) => s && s.length >= 3 && pwd.toLowerCase().includes(s.toLowerCase())),
  };
  const passed = (Object.values(checks) as boolean[]).filter(Boolean).length;
  let score: 0 | 1 | 2 | 3 | 4 = 0;
  if (pwd.length === 0) score = 0;
  else if (passed <= 2) score = 1;
  else if (passed === 3) score = 2;
  else if (passed === 4 || passed === 5) score = 3;
  else score = 4;
  const labels = ['Empty', 'Weak', 'Fair', 'Strong', 'Excellent'] as const;
  const allOk = (Object.values(checks) as boolean[]).every(Boolean);
  return { score, label: labels[score], checks, allOk };
}

const SYMBOLS = '!@#$%^&*()-_=+[]{}<>?';
const UPPERS  = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWERS  = 'abcdefghijkmnopqrstuvwxyz';
const DIGITS  = '23456789';

export function generatePassword(length = 16): string {
  const pools = [UPPERS, LOWERS, DIGITS, SYMBOLS];
  const all = pools.join('');
  const out: string[] = [];
  // Guarantee at least one of each pool.
  for (const p of pools) out.push(p[Math.floor(Math.random() * p.length)]);
  for (let i = out.length; i < length; i++) out.push(all[Math.floor(Math.random() * all.length)]);
  // Shuffle (Fisher-Yates).
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.join('');
}
