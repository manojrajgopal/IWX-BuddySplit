/**
 * Currency table. Number of minor-unit digits per ISO 4217 code.
 * Extend as needed. Unlisted currencies default to 2 minor digits.
 */
export const CURRENCY_MINOR_DIGITS: Readonly<Record<string, number>> = Object.freeze({
  INR: 2, USD: 2, EUR: 2, GBP: 2, JPY: 0, KRW: 0, BHD: 3, KWD: 3, OMR: 3, TND: 3, AUD: 2,
  CAD: 2, SGD: 2, AED: 2, CHF: 2, CNY: 2, HKD: 2, NZD: 2, ZAR: 2, BRL: 2, MXN: 2,
});

export function minorDigits(currency: string): number {
  return CURRENCY_MINOR_DIGITS[currency.toUpperCase()] ?? 2;
}

export function isSupportedCurrency(currency: string): boolean {
  return /^[A-Z]{3}$/.test(currency);
}
