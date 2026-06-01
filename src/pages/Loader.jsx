import React from 'react'

/* ===========================================================
   FutbolStats — Loader System (redesigned)
   Theme-aware, primary-accented, no white surfaces in dark mode.

   Exports:
     - <Loader />            default = PageLoader
     - <PageLoader />        centered, in-flow
     - <SplashLoader />      fullscreen app-boot
     - <InlineLoader />      small inline spinner (buttons)
     - <Skeleton />, <SkeletonCard />, <SkeletonStatsGrid />, <SkeletonTable />
   =========================================================== */

export default function Loader(props) {
  return <PageLoader {...props} />
}

/* ───────────── Core mark: orbiting jade ring ───────────── */
function Mark({ size = 56 }) {
  return (
    <div
      className="fs-mark"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <LoaderStyles />
      <span className="fs-mark__ring" />
      <span className="fs-mark__ring fs-mark__ring--2" />
      <span className="fs-mark__core" />
    </div>
  )
}

/* ───────────── Page-level (in-flow) ───────────── */
export function PageLoader({ label = 'Loading', minHeight = 240 }) {
  return (
    <div className="fs-loader" style={{ minHeight }}>
      <LoaderStyles />
      <Mark size={48} />
      <div className="fs-loader__label">
        <span>{label}</span>
        <span className="fs-loader__dots"><i /><i /><i /></span>
      </div>
    </div>
  )
}

/* ───────────── Fullscreen splash (app boot) ───────────── */
export function SplashLoader({ label = 'FutbolStats' }) {
  return (
    <div className="fs-splash" role="status" aria-live="polite">
      <LoaderStyles />
      <div className="fs-splash__glow" aria-hidden />
      <div className="fs-splash__inner">
        <Mark size={72} />
        <div className="fs-splash__title">{label}</div>
        <div className="fs-splash__sub">{'Preparing your pitch'}</div>
        <div className="fs-bar" aria-hidden><span /></div>
      </div>
    </div>
  )
}

/* ───────────── Inline spinner ───────────── */
export function InlineLoader({ size = 16, color }) {
  return (
    <span
      className="fs-spinner"
      style={{
        width: size, height: size,
        borderWidth: Math.max(2, Math.round(size / 8)),
        borderTopColor: color || 'var(--primary)',
      }}
      role="status" aria-label="Loading"
    >
      <LoaderStyles />
    </span>
  )
}

/* ───────────── Skeletons ───────────── */
export function Skeleton({ w = '100%', h = 12, r = 6, style }) {
  return (
    <span
      className="fs-skel"
      style={{ width: w, height: h, borderRadius: r, ...style }}
      aria-hidden
    >
      <LoaderStyles />
    </span>
  )
}

export function SkeletonCard({ lines = 3, withAvatar = false }) {
  return (
    <div className="fs-skel-card">
      <LoaderStyles />
      <div className="fs-skel-card__head">
        {withAvatar && <Skeleton w={36} h={36} r={999} />}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skeleton w="40%" h={12} />
          <Skeleton w="65%" h={10} />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} w={`${100 - i * 10}%`} h={10} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonStatsGrid({ cols = 4, count }) {
  const n = count ?? cols
  return (
    <div className="fs-skel-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      <LoaderStyles />
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="fs-skel-tile">
          <Skeleton w={18} h={18} r={4} />
          <Skeleton w="55%" h={10} />
          <Skeleton w="80%" h={22} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 6, cols = 4 }) {
  return (
    <div className="fs-skel-table">
      <LoaderStyles />
      <div className="fs-skel-table__row fs-skel-table__row--head"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} w="60%" h={10} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="fs-skel-table__row"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} w={c === 0 ? '70%' : '50%'} h={12} />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ───────────── Style injector ───────────── */
let injected = false
function LoaderStyles() {
  if (typeof document !== 'undefined' && !injected) {
    injected = true
    const tag = document.createElement('style')
    tag.setAttribute('data-fs-loader', '')
    tag.textContent = CSS
    document.head.appendChild(tag)
  }
  return null
}

const CSS = `
@keyframes fs-spin     { to { transform: rotate(360deg); } }
@keyframes fs-spin-rev { to { transform: rotate(-360deg); } }
@keyframes fs-pulse    { 0%,100% { transform: scale(.85); opacity:.55; }
                         50%     { transform: scale(1);    opacity:1; } }
@keyframes fs-dot      { 0%,80%,100% { opacity:.25; transform: translateY(0); }
                         40%         { opacity:1;   transform: translateY(-2px); } }
@keyframes fs-shimmer  { 0% { background-position: -200% 0; }
                         100% { background-position:  200% 0; } }
@keyframes fs-fadeIn   { from { opacity: 0 } to { opacity: 1 } }
@keyframes fs-bar      { 0% { transform: translateX(-100%); }
                         100% { transform: translateX(250%); } }
@keyframes fs-glow     { 0%,100% { opacity:.45; transform: scale(1); }
                         50%     { opacity:.75; transform: scale(1.08); } }

/* ───── Mark (orbiting jade ring) ───── */
.fs-mark {
  position: relative;
  display: grid; place-items: center;
}
.fs-mark__ring {
  position: absolute; inset: 0;
  border-radius: 50%;
  border: 2px solid color-mix(in oklab, var(--primary) 22%, transparent);
  border-top-color: var(--primary);
  border-right-color: var(--primary);
  animation: fs-spin 1.1s cubic-bezier(.55,.15,.45,.85) infinite;
  box-shadow: 0 0 24px -8px var(--primary-glow);
}
.fs-mark__ring--2 {
  inset: 22%;
  border-width: 2px;
  border-color: color-mix(in oklab, var(--primary) 14%, transparent);
  border-bottom-color: var(--primary-active, var(--primary));
  animation: fs-spin-rev 1.6s cubic-bezier(.55,.15,.45,.85) infinite;
  box-shadow: none;
}
.fs-mark__core {
  width: 28%; height: 28%;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: 0 0 18px var(--primary-glow);
  animation: fs-pulse 1.2s ease-in-out infinite;
}

/* ───── In-flow page loader ───── */
.fs-loader {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 16px; padding: 28px 16px;
  animation: fs-fadeIn .25s ease both;
  background: transparent;
}
.fs-loader__label {
  font: 600 11px/1 'Inter', sans-serif;
  color: var(--text-muted);
  letter-spacing: .8px; text-transform: uppercase;
  display: inline-flex; align-items: center; gap: 6px;
}
.fs-loader__dots { display: inline-flex; gap: 3px; }
.fs-loader__dots i {
  width: 3px; height: 3px; border-radius: 50%;
  background: var(--primary);
  animation: fs-dot 1.2s ease-in-out infinite;
}
.fs-loader__dots i:nth-child(2) { animation-delay: .15s; }
.fs-loader__dots i:nth-child(3) { animation-delay: .30s; }

/* ───── Inline spinner ───── */
.fs-spinner {
  display: inline-block; box-sizing: border-box;
  border-style: solid;
  border-color: color-mix(in oklab, var(--primary) 22%, transparent);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: fs-spin .8s linear infinite;
  vertical-align: -3px;
}

/* ───── Splash (fullscreen) ───── */
.fs-splash {
  position: fixed; inset: 0; z-index: 9999;
  background: var(--bg);
  display: grid; place-items: center;
  animation: fs-fadeIn .3s ease both;
  overflow: hidden;
}
.fs-splash__glow {
  position: absolute; inset: -20%;
  background:
    radial-gradient(ellipse at 50% 40%,
      color-mix(in oklab, var(--primary) 18%, transparent) 0%,
      transparent 55%);
  filter: blur(10px);
  animation: fs-glow 3.2s ease-in-out infinite;
  pointer-events: none;
}
.fs-splash__inner {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
  gap: 18px; padding: 32px;
}
.fs-splash__title {
  font: 800 22px/1 'Inter Tight', 'Inter', sans-serif;
  color: var(--text); letter-spacing: -.4px;
  margin-top: 4px;
}
.fs-splash__sub {
  font: 500 11px/1 'Inter', sans-serif;
  color: var(--text-muted);
  letter-spacing: 1.6px; text-transform: uppercase;
}
.fs-bar {
  margin-top: 8px;
  width: 160px; height: 3px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--primary) 12%, transparent);
  overflow: hidden;
}
.fs-bar > span {
  display: block; width: 40%; height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg,
    transparent,
    var(--primary) 50%,
    transparent);
  animation: fs-bar 1.4s cubic-bezier(.4,0,.2,1) infinite;
}

/* ───── Skeletons (theme-aware) ───── */
.fs-skel {
  display: block; position: relative; overflow: hidden;
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 0%,
    color-mix(in oklab, var(--bg-secondary) 50%, var(--surface)) 40%,
    var(--bg-secondary) 80%
  );
  background-size: 200% 100%;
  animation: fs-shimmer 1.4s ease-in-out infinite;
}
[data-theme="dark"] .fs-skel {
  background: linear-gradient(
    90deg,
    var(--surface) 0%,
    color-mix(in oklab, var(--surface) 55%, var(--surface-hover)) 40%,
    var(--surface) 80%
  );
  background-size: 200% 100%;
}

.fs-skel-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
}
.fs-skel-card__head { display: flex; align-items: center; gap: 12px; }

.fs-skel-grid { display: grid; gap: 10px; }
.fs-skel-tile {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px 12px;
  display: flex; flex-direction: column; gap: 10px;
}

.fs-skel-table {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 8px 14px;
}
.fs-skel-table__row {
  display: grid; gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  align-items: center;
}
.fs-skel-table__row:last-child { border-bottom: 0; }
.fs-skel-table__row--head { padding: 14px 0 10px; }

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .fs-mark__ring,
  .fs-mark__ring--2,
  .fs-mark__core,
  .fs-spinner,
  .fs-skel,
  .fs-bar > span,
  .fs-loader__dots i { animation-duration: 2.4s; }
}
`
