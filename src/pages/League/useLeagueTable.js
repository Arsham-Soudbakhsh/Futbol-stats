import { useEffect, useState } from "react";
import {
  getTeams,
  getAllTeamStatsSeason,
  getAllTeamWeeklyStats,
} from "../../services";

/**
 * Builds the league standings table aggregated either per-week or
 * for the whole season. Keeps teams whose row sources have no data
 * so they show as P/W/D/L = 0 (matches the old behaviour).
 */
export function useLeagueTable({ week, year, profile, viewMode }) {
  const [teams, setTeams] = useState([]);
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeams().then(setTeams);
  }, []);

  useEffect(() => {
    if (!teams.length) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const statsRows =
          viewMode === "season"
            ? await getAllTeamStatsSeason(year)
            : await getAllTeamWeeklyStats(week, year);

        if (cancelled) return;
        setTable(aggregate(teams, statsRows, profile));
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teams, week, year, viewMode, profile]);

  return { teams, table, loading };
}

function aggregate(teams, statsRows, profile) {
  const agg = {};
  teams.forEach((t) => {
    agg[t.id] = {
      id: t.id,
      name: t.name,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      gf: 0,
      ga: 0,
    };
  });

  statsRows.forEach((s) => {
    if (!agg[s.team_id]) return;
    agg[s.team_id].played += s.played || 0;
    agg[s.team_id].wins += s.wins || 0;
    agg[s.team_id].draws += s.draws || 0;
    agg[s.team_id].losses += s.losses || 0;
    agg[s.team_id].gf += s.goals_for || 0;
    agg[s.team_id].ga += s.goals_against || 0;
  });

  return Object.values(agg)
    .map((t) => ({
      ...t,
      pts: t.wins * 3 + t.draws,
      gd: t.gf - t.ga,
      me: t.id === profile?.team_id,
    }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}
