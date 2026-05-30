import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import { useAuthStore } from './store/authStore'

import AuthPage from './pages/AuthPage'
import DashboardLayout from './pages/DashboardLayout'
import HomePage from './pages/HomePage'
import LeaguePage from './pages/LeaguePage'
import BestTeamPage from './pages/BestTeamPage'
import TopPlayersPage from './pages/TopPlayersPage'
import TopGAPage from './pages/TopGAPage'
import PointsPage from './pages/PointsPage'
import AdminPage from './pages/AdminPage'
import CaptainPage from './pages/CaptainPage'
import SeedPage from './pages/SeedPage'

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-dots">
        <div className="loading-dot" />
        <div className="loading-dot" />
        <div className="loading-dot" />
      </div>
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, loading, isGuest } = useAuthStore()
  if (loading) return <LoadingScreen />
  if (!user && !isGuest) return <Navigate to="/auth" replace />
  return children
}

function App() {
  const { init, loading } = useAuthStore()
  useEffect(() => { init() }, [])
  if (loading) return <LoadingScreen />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/seed" element={<SeedPage />} />
        <Route path="/" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
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
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
