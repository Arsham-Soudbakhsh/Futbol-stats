import React from "react";

/**
 * Medal pill used to badge ranks #1-3 then plain numbers afterwards.
 *
 * Prefer passing `rank` (1-based, with ties sharing the same value).
 * `i` (0-based index) is kept as a fallback for older call-sites.
 */
export default function RankBadge({ i, rank }) {
  const displayRank = rank ?? (typeof i === "number" ? i + 1 : 0);
  const medal =
    displayRank === 1 ? "🥇" : displayRank === 2 ? "🥈" : displayRank === 3 ? "🥉" : null;

  return (
    <div className={`rank-pill ${displayRank <= 3 ? "rank-top" : ""}`}>
      {medal || displayRank}
    </div>
  );
}
