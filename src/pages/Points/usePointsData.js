import { useEffect, useState } from "react";
import {
  getWeeklyStats,
  getAllStats,
  getAwards,
  getAllAwards,
  getAllPlayers,
} from "../../services";
import { calcStatPoints, calcAwardPoints } from "../../utils/points";

/**
 * Loads + aggregates leaderboard rows for the Points page.
 * Switches between week-only and season-total depending on `mode`.
 *
 * Returns: { rows, loading, maxPts }
 */
export function usePointsData({ week, year, profile, mode }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      mode === "week" ? getWeeklyStats(week, year) : getAllStats(),
      mode === "week" ? getAwards(week, year) : getAllAwards(),
      getAllPlayers(),
    ]).then(([stats, awards, players]) => {
      if (cancelled) return;
      setRows(buildRows({ stats, awards, players, profile, mode }));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [week, year, profile, mode]);

  const maxPts = rows[0]?.total || 1;
  return { rows, loading, maxPts };
}

function buildRows({ stats, awards, players, profile, mode }) {
  const statsMap = {};
  stats.forEach((s) => {
    if (!statsMap[s.player_id]) {
      statsMap[s.player_id] = { goals: 0, assists: 0, clean_sheets: 0 };
    }
    if (mode === "week") {
      statsMap[s.player_id] = {
        goals: s.goals || 0,
        assists: s.assists || 0,
        clean_sheets: s.clean_sheets || 0,
      };
    } else {
      statsMap[s.player_id].goals += s.goals || 0;
      statsMap[s.player_id].assists += s.assists || 0;
      statsMap[s.player_id].clean_sheets += s.clean_sheets || 0;
    }
  });

  const awardsMap = {};
  awards.forEach((a) => {
    // BUG FIX: multi-winner awards (best_team_week, top_scorer_week, etc.)
    // store winners in player_ids array. Add award to each winner's list.
    const ids = Array.isArray(a.player_ids) && a.player_ids.length
      ? a.player_ids
      : a.player_id
        ? [a.player_id]
        : [];
    ids.forEach((pid) => {
      if (!awardsMap[pid]) awardsMap[pid] = [];
      awardsMap[pid].push(a);
    });
  });

  return players
    .map((p) => {
      const s = statsMap[p.id];
      const aw = awardsMap[p.id] || [];
      const statPts = calcStatPoints(s);
      const awardPts = calcAwardPoints(aw);
      return {
        id: p.id,
        name: p.full_name,
        position: p.position,
        goals: s?.goals || 0,
        assists: s?.assists || 0,
        clean_sheets: s?.clean_sheets || 0,
        statPts,
        awardPts,
        total: statPts + awardPts,
        me: p.id === profile?.id,
      };
    })
    .sort((a, b) => b.total - a.total);
}
