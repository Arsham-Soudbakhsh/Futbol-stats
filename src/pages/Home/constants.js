// Theme palette references used by the Home page sub-components.
export const C = {
  ink: "var(--text)",
  sub: "var(--text-secondary)",
  muted: "var(--text-muted)",
  brand: "var(--primary)",
  brand2: "var(--primary-active)",
  soft: "var(--primary-soft)",
  gold: "var(--warning)",
  danger: "var(--danger)",
  surf: "var(--surface)",
  surf2: "var(--surface-secondary)",
  bg2: "var(--bg-secondary)",
  border: "var(--border)",
  borderStrong: "var(--border-strong)",
};

export const WEEKS = Array.from({ length: 8 }, (_, i) => i + 1);

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
