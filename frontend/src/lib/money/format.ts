/* Frontend Money formatter — mirrors backend rules (integer minor units). */

const MINOR_DIGITS: Record<string, number> = {
  INR: 2, USD: 2, EUR: 2, GBP: 2, JPY: 0, KRW: 0, BHD: 3, KWD: 3, OMR: 3,
};

export function minorDigits(currency: string): number {
  return MINOR_DIGITS[currency.toUpperCase()] ?? 2;
}

/**
 * Format a minor-unit string into a currency display string.
 * `amountMinor` MUST be an integer (string or bigint) — never a float.
 */
export function formatMoney(amountMinor: string | bigint, currency: string, locale?: string): string {
  const digits = minorDigits(currency);
  const amount = typeof amountMinor === 'bigint' ? amountMinor : BigInt(amountMinor);
  const negative = amount < 0n;
  const abs = negative ? -amount : amount;
  const s = abs.toString().padStart(digits + 1, '0');
  const cut = s.length - digits;
  const major = s.slice(0, cut);
  const frac = digits === 0 ? '' : '.' + s.slice(cut);
  // Use Intl for thousand-separator on major part.
  const formattedMajor = new Intl.NumberFormat(locale).format(BigInt(major));
  const sym = currencySymbol(currency);
  return `${negative ? '-' : ''}${sym}${formattedMajor}${frac}`;
}

function currencySymbol(currency: string): string {
  const map: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$' };
  return map[currency.toUpperCase()] ?? (currency.toUpperCase() + ' ');
}

/** Parse a decimal user input into minor units (string). Strict; throws on invalid. */
export function parseDecimalToMinor(value: string, currency: string): bigint {
  const digits = minorDigits(currency);
  const trimmed = value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) throw new Error('Invalid amount');
  const negative = trimmed.startsWith('-');
  const abs = negative ? trimmed.slice(1) : trimmed;
  const [intPart, fracRaw = ''] = abs.split('.');
  if (fracRaw.length > digits) throw new Error(`Max ${digits} decimal places for ${currency}`);
  const fracPadded = (fracRaw + '0'.repeat(digits)).slice(0, digits);
  const minor = BigInt(intPart) * 10n ** BigInt(digits) + BigInt(fracPadded || '0');
  return negative ? -minor : minor;
}
