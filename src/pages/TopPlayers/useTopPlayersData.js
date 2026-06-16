import { useEffect, useState } from "react";
import { getAllRatings, getAllPlayers } from "../../services";
import { avgRatingsStrict } from "../../utils/points";
import { normalizePosition } from "../../utils/positionMetrics";

/**
 * Loads players with their per-skill ratings for either the current
 * week or aggregated across the entire season.
 *
 * Each returned player has:
 *   { ...player, m1..m4, overall (avg), rawAvg, me }
 *   plus legacy aliases passing/shooting/defending/dribbling/avg for old code.
 */
export function useTopPlayersData({ week, year, profile, mode }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      mode === "week" ? getAllRatings(week, year) : getAllRatings(),
      getAllPlayers(),
    ]).then(([ratings, allPlayers]) => {
      if (cancelled) return;
      setPlayers(buildPlayers({ ratings, allPlayers, profile, mode }));
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [week, year, profile, mode]);

  return { players, loading };
}

function groupByPlayer(ratings) {
  const map = {};
  ratings.forEach((r) => {
    if (!map[r.to_player_id]) map[r.to_player_id] = [];
    map[r.to_player_id].push(r);
  });
  return map;
}

function buildPlayers({ ratings, allPlayers, profile, mode }) {
  const byPlayer = groupByPlayer(ratings);

  const out =
    mode === "week"
      ? allPlayers.map((p) => {
          const pos = normalizePosition(p.position);
          const minRaters = p.role === "captain" ? 2 : 3;
          const r = avgRatingsStrict(byPlayer[p.id] || [], minRaters, pos)
            || { m1: 0, m2: 0, m3: 0, m4: 0, passing: 0, shooting: 0, defending: 0, dribbling: 0, avg: 0, rawAvg: 0, overall: 0 };
          return { ...p, ...r, position_normalized: pos, me: p.id === profile?.id };
        })
      : allPlayers.map((p) => buildSeasonRow(p, byPlayer[p.id] || [], profile));

  out.sort((a, b) => {
    if (b.avg !== a.avg) return b.avg - a.avg;
    return (b.rawAvg ?? b.avg) - (a.rawAvg ?? a.avg);
  });
  return out;
}

function buildSeasonRow(p, playerRatings, profile) {
  const pos = normalizePosition(p.position);
  const minRaters = p.role === "captain" ? 2 : 3;

  const byWeek = {};
  playerRatings.forEach((r) => {
    const key = `${r.week_number}_${r.year}`;
    (byWeek[key] ||= []).push(r);
  });
  const weeklyAverages = Object.values(byWeek)
    .map((arr) => avgRatingsStrict(arr, minRaters, pos))
    .filter(Boolean);

  if (!weeklyAverages.length) {
    return {
      ...p, position_normalized: pos,
      m1: 0, m2: 0, m3: 0, m4: 0,
      passing: 0, shooting: 0, defending: 0, dribbling: 0,
      avg: 0, overall: 0, rawAvg: 0,
      me: p.id === profile?.id,
    };
  }
  const n = weeklyAverages.length;
  const avg = (key) => Math.round(weeklyAverages.reduce((s, w) => s + w[key], 0) / n);
  const m1 = avg("m1"); const m2 = avg("m2"); const m3 = avg("m3"); const m4 = avg("m4");
  const overall = Math.round((m1 + m2 + m3 + m4) / 4);
  const rawAvg = weeklyAverages.reduce((s, w) => s + w.overall, 0) / n;
  return {
    ...p, position_normalized: pos,
    m1, m2, m3, m4,
    passing: m1, shooting: m2, defending: m3, dribbling: m4,
    avg: overall, overall, rawAvg,
    me: p.id === profile?.id,
  };
}
