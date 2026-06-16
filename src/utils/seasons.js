// Season identity & schema version helpers.
// A "season" maps to a calendar year for now; bump CURRENT_SEASON when a new
// season starts. Old seasons stay read-only with their original schema.

export const CURRENT_SEASON = new Date().getFullYear();

// Schema version a NEW rating document should be written with.
export const CURRENT_RATING_SCHEMA = 2;

// First season where v2 (position-based) is active.
// Seasons earlier than this should NEVER be written to with v2.
export const V2_SEASON_START = CURRENT_SEASON;

// Pick the schema a year should be read with.
export function schemaForSeason(year) {
  return year >= V2_SEASON_START ? 2 : 1;
}

// Read schema version of a rating document (defaults to 1 for legacy).
export function getSchemaVersion(doc) {
  return doc?.schema || 1;
}

export function isCurrentSeasonWritable(year) {
  return year === CURRENT_SEASON;
}
