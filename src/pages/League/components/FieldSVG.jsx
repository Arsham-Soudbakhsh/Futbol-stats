import React from "react";

// SVG that paints the pitch background under the lineup bubbles.
export default function FieldSVG() {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      viewBox="0 0 300 400"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="pitchGradLg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1f6b35" />
          <stop offset="1" stopColor="#15532a" />
        </linearGradient>
        <pattern id="stripesLg" width="300" height="40" patternUnits="userSpaceOnUse">
          <rect width="300" height="20" fill="rgba(255,255,255,.03)" />
        </pattern>
      </defs>
      <rect width="300" height="400" fill="url(#pitchGradLg)" />
      <rect width="300" height="400" fill="url(#stripesLg)" />
      <rect x="10" y="10" width="280" height="380" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" fill="none" rx="2" />
      <line x1="10" y1="200" x2="290" y2="200" stroke="rgba(255,255,255,.3)" strokeWidth="1.2" />
      <circle cx="150" cy="200" r="42" stroke="rgba(255,255,255,.28)" strokeWidth="1.2" fill="none" />
      <circle cx="150" cy="200" r="2.5" fill="rgba(255,255,255,.4)" />
      <rect x="80" y="10" width="140" height="50" stroke="rgba(255,255,255,.28)" strokeWidth="1.2" fill="none" />
      <rect x="115" y="10" width="70" height="20" stroke="rgba(255,255,255,.22)" strokeWidth="1" fill="none" />
      <rect x="80" y="340" width="140" height="50" stroke="rgba(255,255,255,.28)" strokeWidth="1.2" fill="none" />
      <rect x="115" y="370" width="70" height="20" stroke="rgba(255,255,255,.22)" strokeWidth="1" fill="none" />
    </svg>
  );
}
