import React from "react";

export function Skeleton({ w = "100%", h = 12, r = 6, style }) {
  return (
    <span
      className="fs-skel"
      style={{ width: w, height: h, borderRadius: r, ...style }}
      aria-hidden
    />
  );
}

export function SkeletonCard({ lines = 3, withAvatar = false }) {
  return (
    <div className="fs-skel-card">
      <div className="fs-skel-card__head">
        {withAvatar && <Skeleton w={36} h={36} r={999} />}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          <Skeleton w="40%" h={12} />
          <Skeleton w="65%" h={10} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} w={`${100 - i * 10}%`} h={10} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonStatsGrid({ cols = 4, count }) {
  const n = count ?? cols;
  return (
    <div
      className="fs-skel-grid"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
    >
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="fs-skel-tile">
          <Skeleton w={18} h={18} r={4} />
          <Skeleton w="55%" h={10} />
          <Skeleton w="80%" h={22} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 4 }) {
  return (
    <div className="fs-skel-table">
      <div
        className="fs-skel-table__row fs-skel-table__row--head"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} w="60%" h={10} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="fs-skel-table__row"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} w={c === 0 ? "70%" : "50%"} h={12} />
          ))}
        </div>
      ))}
    </div>
  );
}
