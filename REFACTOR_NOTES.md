# Refactor notes

This project was reorganised for clean code + per-page components & CSS. No
UI / behaviour was intentionally changed; class names were preserved.

## New layout

```
src/
  services/          ← Firebase split by domain (auth, profiles, teams, ...)
  utils/             ← Pure helpers (points, AWARD_LABELS, ...)
  store/             ← Zustand stores (authStore)
  hooks/             ← Shared hooks (useTheme)
  styles/pages/      ← Per-page CSS slices extracted from pages.css
  components/
    layout/          ← DashboardLayout + Sidebar + TopBar + WeekContext
    common/          ← Loader, ConfirmModal, PosBadge, ModeSwitch
  pages/<Name>/      ← One folder per page
    <Name>Page.jsx   ← Thin orchestrator
    use<Name>Data.js ← Data-loading + business logic hook
    components/      ← Per-page sub-components
    <Name>.css       ← Page-specific styles
    index.js         ← `export { default } from "./<Name>Page"`
```

## Per-page split summary

| Page         | Components extracted                                                |
|--------------|---------------------------------------------------------------------|
| Home         | CardTitle, KPI, TotalTile, Gauge, Radar, PointsBreakdown,           |
|              | TrendChart, WeekView, SeasonView, States                            |
| League       | LeagueTable, TeamDetail, PitchView, PointsBox, FieldSVG             |
| BestTeam     | BestPitch, PlayerDetail, PositionRankings, FieldSVG                 |
| TopPlayers   | RatingRing, SkillBar, Podium, RatingsTable                          |
| TopGA        | RankBadge, MiniBar, LeaderCard                                      |
| Points       | LeaderboardTable, PlayerRow, ScoringLegend, EmptyState              |
| Admin        | AdminHeader + PlayerStatsTab / TeamStatsTab / AwardsTab /           |
|              | InvitesTab / TeamsManagementTab                                     |
| Auth         | AuthBackground, BrandPanel, Field, RolePicker, PositionPicker,      |
|              | AuthForm                                                            |
| Captain      | Kept as a single page (uses portals + modal); only imports updated  |

## Notable improvements

- All inline `<style>{`…`}</style>` blocks moved into real `.css` files.
- `pages.css` (1.5k lines) split into per-page slices under `styles/pages/`.
- Firebase calls live in `services/` (one file per domain) and are pulled in
  via custom hooks under each page folder.
- `src/lib/{firebase,points}.js` are now back-compat re-exports so any
  forgotten import keeps working.
- Auth page logic / state lives in `useAuthForm`. AdminPage data + writes
  live in `useAdminData`.
