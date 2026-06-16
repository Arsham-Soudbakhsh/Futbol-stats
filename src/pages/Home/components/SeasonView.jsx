import React from "react";
import CardTitle from "./CardTitle";
import TotalTile from "./TotalTile";
import TrendChart from "./TrendChart";
import Radar from "./Radar";
import { PageLoader } from "../../../components/common/Loader";
import { C } from "../constants";
import { getMetricsConfig, normalizePosition } from "../../../utils/positionMetrics";

// Season-view layout: totals tiles + full trend chart + season-avg radar.
export default function SeasonView({ season, year, profile }) {
  if (!season) return <PageLoader label="Loading season" minHeight={220} />;
  const position = normalizePosition(profile?.position) || "MID";
  const cfg = getMetricsConfig(position);

  return (
    <>
      <section className="card">
        <CardTitle icon="ti-sigma" title="Season totals" badge={String(year)} />
        <div className="hp-totals">
          <TotalTile icon="ti-ball-football" label="Goals" val={season.totals.goals} accent={C.brand} />
          <TotalTile icon="ti-arrow-big-right" label="Assists" val={season.totals.assists} accent={C.brand2} />
          <TotalTile icon="ti-shield-check" label="Clean sheets" val={season.totals.cs} accent={C.gold} />
          <TotalTile icon="ti-chart-bar" label="Stat pts" val={season.totals.statPts} />
          <TotalTile icon="ti-chart-radar" label="Rating bonus" val={season.totals.ratingBonus || 0} accent={C.brand} />
          <TotalTile icon="ti-award" label="Award pts" val={season.totals.awardPts} accent={C.gold} />
          <TotalTile icon="ti-star" label="Total pts" val={season.totals.totalPts} dark />
        </div>
      </section>

      <section className="card">
        <CardTitle icon="ti-trending-up" title="Weekly points" badge={String(year)} />
        <TrendChart data={season.trend} />
      </section>

      {season.ratings && (
        <section className="card hp-grid hp-grid--season">
          <div>
            <CardTitle icon="ti-chart-radar" title={`${position} season radar`} badge="Season" />
            <div className="rad-wrap">
              <Radar position={position} values={season.ratings} size={180} />
              <div className="rad-skills">
                {cfg.metrics.map((m) => {
                  const v = season.ratings[m.key] ?? 0;
                  return (
                    <div key={m.key} className="sk" title={m.tip}>
                      <span className="sk__name" style={{ color: m.color }}>
                        <i className={`ti ${m.icon}`} /> {m.label}
                      </span>
                      <div className="sk__track">
                        <div className="sk__fill" style={{ width: `${v}%`, background: m.color }} />
                      </div>
                      <span className="sk__val">{v}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
