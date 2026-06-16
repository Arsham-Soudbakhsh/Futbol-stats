import React from "react";
import { STAT_SCORING, RATING_BONUS, AWARD_SCORING } from "../constants";

function Section({ title, icon, items, render }) {
  return (
    <div className="scoring-section">
      <div className="scoring-section__title">
        <i className={`ti ${icon}`} /> {title}
      </div>
      <div className="scoring-grid">
        {items.map(render)}
      </div>
    </div>
  );
}

export default function ScoringLegend() {
  return (
    <div className="card">
      <div className="card-title" style={{ marginBottom: 12 }}>
        <i className="ti ti-info-circle" />
        Scoring system
      </div>

      {/* Stat scoring — position-weighted goals & assists, flat CS */}
      <Section
        title="Match stats (per position)"
        icon="ti-ball-football"
        items={STAT_SCORING}
        render={(item) => (
          <div key={item.label} className="scoring-item scoring-item--stat">
            <span className="scoring-item__icon" style={{ color: item.color }}>
              <i className={`ti ${item.icon}`} />
            </span>
            <span className="scoring-item__label">{item.label}</span>
            {item.flatPts != null ? (
              <span className="scoring-item__pts" style={{ color: item.color }}>
                +{item.flatPts}
              </span>
            ) : (
              <span className="scoring-item__tiers">
                {item.tiers.map((t) => (
                  <span key={t.pos} className="scoring-tier" title={t.pos}>
                    <span className="scoring-tier__pos">{t.pos}</span>
                    <span className="scoring-tier__pts" style={{ color: item.color }}>
                      +{t.pts}
                    </span>
                  </span>
                ))}
              </span>
            )}
          </div>
        )}
      />

      {/* Rating bonus */}
      <Section
        title="Weekly rating bonus"
        icon="ti-chart-radar"
        items={RATING_BONUS}
        render={(item) => (
          <div key={item.label} className="scoring-item">
            <span className="scoring-item__icon" style={{ color: item.color }}>
              <i className={`ti ${item.icon}`} />
            </span>
            <span className="scoring-item__label">{item.label}</span>
            <span className="scoring-item__pts" style={{ color: item.color }}>
              +{item.pts}
            </span>
          </div>
        )}
      />

      {/* Awards */}
      <Section
        title="Awards"
        icon="ti-trophy"
        items={AWARD_SCORING}
        render={(item) => (
          <div key={item.label} className="scoring-item">
            <span className="scoring-item__icon" style={{ color: item.color }}>
              <i className={`ti ${item.icon}`} />
            </span>
            <span className="scoring-item__label">{item.label}</span>
            <span className="scoring-item__pts" style={{ color: item.color }}>
              +{item.pts}
            </span>
          </div>
        )}
      />
    </div>
  );
}
