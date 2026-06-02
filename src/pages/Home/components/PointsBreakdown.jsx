import React from "react";

// Stacked bar + colour-coded legend used by the "Points breakdown" card.
export default function PointsBreakdown({ items, total }) {
  const sum = items.reduce((s, i) => s + i.val, 0) || 1;
  return (
    <div className="pb">
      <div className="pb__bar">
        {items.map((it, i) => (
          <div
            key={i}
            title={`${it.label}: ${it.val}`}
            className="pb__seg"
            style={{
              width: `${(it.val / sum) * 100}%`,
              background: it.color,
            }}
          />
        ))}
      </div>
      <div className="pb__legend">
        {items.map((it) => (
          <div key={it.label} className="pb__item">
            <span className="pb__dot" style={{ background: it.color }} />
            <span className="pb__lbl">{it.label}</span>
            <span className="pb__val">{it.val}</span>
          </div>
        ))}
      </div>
      <div className="pb__total">
        <span>Total points</span>
        <strong>{total}</strong>
      </div>
    </div>
  );
}
