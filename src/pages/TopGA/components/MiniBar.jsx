import React from "react";

// Horizontal bar showing a value relative to a max. Coloured per leader card.
export default function MiniBar({ val, max, accent }) {
  const pct = max > 0 ? (val / max) * 100 : 0;
  return (
    <div className="tga-bar">
      <div
        className="tga-bar__fill"
        style={{ width: pct + "%", background: accent }}
      />
    </div>
  );
}
