import React from "react";

// Medal pill used to badge rank #1-3 then plain numbers afterwards.
export default function RankBadge({ i }) {
  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
  return (
    <div className={`rank-pill ${i < 3 ? "rank-top" : ""}`}>
      {medal || i + 1}
    </div>
  );
}
