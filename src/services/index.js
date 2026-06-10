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

/**
 * Cached wrappers for the "read all" calls that every page hits.
 *
 * These shadow the exports from individual service files (same name).
 * Since this file is last in the barrel and re-exports explicitly, the
 * cached versions win at call sites that import from '@/services'.
 *
 * Call sites don't need to change at all.
 */
import { cached, invalidate as _inv } from "../lib/cache";
import { getAllPlayers as _getAllPlayers } from "./profiles.service";
import { getAllStats as _getAllStats } from "./stats.service";
import { getAllAwards as _getAllAwards } from "./awards.service";
import { getAllRatings as _getAllRatings } from "./ratings.service";

export const getAllPlayers = () => cached("players", _getAllPlayers);

export const getAllStats = () => cached("stats_all", _getAllStats);

export const getAllAwards = () => cached("awards_all", _getAllAwards);

export const getAllRatings = (week = null, year = null) => {
  if (week !== null && year !== null) {
    // Week-scoped: 30-second TTL (captains are actively submitting during the week)
    return cached(`ratings_${week}_${year}`, () => _getAllRatings(week, year), 30_000);
  }
  return cached("ratings_all", _getAllRatings);
};

/**
 * Call after any admin write that changes shared data so the next
 * navigation sees fresh results.
 *
 * Example:
 *   await upsertStats(...)
 *   bustCache()
 */
export function bustCache() {
  _inv("players");
  _inv("stats_all");
  _inv("awards_all");
  _inv("ratings_all");
}
