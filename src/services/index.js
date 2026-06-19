// Barrel export so call sites can keep doing
//   import { signUp, getProfile, ... } from '@/services'
export * from "./firebase";
export * from "./auth.service";
export * from "./profiles.service";
export * from "./teams.service";
export * from "./squads.service";
export * from "./stats.service";
export * from "./awards.service";
export * from "./ratings.service";
export * from "./invites.service";
export * from "./weekAccess.service";
export * from "./notifications.service";
export * from "./hunt.service";

/**
 * Cached wrappers for the "read all" calls that every page hits.
 *
 * These shadow the exports from individual service files (same name).
 * Since this file is last in the barrel and re-exports explicitly, the
 * cached versions win at call sites that import from '@/services'.
 */
import { cached, invalidate as _inv, invalidatePrefix as _invPrefix } from "../lib/cache";
import { getAllPlayers as _getAllPlayers, getAllProfiles as _getAllProfiles } from "./profiles.service";
import { getAllStats as _getAllStats, getWeeklyStats as _getWeeklyStats } from "./stats.service";
import { getAllAwards as _getAllAwards, getAwards as _getAwards } from "./awards.service";
import { getAllRatings as _getAllRatings } from "./ratings.service";

// Players / profiles — heavy reads. 2 min TTL: roster rarely changes mid-session.
export const getAllPlayers = () => cached("players", _getAllPlayers, 120_000);
export const getAllProfiles = () => cached("profiles_all", _getAllProfiles, 120_000);

// Stats — 60s TTL (admin edits during the week).
export const getAllStats = () => cached("stats_all", _getAllStats);
export const getWeeklyStats = (week, year) =>
  cached(`stats_${week}_${year}`, () => _getWeeklyStats(week, year));

// Awards — 60s TTL.
export const getAllAwards = () => cached("awards_all", _getAllAwards);
export const getAwards = (week, year) =>
  cached(`awards_${week}_${year}`, () => _getAwards(week, year));

// Ratings — week-scoped is shorter because captains submit during the week.
export const getAllRatings = (week = null, year = null) => {
  if (week !== null && year !== null) {
    return cached(`ratings_${week}_${year}`, () => _getAllRatings(week, year), 30_000);
  }
  return cached("ratings_all", _getAllRatings);
};

/**
 * Call after any admin / captain write that changes shared data so the next
 * navigation sees fresh results. Clears BOTH the season-wide caches and any
 * per-week caches that may have been populated.
 */
export function bustCache() {
  _inv("players");
  _inv("profiles_all");
  _inv("stats_all");
  _inv("awards_all");
  _inv("ratings_all");
  _invPrefix("ratings_");
  _invPrefix("stats_");
  _invPrefix("awards_");
}
