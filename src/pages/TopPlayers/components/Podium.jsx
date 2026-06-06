import React from "react";
import RatingRing from "./RatingRing";

export default function Podium({ podium, onSelect }) {
  return (
    <div className="podium-grid">
      {podium.map((p, i) => (
        <div
          key={p.id}
          className={`podium-card podium-${i} row-clickable`}
          onClick={() => onSelect?.(p)}
        >
          <div className="podium-medal">
            {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
          </div>
          <RatingRing avg={p.avg} />
          <div className="podium-name">
            {p.full_name}
            {p.me && <span className="you-tag" style={{ marginLeft: 6 }}>YOU</span>}
          </div>
          <div className="podium-meta">
            P {p.passing} · S {p.shooting} · D {p.defending} · Dr {p.dribbling}
          </div>
        </div>
      ))}
    </div>
  );
}
