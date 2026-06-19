import React from "react";
import PosBadge from "../../../components/common/PosBadge";

export default function PlayerRow({ row, index, rank, maxPts, onSelect }) {
  // Fall back to positional index if rank was not supplied (backwards compat).
  const displayRank = rank ?? index + 1;
  const medal =
    displayRank === 1 ? "🥇" : displayRank === 2 ? "🥈" : displayRank === 3 ? "🥉" : null;

  return (
    <tr
      className={`row-clickable ${row.me ? "me" : ""}`}
      onClick={() => onSelect?.(row)}
    >
      <td>
        <div className={`rank-pill ${displayRank <= 3 ? "rank-top" : ""}`}>
          {medal || displayRank}
        </div>
      </td>
      <td>
        <div className="player-cell">
          <div className="player-line">
            <span className={`player-name ${row.me ? "is-me" : ""}`}>{row.name}</span>
            {row.me && <span className="you-tag">YOU</span>}
            <PosBadge pos={row.position} />
          </div>
          <div className="player-bar">
            <div className="player-bar__fill" style={{ width: `${(row.total / maxPts) * 100}%` }} />
          </div>
        </div>
      </td>
      <td className="r"><span className={`stat-num ${row.goals ? "pos" : ""}`}>{row.goals}</span></td>
      <td className="r"><span className={`stat-num ${row.assists ? "neutral" : ""}`}>{row.assists}</span></td>
      <td className="r"><span className={`stat-num ${row.clean_sheets ? "ok" : ""}`}>{row.clean_sheets}</span></td>
      <td className="r"><span className={`stat-num ${row.ratingBonus ? "pos" : ""}`}>{row.ratingBonus || 0}</span></td>
      <td className="r"><span className={`stat-num ${row.awardPts ? "warn" : ""}`}>{row.awardPts}</span></td>
      <td className="r">
        <span className={`stat-num ${row.huntDelta > 0 ? "pos" : row.huntDelta < 0 ? "neg" : ""}`}>
          {row.huntDelta > 0 ? `+${row.huntDelta}` : (row.huntDelta || 0)}
        </span>
      </td>
      <td className="r"><span className="pts-total">{row.total}</span></td>
    </tr>
  );
}
