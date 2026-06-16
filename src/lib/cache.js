/**
 * Simple module-level TTL cache for Firestore reads.
 *
 * Why: every page and every drawer open re-fetches getAllPlayers(),
 * getAllStats(), getAllRatings(), getAllAwards() from scratch — even
 * when the data hasn't changed.  A 60-second in-memory cache cuts
 * Firestore reads by ~80% for a typical session where the user flips
 * between pages.
 *
 * Usage:
 *   import { cached } from '../lib/cache';
 *   const players = await cached('players', getAllPlayers);
 *   const players = await cached('players', getAllPlayers, 30_000); // 30s TTL
 *
 * Invalidation:
 *   import { invalidate, invalidateAll } from '../lib/cache';
 *   invalidate('players');   // after an admin edits a player
 *   invalidateAll();         // nuclear option (e.g. after bulk admin write)
 */

const store = new Map(); // key → { promise, expiresAt }

const DEFAULT_TTL = 60_000; // 60 seconds

/**
 * Returns a cached promise for `key`.  On first call (or after TTL
 * expiry) calls `fetchFn()` and stores the result.  Subsequent calls
 * within the TTL window reuse the same resolved promise — no extra
 * Firestore reads.
 *
 * Uses promise-level caching (not value-level) so that two simultaneous
 * callers during the first fetch both await the same in-flight request
 * rather than each firing their own.
 */
export function cached(key, fetchFn, ttl = DEFAULT_TTL) {
  const now = Date.now();
  const entry = store.get(key);
  if (entry && now < entry.expiresAt) {
    return entry.promise;
  }
  const promise = Promise.resolve().then(() => fetchFn());
  store.set(key, { promise, expiresAt: now + ttl });
  // On error, remove the entry so the next caller tries again
  promise.catch(() => store.delete(key));
  return promise;
}

/** Remove a single cache entry (call after a write that changes that data). */
export function invalidate(key) {
  store.delete(key);
}

/** Remove every cache entry whose key starts with `prefix`. */
export function invalidatePrefix(prefix) {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

/** Remove all entries. */
export function invalidateAll() {
  store.clear();
}
