// Pure scoring catalogue rendered by ScoringLegend.
// Lives outside the page component so it's easy to tweak rules in one place.
export const SCORING = [
  { label: "Goal", pts: 10, icon: "ti-ball-football", color: "var(--primary)" },
  { label: "Assist", pts: 5, icon: "ti-arrow-big-right", color: "var(--text-secondary)" },
  { label: "Clean sheet", pts: 20, icon: "ti-shield-check", color: "var(--success)" },
  { label: "Best player / week", pts: 50, icon: "ti-star", color: "var(--warning)" },
  { label: "Best G/A / week", pts: 40, icon: "ti-flame", color: "var(--warning)" },
  { label: "Top scorer / week", pts: 35, icon: "ti-target", color: "var(--warning)" },
  { label: "Top assister / week", pts: 30, icon: "ti-bolt", color: "var(--warning)" },
  { label: "Most clean sheets", pts: 30, icon: "ti-lock", color: "var(--warning)" },
  { label: "Best GK / week", pts: 30, icon: "ti-hand-stop", color: "var(--warning)" },
  { label: "Best DEF / week", pts: 20, icon: "ti-shield", color: "var(--warning)" },
  { label: "Best MID / week", pts: 20, icon: "ti-circle-dot", color: "var(--warning)" },
  { label: "Best STR / week", pts: 20, icon: "ti-rocket", color: "var(--warning)" },
  { label: "Best overall", pts: 30, icon: "ti-crown", color: "var(--warning)" },
  { label: "Team of the week", pts: 15, icon: "ti-users-group", color: "var(--warning)" },
];
