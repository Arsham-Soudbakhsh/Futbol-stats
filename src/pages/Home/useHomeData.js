import { useEffect, useState } from "react";
import {
  getPlayerStats,
  getAwards,
  getRatingsForPlayer,
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
      setAwards((aw || []).filter((a) => a.player_id === profile.id));
      // Only show ratings when all 3 captains submitted (strict mode).
      const strict =
        avgRatingsStrict(rt || [], 3) || {
          passing: 0,
          shooting: 0,
          defending: 0,
          dribbling: 0,
        };
      setRatings(avgRatingsStrict(rt || [], 3));
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
      const trend = [];
      let tG = 0, tA = 0, tC = 0, tAw = 0;
      let pS = 0, sS = 0, dS = 0, drS = 0, rW = 0;

      for (const w of WEEKS) {
        const [st, aw, rt] = await Promise.all([
          getPlayerStats(profile.id, w, year),
          getAwards(w, year),
          getRatingsForPlayer(profile.id, w, year),
        ]);
        const g = st?.goals || 0;
        const a = st?.assists || 0;
        const cs = st?.clean_sheets || 0;
        const myAw = (aw || []).filter((x) => x.player_id === profile.id);
        const ap = calcAwardPoints(myAw);
        const sp = calcStatPoints(st);
        tG += g; tA += a; tC += cs; tAw += ap;

        if (rt && rt.length) {
          const rr = avgRatingsStrict(rt, 3);
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
