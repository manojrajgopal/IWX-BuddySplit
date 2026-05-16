import { Money } from './money';

/**
 * Stable participant identity for splitting.
 * `orderKey` must be deterministic (e.g. `${joinedAtISO}|${memberId}`).
 */
export interface SplitParticipant {
  memberId: string;
  orderKey: string;
}

export interface SplitShare {
  memberId: string;
  share: Money;
}

export type SplitInput =
  | { mode: 'equal'; participants: SplitParticipant[] }
  | { mode: 'exact'; entries: Array<{ memberId: string; amount: Money }> }
  | { mode: 'percentage'; participants: SplitParticipant[]; bp: Record<string, number /* 0..10000 */> }
  | { mode: 'shares'; participants: SplitParticipant[]; shares: Record<string, number /* positive int */> }
  | {
      mode: 'adjustment';
      participants: SplitParticipant[];
      adjustments: Record<string, Money /* signed delta per person */>;
    }
  | { mode: 'itemized'; lines: Array<{ memberId: string; amount: Money }> };

/**
 * SplitEngine: deterministic, exact splitting using the largest-remainder
 * (Hamilton) method. Every public method returns shares that sum *exactly*
 * to the input total.
 */
export class SplitEngine {
  static split(total: Money, input: SplitInput): SplitShare[] {
    switch (input.mode) {
      case 'equal':
        return SplitEngine.equal(total, input.participants);
      case 'exact':
        return SplitEngine.exact(total, input.entries);
      case 'percentage':
        return SplitEngine.percentage(total, input.participants, input.bp);
      case 'shares':
        return SplitEngine.shares(total, input.participants, input.shares);
      case 'adjustment':
        return SplitEngine.adjustment(total, input.participants, input.adjustments);
      case 'itemized':
        return SplitEngine.itemized(total, input.lines);
    }
  }

  // ── equal ─────────────────────────────────────────────────────────────────
  static equal(total: Money, participants: SplitParticipant[]): SplitShare[] {
    if (participants.length === 0) {
      throw new Error('SplitEngine.equal: at least one participant required');
    }
    const sorted = [...participants].sort((a, b) => (a.orderKey < b.orderKey ? -1 : 1));
    const n = BigInt(sorted.length);
    const base = total.amount / n;
    const rem = total.amount - base * n; // 0 <= rem < n
    return sorted.map((p, i) => ({
      memberId: p.memberId,
      share: Money.of(base + (BigInt(i) < rem ? 1n : 0n), total.currency),
    }));
  }

  // ── exact ─────────────────────────────────────────────────────────────────
  static exact(
    total: Money,
    entries: Array<{ memberId: string; amount: Money }>,
  ): SplitShare[] {
    if (entries.length === 0) throw new Error('SplitEngine.exact: no entries');
    let sum = 0n;
    for (const e of entries) {
      if (e.amount.currency !== total.currency) {
        throw new Error('SplitEngine.exact: currency mismatch');
      }
      sum += e.amount.amount;
    }
    if (sum !== total.amount) {
      throw new Error(
        `SplitEngine.exact: entries sum ${sum} ≠ total ${total.amount}`,
      );
    }
    return entries.map((e) => ({ memberId: e.memberId, share: e.amount }));
  }

  // ── shares ────────────────────────────────────────────────────────────────
  static shares(
    total: Money,
    participants: SplitParticipant[],
    shares: Record<string, number>,
  ): SplitShare[] {
    const sorted = [...participants].sort((a, b) => (a.orderKey < b.orderKey ? -1 : 1));
    const weights: bigint[] = sorted.map((p) => {
      const w = shares[p.memberId];
      if (!Number.isInteger(w) || w <= 0) {
        throw new Error(`SplitEngine.shares: invalid share for ${p.memberId}`);
      }
      return BigInt(w);
    });
    const sumW = weights.reduce((a, b) => a + b, 0n);
    if (sumW === 0n) throw new Error('SplitEngine.shares: total share is zero');

    // base[i] = total * weights[i] / sumW  (integer division)
    // remainder[i] = total * weights[i] % sumW  (for ranking)
    const bases = weights.map((w) => (total.amount * w) / sumW);
    const remainders = weights.map((w, i) => ({
      i,
      r: (total.amount * w) % sumW,
    }));
    let assigned = bases.reduce((a, b) => a + b, 0n);
    let toDistribute = total.amount - assigned;

    // Distribute remaining minor units to largest remainders, then by order.
    remainders.sort((a, b) => {
      if (b.r !== a.r) return b.r > a.r ? 1 : -1;
      return a.i - b.i; // stable tie-break by original (sorted) order
    });
    let k = 0;
    while (toDistribute > 0n) {
      bases[remainders[k % remainders.length].i] += 1n;
      toDistribute -= 1n;
      k += 1;
    }
    return sorted.map((p, i) => ({
      memberId: p.memberId,
      share: Money.of(bases[i], total.currency),
    }));
  }

  // ── percentage (basis points, sum = 10000) ───────────────────────────────
  static percentage(
    total: Money,
    participants: SplitParticipant[],
    bp: Record<string, number>,
  ): SplitShare[] {
    let sum = 0;
    for (const p of participants) {
      const v = bp[p.memberId];
      if (!Number.isInteger(v) || v < 0) {
        throw new Error(`SplitEngine.percentage: invalid bp for ${p.memberId}`);
      }
      sum += v;
    }
    if (sum !== 10000) {
      throw new Error(`SplitEngine.percentage: bp must sum to 10000, got ${sum}`);
    }
    // Reuse shares() with bp as weights.
    return SplitEngine.shares(total, participants, bp);
  }

  // ── adjustment (equal split + signed per-person delta) ───────────────────
  static adjustment(
    total: Money,
    participants: SplitParticipant[],
    adjustments: Record<string, Money>,
  ): SplitShare[] {
    let adjSum = 0n;
    for (const p of participants) {
      const a = adjustments[p.memberId];
      if (a && a.currency !== total.currency) {
        throw new Error('SplitEngine.adjustment: currency mismatch');
      }
      adjSum += a ? a.amount : 0n;
    }
    const remainingTotal = Money.of(total.amount - adjSum, total.currency);
    if (remainingTotal.isNegative()) {
      throw new Error('SplitEngine.adjustment: adjustments exceed total');
    }
    const baseShares = SplitEngine.equal(remainingTotal, participants);
    const out = baseShares.map((s) => ({
      memberId: s.memberId,
      share: s.share.add(adjustments[s.memberId] ?? Money.zero(total.currency)),
    }));
    // Defensive: re-assert sum == total.
    const checkSum = out.reduce((acc, s) => acc + s.share.amount, 0n);
    if (checkSum !== total.amount) {
      throw new Error('SplitEngine.adjustment: sum invariant violated');
    }
    return out;
  }

  // ── itemized (already-computed per-line entries) ─────────────────────────
  static itemized(
    total: Money,
    lines: Array<{ memberId: string; amount: Money }>,
  ): SplitShare[] {
    // Aggregate per member, then validate.
    const agg = new Map<string, bigint>();
    for (const l of lines) {
      if (l.amount.currency !== total.currency) {
        throw new Error('SplitEngine.itemized: currency mismatch');
      }
      agg.set(l.memberId, (agg.get(l.memberId) ?? 0n) + l.amount.amount);
    }
    let sum = 0n;
    const out: SplitShare[] = [];
    for (const [memberId, amount] of agg) {
      sum += amount;
      out.push({ memberId, share: Money.of(amount, total.currency) });
    }
    if (sum !== total.amount) {
      throw new Error(
        `SplitEngine.itemized: line sum ${sum} ≠ total ${total.amount}`,
      );
    }
    return out;
  }
}
