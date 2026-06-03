import { useEffect, useState } from "react";
import {
  getPlayerStats,
  getAwards,
  getRatingsForPlayer,
  getAllStats,
  getAllAwards,
  getAllRatings,
} from "../../services";
import {
  calcStatPoints,
  calcAwardPoints,
  avgRatingsStrict,
} from "../../utils/points";
import { WEEKS } from "./constants";

/**
 * Loads "current week" data (stats, awards, ratings) for the signed-in
 * profile, and exposes the animated `skillFill` percentages used to drive
 * the skill bars under the radar.
 *
 * Skill bars animate from 0 → target on every (week, profile) change.
 */
export function useHomeWeek({ profile, week, year }) {
  const [stats, setStats] = useState(null);
  const [awards, setAwards] = useState([]);
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skillFill, setSkillFill] = useState({
    passing: 0,
    shooting: 0,
    defending: 0,
    dribbling: 0,
  });

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    setSkillFill({ passing: 0, shooting: 0, defending: 0, dribbling: 0 });

    Promise.all([
      getPlayerStats(profile.id, week, year),
      getAwards(week, year),
      getRatingsForPlayer(profile.id, week, year),
    ]).then(([st, aw, rt]) => {
      setStats(st);
      // BUG FIX: best_team_week uses player_ids (array), not player_id.
      // Multi-winner awards (top_scorer_week etc.) also use player_ids.
      // Filter awards where this player is included in either field.
      setAwards((aw || []).filter((a) =>
        a.player_id === profile.id ||
        (Array.isArray(a.player_ids) && a.player_ids.includes(profile.id))
      ));
      // Captains are rated by the other 2 captains (not themselves),
      // so they can only ever have 2 ratings. Use requiredCount=2 for them.
      const requiredCount = profile?.role === 'captain' ? 2 : 3;
      const strict =
        avgRatingsStrict(rt || [], requiredCount) || {
          passing: 0,
          shooting: 0,
          defending: 0,
          dribbling: 0,
        };
      setRatings(avgRatingsStrict(rt || [], requiredCount));
      setLoading(false);
      requestAnimationFrame(() =>
        setTimeout(
          () =>
            setSkillFill({
              passing: strict.passing,
              shooting: strict.shooting,
              defending: strict.defending,
              dribbling: strict.dribbling,
            }),
          60,
        ),
      );
    });
  }, [week, year, profile]);

  return { stats, awards, ratings, loading, skillFill };
}

/**
 * Loads season-wide aggregation across all 8 weeks. Used both for the
 * Season view and the small "Points trend" preview on the Week view.
 */
export function useHomeSeason({ profile, year }) {
  const [season, setSeason] = useState(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    (async () => {
      // PERF FIX: instead of 8 serial loops (24 sequential Firestore requests),
      // fetch all stats/awards/ratings for the whole year in 3 parallel requests,
      // then group by week in memory.
      const [allSt, allAw, allRt] = await Promise.all([
        getAllStats(),
        getAllAwards(),
        getAllRatings(),
      ]);

      if (cancelled) return;

      // Index by player + week
      const statsByWeek = {};
      (allSt || []).forEach((s) => {
        if (s.player_id !== profile.id) return;
        statsByWeek[s.week_number] = s;
      });

      const awardsByWeek = {};
      (allAw || []).forEach((a) => {
        const isMe =
          a.player_id === profile.id ||
          (Array.isArray(a.player_ids) && a.player_ids.includes(profile.id));
        if (!isMe) return;
        if (!awardsByWeek[a.week_number]) awardsByWeek[a.week_number] = [];
        awardsByWeek[a.week_number].push(a);
      });

      const ratingsByWeek = {};
      (allRt || []).forEach((r) => {
        if (r.to_player_id !== profile.id) return;
        const key = r.week_number;
        if (!ratingsByWeek[key]) ratingsByWeek[key] = [];
        ratingsByWeek[key].push(r);
      });

      const trend = [];
      let tG = 0, tA = 0, tC = 0, tAw = 0;
      let pS = 0, sS = 0, dS = 0, drS = 0, rW = 0;

      for (const w of WEEKS) {
        const st = statsByWeek[w] || null;
        const myAw = awardsByWeek[w] || [];
        const rt = ratingsByWeek[w] || [];

        const g = st?.goals || 0;
        const a = st?.assists || 0;
        const cs = st?.clean_sheets || 0;
        const ap = calcAwardPoints(myAw);
        const sp = calcStatPoints(st);
        tG += g; tA += a; tC += cs; tAw += ap;

        if (rt.length) {
          const rr = avgRatingsStrict(rt, profile?.role === 'captain' ? 2 : 3);
          if (rr) {
            pS += rr.passing;
            sS += rr.shooting;
            dS += rr.defending;
            drS += rr.dribbling;
            rW++;
          }
        }
        trend.push({ w, pts: sp + ap, goals: g, assists: a, cs });
      }
      if (cancelled) return;

      setSeason({
        totals: {
          goals: tG,
          assists: tA,
          cs: tC,
          awardPts: tAw,
          statPts: tG * 10 + tA * 5 + tC * 10,
          totalPts: tG * 10 + tA * 5 + tC * 10 + tAw,
        },
        ratings: rW
          ? {
              passing: Math.round(pS / rW),
              shooting: Math.round(sS / rW),
              defending: Math.round(dS / rW),
              dribbling: Math.round(drS / rW),
            }
          : null,
        trend,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [year, profile]);

  return season;
}
