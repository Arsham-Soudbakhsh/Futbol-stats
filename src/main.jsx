import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import "./index.css";
import { useAuthStore } from "./store/authStore";

import AuthPage from "./pages/Auth";
import DashboardLayout from "./components/layout/DashboardLayout";
import HomePage from "./pages/Home";
import LeaguePage from "./pages/League";
import BestTeamPage from "./pages/BestTeam";
import TopPlayersPage from "./pages/TopPlayers";
import TopGAPage from "./pages/TopGA";
import PointsPage from "./pages/Points";
import AdminPage from "./pages/Admin";
import CaptainPage from "./pages/Captain";
import { PageLoader } from "./components/common/Loader";

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
          <Route path="league" element={<LeaguePage />} />
          <Route path="best-team" element={<BestTeamPage />} />
          <Route path="top-players" element={<TopPlayersPage />} />
          <Route path="top-ga" element={<TopGAPage />} />
          <Route path="points" element={<PointsPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="captain" element={<CaptainPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
