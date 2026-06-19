import React, { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { signOut } from "../../services";
import { getCurrentYear } from "../../utils/points";
import { useTheme } from "../../hooks/useTheme";
import { WeekContext } from "./WeekContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const BASE_NAV = [
  { to: "/", icon: "ti-home", label: "Home", end: true },
  { to: "/league", icon: "ti-trophy", label: "League" },
  { to: "/best-team", icon: "ti-layout-board", label: "Squad of the Week" },
  { to: "/top-players", icon: "ti-star", label: "Top players" },
  { to: "/top-ga", icon: "ti-chart-bar", label: "Top G/A" },
  { to: "/hunt", icon: "ti-crosshair", label: "Hunt vs Hunter" },
  { to: "/points", icon: "ti-award", label: "Points" },
];

/**
 * DashboardLayout — sidebar + top bar shell that wraps every authenticated
 * page. Owns the selected week and exposes it to children via WeekContext.
 */
export default function DashboardLayout() {
  const { profile, clear, isGuest } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Persist the selected week across reloads. Fall back to 1 only when the
  // user has never picked a week (e.g. very first visit).
  const [week, setWeek] = useState(() => {
    if (typeof window === "undefined") return 1;
    const stored = window.localStorage.getItem("fs.selectedWeek");
    const parsed = stored ? parseInt(stored, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });
  useEffect(() => {
    try { window.localStorage.setItem("fs.selectedWeek", String(week)); }
    catch { /* storage disabled */ }
  }, [week]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  // Auto-close sidebar on route change and on resize past the tablet break.
  useEffect(() => setSidebarOpen(false), [location.pathname]);
  useEffect(() => {
    const fn = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);

  // a11y: close on Escape + lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setSidebarOpen(false); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [sidebarOpen]);

  const handleSignOut = async () => {
    if (!isGuest) await signOut();
    clear();
    navigate("/auth");
  };

  // Append role-specific nav items.
  const navItems = useMemo(() => {
    const items = [...BASE_NAV];
    if (profile?.role === "captain") {
      items.push({ to: "/captain", icon: "ti-shield", label: "My squad" });
    }
    if (profile?.role === "admin") {
      items.push({ to: "/admin", icon: "ti-settings", label: "Admin panel" });
    }
    return items;
  }, [profile?.role]);

  const ctxValue = useMemo(
    () => ({ week, year: getCurrentYear() }),
    [week],
  );

  return (
    <WeekContext.Provider value={ctxValue}>
      <div className="app-layout">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          profile={profile}
          isGuest={isGuest}
          navItems={navItems}
          onSignOut={handleSignOut}
        />

        <div className="main-area">
          <TopBar
            week={week}
            onWeekChange={setWeek}
            onMenu={() => setSidebarOpen((s) => !s)}
            onToggleTheme={toggle}
            isDark={isDark}
          />

          <div className="page-content">
            <Outlet />
          </div>
        </div>
      </div>
    </WeekContext.Provider>
  );
}
