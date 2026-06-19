import React, { useEffect, lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import "./index.css";
import { useAuthStore } from "./store/authStore";
import { setupPWA } from "./pwa";
import { PageLoader } from "./components/common/Loader";

setupPWA();

import AuthPage from "./pages/Auth";
import DashboardLayout from "./components/layout/DashboardLayout";
import HomePage from "./pages/Home";
import ErrorBoundary from "./components/common/ErrorBoundary";

// All other pages: load on demand (code-splitting)
const LeaguePage     = lazy(() => import("./pages/League"));
const BestTeamPage   = lazy(() => import("./pages/BestTeam"));
const TopPlayersPage = lazy(() => import("./pages/TopPlayers"));
const TopGAPage      = lazy(() => import("./pages/TopGA"));
const PointsPage     = lazy(() => import("./pages/Points"));
const AdminPage      = lazy(() => import("./pages/Admin"));
const CaptainPage    = lazy(() => import("./pages/Captain"));
const HuntPage       = lazy(() => import("./pages/Hunt"));

function LoadingScreen() {
  return <PageLoader label="Loading" minHeight={"100vh"} />;
}

// Pages that require a real signed-in account (not guest)
function RequireSignedIn({ children }) {
  const { user, loading, isGuest } = useAuthStore();
  if (loading) return <LoadingScreen />;
  // Guest or unauthenticated → send to auth with a hint
  if (!user || isGuest) return <Navigate to="/auth" replace />;
  return children;
}

// Pages accessible by everyone: signed-in users AND guests
function RequireAuthOrGuest({ children }) {
  const { user, loading, isGuest } = useAuthStore();
  if (loading) return <LoadingScreen />;
  if (!user && !isGuest) return <Navigate to="/auth" replace />;
  return children;
}

function App() {
  const { init, loading } = useAuthStore();
  useEffect(() => {
    init();
  }, []);
  if (loading) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          duration: 3500,
          style: { fontFamily: "Inter, system-ui, sans-serif" },
        }}
      />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />

        <Route
          path="/"
          element={
            <RequireAuthOrGuest>
              <DashboardLayout />
            </RequireAuthOrGuest>
          }
        >
          {/* Home — signed-in only (personal dashboard) */}
          <Route
            index
            element={
              <RequireSignedIn>
                <HomePage />
              </RequireSignedIn>
            }
          />

          {/* Public pages — guests can access freely */}
          <Route path="league"      element={<Suspense fallback={<LoadingScreen />}><LeaguePage /></Suspense>} />
          <Route path="best-team"   element={<Suspense fallback={<LoadingScreen />}><BestTeamPage /></Suspense>} />
          <Route path="top-players" element={<Suspense fallback={<LoadingScreen />}><TopPlayersPage /></Suspense>} />
          <Route path="top-ga"      element={<Suspense fallback={<LoadingScreen />}><TopGAPage /></Suspense>} />
          <Route path="points"      element={<Suspense fallback={<LoadingScreen />}><PointsPage /></Suspense>} />

          {/* Hunt — guest sees a teaser page, not the real page */}
          <Route path="hunt"        element={<Suspense fallback={<LoadingScreen />}><HuntPage /></Suspense>} />

          {/* Private pages — signed-in only */}
          <Route
            path="admin"
            element={
              <RequireSignedIn>
                <Suspense fallback={<LoadingScreen />}><AdminPage /></Suspense>
              </RequireSignedIn>
            }
          />
          <Route
            path="captain"
            element={
              <RequireSignedIn>
                <Suspense fallback={<LoadingScreen />}><CaptainPage /></Suspense>
              </RequireSignedIn>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
