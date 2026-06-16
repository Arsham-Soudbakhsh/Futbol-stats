import { useEffect, useState } from "react";
import {
  getPlayerStats,
  getAwards,
  getRatingsForPlayer,
  getAllStats,
  getAllAwards,
  getAllRatings,
  getAllProfiles,
} from "../../services";
import {
  calcStatPoints,
  calcAwardPoints,
  calcRatingBonus,
  avgRatingsStrict,
} from "../../utils/points";
import { normalizePosition } from "../../utils/positionMetrics";
import { WEEKS } from "./constants";

const ZERO_SKILLS = { m1: 0, m2: 0, m3: 0, m4: 0, passing: 0, shooting: 0, defending: 0, dribbling: 0 };

/**
 * Loads "current week" data (stats, awards, ratings) for the signed-in
 * profile, and exposes the animated `skillFill` percentages used to drive
 * the skill bars under the radar.
 */
export function useHomeWeek({ profile, week, year }) {
  const [stats, setStats] = useState(null);
  const [awards, setAwards] = useState([]);
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skillFill, setSkillFill] = useState(ZERO_SKILLS);

  useEffect(() => {
    // Guests have no `id` field — never hit Firestore (perm-denied otherwise).
    if (!profile?.id) { setLoading(false); return; }
    setLoading(true);
    setSkillFill(ZERO_SKILLS);

    const position = normalizePosition(profile?.position);
    let cancelled = false;

    Promise.all([
      getPlayerStats(profile.id, week, year),
      getAwards(week, year),
      getRatingsForPlayer(profile.id, week, year),
    ])
      .then(([st, aw, rt]) => {
        if (cancelled) return;
        setStats(st);
        setAwards((aw || []).filter((a) =>
          a.player_id === profile.id ||
          (Array.isArray(a.player_ids) && a.player_ids.includes(profile.id))
        ));
        const requiredCount = profile?.role === "captain" ? 2 : 3;
        const strict = avgRatingsStrict(rt || [], requiredCount, position);
        setRatings(strict);
        setLoading(false);

        if (strict) {
          requestAnimationFrame(() =>
            setTimeout(() => {
              if (cancelled) return;
              setSkillFill({
                m1: strict.m1, m2: strict.m2, m3: strict.m3, m4: strict.m4,
                passing: strict.passing, shooting: strict.shooting,
                defending: strict.defending, dribbling: strict.dribbling,
              });
            }, 60)
          );
        }
      })
      .catch((e) => {
        if (cancelled) return;
        console.warn("useHomeWeek failed", e);
        setLoading(false); // never leave the UI in an infinite spinner
      });

    return () => { cancelled = true; };
    // Use primitive deps so the effect doesn't re-fire whenever the profile
    // object reference changes (auth store updates).
  }, [week, year, profile?.id, profile?.role, profile?.position]);


  return { stats, awards, ratings, loading, skillFill };
}

/**
 * Loads ratings of every player for the given week, groups them by position,
 * and returns:
 *   - peersAvg:   { m1..m4, overall } average of same-position teammates (excluding self)
 *   - peerCount:  how many same-position teammates contributed
 *   - rank:       1-based rank of this player within his position (by overall)
 *   - groupSize:  number of same-position players (including self)
 *   - percentile: 0..100 (higher = better)
 */
export function useHomePeers({ profile, week, year, selfOverall }) {
  const [data, setData] = useState({
    peersAvg: null,
    peerCount: 0,
    rank: null,
    groupSize: 0,
    percentile: null,
  });

  useEffect(() => {
    // Guests / unauthenticated users have no `id` — skip Firestore hits.
    if (!profile?.id) return;
    let cancelled = false;
    const myPos = normalizePosition(profile?.position);
    if (!myPos) return;

    (async () => {
      try {
        const [profiles, allRt] = await Promise.all([
          getAllProfiles(),
          getAllRatings(week, year),
        ]);
        if (cancelled) return;

      const samePos = (profiles || []).filter(
        (p) => normalizePosition(p.position) === myPos
      );

      // Group ratings by recipient for this week.
      const byPlayer = {};
      (allRt || []).forEach((r) => {
        if (r.week_number !== week || r.year !== year) return;
        (byPlayer[r.to_player_id] ||= []).push(r);
      });

      const overalls = []; // { id, overall, metrics }
      samePos.forEach((p) => {
        const list = byPlayer[p.id] || [];
        if (!list.length) return;
        const requiredCount = p.role === "captain" ? 2 : 3;
        const avg = avgRatingsStrict(list, requiredCount, myPos);
        if (!avg) return;
        overalls.push({ id: p.id, overall: avg.overall || 0, metrics: avg });
      });

      // Peers = same-position excluding self
      const peers = overalls.filter((x) => x.id !== profile.id);
      let peersAvg = null;
      if (peers.length) {
        const sum = { m1: 0, m2: 0, m3: 0, m4: 0, overall: 0 };
        peers.forEach((p) => {
          sum.m1 += p.metrics.m1 || 0;
          sum.m2 += p.metrics.m2 || 0;
          sum.m3 += p.metrics.m3 || 0;
          sum.m4 += p.metrics.m4 || 0;
          sum.overall += p.overall || 0;
        });
        peersAvg = {
          m1: Math.round(sum.m1 / peers.length),
          m2: Math.round(sum.m2 / peers.length),
          m3: Math.round(sum.m3 / peers.length),
          m4: Math.round(sum.m4 / peers.length),
          overall: Math.round(sum.overall / peers.length),
        };
      }

      // Rank by overall (highest first). Use selfOverall when self isn't in
      // `overalls` (e.g. not enough raters yet) but we still have a value.
      const ranked = [...overalls];
      const meIndex = ranked.findIndex((x) => x.id === profile.id);
      if (meIndex < 0 && selfOverall) {
        ranked.push({ id: profile.id, overall: selfOverall, metrics: null });
      }
      ranked.sort((a, b) => b.overall - a.overall);
      const myRank = ranked.findIndex((x) => x.id === profile.id);
      const rank = myRank >= 0 ? myRank + 1 : null;
      const groupSize = samePos.length;
      const percentile = rank && groupSize > 1
        ? Math.round(((groupSize - rank) / (groupSize - 1)) * 100)
        : null;

      setData({ peersAvg, peerCount: peers.length, rank, groupSize, percentile });
      } catch (e) {
        console.warn("useHomePeers failed", e);
      }
    })();

    return () => { cancelled = true; };
  }, [profile?.id, profile?.position, week, year, selfOverall]);

  return data;
}

/**
 * Loads season-wide aggregation across all weeks.
 */
export function useHomeSeason({ profile, year }) {
  const [season, setSeason] = useState(null);

  useEffect(() => {
    // Guests have no `id` — no point hitting Firestore.
    if (!profile?.id) return;
    let cancelled = false;
    const position = normalizePosition(profile?.position);

    (async () => {
      try {
        const [allSt, allAw, allRt] = await Promise.all([
          getAllStats(), getAllAwards(), getAllRatings(),
        ]);
        if (cancelled) return;

      const statsByWeek = {};
      (allSt || []).forEach((s) => {
        if (s.player_id !== profile.id) return;
        statsByWeek[s.week_number] = s;
      });

      const awardsByWeek = {};
      (allAw || []).forEach((a) => {
        const isMe = a.player_id === profile.id ||
          (Array.isArray(a.player_ids) && a.player_ids.includes(profile.id));
        if (!isMe) return;
        (awardsByWeek[a.week_number] ||= []).push(a);
      });

      const ratingsByWeek = {};
      (allRt || []).forEach((r) => {
        if (r.to_player_id !== profile.id) return;
        (ratingsByWeek[r.week_number] ||= []).push(r);
      });

      const trend = [];
      let tG = 0, tA = 0, tC = 0, tAw = 0, tRB = 0;
      const skillSum = { m1: 0, m2: 0, m3: 0, m4: 0 };
      let rW = 0;
      const requiredCount = profile?.role === "captain" ? 2 : 3;

      for (const w of WEEKS) {
        const st = statsByWeek[w] || null;
        const myAw = awardsByWeek[w] || [];
        const rt = ratingsByWeek[w] || [];

        const g = st?.goals || 0;
        const a = st?.assists || 0;
        const cs = st?.clean_sheets || 0;
        const ap = calcAwardPoints(myAw);
        // Position-weighted stat points (so DEFs/GKs get more per goal etc.)
        const sp = calcStatPoints(st, profile?.position);
        tG += g; tA += a; tC += cs; tAw += ap;

        let weeklyBonus = 0;
        if (rt.length) {
          const rr = avgRatingsStrict(rt, requiredCount, position);
          if (rr) {
            skillSum.m1 += rr.m1; skillSum.m2 += rr.m2;
            skillSum.m3 += rr.m3; skillSum.m4 += rr.m4;
            rW++;
            weeklyBonus = calcRatingBonus(rr.overall);
            tRB += weeklyBonus;
          }
        }
        trend.push({ w, pts: sp + ap + weeklyBonus, goals: g, assists: a, cs });
      }
      if (cancelled) return;

      const ratings = rW ? {
        m1: Math.round(skillSum.m1 / rW),
        m2: Math.round(skillSum.m2 / rW),
        m3: Math.round(skillSum.m3 / rW),
        m4: Math.round(skillSum.m4 / rW),
        passing: Math.round(skillSum.m1 / rW),
        shooting: Math.round(skillSum.m2 / rW),
        defending: Math.round(skillSum.m3 / rW),
        dribbling: Math.round(skillSum.m4 / rW),
      } : null;

      const seasonStatPts = calcStatPoints(
        { goals: tG, assists: tA, clean_sheets: tC },
        profile?.position,
      );
      setSeason({
        totals: {
          goals: tG, assists: tA, cs: tC, awardPts: tAw, ratingBonus: tRB,
          statPts: seasonStatPts,
          totalPts: seasonStatPts + tAw + tRB,
        },
        ratings,
        trend,
      });
      } catch (e) {
        console.warn("useHomeSeason failed", e);
      }
    })();

    return () => { cancelled = true; };
  }, [year, profile?.id, profile?.role, profile?.position]);

  return season;
}
