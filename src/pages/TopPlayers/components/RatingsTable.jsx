import React from "react";
import RatingRing from "./RatingRing";
import SkillBar from "./SkillBar";
import { ratingColor } from "../ratingColor";

export default function RatingsTable({ players }) {
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
            <RatingsRow key={p.id} player={p} index={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RatingsRow({ player: p, index: i }) {
  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
  return (
    <tr className={p.me ? "me" : ""}>
      <td style={{ textAlign: "center" }}>
        <div className={`rank-pill ${i < 3 ? "rank-top" : ""}`}>
          {medal || i + 1}
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
