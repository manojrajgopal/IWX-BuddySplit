import { Money, SplitEngine, SettlementEngine } from '../src/core/money';

const part = (ids: string[]) =>
  ids.map((id, i) => ({ memberId: id, orderKey: `${i}|${id}` }));

describe('Money', () => {
  it('parses decimal strings with currency precision', () => {
    expect(Money.fromDecimalString('1234.56', 'INR').amount).toBe(123456n);
    expect(Money.fromDecimalString('1234', 'JPY').amount).toBe(1234n);
    expect(Money.fromDecimalString('-0.01', 'USD').amount).toBe(-1n);
  });
  it('formats back to decimal', () => {
    expect(Money.of(123456n, 'INR').toDecimalString()).toBe('1234.56');
    expect(Money.of(5n, 'JPY').toDecimalString()).toBe('5');
    expect(Money.of(-1n, 'USD').toDecimalString()).toBe('-0.01');
  });
  it('rejects floats and mixed currencies', () => {
    expect(() => Money.of(1.23 as unknown as bigint, 'INR')).toThrow();
    expect(() => Money.of(1n, 'INR').add(Money.of(1n, 'USD'))).toThrow();
  });
});

describe('SplitEngine.equal', () => {
  it('sums exactly and differs by at most 1 minor unit', () => {
    const total = Money.of(1000n, 'INR'); // 10.00
    const shares = SplitEngine.equal(total, part(['a', 'b', 'c'])); // 333.33...
    const sum = shares.reduce((s, x) => s + x.share.amount, 0n);
    expect(sum).toBe(1000n);
    const amounts = shares.map((s) => s.share.amount).sort();
    expect(amounts[amounts.length - 1] - amounts[0]).toBeLessThanOrEqual(1n);
  });
  it('is deterministic across runs', () => {
    const total = Money.of(1001n, 'INR');
    const a = SplitEngine.equal(total, part(['x', 'y', 'z']));
    const b = SplitEngine.equal(total, part(['x', 'y', 'z']));
    expect(a).toEqual(b);
  });
});

describe('SplitEngine.shares', () => {
  it('distributes remainder by largest fractional', () => {
    const total = Money.of(1000n, 'INR');
    const out = SplitEngine.shares(total, part(['a', 'b', 'c']), { a: 1, b: 1, c: 2 });
    const sum = out.reduce((s, x) => s + x.share.amount, 0n);
    expect(sum).toBe(1000n);
    expect(out.find((s) => s.memberId === 'c')!.share.amount).toBeGreaterThan(
      out.find((s) => s.memberId === 'a')!.share.amount,
    );
  });
});

describe('SplitEngine.percentage', () => {
  it('requires bp to sum to 10000', () => {
    expect(() =>
      SplitEngine.percentage(Money.of(1000n, 'INR'), part(['a', 'b']), { a: 5000, b: 4000 }),
    ).toThrow();
  });
  it('splits 33/33/34 cleanly', () => {
    const out = SplitEngine.percentage(
      Money.of(1000n, 'INR'), part(['a', 'b', 'c']),
      { a: 3333, b: 3333, c: 3334 },
    );
    expect(out.reduce((s, x) => s + x.share.amount, 0n)).toBe(1000n);
  });
});

describe('SplitEngine.exact', () => {
  it('rejects mismatched sums', () => {
    expect(() =>
      SplitEngine.exact(Money.of(1000n, 'INR'), [
        { memberId: 'a', amount: Money.of(400n, 'INR') },
        { memberId: 'b', amount: Money.of(500n, 'INR') },
      ]),
    ).toThrow();
  });
});

describe('SplitEngine.adjustment', () => {
  it('applies per-person delta and balances', () => {
    const out = SplitEngine.adjustment(
      Money.of(1000n, 'INR'),
      part(['a', 'b', 'c']),
      { a: Money.of(100n, 'INR'), b: Money.of(-50n, 'INR'), c: Money.of(0n, 'INR') },
    );
    expect(out.reduce((s, x) => s + x.share.amount, 0n)).toBe(1000n);
  });
});

describe('SettlementEngine', () => {
  it('produces zero transfers when balanced', () => {
    const t = SettlementEngine.simplify('INR', [
      { memberId: 'a', net: Money.of(0n, 'INR') },
      { memberId: 'b', net: Money.of(0n, 'INR') },
    ]);
    expect(t).toEqual([]);
  });
  it('simplifies a 3-way chain', () => {
    const t = SettlementEngine.simplify('INR', [
      { memberId: 'a', net: Money.of(500n, 'INR') },     // creditor
      { memberId: 'b', net: Money.of(-300n, 'INR') },    // debtor
      { memberId: 'c', net: Money.of(-200n, 'INR') },    // debtor
    ]);
    const sum = t.reduce((s, x) => s + x.amount.amount, 0n);
    expect(sum).toBe(500n);
    expect(t.length).toBeLessThanOrEqual(2);
    for (const x of t) expect(x.to).toBe('a');
  });
  it('detects ledger imbalance', () => {
    expect(() =>
      SettlementEngine.simplify('INR', [
        { memberId: 'a', net: Money.of(100n, 'INR') },
        { memberId: 'b', net: Money.of(-50n, 'INR') },
      ]),
    ).toThrow();
  });
  it('handles a 4-person mixed ledger and clears all balances', () => {
    const t = SettlementEngine.simplify('INR', [
      { memberId: 'a', net: Money.of(700n, 'INR') },
      { memberId: 'b', net: Money.of(300n, 'INR') },
      { memberId: 'c', net: Money.of(-400n, 'INR') },
      { memberId: 'd', net: Money.of(-600n, 'INR') },
    ]);
    // Reconstruct nets after transfers; should all be zero.
    const acc = new Map<string, bigint>([
      ['a', 700n], ['b', 300n], ['c', -400n], ['d', -600n],
    ]);
    for (const x of t) {
      acc.set(x.from, (acc.get(x.from) ?? 0n) + x.amount.amount);
      acc.set(x.to, (acc.get(x.to) ?? 0n) - x.amount.amount);
    }
    for (const v of acc.values()) expect(v).toBe(0n);
  });
});
