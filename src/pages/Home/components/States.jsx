import React from "react";

export function Empty({ icon, text }) {
  return (
    <div className="hp-empty">
      <i className={`ti ${icon}`} />
      <div>{text}</div>
    </div>
  );
}

export function GuestView() {
  return (
    <div className="hp">
      <div className="guest-banner">
        <i className="ti ti-eye" />
        <span>
          You're browsing as a guest. <strong>Sign in</strong> to see your
          personal dashboard.
        </span>
      </div>
      <div className="guest-locked">
        <i className="ti ti-lock guest-locked__icon" />
        <div className="guest-locked__title">Your dashboard is private</div>
        <div className="guest-locked__sub">
          Sign in to view goals, assists, ratings, and awards.
        </div>
        <a href="/auth" className="guest-cta">
          <i className="ti ti-login" /> Sign in
        </a>
      </div>
    </div>
  );
}
