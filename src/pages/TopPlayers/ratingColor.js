// Shared color scale for player ratings (0-100).
export function ratingColor(v) {
  if (v >= 75) return "var(--success)";
  if (v >= 55) return "var(--warning)";
  if (v > 0) return "var(--danger)";
  return "var(--text-muted)";
}
