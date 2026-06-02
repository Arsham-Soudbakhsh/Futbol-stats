import React from "react";
import PosBadge from "../../../components/common/PosBadge";

// One leaderboard row. Kept dumb / presentational so the table is easy to read.
export default function PlayerRow({ row, index, maxPts }) {
  const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;
  return (
    <tr className={row.me ? "me" : ""}>
      <td>
        <div className={`rank-pill ${index < 3 ? "rank-top" : ""}`}>
          {medal || index + 1}
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
            <div
              className="player-bar__fill"
              style={{ width: `${(row.total / maxPts) * 100}%` }}
            />
          </div>
        </div>
      </td>
      <td className="r">
        <span className={`stat-num ${row.goals ? "pos" : ""}`}>{row.goals}</span>
      </td>
      <td className="r">
        <span className={`stat-num ${row.assists ? "neutral" : ""}`}>{row.assists}</span>
      </td>
      <td className="r">
        <span className={`stat-num ${row.clean_sheets ? "ok" : ""}`}>{row.clean_sheets}</span>
      </td>
      <td className="r">
        <span className={`stat-num ${row.awardPts ? "warn" : ""}`}>{row.awardPts}</span>
      </td>
      <td className="r">
        <span className="pts-total">{row.total}</span>
      </td>
    </tr>
  );
}
