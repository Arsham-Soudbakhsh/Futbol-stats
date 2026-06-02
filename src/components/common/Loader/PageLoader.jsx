import React from "react";
import Mark from "./Mark";

export default function PageLoader({ label = "Loading", minHeight = 240 }) {
  return (
    <div className="fs-loader" style={{ minHeight }}>
      <Mark size={48} />
      <div className="fs-loader__label">
        <span>{label}</span>
        <span className="fs-loader__dots">
          <i /><i /><i />
        </span>
      </div>
    </div>
  );
}
