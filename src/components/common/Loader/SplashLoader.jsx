import React from "react";
import Mark from "./Mark";

export default function SplashLoader({ label = "FutbolStats" }) {
  return (
    <div className="fs-splash" role="status" aria-live="polite">
      <div className="fs-splash__glow" aria-hidden />
      <div className="fs-splash__inner">
        <Mark size={72} />
        <div className="fs-splash__title">{label}</div>
        <div className="fs-splash__sub">Preparing your pitch</div>
        <div className="fs-bar" aria-hidden>
          <span />
        </div>
      </div>
    </div>
  );
}
