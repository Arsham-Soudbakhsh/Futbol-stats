import { useEffect, useState } from "react";
import { getWeeklyStats, getAllStats, getAllPlayers } from "../../services";

/**
 * Merges weekly / season stats into per-player {goals, assists, ga} rows.
 */
export function useTopGAData({ week, year, profile, mode }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      mode === "week" ? getWeeklyStats(week, year) : getAllStats(),
      getAllPlayers(),
    ]).then(([stats, players]) => {
      if (cancelled) return;
      setData(mergeStats({ stats, players, profile, mode }));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [week, year, profile, mode]);

  return { data, loading };
}

function mergeStats({ stats, players, profile, mode }) {
  const statsMap = {};
  stats.forEach((s) => {
    if (!statsMap[s.player_id]) statsMap[s.player_id] = { goals: 0, assists: 0 };
    if (mode === "week") {
      statsMap[s.player_id] = { goals: s.goals || 0, assists: s.assists || 0 };
    } else {
      statsMap[s.player_id].goals += s.goals || 0;
      statsMap[s.player_id].assists += s.assists || 0;
    }
  });
  return players.map((p) => ({
    ...p,
    goals: statsMap[p.id]?.goals || 0,
    assists: statsMap[p.id]?.assists || 0,
    ga: (statsMap[p.id]?.goals || 0) + (statsMap[p.id]?.assists || 0),
    me: p.id === profile?.id,
  }));
}
