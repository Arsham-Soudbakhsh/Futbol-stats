import { useEffect, useState } from "react";
import {
  getTeamsForWeek,
  getTeams,
  getAllTeamStatsSeason,
  getAllTeamWeeklyStats,
  getCaptainTeamForWeek,
} from "../../services";

/**
 * Builds the league standings table.
 *
 * Week view: only teams that were CREATED for that week (per-week scoped).
 * Season view: every team that ever existed in this year (so the table can
 *   aggregate stats across week-scoped team docs).
 */
export function useLeagueTable({ week, year, profile, viewMode }) {
  const [teams, setTeams] = useState([]);
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myTeamId, setMyTeamId] = useState(null);

  // Reload teams when week/year/viewMode changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list =
        viewMode === "season"
          ? await getTeams()
          : await getTeamsForWeek(week, year);
      if (!cancelled) setTeams(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [week, year, viewMode]);

  // Resolve "my team this week" for the current viewer (used for "me" highlight).
  useEffect(() => {
    let cancelled = false;
    if (!profile?.id || profile?.role !== "captain") {
      setMyTeamId(null);
      return;
    }
    getCaptainTeamForWeek(profile.id, week, year).then((tid) => {
      if (!cancelled) setMyTeamId(tid || null);
    });
    return () => {
      cancelled = true;
    };
  }, [profile?.id, profile?.role, week, year]);

  useEffect(() => {
    if (!teams.length) {
      setTable([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const statsRows =
          viewMode === "season"
            ? await getAllTeamStatsSeason(year)
            : await getAllTeamWeeklyStats(week, year);

        if (cancelled) return;
        setTable(aggregate(teams, statsRows, myTeamId));
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teams, week, year, viewMode, myTeamId]);

  return { teams, table, loading };
}

function aggregate(teams, statsRows, myTeamId) {
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
      me: !!myTeamId && t.id === myTeamId,
    }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}
