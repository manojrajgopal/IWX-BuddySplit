import { isSupportedCurrency, minorDigits } from './currency';

/**
 * Money value object.
 *
 * Invariants:
 *  - amount is BigInt representing minor units (e.g. paise, cents).
 *  - currency is uppercase ISO-4217.
 *  - arithmetic is exact; no implicit rounding.
 *  - division is performed only by `SplitEngine`, never here.
 */
export class Money {
  readonly amount: bigint;
  readonly currency: string;

  private constructor(amount: bigint, currency: string) {
    this.amount = amount;
    this.currency = currency;
  }

  static of(amount: bigint | number | string, currency: string): Money {
    const cc = currency.toUpperCase();
    if (!isSupportedCurrency(cc)) {
      throw new Error(`Money: invalid currency code "${currency}"`);
    }
    let v: bigint;
    if (typeof amount === 'bigint') v = amount;
    else if (typeof amount === 'string') v = BigInt(amount);
    else if (Number.isInteger(amount)) v = BigInt(amount);
    else throw new Error('Money: numeric amount must be an integer minor-unit value');
    return new Money(v, cc);
  }

  /** Parse a major-unit decimal string (e.g. "1234.56") into Money. */
  static fromDecimalString(value: string, currency: string): Money {
    const cc = currency.toUpperCase();
    const digits = minorDigits(cc);
    const trimmed = value.trim();
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
      throw new Error(`Money: invalid decimal string "${value}"`);
    }
    const negative = trimmed.startsWith('-');
    const abs = negative ? trimmed.slice(1) : trimmed;
    const [intPart, fracPartRaw = ''] = abs.split('.');
    if (fracPartRaw.length > digits) {
      throw new Error(
        `Money: too many fractional digits for ${cc} (max ${digits}): "${value}"`,
      );
    }
    const fracPadded = (fracPartRaw + '0'.repeat(digits)).slice(0, digits);
    const minor = BigInt(intPart) * 10n ** BigInt(digits) + BigInt(fracPadded || '0');
    return new Money(negative ? -minor : minor, cc);
  }

  static zero(currency: string): Money {
    return Money.of(0n, currency);
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Money: currency mismatch (${this.currency} vs ${other.currency})`,
      );
    }
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  sub(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  neg(): Money {
    return new Money(-this.amount, this.currency);
  }

  abs(): Money {
    return new Money(this.amount < 0n ? -this.amount : this.amount, this.currency);
  }

  /** Multiply by an integer scalar. */
  mulInt(n: bigint | number): Money {
    const b = typeof n === 'number' ? BigInt(Math.trunc(n)) : n;
    return new Money(this.amount * b, this.currency);
  }

  eq(other: Money): boolean {
    return this.currency === other.currency && this.amount === other.amount;
  }

  isZero(): boolean { return this.amount === 0n; }
  isPositive(): boolean { return this.amount > 0n; }
  isNegative(): boolean { return this.amount < 0n; }

  /** Wire-safe serialization. amount as string to survive JSON. */
  toJSON(): { amount: string; currency: string } {
    return { amount: this.amount.toString(), currency: this.currency };
  }

  /** Format as a decimal string (e.g. "1234.56"). */
  toDecimalString(): string {
    const digits = minorDigits(this.currency);
    const negative = this.amount < 0n;
    const abs = negative ? -this.amount : this.amount;
    const s = abs.toString().padStart(digits + 1, '0');
    const cut = s.length - digits;
    const major = s.slice(0, cut);
    const frac = digits === 0 ? '' : '.' + s.slice(cut);
    return (negative ? '-' : '') + major + frac;
  }
}
