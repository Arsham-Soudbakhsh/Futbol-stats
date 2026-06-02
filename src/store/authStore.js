import { create } from "zustand";
import { onAuth, getProfile } from "../services";

// The profile document is written in the same client transaction as sign-up,
// but Firebase auth can fire `onAuth` before the write becomes visible.
// Retry a few times so the very first session always lands on a profile.
const getProfileWithRetry = async (uid, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    const profile = await getProfile(uid);
    if (profile) return profile;
    await new Promise((r) => setTimeout(r, 600));
  }
  return null;
};

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  loading: true,
  isGuest: false,

  init: () => {
    onAuth(async (user) => {
      if (user) {
        const profile = await getProfileWithRetry(user.uid);
        set({ user, profile, loading: false, isGuest: false });
      } else {
        set({ user: null, profile: null, loading: false, isGuest: false });
      }
    });
  },

  enterAsGuest: () =>
    set({
      user: null,
      profile: { full_name: "Guest", role: "guest" },
      loading: false,
      isGuest: true,
    }),

  setProfile: (profile) => set({ profile }),
  clear: () => set({ user: null, profile: null, isGuest: false }),
}));
