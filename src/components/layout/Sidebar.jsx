import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { avatarThumb } from "../../lib/cloudinary";

/**
 * Side navigation. Pure presentational — receives the nav model + auth
 * helpers from DashboardLayout.
 */
export default function Sidebar({ open, onClose, profile, isGuest, navItems, onSignOut }) {
  const navigate = useNavigate();
  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <>
      {open && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar${open ? " open" : ""}`}
        aria-label="Primary navigation"
        aria-hidden={!open && typeof window !== "undefined" && window.innerWidth <= 768 ? "true" : undefined}
      >
        <div className="sidebar-brand">
          <div className="brand-row">
            <div className="brand-icon" aria-hidden="true">
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <circle cx="8.5" cy="8.5" r="7" stroke="white" strokeWidth="1.5" />
                <path
                  d="M8.5 3.5L10.2 7H13.8L11 9.2L12 12.8L8.5 10.8L5 12.8L6 9.2L3.2 7H6.8Z"
                  fill="white"
                  opacity=".9"
                />
              </svg>
            </div>
            <span className="brand-name">FutbolStats</span>
          </div>

          <div className="profile-box">
            <div className="avatar-ring">
              {profile?.avatar_url ? (
                <img
                  className="avatar-img avatar-img--photo"
                  src={avatarThumb(profile.avatar_url, 112)}
                  alt={profile.full_name || "Profile"}
                />
              ) : (
                <div className="avatar-img" aria-hidden="true">
                  {initials || <i className="ti ti-user" />}
                </div>
              )}
            </div>
            <div className="profile-name">{profile?.full_name || "Player"}</div>
            <div className="profile-role">
              {isGuest ? <span className="guest-chip">Guest</span> : profile?.role}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Sections">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                "nav-item" + (isActive ? " active" : "")
              }
            >
              <i className={`ti ${item.icon}`} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {isGuest && (
            <button
              type="button"
              className="nav-item nav-item--guest"
              onClick={() => navigate("/auth")}
            >
              <i className="ti ti-login" aria-hidden="true" />
              Sign in
            </button>
          )}

          <button type="button" className="nav-item" onClick={onSignOut}>
            <i className="ti ti-logout" aria-hidden="true" />
            {isGuest ? "Exit" : "Sign out"}
          </button>
        </div>
      </aside>
    </>
  );
}
