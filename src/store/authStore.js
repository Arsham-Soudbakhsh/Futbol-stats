import { create } from "zustand";
import { toast } from "sonner";
import { onAuth, getProfile, signOut } from "../services";

// The profile document is written in the same client transaction as sign-up,
// but Firebase auth can fire `onAuth` before the write becomes visible.
// Retry a few times so the very first session always lands on a profile.
const getProfileWithRetry = async (uid, retries = 4) => {
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
  // When profile load fails after retries we expose an error flag so the
  // app shell can surface a real error UI instead of an empty dashboard.
  profileError: null,

  init: () => {
    onAuth(async (user) => {
      if (user) {
        try {
          const profile = await getProfileWithRetry(user.uid);
          if (!profile) {
            // Could not load profile — sign back out and report the error
            // rather than dumping the user into an empty dashboard.
            console.error("Profile not found for uid", user.uid);
            try { await signOut(); } catch { /* ignore */ }
            try { toast.error("Could not load your profile. Please sign in again."); } catch { /* ignore */ }
            set({
              user: null,
              profile: null,
              loading: false,
              isGuest: false,
              profileError: "profile_not_found",
            });
            return;
          }
          set({ user, profile, loading: false, isGuest: false, profileError: null });
        } catch (e) {
          console.error("Profile load failed", e);
          try { await signOut(); } catch { /* ignore */ }
          set({
            user: null,
            profile: null,
            loading: false,
            isGuest: false,
            profileError: e?.message || "profile_load_failed",
          });
        }
      } else {
        set({ user: null, profile: null, loading: false, isGuest: false, profileError: null });
      }
    });
  },

  enterAsGuest: () =>
    set({
      user: null,
      profile: { full_name: "Guest", role: "guest" },
      loading: false,
      isGuest: true,
      profileError: null,
    }),

  setProfile: (profile) => set({ profile }),
  clear: () => set({ user: null, profile: null, isGuest: false, profileError: null }),
}));
