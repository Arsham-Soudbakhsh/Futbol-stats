import { useEffect, useMemo, useState } from "react";
import { getAllPlayers, getWeeklyStats, getAllRatings } from "../../services";
import { avgRatingsStrict } from "../../utils/points";
import { positionScore, normalizePos } from "./constants";

/**
 * Loads the data the Best XI page needs and derives:
 *   - enriched: players + stats + averaged ratings + per-position scores
 *   - byPosition: enriched grouped by position and sorted by that score
 *   - bestXI: best-per-slot selection picked from byPosition
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
      setStats(st);
      setRatings(rt);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [week, year]);

  const enriched = useMemo(() => enrichPlayers({ players, stats, ratings }), [
    players,
    stats,
    ratings,
  ]);

  const byPosition = useMemo(() => groupByPosition(enriched), [enriched]);

  const bestXI = useMemo(
    () => ({
      GK: byPosition.GK[0] || null,
      DEF1: byPosition.DEF[0] || null,
      DEF2: byPosition.DEF[1] || null,
      MID: byPosition.MID[0] || null,
      ST: byPosition.ST[0] || null,
    }),
    [byPosition],
  );

  return { loading, enriched, byPosition, bestXI };
}

function enrichPlayers({ players, stats, ratings }) {
  const statsByPid = Object.fromEntries(stats.map((s) => [s.player_id, s]));
  const ratingsByPid = {};
  ratings.forEach((r) => {
    (ratingsByPid[r.to_player_id] ||= []).push(r);
  });

  return players.map((p) => {
    const s = statsByPid[p.id] || { goals: 0, assists: 0, clean_sheets: 0 };
    const r =
      avgRatingsStrict(ratingsByPid[p.id] || [], 3) ||
      { passing: 0, shooting: 0, defending: 0, dribbling: 0, avg: 0 };
    const pos = normalizePos(p.position);
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
        GK: positionScore.GK(s, r),
        DEF: positionScore.DEF(s, r),
        MID: positionScore.MID(s, r),
        ST: positionScore.ST(s, r),
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
    groups[pos].sort((a, b) => b.scores[pos] - a.scores[pos]),
  );
  return groups;
}
