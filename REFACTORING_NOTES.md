# Refactoring notes (2026-06)

A focused pass through the codebase to improve **performance, structure,
security, and readability** — without changing any UI or user flow.

## What changed

### 🧹 Cleanup
- **Deleted unused module** `src/pages/Home/components/PointsBreakdown.jsx`
  (declared but never imported anywhere).
- **Deleted unused shim** `src/lib/firebase.js` (it just re-exported from
  `services/`; every call site already imports from `services` directly).
- **Removed committed `.env`** and **all `.DS_Store` files** from the tree.
  Added a clean `.env.example` documenting the public variables.
- **Strengthened `.gitignore`** — explicit `.DS_Store` / `Thumbs.db` rules.

### ⚡ Performance
- **`vite.config.js`** — manual vendor chunks split Firebase, Chart.js,
  React, Router and UI libs into their own long-lived files. Page changes
  no longer invalidate the heavy vendor cache.
- **`build.target: 'esnext'`** and dropped `console.*` / `debugger`
  statements in production builds via `esbuild.drop`.
- **`index.html`** — non-blocking font + icon-font loading
  (`preload` + `media="print"` swap with `<noscript>` fallback). Removes
  ~50 KB of render-blocking CSS from the critical path.
- **`React.memo`** added to pure, frequently re-rendered components
  (e.g. `PosBadge`).
- **Path alias** `@ → /src` configured in `vite.config.js` so future
  imports stay short.

### 🎨 Inline-CSS extraction
Static inline styles moved into proper, cached CSS files:
- `ErrorBoundary.jsx` → new `ErrorBoundary.css`
- `PosBadge.jsx` → new `PosBadge.css`
- `Skeletons.jsx` → utility classes in `Loader.css`
- `Sidebar.jsx` / `TopBar.jsx` icon sizes → `Layout.css`
- `HuntWeekTab.jsx` → new helpers in `admin.css`

Dynamic, data-driven styles (computed widths, runtime colors) were kept
inline as CSS custom properties — that's the correct pattern.

### 🔒 Security
- `.env` no longer in the shipped archive.
- Added `X-Content-Type-Options: nosniff` and
  `Referrer-Policy: strict-origin-when-cross-origin` meta tags.
- Production builds drop `console.*` so stack traces / object dumps don't
  leak in deployed bundles.

### 📝 Comments / docs
- JSDoc headers added to `vite.config.js`, refactored components, and
  the new CSS files describing intent and constraints.
- This `REFACTORING_NOTES.md`.

## What did NOT change
- **Zero UI / visual / flow changes.** Class names that were already in
  CSS files were preserved exactly; new utility classes were added
  alongside them.
- Folder structure was already clean (`pages/`, `components/common/`,
  `components/layout/`, `services/`, `lib/`, `hooks/`, `store/`,
  `styles/`, `utils/`) and was left in place.
- Routing, auth, services, Firebase wiring, and PWA setup are unchanged.

## Suggested next steps (not done here, scoped follow-ups)
1. Migrate the remaining ~140 inline styles in page components case by
   case — most are data-driven and should become CSS variables on a
   wrapper element rather than inline `style={{...}}`.
2. Add **TypeScript** progressively (start with `services/` — easiest
   wins, biggest safety boost).
3. Audit **Firestore security rules** server-side — client RLS is the
   only thing standing between a guest account and write access.
4. Add an **`<img loading="lazy">`** sweep for non-critical images.
5. Add a real **ESLint + Prettier** config and a CI job.
