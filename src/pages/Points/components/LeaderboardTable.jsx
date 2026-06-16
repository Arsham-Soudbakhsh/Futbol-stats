import React, { useMemo } from "react";
import PlayerRow from "./PlayerRow";

/**
 * Computes "standard competition" ranks so tied players share the same rank.
 * Example for totals [12, 10, 10, 8] -> ranks [1, 2, 2, 4].
 * Rows are assumed to be already sorted in descending order by `total`.
 */
function computeRanks(rows) {
  const ranks = new Array(rows.length);
  let lastRank = 0;
  let lastValue = null;
  rows.forEach((row, i) => {
    if (i === 0 || row.total !== lastValue) {
      lastRank = i + 1;
      lastValue = row.total;
    }
    ranks[i] = lastRank;
  });
  return ranks;
}

export default function LeaderboardTable({ rows, maxPts, onSelect }) {
  const ranks = useMemo(() => computeRanks(rows), [rows]);

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
            <th className="r" title="Rating bonus">RB</th>
            <th className="r">Aw</th>
            <th className="r">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <PlayerRow
              key={row.id}
              row={row}
              index={i}
              rank={ranks[i]}
              maxPts={maxPts}
              onSelect={onSelect}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
