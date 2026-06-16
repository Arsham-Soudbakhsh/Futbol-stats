// Points & rating helpers.
// v2: position-based metrics live in rating docs as { metrics: {m1..m4}, overall }.
// Legacy v1 docs (passing/shooting/defending/dribbling) are still readable via
// ratingSchema.normalizeRating().

import { normalizeRating, aggregatePlayerRatings } from "./ratingSchema";
import { normalizePosition } from "./positionMetrics";

// ─────────────────────────────────────────────────────────────────────────────
// Stat points — POSITION-WEIGHTED so every role has a fair shot at the title.
// Defenders / GKs get more for scoring; forwards get clean-sheet credit too
// (CS is now manually entered per-player by admin, so the value is flat = 15).
// ─────────────────────────────────────────────────────────────────────────────
export const POINTS_BY_POSITION = {
  GK:  { goal: 25, assist: 12, clean_sheet: 15 },
  DEF: { goal: 15, assist: 9,  clean_sheet: 15 },
  MID: { goal: 10, assist: 6,  clean_sheet: 15 },
  FWD: { goal: 8,  assist: 5,  clean_sheet: 15 },
};

// Legacy default — used when callers don't (yet) know the player's position.
// Equal to MID weights so older read paths produce a sensible middle value.
export const POINTS = POINTS_BY_POSITION.MID;

// ─────────────────────────────────────────────────────────────────────────────
// Rating bonus — rewards players who get high captain ratings each week.
// Tiered so the curve isn't flat; a 90+ week is a real prize.
// ─────────────────────────────────────────────────────────────────────────────
export const RATING_BONUS_TIERS = [
  { min: 90, pts: 25, label: "World-class (90+)" },
  { min: 80, pts: 15, label: "Excellent (80-89)" },
  { min: 70, pts: 8,  label: "Solid (70-79)" },
  { min: 60, pts: 3,  label: "Average (60-69)" },
];

export const calcRatingBonus = (overall) => {
  const o = Number(overall) || 0;
  for (const t of RATING_BONUS_TIERS) if (o >= t.min) return t.pts;
  return 0;
};

// ─────────────────────────────────────────────────────────────────────────────
// Award points — rebalanced so weekly position awards are competitive but
// the season MVP stays the prestige prize.
// ─────────────────────────────────────────────────────────────────────────────
export const AWARD_POINTS = {
  // Weekly headline awards
  best_player_week: 20,
  top_scorer_week: 10,
  top_assister_week: 10,
  best_ga_week: 10,
  most_cleansheets: 10,
  // Weekly position awards
  best_goalkeeper: 10,
  best_defender: 10,
  best_midfielder: 10,
  best_striker: 10,
  // Weekly team award
  best_team_week: 5,
  // Season-long awards
  best_overall: 20,         // weekly "best overall" snapshot
  player_of_season: 50,     // season MVP
  team_of_month: 100,       // legacy
};

// Stat points — accepts an optional position so we can apply position weights.
// If position is missing/unknown we fall back to MID weights (legacy behaviour).
export const calcStatPoints = (stats, position = null) => {
  if (!stats) return 0;
  const pos = normalizePosition(position) || "MID";
  const w = POINTS_BY_POSITION[pos] || POINTS_BY_POSITION.MID;
  const cs = stats.clean_sheets != null
    ? stats.clean_sheets
    : (stats.clean_sheet ? 1 : 0);
  return (stats.goals || 0) * w.goal
       + (stats.assists || 0) * w.assist
       + cs * w.clean_sheet;
};

export const calcAwardPoints = (awards) => {
  if (!awards?.length) return 0;
  return awards.reduce((sum, a) => sum + (AWARD_POINTS[a.award_type] || 0), 0);
};

// ─────────────────────────────────────────────────────────────────────────────
// Rating aggregation (v2-first, v1 transparent fallback).
// All public consumers should use these.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aggregate one player's raw rating docs into a normalized summary.
 * Returns null if fewer than `minRaters` non-absent ratings.
 *
 * Result shape:
 *   { position, metrics: {m1..m4}, overall, rawOverall, raters }
 */
export const aggregateRatings = (rawRatings, playerPosition = null, minRaters = 3) => {
  const normalized = (rawRatings || [])
    .map((d) => normalizeRating(d, playerPosition))
    .filter(Boolean);
  return aggregatePlayerRatings(normalized, { minRaters, position: playerPosition });
};

// ─────────────────────────────────────────────────────────────────────────────
// Legacy shims — kept so older code paths don't break during migration.
// ─────────────────────────────────────────────────────────────────────────────
export const avgRatings = (ratings, playerPosition = null) => {
  const agg = aggregateRatings(ratings, playerPosition, 1)
            || { metrics: { m1: 0, m2: 0, m3: 0, m4: 0 }, overall: 0, rawOverall: 0 };
  return {
    passing:  agg.metrics.m1,
    shooting: agg.metrics.m2,
    defending: agg.metrics.m3,
    dribbling: agg.metrics.m4,
    m1: agg.metrics.m1, m2: agg.metrics.m2, m3: agg.metrics.m3, m4: agg.metrics.m4,
    avg: agg.overall,
    rawAvg: agg.rawOverall ?? agg.overall,
    overall: agg.overall,
  };
};

export const avgRatingsStrict = (ratings, requiredCount = 3, playerPosition = null) => {
  const agg = aggregateRatings(ratings, playerPosition, requiredCount);
  if (!agg) return null;
  return {
    passing:  agg.metrics.m1,
    shooting: agg.metrics.m2,
    defending: agg.metrics.m3,
    dribbling: agg.metrics.m4,
    m1: agg.metrics.m1, m2: agg.metrics.m2, m3: agg.metrics.m3, m4: agg.metrics.m4,
    avg: agg.overall,
    rawAvg: agg.rawOverall ?? agg.overall,
    overall: agg.overall,
  };
};

export const getCurrentYear = () => new Date().getFullYear();

export const AWARD_LABELS = {
  best_player_week: "Best player of the week",
  best_overall: "Best overall",
  best_goalkeeper: "Best GK of the week",
  best_defender: "Best defender of the week",
  best_midfielder: "Best midfielder of the week",
  best_striker: "Best striker of the week",
  top_scorer_week: "Top scorer of the week",
  top_assister_week: "Top assister of the week",
  best_ga_week: "Best G/A of the week",
  most_cleansheets: "Most clean sheets",
  best_team_week: "Best team of the week",
  player_of_season: "Player of the season",
};

export const MULTI_WINNER_AWARDS = new Set([
  "top_scorer_week",
  "top_assister_week",
  "best_ga_week",
  "most_cleansheets",
]);
