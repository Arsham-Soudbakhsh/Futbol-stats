import React, { useMemo } from "react";
import RatingRing from "./RatingRing";
import SkillBar from "./SkillBar";
import { ratingColor } from "../ratingColor";

/**
 * Standard competition ranking for top players.
 * Ties are broken by rawAvg (unrounded) — higher rawAvg wins.
 * If rawAvg is also equal, they share the same rank.
 */
function computeRanks(players) {
  const ranks = new Array(players.length);
  let lastRank = 0;
  let lastAvg = null;
  let lastRaw = null;
  players.forEach((p, i) => {
    const isDifferent = i === 0 || p.avg !== lastAvg || (p.rawAvg ?? p.avg) !== lastRaw;
    if (isDifferent) {
      lastRank = i + 1;
      lastAvg = p.avg;
      lastRaw = p.rawAvg ?? p.avg;
    }
    ranks[i] = lastRank;
  });
  return ranks;
}

export default function RatingsTable({ players, onSelect }) {
  const ranks = useMemo(() => computeRanks(players), [players]);

  return (
    <div className="rt-wrap">
      <table className="tp-table">
        <thead>
          <tr>
            <th style={{ width: 40, textAlign: "center" }}>#</th>
            <th>Player</th>
            <th>Pass</th>
            <th>Shot</th>
            <th>Def</th>
            <th>Drib</th>
            <th style={{ textAlign: "center", width: 56 }}>Avg</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, i) => (
            <RatingsRow key={p.id} player={p} index={i} rank={ranks[i]} onSelect={onSelect} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RatingsRow({ player: p, index: i, rank, onSelect }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <tr
      className={`row-clickable ${p.me ? "me" : ""}`}
      onClick={() => onSelect?.(p)}
    >
      <td style={{ textAlign: "center" }}>
        <div className={`rank-pill ${rank <= 3 ? "rank-top" : ""}`}>
          {medal || rank}
        </div>
      </td>
      <td>
        <div className="tp-player">
          <RatingRing avg={p.avg} />
          <div className="tp-player__info">
            <div className="player-line">
              <span className={`player-name ${p.me ? "is-me" : ""}`}>{p.full_name}</span>
              {p.me && <span className="you-tag">YOU</span>}
            </div>
            <div className="tp-player__sub">
              Avg <strong style={{ color: ratingColor(p.avg) }}>{p.avg}</strong>/100
            </div>
          </div>
        </div>
      </td>
      <td><SkillBar val={p.passing} /></td>
      <td><SkillBar val={p.shooting} /></td>
      <td><SkillBar val={p.defending} /></td>
      <td><SkillBar val={p.dribbling} /></td>
      <td style={{ textAlign: "center" }}>
        <span className="pts-total">{p.avg}</span>
      </td>
    </tr>
  );
}

