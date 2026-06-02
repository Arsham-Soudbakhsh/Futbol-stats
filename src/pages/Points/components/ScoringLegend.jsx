import React from "react";
import { SCORING } from "../constants";

export default function ScoringLegend() {
  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: 12 }}>
        <i className="ti ti-info-circle" />
        Scoring system
      </div>
      <div className="scoring-grid">
        {SCORING.map((item) => (
          <div key={item.label} className="scoring-item">
            <span className="scoring-item__icon" style={{ color: item.color }}>
              <i className={`ti ${item.icon}`} />
            </span>
            <span className="scoring-item__label">{item.label}</span>
            <span className="scoring-item__pts" style={{ color: item.color }}>
              +{item.pts}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
