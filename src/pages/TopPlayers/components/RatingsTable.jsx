import React, { useMemo } from "react";
import RatingRing from "./RatingRing";
import SkillBar from "./SkillBar";
import { ratingColor } from "../ratingColor";
import { getMetricsConfig, normalizePosition, POSITIONS_ORDER } from "../../../utils/positionMetrics";

/**
 * Standard competition ranking.
 */
function computeRanks(players) {
  const ranks = new Array(players.length);
  let lastRank = 0, lastAvg = null, lastRaw = null;
  players.forEach((p, i) => {
    const isDifferent = i === 0 || p.avg !== lastAvg || (p.rawAvg ?? p.avg) !== lastRaw;
    if (isDifferent) {
      lastRank = i + 1; lastAvg = p.avg; lastRaw = p.rawAvg ?? p.avg;
    }
    ranks[i] = lastRank;
  });
  return ranks;
}

/**
 * Position-aware leaderboard.
 * Renders one section per position; each section shows the 4 position-specific
 * metrics as columns. A cross-position "Overall" leaderboard sits on top.
 */
export default function RatingsTable({ players, onSelect }) {
  const ranks = useMemo(() => computeRanks(players), [players]);

  const byPos = useMemo(() => {
    const groups = { GK: [], DEF: [], MID: [], FWD: [] };
    players.forEach((p) => {
      const pos = normalizePosition(p.position);
      if (groups[pos]) groups[pos].push(p);
    });
    return groups;
  }, [players]);

  return (
    <div className="rt-wrap">
      {/* Overall cross-position table */}
      <div className="rt-section">
        <div className="rt-section__head">
          <i className="ti ti-trophy" />
          <h3>Overall leaderboard</h3>
          <span className="rt-section__note">Cross-position comparison uses Overall only.</span>
        </div>
        <table className="tp-table">
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: "center" }}>#</th>
              <th>Player</th>
              <th style={{ width: 60 }}>Pos</th>
              <th style={{ textAlign: "center", width: 70 }}>Overall</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <OverallRow key={p.id} player={p} rank={ranks[i]} onSelect={onSelect} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Per-position sections */}
      {POSITIONS_ORDER.map((pos) => {
        const list = byPos[pos];
        if (!list?.length) return null;
        const cfg = getMetricsConfig(pos);
        return (
          <div key={pos} className="rt-section">
            <div className="rt-section__head" style={{ borderLeft: `3px solid ${cfg.color}` }}>
              <i className="ti ti-list" style={{ color: cfg.color }} />
              <h3>{positionFullName(pos)}</h3>
              <span className="rt-section__count">{list.length}</span>
            </div>
            <table className="tp-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: "center" }}>#</th>
                  <th>Player</th>
                  {cfg.metrics.map((m) => (
                    <th key={m.key} title={m.tip}
                        style={{ color: m.color, whiteSpace: "nowrap" }}>
                      {m.label}
                    </th>
                  ))}
                  <th style={{ textAlign: "center", width: 60 }}>OVR</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p, i) => (
                  <PosRow key={p.id} player={p} cfg={cfg} index={i} onSelect={onSelect} />
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

function positionFullName(pos) {
  return { GK: "Goalkeepers", DEF: "Defenders", MID: "Midfielders", FWD: "Forwards" }[pos] || pos;
}

function OverallRow({ player: p, rank, onSelect }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const pos = normalizePosition(p.position);
  const cfg = getMetricsConfig(pos);
  return (
    <tr className={`row-clickable ${p.me ? "me" : ""}`} onClick={() => onSelect?.(p)}>
      <td style={{ textAlign: "center" }}>
        <div className={`rank-pill ${rank <= 3 ? "rank-top" : ""}`}>{medal || rank}</div>
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
      <td>
        <span className="rt-pos-chip" style={{ background: cfg.accent, color: cfg.color }}>{pos || "?"}</span>
      </td>
      <td style={{ textAlign: "center" }}>
        <span className="pts-total">{p.avg}</span>
      </td>
    </tr>
  );
}

function PosRow({ player: p, cfg, index, onSelect }) {
  const rank = index + 1;
  return (
    <tr className={`row-clickable ${p.me ? "me" : ""}`} onClick={() => onSelect?.(p)}>
      <td style={{ textAlign: "center" }}>
        <div className={`rank-pill ${rank <= 3 ? "rank-top" : ""}`}>{rank}</div>
      </td>
      <td>
        <div className="tp-player">
          <RatingRing avg={p.avg} />
          <div className="tp-player__info">
            <div className="player-line">
              <span className={`player-name ${p.me ? "is-me" : ""}`}>{p.full_name}</span>
              {p.me && <span className="you-tag">YOU</span>}
            </div>
            <div className="tp-player__sub">{p.role || "player"}</div>
          </div>
        </div>
      </td>
      {cfg.metrics.map((m) => (
        <td key={m.key}><SkillBar val={p[m.key] ?? 0} color={m.color} /></td>
      ))}
      <td style={{ textAlign: "center" }}><span className="pts-total">{p.avg}</span></td>
    </tr>
  );
}
