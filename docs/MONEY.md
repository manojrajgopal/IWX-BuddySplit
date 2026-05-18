# Money & Settlement — Specification

> All monetary values in IWX BuddySplit are stored, transmitted, and computed as **integer minor units** (`bigint`). Floating-point is forbidden in this codebase for monetary values.

## Representation

```ts
type CurrencyCode = string; // ISO-4217, uppercase
class Money {
  readonly amount: bigint;     // minor units (e.g. paise, cents)
  readonly currency: CurrencyCode;
}
```

- Storage: `amount_minor BIGINT NOT NULL`, `currency CHAR(3) NOT NULL`.
- Wire format: JSON `{ "amount": "12345", "currency": "INR" }` — `amount` is a **string** to survive JS `Number` precision loss.
- Display: see `frontend/src/lib/money/format.ts`. Uses `Intl.NumberFormat` with explicit `minimumFractionDigits` from a currency table.

## Arithmetic rules

- `add`, `sub`, `neg`, `abs` require same currency or throw.
- `mul(scalar)` — `scalar` is a `bigint` or a `{num: bigint, den: bigint}` rational. No floats.
- Division is **only** performed by the splitter (largest-remainder).
- No silent rounding anywhere else.

## Splitting (Hamilton / largest-remainder)

```
splitEqual(total, n, order):
  base = total \ n            # integer division
  rem  = total - base * n     # in [0, n-1]
  result = [base, base, ..., base]
  # distribute `rem` extra minor units to first `rem` participants in `order`
  for i in 0..rem-1: result[order[i]] += 1
  return result
```

`order` is stable: by `member.joined_at ASC, member.id ASC`. This guarantees the same expense always splits the same way.

`splitByShares(total, shares[])`: same algorithm but `base[i] = total * shares[i] \ sum(shares)`, then distribute remainder by largest fractional remainder.

`splitByPercentageBp(total, bp[])`: `bp` sums to 10000; treat as shares.

`splitExact(total, amounts[])`: `sum(amounts) == total` is validated; no rounding needed.

`splitAdjustment(total, baseEqual=true, adjustments[])`: each member's share is `equalShare + adjustment[i]`; the residual after equal split is distributed by Hamilton, then the per-person adjustment is added; the sum is asserted to equal `total`.

Every splitter returns `Array<{ memberId, share: bigint }>` summing exactly to `total`.

## Balances

For a workspace:

```
paid[m]   = Σ over expenses where payer = m of total_minor
owed[m]   = Σ over splits where member  = m of share_minor
net[m]    = paid[m] − owed[m]
Σ net[*]  = 0    (invariant; unit-tested)
```

## Settlement simplification

Greedy creditor-debtor pairing:

```
nets = [(member, net) for all members]
creditors = max-heap of (net, member) where net > 0
debtors   = max-heap of (|net|, member) where net < 0
transfers = []
while creditors and debtors:
  (c, cm) = creditors.pop()
  (d, dm) = debtors.pop()
  pay = min(c, d)
  transfers.append({ from: dm, to: cm, amount: pay })
  if c > pay: creditors.push(c - pay, cm)
  if d > pay: debtors.push(d - pay, dm)
return transfers
```

Properties:
- At most `n − 1` transfers when all nets are non-zero.
- Deterministic given a stable tie-break (member id ASC for equal nets).
- Produces zero transfers when all nets are zero.

## Partial settlement

When a debtor pays only part of a suggested transfer:

1. Record a `settlement_transaction` row with `amount_paid_minor` (the actual amount).
2. The ledger entry adjusts `paid[payer] += amount_paid_minor` and `paid[recipient] -= amount_paid_minor` (recipient effectively "owes back" the unpaid portion of nothing — actually: the transfer simply reduces the debtor's net by the paid amount and increases creditor's net by the same).
3. Re-run the simplification on the updated nets. The remaining transfers automatically reflect the residue.

## Workspace lifecycle and snapshots

- `complete()`: writes `workspace_snapshots(snapshot_kind='completion')` JSON of all nets + transfers, marks workspace `status='completed'`. No further mutation allowed.
- `pause()`: sets `status='paused'`; reads remain open, writes blocked except admin/audit.
- `reopen()`: copies workspace forward into a new `epoch`, snapshot frozen, expenses/settlements continue under new epoch id.
