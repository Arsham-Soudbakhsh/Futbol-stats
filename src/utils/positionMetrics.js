// ─────────────────────────────────────────────────────────────────────────────
// Position-based rating metrics — single source of truth.
// All UI, captain forms, leaderboards, radars and tooltips read from here.
// ─────────────────────────────────────────────────────────────────────────────

// Keys are intentionally stable (m1..m4) so Firestore documents stay generic.
// The captain UI maps m1..m4 to the labels below based on the rated player's
// position. Cross-position comparison always uses `overall` (avg of m1..m4).

export const METRICS_BY_POSITION = {
  GK: {
    color: "#E8C76A",
    accent: "rgba(232,199,106,.14)",
    metrics: [
      { key: "m1", label: "Shot Stopping", icon: "ti-hand-stop",     color: "#E8C76A", tip: "Reflexes & saves under pressure." },
      { key: "m2", label: "Positioning",   icon: "ti-target",        color: "#F59E0B", tip: "Reading the play & being in the right spot." },
      { key: "m3", label: "Distribution",  icon: "ti-send",          color: "#60A5FA", tip: "Throws, kicks and starting attacks." },
      { key: "m4", label: "Communication", icon: "ti-message",       color: "#A78BFA", tip: "Organising the backline & calling plays." },
    ],
  },
  DEF: {
    color: "#5E8C31",
    accent: "rgba(94,140,49,.14)",
    metrics: [
      { key: "m1", label: "Defending",       icon: "ti-shield",          color: "#5E8C31", tip: "Tackles, interceptions, 1v1 duels." },
      { key: "m2", label: "Positioning",     icon: "ti-map-pin",         color: "#3B82F6", tip: "Covering space & marking discipline." },
      { key: "m3", label: "Passing",         icon: "ti-arrows-right-left", color: "#60A5FA", tip: "Build-up play & ball distribution." },
      { key: "m4", label: "Decision Making", icon: "ti-bulb",            color: "#A78BFA", tip: "Choices under pressure & game IQ." },
    ],
  },
  MID: {
    color: "#60A5FA",
    accent: "rgba(96,165,250,.14)",
    metrics: [
      { key: "m1", label: "Attacking Impact",    icon: "ti-bolt",              color: "#F59E0B", tip: "Creating chances & affecting attacks." },
      { key: "m2", label: "Dribbling",           icon: "ti-run",               color: "#EAB308", tip: "Beating opponents & ball carrying." },
      { key: "m3", label: "Passing",             icon: "ti-arrows-right-left", color: "#60A5FA", tip: "Vision, accuracy & link-up passing." },
      { key: "m4", label: "Defensive Work Rate", icon: "ti-arrow-back-up",     color: "#5E8C31", tip: "Tracking back & defensive effort." },
    ],
  },
  FWD: {
    color: "#C95B5B",
    accent: "rgba(201,91,91,.14)",
    metrics: [
      { key: "m1", label: "Finishing",     icon: "ti-target-arrow",     color: "#C95B5B", tip: "Composure in front of goal." },
      { key: "m2", label: "Ball Holding",  icon: "ti-shield-half",      color: "#A78BFA", tip: "Holding up play & shielding the ball." },
      { key: "m3", label: "Positioning",   icon: "ti-map-pin",          color: "#F59E0B", tip: "Movement & finding space in the box." },
      { key: "m4", label: "Link-up Play",  icon: "ti-arrows-exchange",  color: "#60A5FA", tip: "Combining with teammates to build chances." },
    ],
  },
};

// FWD ↔ ST alias — some places in the codebase use "ST".
METRICS_BY_POSITION.ST = METRICS_BY_POSITION.FWD;

export const POSITIONS_ORDER = ["GK", "DEF", "MID", "FWD"];

// Normalise raw position strings stored in profiles.
export function normalizePosition(raw) {
  if (!raw) return null;
  const p = String(raw).toUpperCase().trim();
  if (["GK", "GOALKEEPER"].includes(p)) return "GK";
  if (["DEF", "DEFENDER", "CB", "LB", "RB"].includes(p)) return "DEF";
  if (["MID", "MIDFIELDER", "CM", "AM", "DM"].includes(p)) return "MID";
  if (["FWD", "FW", "ST", "STRIKER", "FORWARD", "ATT"].includes(p)) return "FWD";
  return null;
}

export function getMetricsConfig(position) {
  const pos = normalizePosition(position) || "MID";
  return METRICS_BY_POSITION[pos];
}

export function getMetricKeys() {
  return ["m1", "m2", "m3", "m4"];
}

// Compute overall from a metrics map (rounded 0..100).
export function computeOverall(metrics) {
  if (!metrics) return 0;
  const vals = getMetricKeys().map((k) => Number(metrics[k]) || 0);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// Default metrics — used to seed sliders.
export function defaultMetrics() {
  return { m1: 50, m2: 50, m3: 50, m4: 50 };
}
