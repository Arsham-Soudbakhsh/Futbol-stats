import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { signOut } from '../lib/firebase'
import { getCurrentYear } from '../lib/points'
import { useTheme } from '../hooks/useTheme'

export const WeekContext = React.createContext({ week: 1, year: getCurrentYear() })
const TOTAL_WEEKS = 8

export default function DashboardLayout() {
  const { profile, clear, isGuest } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [week, setWeek] = useState(1)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])
  useEffect(() => {
    const fn = () => { if (window.innerWidth > 768) setSidebarOpen(false) }
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const handleSignOut = async () => {
    if (!isGuest) await signOut()
    clear()
    navigate('/auth')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const navItems = [
    { to: '/', icon: 'ti-home', label: 'Home', end: true },
    { to: '/league', icon: 'ti-trophy', label: 'League' },
    { to: '/best-team', icon: 'ti-layout-board', label: 'Best team' },
    { to: '/top-players', icon: 'ti-star', label: 'Top players' },
    { to: '/top-ga', icon: 'ti-chart-bar', label: 'Top G/A' },
    { to: '/points', icon: 'ti-award', label: 'Points' },
  ]
  if (profile?.role === 'captain') navItems.push({ to: '/captain', icon: 'ti-shield', label: 'My squad' })
  if (profile?.role === 'admin') navItems.push({ to: '/admin', icon: 'ti-settings', label: 'Admin panel' })

  return (
    <WeekContext.Provider value={{ week, year: getCurrentYear() }}>
      <div className="app-layout">
        {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          {/* Brand */}
          <div className="sidebar-brand">
            <div className="brand-row">
              <div className="brand-icon">
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                  <circle cx="8.5" cy="8.5" r="7" stroke="white" strokeWidth="1.5"/>
                  <path d="M8.5 3.5L10.2 7H13.8L11 9.2L12 12.8L8.5 10.8L5 12.8L6 9.2L3.2 7H6.8Z" fill="white" opacity=".9"/>
                </svg>
              </div>
              <span className="brand-name">FutbolStats</span>
            </div>

            {/* Profile */}
            <div className="profile-box">
              <div className="avatar-ring">
                <div className="avatar-img">{initials}</div>
              </div>
              <div className="profile-name">{profile?.full_name || 'Player'}</div>
              <div className="profile-role">
                {isGuest
                  ? <span style={{ background: 'rgba(255,255,255,.1)', padding: '1px 8px', borderRadius: 999, fontSize: 10 }}>Guest</span>
                  : profile?.role
                }
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="sidebar-nav">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end}
                className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}>
                <i className={`ti ${item.icon}`} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            {/* <button className="theme-btn" onClick={toggle}>
              <span className="theme-btn-left">
                <i className={`ti ${isDark ? 'ti-sun' : 'ti-moon'}`} />
                {isDark ? 'Light mode' : 'Dark mode'}
              </span>
              <div className={`toggle-track${isDark ? ' on' : ''}`}>
                <div className={`toggle-knob${isDark ? ' on' : ''}`} />
              </div>
            </button> */}

            {isGuest && (
              <button className="nav-item" onClick={() => navigate('/auth')}
                style={{ color: 'rgba(255,255,255,.6)', background: 'rgba(255,255,255,.06)' }}>
                <i className="ti ti-login" />Sign in
              </button>
            )}

            <button className="nav-item" onClick={handleSignOut}>
              <i className="ti ti-logout" />
              {isGuest ? 'Exit' : 'Sign out'}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="main-area">
          <div className="top-bar">
            <button className="menu-btn" onClick={() => setSidebarOpen(s => !s)} aria-label="Menu">
              <i className="ti ti-menu-2" style={{ fontSize: 19 }} />
            </button>

            <div className="week-bar">
              {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map(w => (
                <button key={w}
                  className={`week-pill${week === w ? ' active' : ''}${w > 4 ? ' future' : ''}`}
                  onClick={() => setWeek(w)}>
                  Week {w}
                </button>
              ))}
            </div>

            {/* Theme button — visible on desktop too */}
            <button className="topbar-icon-btn" onClick={toggle} title={isDark ? 'Light mode' : 'Dark mode'}>
              <i className={`ti ${isDark ? 'ti-sun' : 'ti-moon'}`} style={{ fontSize: 17 }} />
            </button>
          </div>

          <div className="page-content">
            <Outlet />
          </div>
        </div>
      </div>
    </WeekContext.Provider>
  )
}
