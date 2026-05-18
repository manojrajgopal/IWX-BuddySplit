'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * A 30-second responsive animated short film for the Home page.
 *
 * Story arc:
 *   0–5s   Scene 1  · Friends set off on a road trip together
 *   5–10s  Scene 2  · Expenses pile up (food, fuel, hotels, cabs…)
 *   10–15s Scene 3  · Without BuddySplit — confusion & arguments
 *   15–20s Scene 4  · They discover BuddySplit
 *   20–25s Scene 5  · The app does the math — every paisa accounted for
 *   25–30s Scene 6  · Happy ending — group settled, journey continues
 *
 * Implementation notes
 *   • Pure inline SVG + CSS keyframes — no media files, no canvas.
 *   • Each scene is mounted only when active to restart its CSS animations.
 *   • Auto-loops; can be paused/restarted with controls.
 *   • Fully responsive — the SVGs use viewBox, the wrapper scales fluidly.
 *   • Respects prefers-reduced-motion (animations freeze at scene midpoint).
 */

interface SceneDef {
  id: number;
  duration: number; // seconds
  label: string;
  caption: string;
  mood: 'travel' | 'pile' | 'chaos' | 'discover' | 'calc' | 'happy';
}

const SCENES: SceneDef[] = [
  { id: 1, duration: 5, label: 'The journey begins',     caption: 'Four friends. One road trip. Endless memories ahead.',                 mood: 'travel'   },
  { id: 2, duration: 5, label: 'Expenses pile up',       caption: 'Fuel, food, hotels, cabs… receipts everywhere.',                       mood: 'pile'     },
  { id: 3, duration: 5, label: 'Without BuddySplit',     caption: '“Wait, who paid for dinner?” — Friendships start to wobble.',           mood: 'chaos'    },
  { id: 4, duration: 5, label: 'Then they discovered…',  caption: 'BuddySplit — a tiny app that takes care of every rupee.',              mood: 'discover' },
  { id: 5, duration: 5, label: 'Smart math, in seconds', caption: 'Every paisa accounted for. The fewest payments possible.',             mood: 'calc'     },
  { id: 6, duration: 5, label: 'Happily ever after',     caption: 'Everyone settled. Everyone smiling. The journey continues.',           mood: 'happy'    },
];

const TOTAL = SCENES.reduce((a, s) => a + s.duration, 0);

export function MoneyJourneyAnimation(): JSX.Element {
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);
  const lastRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    const tick = (t: number): void => {
      if (!lastRef.current) lastRef.current = t;
      const dt = (t - lastRef.current) / 1000;
      lastRef.current = t;
      setElapsed((e) => {
        const next = e + dt;
        return next >= TOTAL ? 0 : next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastRef.current = 0;
    };
  }, [playing]);

  // Figure out current scene
  let cumul = 0;
  let activeIdx = 0;
  for (let i = 0; i < SCENES.length; i++) {
    if (elapsed < cumul + SCENES[i].duration) {
      activeIdx = i;
      break;
    }
    cumul += SCENES[i].duration;
    activeIdx = i;
  }
  const active = SCENES[activeIdx];
  const sceneElapsed = elapsed - cumul;
  const sceneProgress = Math.min(sceneElapsed / active.duration, 1);

  const restart = (): void => {
    setElapsed(0);
    lastRef.current = 0;
    setPlaying(true);
  };

  return (
    <div className="mja">
      {/* ─── Top label bar ─── */}
      <div className="mja__topbar">
        <div className="mja__chapter">
          <span className="mja__chapter-num">Chapter {active.id} / {SCENES.length}</span>
          <span className="mja__chapter-name">{active.label}</span>
        </div>
        <div className="mja__controls">
          <button
            type="button"
            className="mja__btn"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause animation' : 'Play animation'}
          >
            {playing ? '❚❚' : '►'}
          </button>
          <button type="button" className="mja__btn" onClick={restart} aria-label="Restart">
            ⟲
          </button>
          <span className="mja__time">
            {Math.floor(elapsed)}s / {TOTAL}s
          </span>
        </div>
      </div>

      {/* ─── Stage ─── */}
      <div className="mja__stage" data-mood={active.mood}>
        {/* Persistent backdrop sky that shifts color per scene */}
        <div className="mja__sky" data-scene={active.id} aria-hidden />
        <div className="mja__ground" aria-hidden />

        {/* Only mount the active scene so its CSS animations restart */}
        <div key={active.id} className="mja__scene mja__scene--in">
          {active.mood === 'travel'   && <SceneTravel   progress={sceneProgress} />}
          {active.mood === 'pile'     && <ScenePile     progress={sceneProgress} />}
          {active.mood === 'chaos'    && <SceneChaos    progress={sceneProgress} />}
          {active.mood === 'discover' && <SceneDiscover progress={sceneProgress} />}
          {active.mood === 'calc'     && <SceneCalc     progress={sceneProgress} />}
          {active.mood === 'happy'    && <SceneHappy    progress={sceneProgress} />}
        </div>

        {/* Caption */}
        <div key={`cap-${active.id}`} className="mja__caption">
          <p>{active.caption}</p>
        </div>
      </div>

      {/* ─── Scene dots ─── */}
      <div className="mja__dots">
        {SCENES.map((s, i) => (
          <button
            type="button"
            key={s.id}
            className={'mja__dot' + (i === activeIdx ? ' mja__dot--active' : '') + (i < activeIdx ? ' mja__dot--done' : '')}
            onClick={() => {
              let c = 0;
              for (let j = 0; j < i; j++) c += SCENES[j].duration;
              setElapsed(c + 0.001);
              lastRef.current = 0;
            }}
            aria-label={`Go to chapter ${s.id}: ${s.label}`}
          >
            <span className="mja__dot-num">{s.id}</span>
            <span className="mja__dot-name">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Scene 1 — Travel: friends in a car driving past hills under a rising sun
   ────────────────────────────────────────────────────────────────────────── */
function SceneTravel({ progress: _p }: { progress: number }): JSX.Element {
  return (
    <svg viewBox="0 0 800 380" className="mja__svg" preserveAspectRatio="xMidYMid meet" aria-hidden>
      {/* Sun rising */}
      <circle className="mja-sun" cx="640" cy="260" r="48" fill="#ffd166" />
      <circle className="mja-sun-glow" cx="640" cy="260" r="80" fill="#ffd166" opacity="0.25" />

      {/* Distant hills */}
      <path className="mja-hill mja-hill--back" d="M0,260 Q160,170 320,230 T640,210 T960,250 L960,380 L0,380 Z" fill="#8ecae6" />
      <path className="mja-hill mja-hill--mid" d="M-40,290 Q180,210 380,270 T780,260 L820,380 L-40,380 Z" fill="#5fa8d3" />
      <path className="mja-hill mja-hill--front" d="M-60,330 Q220,260 480,310 T900,320 L900,380 L-60,380 Z" fill="#3a7ca5" />

      {/* Road */}
      <rect x="0" y="320" width="800" height="60" fill="#3d3d3d" />
      <g className="mja-road-stripes">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <rect key={i} x={-40 + i * 100} y="346" width="50" height="8" fill="#ffd166" rx="2" />
        ))}
      </g>

      {/* Trees rolling past */}
      <g className="mja-trees">
        {[120, 320, 520, 720, 920, 1120].map((x, i) => (
          <g key={i} transform={`translate(${x}, 280)`}>
            <rect x="-4" y="0" width="8" height="22" fill="#5a3825" />
            <circle cx="0" cy="-6" r="18" fill="#2a9d8f" />
          </g>
        ))}
      </g>

      {/* Car with 4 friends bouncing */}
      <g className="mja-car" transform="translate(280, 270)">
        {/* Body */}
        <rect x="0" y="20" width="220" height="42" rx="10" fill="#e76f51" />
        <path d="M30,20 L60,-6 L160,-6 L190,20 Z" fill="#e76f51" />
        {/* Windows */}
        <path d="M40,18 L65,0 L155,0 L180,18 Z" fill="#a8dadc" />
        <rect x="105" y="0" width="3" height="18" fill="#e76f51" />
        {/* Friends silhouettes */}
        <circle cx="72" cy="9" r="6" fill="#264653" />
        <circle cx="92" cy="9" r="6" fill="#f4a261" />
        <circle cx="128" cy="9" r="6" fill="#2a9d8f" />
        <circle cx="148" cy="9" r="6" fill="#e9c46a" />
        {/* Wheels */}
        <circle className="mja-wheel" cx="50" cy="62" r="16" fill="#1d3557" />
        <circle className="mja-wheel" cx="170" cy="62" r="16" fill="#1d3557" />
        <circle cx="50" cy="62" r="6" fill="#a8dadc" />
        <circle cx="170" cy="62" r="6" fill="#a8dadc" />
        {/* Headlight */}
        <circle cx="218" cy="40" r="4" fill="#fff3b0" />
      </g>

      {/* Hearts/luggage drifting up */}
      <g className="mja-bubbles">
        {['❤', '✦', '★', '❤', '✦'].map((c, i) => (
          <text
            key={i}
            x={120 + i * 130}
            y="100"
            fontSize="22"
            fill={['#e76f51', '#ffd166', '#2a9d8f', '#e76f51', '#264653'][i]}
            textAnchor="middle"
            style={{ animationDelay: `${i * 0.4}s` }}
            className="mja-bubble"
          >{c}</text>
        ))}
      </g>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Scene 2 — Pile: receipts and bills flying into a growing pile
   ────────────────────────────────────────────────────────────────────────── */
function ScenePile({ progress: _p }: { progress: number }): JSX.Element {
  const items = [
    { x: 120, y: 200, color: '#ffd6a5', label: '🍕', amt: '₹420', delay: 0 },
    { x: 220, y: 180, color: '#caffbf', label: '⛽',  amt: '₹2,300', delay: 0.4 },
    { x: 340, y: 220, color: '#a0c4ff', label: '🏨', amt: '₹3,800', delay: 0.8 },
    { x: 440, y: 190, color: '#ffc6ff', label: '🚖', amt: '₹650',  delay: 1.2 },
    { x: 540, y: 210, color: '#fdffb6', label: '🍻', amt: '₹980',  delay: 1.6 },
    { x: 640, y: 180, color: '#bdb2ff', label: '🎟️', amt: '₹1,200', delay: 2.0 },
  ];

  return (
    <svg viewBox="0 0 800 380" className="mja__svg" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <rect x="0" y="0" width="800" height="380" fill="transparent" />

      {/* Counter / table */}
      <rect x="60" y="320" width="680" height="20" fill="#8d6e63" rx="4" />
      <rect x="60" y="340" width="680" height="40" fill="#5d4037" />

      {/* Falling receipts */}
      <g>
        {items.map((it, i) => (
          <g key={i} className="mja-receipt" style={{ animationDelay: `${it.delay}s` }}>
            <g transform={`translate(${it.x}, ${it.y}) rotate(${(i % 2 ? -8 : 8)})`}>
              <rect x="-44" y="-58" width="88" height="116" rx="6" fill={it.color} stroke="#333" strokeWidth="1.5" />
              {/* Torn bottom */}
              <path d="M-44,58 L-34,52 L-24,58 L-14,52 L-4,58 L6,52 L16,58 L26,52 L36,58 L44,52 L44,68 L-44,68 Z" fill={it.color} stroke="#333" strokeWidth="1.5" />
              <text x="0" y="-28" textAnchor="middle" fontSize="28">{it.label}</text>
              <line x1="-32" y1="-8" x2="32" y2="-8" stroke="#888" strokeWidth="1.2" strokeDasharray="3 2" />
              <line x1="-32" y1="6"  x2="32" y2="6"  stroke="#888" strokeWidth="1.2" strokeDasharray="3 2" />
              <line x1="-32" y1="20" x2="32" y2="20" stroke="#888" strokeWidth="1.2" strokeDasharray="3 2" />
              <text x="0" y="44" textAnchor="middle" fontSize="14" fontWeight="700" fill="#111">{it.amt}</text>
            </g>
          </g>
        ))}
      </g>

      {/* Big confused calculator icon */}
      <g className="mja-calc-wobble" transform="translate(680, 60)">
        <rect x="-30" y="-30" width="60" height="80" rx="8" fill="#fff" stroke="#222" strokeWidth="2" />
        <rect x="-22" y="-22" width="44" height="14" fill="#90e0ef" />
        <text x="0" y="-11" textAnchor="middle" fontSize="10" fontWeight="700" fill="#111">??? ??</text>
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => (
            <rect key={`${row}-${col}`} x={-22 + col * 16} y={-2 + row * 16} width="12" height="12" rx="2" fill="#eee" stroke="#999" />
          )),
        )}
      </g>

      {/* Total badge growing */}
      <g className="mja-total" transform="translate(400, 90)">
        <rect x="-110" y="-30" width="220" height="60" rx="30" fill="#e63946" />
        <text x="0" y="-5" textAnchor="middle" fontSize="14" fill="#fff" opacity="0.85">Total spent</text>
        <text x="0" y="18" textAnchor="middle" fontSize="22" fontWeight="700" fill="#fff">₹9,350</text>
      </g>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Scene 3 — Chaos: speech bubbles arguing, broken heart, frantic phones
   ────────────────────────────────────────────────────────────────────────── */
function SceneChaos({ progress: _p }: { progress: number }): JSX.Element {
  const friends = [
    { x: 150, y: 220, color: '#e76f51', name: 'Priya', bubble: '“I paid the hotel!”',     delay: 0   },
    { x: 320, y: 220, color: '#f4a261', name: 'Manoj', bubble: '“I covered the cabs?”',  delay: 0.6 },
    { x: 490, y: 220, color: '#2a9d8f', name: 'Bindu', bubble: '“Wait, who paid food?”', delay: 1.2 },
    { x: 650, y: 220, color: '#e9c46a', name: 'Amit',  bubble: '“This is unfair!”',       delay: 1.8 },
  ];

  return (
    <svg viewBox="0 0 800 380" className="mja__svg" preserveAspectRatio="xMidYMid meet" aria-hidden>
      {/* Lightning chaos in background */}
      <g className="mja-bolts" aria-hidden>
        {[120, 260, 400, 540, 680].map((x, i) => (
          <polygon
            key={i}
            points={`${x},20 ${x - 8},80 ${x + 4},80 ${x - 6},150 ${x + 12},70 ${x},70`}
            fill="#ffd166" opacity="0.55"
            style={{ animationDelay: `${i * 0.25}s` }}
            className="mja-bolt"
          />
        ))}
      </g>

      {/* Friends */}
      {friends.map((f, i) => (
        <g key={i} className="mja-friend-shake" style={{ animationDelay: `${i * 0.15}s` }}>
          {/* Speech bubble — outer <g> positions, inner <g> animates */}
          <g transform={`translate(${f.x}, ${f.y - 90})`}>
            <g className="mja-bubble-pop" style={{ animationDelay: `${f.delay}s` }}>
              <rect x="-78" y="-30" width="156" height="48" rx="14" fill="#fff" stroke="#e63946" strokeWidth="2" />
              <polygon points="-12,18 0,34 12,18" fill="#fff" stroke="#e63946" strokeWidth="2" />
              <text x="0" y="0" textAnchor="middle" fontSize="13" fontWeight="600" fill="#1d3557">{f.bubble}</text>
            </g>
          </g>

          {/* Body */}
          <g transform={`translate(${f.x}, ${f.y})`}>
            <circle cx="0" cy="0" r="26" fill={f.color} />
            {/* Angry eyebrows */}
            <line x1="-12" y1="-6" x2="-4" y2="-10" stroke="#1d1d1d" strokeWidth="3" strokeLinecap="round" />
            <line x1="12" y1="-6"  x2="4"  y2="-10" stroke="#1d1d1d" strokeWidth="3" strokeLinecap="round" />
            {/* Eyes */}
            <circle cx="-8" cy="0" r="2.5" fill="#1d1d1d" />
            <circle cx="8" cy="0" r="2.5" fill="#1d1d1d" />
            {/* Frown */}
            <path d="M-9,12 Q0,4 9,12" stroke="#1d1d1d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Body */}
            <rect x="-22" y="22" width="44" height="38" rx="10" fill={f.color} />
            <text x="0" y="76" textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff">{f.name}</text>
          </g>
        </g>
      ))}

      {/* Broken heart floating */}
      <g className="mja-broken" transform="translate(400, 80)">
        <text x="-12" y="0" fontSize="36">💔</text>
      </g>

      {/* Floating ???  */}
      <g>
        {['?', '?', '?', '?'].map((q, i) => (
          <text
            key={i}
            x={120 + i * 180}
            y="60"
            fontSize="38"
            fontWeight="900"
            fill="#e63946"
            textAnchor="middle"
            className="mja-q"
            style={{ animationDelay: `${i * 0.4}s` }}
          >{q}</text>
        ))}
      </g>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Scene 4 — Discover: phone appears with the BuddySplit app, glow effect
   ────────────────────────────────────────────────────────────────────────── */
function SceneDiscover({ progress: _p }: { progress: number }): JSX.Element {
  return (
    <svg viewBox="0 0 800 380" className="mja__svg" preserveAspectRatio="xMidYMid meet" aria-hidden>
      {/* Rays bursting out — outer positions, inner rotates */}
      <g transform="translate(400, 190)">
        <g className="mja-rays">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <rect key={deg} x="-3" y="-200" width="6" height="160" fill="#ffd166" opacity="0.45" transform={`rotate(${deg})`} />
          ))}
        </g>
      </g>

      {/* Halo */}
      <circle className="mja-halo" cx="400" cy="190" r="120" fill="#9b5de5" opacity="0.18" />

      {/* Phone */}
      <g className="mja-phone-rise" transform="translate(400, 190)">
        <rect x="-70" y="-130" width="140" height="260" rx="22" fill="#1a1a2e" />
        <rect x="-64" y="-122" width="128" height="244" rx="18" fill="#fff" />
        {/* Notch */}
        <rect x="-18" y="-126" width="36" height="8" rx="4" fill="#1a1a2e" />

        {/* App header */}
        <rect x="-58" y="-110" width="116" height="34" rx="6" fill="#6366f1" />
        <text x="0" y="-89" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">BuddySplit</text>

        {/* Animated balance rows */}
        <g className="mja-row-in" style={{ animationDelay: '0.4s' }}>
          <rect x="-58" y="-66" width="116" height="20" rx="4" fill="#f1f3f5" />
          <text x="-52" y="-52" fontSize="10" fontWeight="600" fill="#1d3557">Trip · Goa</text>
          <text x="52" y="-52" textAnchor="end" fontSize="10" fontWeight="700" fill="#2a9d8f">₹9,350</text>
        </g>
        <g className="mja-row-in" style={{ animationDelay: '0.8s' }}>
          <rect x="-58" y="-42" width="116" height="20" rx="4" fill="#f1f3f5" />
          <text x="-52" y="-28" fontSize="10" fontWeight="600" fill="#1d3557">You owe</text>
          <text x="52" y="-28" textAnchor="end" fontSize="10" fontWeight="700" fill="#e63946">₹2,337</text>
        </g>
        <g className="mja-row-in" style={{ animationDelay: '1.2s' }}>
          <rect x="-58" y="-18" width="116" height="20" rx="4" fill="#f1f3f5" />
          <text x="-52" y="-4" fontSize="10" fontWeight="600" fill="#1d3557">Priya gets</text>
          <text x="52" y="-4" textAnchor="end" fontSize="10" fontWeight="700" fill="#2a9d8f">₹500</text>
        </g>
        <g className="mja-row-in" style={{ animationDelay: '1.6s' }}>
          <rect x="-58" y="6" width="116" height="20" rx="4" fill="#f1f3f5" />
          <text x="-52" y="20" fontSize="10" fontWeight="600" fill="#1d3557">Splits</text>
          <text x="52" y="20" textAnchor="end" fontSize="10" fontWeight="700" fill="#6366f1">Equal</text>
        </g>

        {/* Big tick */}
        <g className="mja-tick" transform="translate(0, 75)">
          <circle cx="0" cy="0" r="28" fill="#2a9d8f" />
          <path d="M-12,0 L-3,9 L13,-8" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>

      {/* Sparkles */}
      <g>
        {[200, 280, 540, 600, 160, 640].map((x, i) => (
          <text
            key={i}
            x={x}
            y={60 + (i % 2) * 280}
            fontSize={i % 2 ? 18 : 26}
            fill="#ffd166"
            textAnchor="middle"
            className="mja-spark"
            style={{ animationDelay: `${i * 0.3}s` }}
          >✦</text>
        ))}
      </g>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Scene 5 — Calc: numbers crunching, equation resolves to clean split
   ────────────────────────────────────────────────────────────────────────── */
function SceneCalc({ progress: _p }: { progress: number }): JSX.Element {
  return (
    <svg viewBox="0 0 800 380" className="mja__svg" preserveAspectRatio="xMidYMid meet" aria-hidden>
      {/* Floating math symbols */}
      <g>
        {['₹', '+', '÷', '=', '%', '₹', '×', '+'].map((sym, i) => (
          <text
            key={i}
            x={60 + i * 100}
            y={40 + (i % 3) * 30}
            fontSize="34"
            fontWeight="700"
            fill="#6366f1"
            opacity="0.18"
            textAnchor="middle"
            className="mja-float-sym"
            style={{ animationDelay: `${i * 0.2}s` }}
          >{sym}</text>
        ))}
      </g>

      {/* Center board */}
      <g transform="translate(400, 200)">
        <rect x="-280" y="-120" width="560" height="240" rx="20" fill="#fff" stroke="#dee2e6" strokeWidth="2" />

        {/* Title */}
        <text x="0" y="-90" textAnchor="middle" fontSize="14" fontWeight="700" fill="#6366f1">Settlement plan</text>

        {/* Step-in transfer rows — outer <g> positions, inner <g> animates */}
        <g transform="translate(0, -50)">
          <g className="mja-flow-row" style={{ animationDelay: '0.2s' }}>
            <text x="0" y="-14" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1d3557">₹200</text>
            <line x1="-180" y1="0" x2="180" y2="0" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="4 4" className="mja-arrow-line" />
            <polygon points="178,-5 188,0 178,5" fill="#6366f1" />
            <circle cx="-200" cy="0" r="14" fill="#f4a261" />
            <text x="-200" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">R</text>
            <circle cx="200" cy="0" r="14" fill="#e76f51" />
            <text x="200" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">P</text>
          </g>
        </g>

        <g transform="translate(0, 0)">
          <g className="mja-flow-row" style={{ animationDelay: '1.0s' }}>
            <text x="0" y="-14" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1d3557">₹150</text>
            <line x1="-180" y1="0" x2="180" y2="0" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="4 4" className="mja-arrow-line" />
            <polygon points="178,-5 188,0 178,5" fill="#6366f1" />
            <circle cx="-200" cy="0" r="14" fill="#2a9d8f" />
            <text x="-200" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">S</text>
            <circle cx="200" cy="0" r="14" fill="#e76f51" />
            <text x="200" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">P</text>
          </g>
        </g>

        <g transform="translate(0, 50)">
          <g className="mja-flow-row" style={{ animationDelay: '1.8s' }}>
            <text x="0" y="-14" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1d3557">₹150</text>
            <line x1="-180" y1="0" x2="180" y2="0" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="4 4" className="mja-arrow-line" />
            <polygon points="178,-5 188,0 178,5" fill="#6366f1" />
            <circle cx="-200" cy="0" r="14" fill="#e9c46a" />
            <text x="-200" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1d1d1d">A</text>
            <circle cx="200" cy="0" r="14" fill="#e76f51" />
            <text x="200" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">P</text>
          </g>
        </g>

        {/* Result */}
        <g transform="translate(0, 105)">
          <g className="mja-result-in" style={{ animationDelay: '2.6s' }}>
            <rect x="-130" y="-15" width="260" height="30" rx="15" fill="#2a9d8f" />
            <text x="0" y="5" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">✓ 3 transfers · all settled</text>
          </g>
        </g>
      </g>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Scene 6 — Happy: friends jumping with arms up, fireworks, "settled"
   ────────────────────────────────────────────────────────────────────────── */
function SceneHappy({ progress: _p }: { progress: number }): JSX.Element {
  const friends = [
    { x: 180, y: 240, color: '#e76f51', delay: 0   },
    { x: 320, y: 240, color: '#f4a261', delay: 0.15 },
    { x: 480, y: 240, color: '#2a9d8f', delay: 0.3 },
    { x: 620, y: 240, color: '#e9c46a', delay: 0.45 },
  ];

  return (
    <svg viewBox="0 0 800 380" className="mja__svg" preserveAspectRatio="xMidYMid meet" aria-hidden>
      {/* Fireworks — outer positions, inner scales */}
      <g transform="translate(180, 100)">
        <g className="mja-fw">
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="0" y1="0"
              x2={Math.cos((i * Math.PI) / 6) * 40}
              y2={Math.sin((i * Math.PI) / 6) * 40}
              stroke="#e63946" strokeWidth="2.5" strokeLinecap="round"
            />
          ))}
        </g>
      </g>
      <g transform="translate(620, 90)">
        <g className="mja-fw" style={{ animationDelay: '0.5s' }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <line
              key={i}
              x1="0" y1="0"
              x2={Math.cos((i * Math.PI) / 6) * 40}
              y2={Math.sin((i * Math.PI) / 6) * 40}
              stroke="#2a9d8f" strokeWidth="2.5" strokeLinecap="round"
            />
          ))}
        </g>
      </g>
      <g transform="translate(400, 70)">
        <g className="mja-fw" style={{ animationDelay: '1s' }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <line
              key={i}
              x1="0" y1="0"
              x2={Math.cos((i * Math.PI) / 7) * 48}
              y2={Math.sin((i * Math.PI) / 7) * 48}
              stroke="#ffd166" strokeWidth="3" strokeLinecap="round"
            />
          ))}
        </g>
      </g>

      {/* Confetti */}
      <g>
        {Array.from({ length: 24 }).map((_, i) => (
          <rect
            key={i}
            x={i * 35 + (i % 3) * 6}
            y="-20"
            width="6" height="12" rx="2"
            fill={['#e63946', '#2a9d8f', '#ffd166', '#6366f1', '#f4a261'][i % 5]}
            className="mja-confetti"
            style={{ animationDelay: `${(i % 8) * 0.2}s`, animationDuration: `${3 + (i % 5) * 0.4}s` }}
          />
        ))}
      </g>

      {/* Ground */}
      <rect x="0" y="320" width="800" height="60" fill="#caffbf" />

      {/* Friends jumping */}
      {friends.map((f, i) => (
        <g key={i} className="mja-jump" style={{ animationDelay: `${f.delay}s` }}>
          <g transform={`translate(${f.x}, ${f.y})`}>
            {/* Arms up */}
            <line x1="-22" y1="10" x2="-40" y2="-26" stroke={f.color} strokeWidth="8" strokeLinecap="round" />
            <line x1="22" y1="10" x2="40" y2="-26" stroke={f.color} strokeWidth="8" strokeLinecap="round" />
            {/* Head */}
            <circle cx="0" cy="-12" r="22" fill={f.color} />
            {/* Smile eyes (closed arc) */}
            <path d="M-10,-16 Q-7,-12 -4,-16" stroke="#1d1d1d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M10,-16 Q7,-12 4,-16" stroke="#1d1d1d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Big smile */}
            <path d="M-10,-2 Q0,10 10,-2" stroke="#1d1d1d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Body */}
            <rect x="-20" y="10" width="40" height="46" rx="10" fill={f.color} />
            {/* Legs */}
            <line x1="-10" y1="56" x2="-18" y2="76" stroke={f.color} strokeWidth="8" strokeLinecap="round" />
            <line x1="10" y1="56" x2="18" y2="76" stroke={f.color} strokeWidth="8" strokeLinecap="round" />
          </g>
        </g>
      ))}

      {/* "All settled" banner */}
      <g className="mja-banner" transform="translate(400, 340)">
        <rect x="-140" y="-22" width="280" height="44" rx="22" fill="#2a9d8f" />
        <text x="0" y="6" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">✓ All settled · ₹0 owed</text>
      </g>
    </svg>
  );
}
