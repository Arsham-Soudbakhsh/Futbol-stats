import { useEffect, useMemo, useState } from "react";
import { getAllPlayers, getWeeklyStats, getAllRatings } from "../../services";
import { avgRatingsStrict } from "../../utils/points";
import { positionScore, normalizePos } from "./constants";
import { normalizePosition } from "../../utils/positionMetrics";

/**
 * Loads Best XI data. Now uses the v2 schema:
 *   - per-position averaged metrics (m1..m4)
 *   - `overall` for cross-position comparison
 *   - positionScore.<POS> blends overall + raw stats
 */
export function useBestTeamData({ week, year }) {
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getAllPlayers(),
      getWeeklyStats(week, year),
      getAllRatings(week, year),
    ]).then(([pl, st, rt]) => {
      if (cancelled) return;
      setPlayers(pl.filter((p) => p.role !== "admin"));
      setStats(st); setRatings(rt); setLoading(false);
    });
    return () => { cancelled = true; };
  }, [week, year]);

  const enriched = useMemo(() => enrichPlayers({ players, stats, ratings }), [players, stats, ratings]);
  const byPosition = useMemo(() => groupByPosition(enriched), [enriched]);

  const bestXI = useMemo(() => ({
    GK:   byPosition.GK[0]  || null,
    DEF:  byPosition.DEF[0] || null,
    MID1: byPosition.MID[0] || null,
    MID2: byPosition.MID[1] || null,
    ST:   byPosition.ST[0]  || null,
  }), [byPosition]);

  return { loading, enriched, byPosition, bestXI };
}

function enrichPlayers({ players, stats, ratings }) {
  const statsByPid = Object.fromEntries(stats.map((s) => [s.player_id, s]));
  const ratingsByPid = {};
  ratings.forEach((r) => { (ratingsByPid[r.to_player_id] ||= []).push(r); });

  return players.map((p) => {
    const s = statsByPid[p.id] || { goals: 0, assists: 0, clean_sheets: 0 };
    const pos = normalizePos(p.position);
    const posMetricKey = normalizePosition(p.position); // GK/DEF/MID/FWD for metrics
    // minRaters: 1 — captains often receive only 1–2 ratings, but their
    // overall must still feed into Squad of the Week scoring.
    const r = avgRatingsStrict(ratingsByPid[p.id] || [], 1, posMetricKey)
      || { m1: 0, m2: 0, m3: 0, m4: 0, passing: 0, shooting: 0, defending: 0, dribbling: 0, avg: 0, overall: 0 };
    return {
      ...p,
      position_normalized: pos,
      stats: {
        goals: s.goals || 0,
        assists: s.assists || 0,
        clean_sheets: s.clean_sheets || 0,
      },
      ratings: r,
      scores: {
        GK:  positionScore.GK(s, r),
        DEF: positionScore.DEF(s, r),
        MID: positionScore.MID(s, r),
        ST:  positionScore.ST(s, r),
      },
    };
  });
}

function groupByPosition(enriched) {
  const groups = { GK: [], DEF: [], MID: [], ST: [] };
  enriched.forEach((p) => {
    if (p.position_normalized && groups[p.position_normalized]) {
      groups[p.position_normalized].push(p);
    }
  });
  Object.keys(groups).forEach((pos) =>
    groups[pos].sort((a, b) => b.scores[pos] - a.scores[pos])
  );
  return groups;
}
