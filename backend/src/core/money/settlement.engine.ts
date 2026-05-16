import { Money } from './money';

export interface MemberNet {
  memberId: string;
  /** signed: positive = creditor (others owe them), negative = debtor */
  net: Money;
}

export interface Transfer {
  from: string;     // debtor memberId
  to: string;       // creditor memberId
  amount: Money;
}

/**
 * SettlementEngine: produces a minimal-ish chain of transfers that brings every
 * member's net balance to zero.
 *
 * Algorithm: greedy creditor–debtor matching.
 *   - Sort creditors by net DESC (tie: memberId ASC).
 *   - Sort debtors  by |net| DESC (tie: memberId ASC).
 *   - Repeatedly transfer min(creditor, |debtor|) from the largest debtor to
 *     the largest creditor; remove whichever side reaches zero; reinsert the
 *     residue of the other side in sort order. Stop when both heaps empty.
 *
 * Properties:
 *   - Deterministic.
 *   - Produces ≤ (n - 1) transfers when feasible.
 *   - Exact: every transfer amount is an integer minor-unit value.
 *   - Σ creditors == Σ |debtors| is asserted (precondition of a valid ledger).
 */
export class SettlementEngine {
  static simplify(currency: string, nets: MemberNet[]): Transfer[] {
    // Validate.
    let pos = 0n;
    let neg = 0n;
    for (const n of nets) {
      if (n.net.currency !== currency) {
        throw new Error('SettlementEngine: currency mismatch');
      }
      if (n.net.amount > 0n) pos += n.net.amount;
      else if (n.net.amount < 0n) neg += -n.net.amount;
    }
    if (pos !== neg) {
      throw new Error(
        `SettlementEngine: ledger imbalance: creditors=${pos} debtors=${neg}`,
      );
    }

    // Build sorted creditor/debtor arrays (we treat as priority queues by
    // re-sorting; n is small in practice — < 100 members per workspace).
    const creditors = nets
      .filter((n) => n.net.amount > 0n)
      .map((n) => ({ id: n.memberId, amount: n.net.amount }))
      .sort(cmpDescThenId);
    const debtors = nets
      .filter((n) => n.net.amount < 0n)
      .map((n) => ({ id: n.memberId, amount: -n.net.amount }))
      .sort(cmpDescThenId);

    const transfers: Transfer[] = [];
    while (creditors.length > 0 && debtors.length > 0) {
      const c = creditors[0];
      const d = debtors[0];
      const pay = c.amount < d.amount ? c.amount : d.amount;
      transfers.push({
        from: d.id,
        to: c.id,
        amount: Money.of(pay, currency),
      });
      c.amount -= pay;
      d.amount -= pay;
      if (c.amount === 0n) creditors.shift();
      else {
        creditors.shift();
        insertSorted(creditors, c);
      }
      if (d.amount === 0n) debtors.shift();
      else {
        debtors.shift();
        insertSorted(debtors, d);
      }
    }
    return transfers;
  }

  /**
   * Compute per-member nets from raw paid/owed maps.
   * Maps are keyed by memberId; missing keys are treated as 0.
   */
  static computeNets(
    currency: string,
    members: string[],
    paid: Map<string, bigint>,
    owed: Map<string, bigint>,
  ): MemberNet[] {
    return members.map((m) => ({
      memberId: m,
      net: Money.of((paid.get(m) ?? 0n) - (owed.get(m) ?? 0n), currency),
    }));
  }
}

function cmpDescThenId(a: { id: string; amount: bigint }, b: { id: string; amount: bigint }): number {
  if (a.amount !== b.amount) return a.amount > b.amount ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function insertSorted(
  arr: Array<{ id: string; amount: bigint }>,
  v: { id: string; amount: bigint },
): void {
  // Linear insert is fine for small n. Avoids a heap dep.
  let i = 0;
  while (i < arr.length && cmpDescThenId(arr[i], v) <= 0) i += 1;
  arr.splice(i, 0, v);
}
