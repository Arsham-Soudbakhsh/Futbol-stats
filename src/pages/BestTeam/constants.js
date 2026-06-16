// Best XI — slot layout (1-2-1-1: 1 GK, 1 DEF, 2 MID, 1 ST)
// Position-specific metrics live in src/utils/positionMetrics.js:
//   GK:  m1 Shot Stopping · m2 Positioning · m3 Distribution · m4 Communication
//   DEF: m1 Defending · m2 Positioning · m3 Passing · m4 Decision Making
//   MID: m1 Attacking · m2 Dribbling · m3 Passing · m4 Defensive Work Rate
//   FWD: m1 Finishing · m2 Ball Holding · m3 Positioning · m4 Link-up
// Each player's `ratings` object has m1..m4 and `overall`.

export const POSITIONS = [
  { slot: "ST",   pos: "ST",  x: 50, y: 16 },
  { slot: "MID1", pos: "MID", x: 30, y: 42 },
  { slot: "MID2", pos: "MID", x: 70, y: 42 },
  { slot: "DEF",  pos: "DEF", x: 50, y: 68 },
  { slot: "GK",   pos: "GK",  x: 50, y: 88 },
];

export const POS_COLOR = {
  ST:  "linear-gradient(135deg,#e74c3c,#c0392b)",
  MID: "linear-gradient(135deg,#2980b9,#1f5f8b)",
  DEF: "linear-gradient(135deg,#27ae60,#1a6b3c)",
  GK:  "linear-gradient(135deg,#f39c12,#b9770e)",
};

// Per-position Squad of the Week score formulas.
// Final agreed formula: Overall (week avg rate) + raw stat bonuses.
//   GK : Overall + Assists × 1  + CleanSheets × 10
//   DEF: Overall + Goals   × 5  + Assists     × 4
//   MID: Overall + Goals   × 8  + Assists     × 10
//   ST : Overall + Goals   × 10 + Assists     × 7
export const positionScore = {
  GK:  (s, r) => (r.overall || 0) + (s.assists || 0) * 1  + (s.clean_sheets || 0) * 10,
  DEF: (s, r) => (r.overall || 0) + (s.goals   || 0) * 5  + (s.assists      || 0) * 4,
  MID: (s, r) => (r.overall || 0) + (s.goals   || 0) * 8  + (s.assists      || 0) * 10,
  ST:  (s, r) => (r.overall || 0) + (s.goals   || 0) * 10 + (s.assists      || 0) * 7,
};

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
  ST: "Striker", MID: "Midfielder", DEF: "Defender", GK: "Goalkeeper",
};

export const SCORE_FORMULA = {
  GK:  "Overall + Assists × 1 + Clean Sheets × 10",
  DEF: "Overall + Goals × 5 + Assists × 4",
  MID: "Overall + Goals × 8 + Assists × 10",
  ST:  "Overall + Goals × 10 + Assists × 7",
};
