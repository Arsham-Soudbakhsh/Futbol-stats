import React from "react";
import PlayerRow from "./PlayerRow";

export default function LeaderboardTable({ rows, maxPts, onSelect }) {
  return (
    <div className="rt-wrap">
      <table className="pts-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>#</th>
            <th>Player</th>
            <th className="r">G</th>
            <th className="r">A</th>
            <th className="r">CS</th>
            <th className="r">Aw</th>
            <th className="r">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <PlayerRow key={row.id} row={row} index={i} maxPts={maxPts} onSelect={onSelect} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
