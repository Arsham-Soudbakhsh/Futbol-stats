export const POSITIONS = [
  { id: "GK",  label: "Goalkeeper", icon: "ti-hand-stop",       color: "#E8C76A" },
  { id: "DEF", label: "Defender",   icon: "ti-shield",          color: "#5E8C31" },
  { id: "MID", label: "Midfielder", icon: "ti-arrows-exchange", color: "#60A5FA" },
  { id: "FWD", label: "Forward",    icon: "ti-ball-football",   color: "#C95B5B" },
];

export const ROLES = [
  { id: "player",  label: "Player",  icon: "ti-user",         desc: "Track your stats"      },
  { id: "captain", label: "Captain", icon: "ti-shield-star",  desc: "Lead & rate your squad" },
];

// Maps Firebase Auth error codes to user-friendly messages.
export const AUTH_ERROR_MESSAGES = {
  "auth/email-already-in-use": "This email is already registered.",
  "auth/invalid-email":        "Invalid email address.",
  "auth/weak-password":        "Password must be at least 6 characters.",
  "auth/user-not-found":       "No account found with this email.",
  "auth/wrong-password":       "Incorrect password.",
  "auth/invalid-credential":   "Incorrect email or password.",
};
