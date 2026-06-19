import { useEffect, useMemo, useState } from "react";
import {
  getWeeklyStats,
  getAllStats,
  getAwards,
  getAllAwards,
  getAllPlayers,
  getAllRatings,
} from "../../services";
import {
  calcStatPoints,
  calcAwardPoints,
  calcRatingBonus,
  avgRatingsStrict,
} from "../../utils/points";

/**
 * Loads + aggregates leaderboard rows for the Points page.
 * Switches between week-only and season-total depending on `mode`.
 *
 * Each row's `total` =
 *    statPts (position-weighted) + awardPts + ratingBonus
 *
 * `ratingBonus` for week mode = bonus on that week's overall rating.
 * `ratingBonus` for season mode = sum of weekly bonuses across all weeks.
 *
 * Returns: { rows, loading, maxPts, playersIndex }
 */
export function usePointsData({ week, year, profile, mode }) {
  const [rows, setRows] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      mode === "week" ? getWeeklyStats(week, year) : getAllStats(),
      mode === "week" ? getAwards(week, year) : getAllAwards(),
      getAllPlayers(),
      mode === "week" ? getAllRatings(week, year) : getAllRatings(),
    ]).then(([stats, awards, playersList, ratings]) => {
      if (cancelled) return;
      setPlayers(playersList);
      setRows(buildRows({ stats, awards, ratings, players: playersList, profile, mode }));
      setLoading(false);
    }).catch((e) => {
      if (cancelled) return;
      console.warn("usePointsData failed", e);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [week, year, profile, mode]);

  const playersIndex = useMemo(() => {
    const idx = {};
    players.forEach((p) => { idx[p.id] = p; });
    return idx;
  }, [players]);

  const maxPts = rows[0]?.total || 1;
  return { rows, loading, maxPts, playersIndex };
}

function buildRows({ stats, awards, ratings, players, profile, mode, huntMap }) {
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
    const ids = Array.isArray(a.player_ids) && a.player_ids.length
      ? a.player_ids
      : a.player_id ? [a.player_id] : [];
    ids.forEach((pid) => { (awardsMap[pid] ||= []).push(a); });
  });

  const ratingBonusMap = {};
  if (mode === "week") {
    const byPlayer = {};
    (ratings || []).forEach((r) => { (byPlayer[r.to_player_id] ||= []).push(r); });
    Object.entries(byPlayer).forEach(([pid, list]) => {
      const player = players.find((p) => p.id === pid);
      const required = player?.role === "captain" ? 2 : 3;
      const agg = avgRatingsStrict(list, required, player?.position);
      ratingBonusMap[pid] = agg ? calcRatingBonus(agg.overall) : 0;
    });
  } else {
    const byPlayerWeek = {};
    (ratings || []).forEach((r) => {
      const key = `${r.to_player_id}__${r.week_number}`;
      (byPlayerWeek[key] ||= []).push(r);
    });
    Object.entries(byPlayerWeek).forEach(([key, list]) => {
      const [pid] = key.split("__");
      const player = players.find((p) => p.id === pid);
      const required = player?.role === "captain" ? 2 : 3;
      const agg = avgRatingsStrict(list, required, player?.position);
      if (!agg) return;
      ratingBonusMap[pid] = (ratingBonusMap[pid] || 0) + calcRatingBonus(agg.overall);
    });
  }

  return players
    .map((p) => {
      const s = statsMap[p.id];
      const aw = awardsMap[p.id] || [];
      const statPts = calcStatPoints(s, p.position);
      const awardPts = calcAwardPoints(aw);
      const ratingBonus = ratingBonusMap[p.id] || 0;
      const huntDelta = (huntMap && huntMap[p.id]) || 0;
      return {
        id: p.id,
        name: p.full_name,
        position: p.position,
        goals: s?.goals || 0,
        assists: s?.assists || 0,
        clean_sheets: s?.clean_sheets || 0,
        statPts,
        awardPts,
        ratingBonus,
        huntDelta,
        total: statPts + awardPts + ratingBonus + huntDelta,
        me: p.id === profile?.id,
      };
    })
    .sort((a, b) => b.total - a.total);
}
