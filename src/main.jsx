import React, { useEffect, lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import "./index.css";
import { useAuthStore } from "./store/authStore";
import { setupPWA } from "./pwa";
import { PageLoader } from "./components/common/Loader";

setupPWA();

// These two are always needed immediately — keep them eager
import AuthPage from "./pages/Auth";
import DashboardLayout from "./components/layout/DashboardLayout";
import HomePage from "./pages/Home";
import ErrorBoundary from "./components/common/ErrorBoundary";

// All other pages: load on demand (code-splitting)
// Vite automatically creates separate JS chunks for each of these
const LeaguePage     = lazy(() => import("./pages/League"));
const BestTeamPage   = lazy(() => import("./pages/BestTeam"));
const TopPlayersPage = lazy(() => import("./pages/TopPlayers"));
const TopGAPage      = lazy(() => import("./pages/TopGA"));
const PointsPage     = lazy(() => import("./pages/Points"));
const AdminPage      = lazy(() => import("./pages/Admin"));
const CaptainPage    = lazy(() => import("./pages/Captain"));

function LoadingScreen() {
  return <PageLoader label="Loading" minHeight={"100vh"} />;
}

function RequireAuth({ children }) {
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
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="league"       element={<Suspense fallback={<LoadingScreen />}><LeaguePage /></Suspense>} />
          <Route path="best-team"    element={<Suspense fallback={<LoadingScreen />}><BestTeamPage /></Suspense>} />
          <Route path="top-players"  element={<Suspense fallback={<LoadingScreen />}><TopPlayersPage /></Suspense>} />
          <Route path="top-ga"       element={<Suspense fallback={<LoadingScreen />}><TopGAPage /></Suspense>} />
          <Route path="points"       element={<Suspense fallback={<LoadingScreen />}><PointsPage /></Suspense>} />
          <Route path="admin"        element={<Suspense fallback={<LoadingScreen />}><AdminPage /></Suspense>} />
          <Route path="captain"      element={<Suspense fallback={<LoadingScreen />}><CaptainPage /></Suspense>} />
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
