// Slot layout (1-2-1-1) and per-position styling for the BestTeam pitch.
export const POSITIONS = [
  { slot: "ST",   pos: "ST",  x: 50, y: 16 },
  { slot: "MID",  pos: "MID", x: 50, y: 42 },
  { slot: "DEF1", pos: "DEF", x: 30, y: 68 },
  { slot: "DEF2", pos: "DEF", x: 70, y: 68 },
  { slot: "GK",   pos: "GK",  x: 50, y: 88 },
];

export const POS_COLOR = {
  ST:  "linear-gradient(135deg,#e74c3c,#c0392b)",
  MID: "linear-gradient(135deg,#2980b9,#1f5f8b)",
  DEF: "linear-gradient(135deg,#27ae60,#1a6b3c)",
  GK:  "linear-gradient(135deg,#f39c12,#b9770e)",
};

// Per-position score formulas blending raw stats with averaged ratings.
export const positionScore = {
  GK:  (s, r) => (s.clean_sheets || 0) * 10 + (r.defending || 0) * 0.3,
  DEF: (s, r) =>
    (r.defending || 0) * 1.0 +
    (s.clean_sheets || 0) * 4 +
    (s.assists || 0) * 1.5,
  MID: (s, r) =>
    ((r.passing || 0) + (r.dribbling || 0)) * 0.5 +
    (s.assists || 0) * 5 +
    (s.goals || 0) * 2,
  ST:  (s, r) =>
    (r.shooting || 0) * 1.0 + (s.goals || 0) * 8 + (s.assists || 0) * 3,
};

// Free-form position strings from Firebase normalised to GK / DEF / MID / ST.
export function normalizePos(raw) {
  if (!raw) return null;
  const p = raw.toString().toLowerCase().trim();
  if (p === "gk" || p === "goalkeeper") return "GK";
  if (["def", "defender", "cb", "lb", "rb"].includes(p)) return "DEF";
  if (["mid", "midfielder", "cm", "am", "dm"].includes(p)) return "MID";
  if (["st", "striker", "fw", "fwd", "forward", "att"].includes(p)) return "ST";
  return p.toUpperCase();
}

export const TABS = ["ST", "MID", "DEF", "GK"];
export const TAB_LABEL = {
  ST: "Striker",
  MID: "Midfielder",
  DEF: "Defender",
  GK: "Goalkeeper",
};

export const SCORE_FORMULA = {
  GK: "Clean sheets × 10 + Defending rating × 0.3",
  DEF: "Defending × 1.0 + Clean sheets × 4 + Assists × 1.5",
  MID: "(Passing + Dribbling) × 0.5 + Assists × 5 + Goals × 2",
  ST: "Shooting × 1.0 + Goals × 8 + Assists × 3",
};
