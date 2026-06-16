// Pure scoring catalogue rendered by ScoringLegend.
// Position-weighted stat scoring + rating bonus tiers + award points.

// ─────────────────────────────────────────────────────────────────────────────
// Stat scoring — position-weighted. CS is flat (admin enters manually).
// ─────────────────────────────────────────────────────────────────────────────
export const STAT_SCORING = [
  {
    label: "Goal",
    icon: "ti-ball-football",
    color: "var(--primary)",
    tiers: [
      { pos: "GK",  pts: 25 },
      { pos: "DEF", pts: 15 },
      { pos: "MID", pts: 10 },
      { pos: "FWD", pts: 8  },
    ],
  },
  {
    label: "Assist",
    icon: "ti-arrow-big-right",
    color: "var(--text-secondary)",
    tiers: [
      { pos: "GK",  pts: 12 },
      { pos: "DEF", pts: 9  },
      { pos: "MID", pts: 6  },
      { pos: "FWD", pts: 5  },
    ],
  },
  {
    label: "Clean sheet (per player)",
    icon: "ti-shield-check",
    color: "var(--success)",
    flatPts: 15,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Rating bonus — based on the player's overall captain rating that week.
// ─────────────────────────────────────────────────────────────────────────────
export const RATING_BONUS = [
  { label: "Rating 90+",   pts: 25, icon: "ti-crown",    color: "var(--warning)" },
  { label: "Rating 80-89", pts: 15, icon: "ti-star",     color: "var(--warning)" },
  { label: "Rating 70-79", pts: 8,  icon: "ti-thumb-up", color: "var(--primary)" },
  { label: "Rating 60-69", pts: 3,  icon: "ti-line",     color: "var(--text-secondary)" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Award points — flat regardless of position (the award already encodes it).
// ─────────────────────────────────────────────────────────────────────────────
export const AWARD_SCORING = [
  { label: "Best player of the week", pts: 20, icon: "ti-star",        color: "var(--warning)" },
  { label: "Top scorer of the week",  pts: 10, icon: "ti-target",      color: "var(--warning)" },
  { label: "Top assister of the week",pts: 10, icon: "ti-bolt",        color: "var(--warning)" },
  { label: "Best G/A of the week",    pts: 10, icon: "ti-flame",       color: "var(--warning)" },
  { label: "Most clean sheets",       pts: 10, icon: "ti-lock",        color: "var(--warning)" },
  { label: "Best GK of the week",     pts: 10, icon: "ti-hand-stop",   color: "var(--warning)" },
  { label: "Best DEF of the week",    pts: 10, icon: "ti-shield",      color: "var(--warning)" },
  { label: "Best MID of the week",    pts: 10, icon: "ti-circle-dot",  color: "var(--warning)" },
  { label: "Best STR of the week",    pts: 10, icon: "ti-rocket",      color: "var(--warning)" },
  { label: "Best overall (week)",     pts: 20, icon: "ti-crown",       color: "var(--warning)" },
  { label: "Best team of the week",   pts: 5,  icon: "ti-users-group", color: "var(--warning)" },
  { label: "Player of the season",    pts: 50, icon: "ti-trophy",      color: "var(--warning)" },
];

// Backwards-compat flat list (kept so any importer of SCORING still works).
export const SCORING = AWARD_SCORING;
