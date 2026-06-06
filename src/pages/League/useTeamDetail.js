import { useEffect, useMemo, useState } from "react";
import {
  getAllPlayers,
  getWeeklyStats,
  getAllStats,
  getAwards,
  getAllAwards,
  getWeeklySquad,
} from "../../services";
import { calcStatPoints, calcAwardPoints } from "../../utils/points";
import { positionScore } from "./constants";

/**
 * Loads + aggregates one team's roster, stats, awards and saved squad,
 * then derives the on-pitch lineup and the per-player points list.
 */
export function useTeamDetail({ teamId, week, year, viewMode }) {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState([]);
  const [stats, setStats] = useState([]);
  const [awards, setAwards] = useState([]);
  const [squad, setSquad] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      getAllPlayers(),
      viewMode === "week" ? getWeeklyStats(week, year) : getAllStats(),
      viewMode === "week" ? getAwards(week, year) : getAllAwards(),
      getWeeklySquad(teamId, week, year).catch(() => null),
    ])
      .then(([pl, st, aw, sq]) => {
        if (cancelled) return;
        // Season view: filter to current year. Week view: already scoped.
        const filteredStats = viewMode === "week" ? st : st.filter((s) => s.year === year);
        const filteredAwards = viewMode === "week" ? aw : aw.filter((a) => a.year === year);

        // Roster comes from the saved weekly squad. With per-week teams we
        // can't fall back to profile.team_id (it's global and would leak
        // across weeks), so if no squad exists we render an empty roster.
        const squadIds = sq?.player_ids || [];
        const roster = squadIds.length
          ? squadIds.map((id) => pl.find((p) => p.id === id)).filter(Boolean)
          : [];

        setPlayers(roster);
        setStats(filteredStats);
        setAwards(filteredAwards);
        setSquad(sq);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamId, week, year, viewMode]);

  const perPlayer = useMemo(
    () => aggregatePerPlayer({ players, stats, awards }),
    [players, stats, awards],
  );

  const lineup = useMemo(() => buildLineup(perPlayer, squad), [perPlayer, squad]);

  return { loading, players, perPlayer, lineup };
}

function aggregatePerPlayer({ players, stats, awards }) {
  return players
    .map((p) => {
      const myStats = stats.filter((s) => s.player_id === p.id);
      const agg = myStats.reduce(
        (a, s) => ({
          goals: a.goals + (s.goals || 0),
          assists: a.assists + (s.assists || 0),
          clean_sheets:
            a.clean_sheets + (s.clean_sheets || (s.clean_sheet ? 1 : 0) || 0),
        }),
        { goals: 0, assists: 0, clean_sheets: 0 },
      );
      const myAwards = awards.filter((a) => a.player_id === p.id);
      const statPts = myStats.reduce(
        (sum, s) =>
          sum +
          calcStatPoints({
            goals: s.goals || 0,
            assists: s.assists || 0,
            clean_sheet: (s.clean_sheets || 0) > 0 || s.clean_sheet,
          }),
        0,
      );
      const awardPts = calcAwardPoints(
        myAwards.map((a) => ({ award_type: a.award_type })),
      );

      return {
        ...p,
        stats: agg,
        points: statPts + awardPts,
        statPts,
        awardPts,
        scores: {
          GK: positionScore.GK(agg),
          DEF: positionScore.DEF(agg),
          MID: positionScore.MID(agg),
          ST: positionScore.ST(agg),
        },
      };
    })
    .sort((a, b) => b.points - a.points);
}

function buildLineup(perPlayer, squad) {
  const byId = Object.fromEntries(perPlayer.map((p) => [p.id, p]));
  const out = { GK: null, DEF1: null, DEF2: null, MID: null, ST: null };
  const used = new Set();

  if (squad?.positions && typeof squad.positions === "object") {
    // Map keyed by slot first (GK / DEF1 / ...).
    for (const slot of Object.keys(out)) {
      const pid = squad.positions[slot];
      if (pid && byId[pid]) {
        out[slot] = byId[pid];
        used.add(pid);
      }
    }
    // Then map keyed by player id with position string value.
    Object.entries(squad.positions).forEach(([k, v]) => {
      if (used.has(k) || used.has(v)) return;
      if (!byId[k] || !["GK", "DEF", "MID", "ST"].includes(v)) return;

      if (v === "GK" && !out.GK)        { out.GK = byId[k];   used.add(k); }
      else if (v === "DEF" && !out.DEF1){ out.DEF1 = byId[k]; used.add(k); }
      else if (v === "DEF" && !out.DEF2){ out.DEF2 = byId[k]; used.add(k); }
      else if (v === "MID" && !out.MID) { out.MID = byId[k];  used.add(k); }
      else if (v === "ST" && !out.ST)   { out.ST = byId[k];   used.add(k); }
    });
  }

  const pickBest = (posKey) => {
    const pool = perPlayer.filter((p) => !used.has(p.id) && p.scores[posKey] > 1);
    if (!pool.length) return null;
    const best = [...pool].sort((a, b) => b.scores[posKey] - a.scores[posKey])[0];
    used.add(best.id);
    return best;
  };

  if (!out.GK) out.GK = pickBest("GK");
  if (!out.DEF1) out.DEF1 = pickBest("DEF");
  if (!out.DEF2) out.DEF2 = pickBest("DEF");
  if (!out.MID) out.MID = pickBest("MID");
  if (!out.ST) out.ST = pickBest("ST");
  return out;
}
