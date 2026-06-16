import { AWARD_LABELS } from "../../utils/points";

export const AWARD_TYPES = Object.entries(AWARD_LABELS);

export const ADMIN_TABS = [
  { id: "player-stats", label: "Players", icon: "ti-user" },
  { id: "team-stats", label: "Teams", icon: "ti-shield" },
  { id: "awards", label: "Awards", icon: "ti-trophy" },
  { id: "invites", label: "Invites", icon: "ti-key" },
  { id: "teams-mgmt", label: "مدیریت تیم‌ها", icon: "ti-users-group" },
  { id: "broadcast", label: "Notifications", icon: "ti-speakerphone" },
];

export const PLAYER_STAT_FIELDS = [
  { field: "goals", label: "Goals", icon: "ti-ball-football", max: 30 },
  { field: "assists", label: "Assists", icon: "ti-arrow-big-right", max: 30 },
  { field: "clean_sheets", label: "Clean sheets", icon: "ti-shield-check", max: 10 },
];

export const TEAM_STAT_FIELDS = [
  { field: "played", label: "Played", icon: "ti-calendar" },
  { field: "wins", label: "Wins", icon: "ti-check" },
  { field: "draws", label: "Draws", icon: "ti-equal" },
  { field: "losses", label: "Losses", icon: "ti-x" },
  { field: "goals_for", label: "Goals for", icon: "ti-ball-football" },
  { field: "goals_against", label: "Goals against", icon: "ti-target-off" },
];
