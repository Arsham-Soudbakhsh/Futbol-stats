import React from "react";

// Card header used throughout the Home page (icon + title + optional badge).
export default function CardTitle({ icon, title, badge }) {
  return (
    <div className="card-title">
      <i className={`ti ${icon}`} /> <span>{title}</span>
      {badge && <span className="card-title__badge">{badge}</span>}
    </div>
  );
}
