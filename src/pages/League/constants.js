// Pitch slots (1-2-1-1 formation) shared by League + BestTeam pages.
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

// Auto position scorers — used by League + BestTeam pages to pick lineups.
export const positionScore = {
  GK:  (s) => (s.clean_sheets || 0) * 10 + 1,
  DEF: (s) => (s.clean_sheets || 0) * 4 + (s.assists || 0) * 1.5 + 1,
  MID: (s) => (s.assists || 0) * 5 + (s.goals || 0) * 2 + 1,
  ST:  (s) => (s.goals || 0) * 8 + (s.assists || 0) * 3 + 1,
};
