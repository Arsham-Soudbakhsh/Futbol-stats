import React from "react";
import CardTitle from "./CardTitle";
import TotalTile from "./TotalTile";
import TrendChart from "./TrendChart";
import Radar from "./Radar";
import { PageLoader } from "../../../components/common/Loader";
import { C } from "../constants";

const SKILL_AXES = [
  { k: "passing", name: "Passing", color: C.brand },
  { k: "shooting", name: "Shooting", color: C.brand2 },
  { k: "defending", name: "Defending", color: C.gold },
  { k: "dribbling", name: "Dribbling", color: C.brand },
];

// Season-view layout: totals tiles + full trend chart + season-avg radar.
export default function SeasonView({ season, year }) {
  if (!season) return <PageLoader label="Loading season" minHeight={220} />;

  return (
    <>
      <section className="card">
        <CardTitle icon="ti-sigma" title="Season totals" badge={String(year)} />
        <div className="hp-totals">
          <TotalTile icon="ti-ball-football" label="Goals" val={season.totals.goals} accent={C.brand} />
          <TotalTile icon="ti-arrow-big-right" label="Assists" val={season.totals.assists} accent={C.brand2} />
          <TotalTile icon="ti-shield-check" label="Clean sheets" val={season.totals.cs} accent={C.gold} />
          <TotalTile icon="ti-chart-bar" label="Stat pts" val={season.totals.statPts} />
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
            <CardTitle icon="ti-chart-radar" title="Average ratings" badge="Season" />
            <div className="rad-wrap">
              <Radar values={season.ratings} size={180} />
              <div className="rad-skills">
                {SKILL_AXES.map((s) => (
                  <div key={s.k} className="sk">
                    <span className="sk__name">{s.name}</span>
                    <div className="sk__track">
                      <div
                        className="sk__fill"
                        style={{
                          width: `${season.ratings[s.k]}%`,
                          background: s.color,
                        }}
                      />
                    </div>
                    <span className="sk__val">{season.ratings[s.k]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
