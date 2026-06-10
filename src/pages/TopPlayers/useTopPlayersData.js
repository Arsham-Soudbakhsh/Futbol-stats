import { useEffect, useState } from "react";
import { getAllRatings, getAllPlayers } from "../../services";
import { avgRatingsStrict } from "../../utils/points";

/**
 * Loads players with their per-skill ratings for either the current
 * week or aggregated across the entire season.
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

    return () => {
      cancelled = true;
    };
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
          const strict = avgRatingsStrict(byPlayer[p.id] || [], p.role === 'captain' ? 2 : 3);
          const r =
            strict || { passing: 0, shooting: 0, defending: 0, dribbling: 0, avg: 0, rawAvg: 0 };
          return { ...p, ...r, me: p.id === profile?.id };
        })
      : allPlayers.map((p) => buildSeasonRow(p, byPlayer[p.id] || [], profile));

  out.sort((a, b) => {
    // Sort by rounded avg first, then by rawAvg for tie-breaking
    if (b.avg !== a.avg) return b.avg - a.avg;
    return (b.rawAvg ?? b.avg) - (a.rawAvg ?? a.avg);
  });
  return out;
}

function buildSeasonRow(p, playerRatings, profile) {
  // Group ratings per week, only keep weeks with strict (3-rater) coverage.
  const byWeek = {};
  playerRatings.forEach((r) => {
    const key = `${r.week_number}_${r.year}`;
    if (!byWeek[key]) byWeek[key] = [];
    byWeek[key].push(r);
  });
  const requiredCount = p.role === 'captain' ? 2 : 3;
  const weeklyAverages = Object.values(byWeek)
    .map((arr) => avgRatingsStrict(arr, requiredCount))
    .filter(Boolean);

  if (!weeklyAverages.length) {
    return {
      ...p,
      passing: 0,
      shooting: 0,
      defending: 0,
      dribbling: 0,
      avg: 0,
      me: p.id === profile?.id,
    };
  }
  const avg = (key) =>
    Math.round(weeklyAverages.reduce((s, w) => s + w[key], 0) / weeklyAverages.length);
  const rawAvgOf = (key) =>
    weeklyAverages.reduce((s, w) => s + w[key], 0) / weeklyAverages.length;
  const passing = avg("passing");
  const shooting = avg("shooting");
  const defending = avg("defending");
  const dribbling = avg("dribbling");
  const rawAvg = (rawAvgOf("passing") + rawAvgOf("shooting") + rawAvgOf("defending") + rawAvgOf("dribbling")) / 4;
  return {
    ...p,
    passing,
    shooting,
    defending,
    dribbling,
    avg: Math.round((passing + shooting + defending + dribbling) / 4),
    rawAvg,
    me: p.id === profile?.id,
  };
}
