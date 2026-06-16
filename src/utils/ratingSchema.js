// Read-side adapter that hides the schema split (v1 legacy vs v2 position-based).
// Always returns a normalized shape:
//   { position, metrics: {m1..m4}, overall, absent, weekKey, raw }

import { getSchemaVersion } from "./seasons";
import { computeOverall, getMetricsConfig, normalizePosition } from "./positionMetrics";

// LEGACY → V2 metric mapping (best-effort, only used when v1 doc has no overall).
// We map the 4 fixed v1 keys to the per-position metric slots so radars work.
// This is approximate — used only for display, never for awards/leaderboards.
const LEGACY_FIELDS = ["passing", "shooting", "defending", "dribbling"];

export function normalizeRating(doc, fallbackPosition = null) {
  if (!doc) return null;
  const v = getSchemaVersion(doc);

  if (v >= 2) {
    const metrics = doc.metrics || { m1: 0, m2: 0, m3: 0, m4: 0 };
    return {
      position: normalizePosition(doc.position) || normalizePosition(fallbackPosition),
      metrics,
      overall: doc.overall != null ? doc.overall : computeOverall(metrics),
      absent: !!doc.absent,
      week: doc.week_number,
      year: doc.year,
      raw: doc,
    };
  }

  // v1 legacy: read 4 fixed fields, derive overall.
  const m1 = Number(doc.passing) || 0;
  const m2 = Number(doc.shooting) || 0;
  const m3 = Number(doc.defending) || 0;
  const m4 = Number(doc.dribbling) || 0;
  const overall = Math.round((m1 + m2 + m3 + m4) / 4);
  return {
    position: normalizePosition(fallbackPosition),
    metrics: { m1, m2, m3, m4 },
    overall,
    absent: !!doc.absent,
    week: doc.week_number,
    year: doc.year,
    legacy: true,
    raw: doc,
  };
}

// Average a list of (already-normalized) ratings for one player.
// Requires `minRaters` valid (non-absent) raters or returns null.
export function aggregatePlayerRatings(ratings, { minRaters = 3, position = null } = {}) {
  const active = (ratings || []).filter((r) => r && !r.absent);
  if (active.length < minRaters) return null;

  const n = active.length;
  const sum = { m1: 0, m2: 0, m3: 0, m4: 0 };
  let overallSum = 0;

  active.forEach((r) => {
    sum.m1 += r.metrics.m1 || 0;
    sum.m2 += r.metrics.m2 || 0;
    sum.m3 += r.metrics.m3 || 0;
    sum.m4 += r.metrics.m4 || 0;
    overallSum += r.overall || 0;
  });

  const metrics = {
    m1: Math.round(sum.m1 / n),
    m2: Math.round(sum.m2 / n),
    m3: Math.round(sum.m3 / n),
    m4: Math.round(sum.m4 / n),
  };
  return {
    position: position || active[0]?.position,
    metrics,
    overall: Math.round(overallSum / n),
    rawOverall: overallSum / n,
    raters: n,
  };
}

// Convenience: get labelled metric rows for a player (for table/radar rendering).
export function metricRowsFor(position, metrics) {
  const cfg = getMetricsConfig(position);
  return cfg.metrics.map((m) => ({ ...m, value: metrics?.[m.key] || 0 }));
}
