'use client';
import { useState } from 'react';

type SplitMode = 'equal' | 'exact' | 'percentage' | 'shares' | 'adjustment' | 'itemized';

const GUIDE: Record<SplitMode, {
  title: string;
  tagline: string;
  when: string;
  how: string;
  example: { total: string; members: string[]; rows: string[][]; note?: string };
}> = {
  equal: {
    title: 'Equal split',
    tagline: 'Everyone pays the same amount.',
    when: 'Shared meals, group tickets, utilities — anything where everyone benefits equally.',
    how: 'The total is divided equally. If it doesn\u2019t divide evenly, the extra paise/cents are distributed one-by-one to the first members (sorted by join date).',
    example: {
      total: '\u20B9500.00',
      members: ['Alice', 'Bob', 'Charlie'],
      rows: [
        ['Alice',   '\u20B9166.67'],
        ['Bob',     '\u20B9166.67'],
        ['Charlie', '\u20B9166.66'],
      ],
      note: '\u20B9500.00 \u00F7 3 = \u20B9166.666\u2026 \u2014 the extra paisa goes to Alice.',
    },
  },
  exact: {
    title: 'Exact amounts',
    tagline: 'You specify exactly how much each person owes.',
    when: 'Everyone ordered different items, or you already know each person\u2019s share.',
    how: 'Enter the exact amount per person. The sum of all amounts must equal the total expense.',
    example: {
      total: '\u20B91,200.00',
      members: ['Alice', 'Bob', 'Charlie'],
      rows: [
        ['Alice',   '\u20B9300.00'],
        ['Bob',     '\u20B9450.00'],
        ['Charlie', '\u20B9450.00'],
      ],
      note: '\u20B9300 + \u20B9450 + \u20B9450 = \u20B91,200 \u2714',
    },
  },
  percentage: {
    title: 'Percentage split',
    tagline: 'Each person owes a percentage of the total.',
    when: 'Rent split by room size, income-based sharing, or any proportional arrangement.',
    how: 'Enter each person\u2019s percentage. All percentages must add up to exactly 100%. The engine converts to basis points (100% = 10,000 bp) for precision.',
    example: {
      total: '\u20B910,000.00',
      members: ['Alice', 'Bob', 'Charlie'],
      rows: [
        ['Alice',   '50%', '\u20B95,000.00'],
        ['Bob',     '30%', '\u20B93,000.00'],
        ['Charlie', '20%', '\u20B92,000.00'],
      ],
      note: '50% + 30% + 20% = 100% \u2714',
    },
  },
  shares: {
    title: 'Shares (weighted)',
    tagline: 'Split by ratio \u2014 like slicing a pizza into custom-sized pieces.',
    when: 'Families with different numbers of people (2 adults vs 1 adult), unequal usage, or any custom ratio.',
    how: 'Assign whole-number share units to each person. The total is divided proportionally. Example: shares of 2, 1, 1 means the first person pays double.',
    example: {
      total: '\u20B91,000.00',
      members: ['Alice (2 guests)', 'Bob', 'Charlie'],
      rows: [
        ['Alice (2 guests)', '2 shares', '\u20B9500.00'],
        ['Bob',              '1 share',  '\u20B9250.00'],
        ['Charlie',          '1 share',  '\u20B9250.00'],
      ],
      note: 'Total shares = 4. Alice: 2/4 = 50%, Bob & Charlie: 1/4 = 25% each.',
    },
  },
  adjustment: {
    title: 'Equal + adjustments',
    tagline: 'Start equal, then add or subtract fixed amounts per person.',
    when: 'Mostly equal, but someone had an extra drink or deserves a small discount.',
    how: 'Adjustments (\u00B1) are subtracted from the total first. The remainder is split equally. Then each person\u2019s adjustment is added back to their share.',
    example: {
      total: '\u20B91,500.00',
      members: ['Alice', 'Bob', 'Charlie'],
      rows: [
        ['Alice',   '+\u20B9200 (extra)', '\u20B9200 + \u20B9433.33 = \u20B9633.33'],
        ['Bob',     '\u20B90 (no adj)',  '\u20B9433.33'],
        ['Charlie', '\u20B90 (no adj)',  '\u20B9433.34'],
      ],
      note: 'Remainder = \u20B91,500 \u2212 \u20B9200 = \u20B91,300 \u00F7 3 = \u20B9433.33 each. Then Alice adds her \u20B9200.',
    },
  },
  itemized: {
    title: 'Itemized',
    tagline: 'Assign individual line items to specific people.',
    when: 'Restaurant bills where each dish belongs to someone, or mixed grocery receipts.',
    how: 'Add items with their amounts and assign each to one or more members. The sum of all items must equal the total. Each person\u2019s share is the total of items assigned to them.',
    example: {
      total: '\u20B9900.00',
      members: ['Alice', 'Bob', 'Charlie'],
      rows: [
        ['Pasta (\u20B9350)',    'Alice',           '\u20B9350.00'],
        ['Pizza (\u20B9300)',    'Bob',             '\u20B9300.00'],
        ['Dessert (\u20B9250)', 'Charlie',         '\u20B9250.00'],
      ],
      note: '\u20B9350 + \u20B9300 + \u20B9250 = \u20B9900 \u2714',
    },
  },
};

const MODE_ORDER: SplitMode[] = ['equal', 'exact', 'percentage', 'shares', 'adjustment', 'itemized'];

export function SplitModeGuide({ activeMode }: { activeMode: SplitMode }): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'all'>('active');

  const modes = viewMode === 'active' ? [activeMode] : MODE_ORDER;
  const hasPercentCol = (m: SplitMode) => m === 'percentage' || m === 'shares' || m === 'adjustment';

  return (
    <div className="split-guide">
      <button
        type="button"
        className="split-guide__toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4"/><path d="M12 17h.01"/>
        </svg>
        <span>{expanded ? 'Hide split mode guide' : 'How does this split mode work?'}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {expanded && (
        <div className="split-guide__body">
          <div className="split-guide__tabs">
            <button type="button" className={'split-guide__tab' + (viewMode === 'active' ? ' split-guide__tab--active' : '')} onClick={() => setViewMode('active')}>
              Current mode
            </button>
            <button type="button" className={'split-guide__tab' + (viewMode === 'all' ? ' split-guide__tab--active' : '')} onClick={() => setViewMode('all')}>
              All modes overview
            </button>
          </div>

          {modes.map((mode) => {
            const g = GUIDE[mode];
            const showMiddleCol = hasPercentCol(mode);
            return (
              <div key={mode} className={'split-guide__card' + (mode === activeMode && viewMode === 'all' ? ' split-guide__card--active' : '')}>
                <div className="split-guide__header">
                  <h4 className="split-guide__title">{g.title}</h4>
                  <span className="split-guide__tagline">{g.tagline}</span>
                </div>

                <div className="split-guide__section">
                  <div className="split-guide__label">When to use</div>
                  <p className="split-guide__text">{g.when}</p>
                </div>

                <div className="split-guide__section">
                  <div className="split-guide__label">How it works</div>
                  <p className="split-guide__text">{g.how}</p>
                </div>

                <div className="split-guide__section">
                  <div className="split-guide__label">Example &mdash; {g.example.total} split between {g.example.members.join(', ')}</div>
                  <table className="split-guide__table">
                    <thead>
                      <tr>
                        <th>{mode === 'itemized' ? 'Item' : 'Member'}</th>
                        {showMiddleCol && <th>{mode === 'percentage' ? '%' : mode === 'shares' ? 'Shares' : 'Adjustment'}</th>}
                        <th>{mode === 'itemized' ? 'Assigned to' : 'Owes'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.example.rows.map((row, i) => (
                        <tr key={i}>
                          <td>{row[0]}</td>
                          {showMiddleCol && <td className="text-mono">{row[1]}</td>}
                          <td className="text-mono">{row[showMiddleCol ? 2 : 1]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {g.example.note && <p className="split-guide__note">{g.example.note}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
