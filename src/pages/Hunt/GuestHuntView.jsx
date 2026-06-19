import React from "react";
import { useNavigate } from "react-router-dom";
import "./Hunt.css";

/**
 * GuestHuntView
 * Shown instead of the real Hunt page when the visitor is not signed in.
 * Goal: make Hunt feel exciting and personal, not just a locked door.
 */
export default function GuestHuntView() {
  const navigate = useNavigate();

  return (
    <div className="hunt-page">

      {/* ── Hero — same look as the real Hunt hero ── */}
      <div className="hunt-hero">
        <div className="hunt-hero__top">
          <div className="hunt-hero__icon">
            <i className="ti ti-crosshair" />
          </div>
          <div className="hunt-hero__title">
            <h1>Hunt vs Hunter</h1>
            <p>Player-vs-player predictions. Real stakes.</p>
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="guest-hunt-how">
        <div className="guest-hunt-how__title">How it works</div>
        <div className="guest-hunt-steps">
          <div className="guest-hunt-step">
            <div className="guest-hunt-step__num">1</div>
            <div>
              <strong>Pick your target</strong>
              <p>Challenge any player in the league to a head-to-head bet on this week's stats.</p>
            </div>
          </div>
          <div className="guest-hunt-step">
            <div className="guest-hunt-step__num">2</div>
            <div>
              <strong>Set the terms</strong>
              <p>Choose the stat (goals, assists, rating) and the stake. They accept or counter.</p>
            </div>
          </div>
          <div className="guest-hunt-step">
            <div className="guest-hunt-step__num">3</div>
            <div>
              <strong>Play the week</strong>
              <p>After the matches, the better performer wins. Results are settled automatically.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="guest-hunt-cta-wrap">
        <div className="guest-hunt-cta-card">
          <i className="ti ti-lock guest-hunt-cta-card__icon" />
          <div className="guest-hunt-cta-card__title">You need an account to hunt</div>
          <div className="guest-hunt-cta-card__sub">
            Sign up with your invite code and join the league.
          </div>
          <button
            className="guest-cta"
            onClick={() => navigate("/auth")}
          >
            <i className="ti ti-login" /> Sign in / Sign up
          </button>
        </div>
      </div>

    </div>
  );
}
