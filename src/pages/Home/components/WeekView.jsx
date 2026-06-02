import React from "react";
import CardTitle from "./CardTitle";
import Gauge from "./Gauge";
import KPI from "./KPI";
import Radar from "./Radar";
import PointsBreakdown from "./PointsBreakdown";
import TrendChart from "./TrendChart";
import { Empty } from "./States";
import { C } from "../constants";
import { AWARD_LABELS } from "../../../utils/points";

const SKILL_AXES = [
  { k: "passing", name: "Passing", color: C.brand },
  { k: "shooting", name: "Shooting", color: C.brand2 },
  { k: "defending", name: "Defending", color: C.gold },
  { k: "dribbling", name: "Dribbling", color: C.brand },
];

/**
 * Week view: hero gauge + KPI tiles + radar/breakdown cards + season trend.
 */
export default function WeekView({
  profile,
  week,
  year,
  stats,
  awards,
  ratings,
  totalPts,
  awardPts,
  avgOverall,
  skillFill,
  season,
}) {
  return (
    <>
      <section className="hp-hero card">
        <div className="hp-hero__gauge">
          <Gauge value={avgOverall} label="Overall" />
          <div className="hp-hero__chips">
            <span className="chip chip--gold">
              <i className="ti ti-trophy" /> {totalPts} pts
            </span>
            <span className="chip">
              <i className="ti ti-ribbon" /> {awards.length} award
              {awards.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="hp-kpis">
          <KPI icon="ti-ball-football" label="Goals" val={stats?.goals ?? 0} accent={C.brand} />
          <KPI icon="ti-arrow-big-right" label="Assists" val={stats?.assists ?? 0} accent={C.brand2} />
          <KPI icon="ti-shield-check" label="Clean sheet" val={stats?.clean_sheets ?? 0} accent={C.gold} />
          <KPI icon="ti-award" label="Points" val={totalPts} dark />
        </div>
      </section>

      <section className="hp-grid">
        <div className="card hp-rad">
          <CardTitle icon="ti-chart-radar" title="Performance radar" badge={`Week ${week}`} />
          {ratings && avgOverall > 0 ? (
            <div className="rad-wrap">
              <Radar values={ratings} size={180} />
              <div className="rad-skills">
                {SKILL_AXES.map((s) => (
                  <div key={s.k} className="sk">
                    <span className="sk__name">{s.name}</span>
                    <div className="sk__track">
                      <div
                        className="sk__fill"
                        style={{
                          width: `${skillFill[s.k]}%`,
                          background: s.color,
                        }}
                      />
                    </div>
                    <span className="sk__val">{ratings[s.k]}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Empty icon="ti-mood-empty" text={`No ratings yet for week ${week}.`} />
          )}
        </div>

        <div className="card hp-pts">
          <CardTitle icon="ti-chart-pie" title="Points breakdown" badge={`Week ${week}`} />
          <PointsBreakdown
            items={[
              { label: "Goals", val: (stats?.goals || 0) * 10, color: C.brand },
              { label: "Assists", val: (stats?.assists || 0) * 5, color: C.brand2 },
              { label: "Clean sh.", val: stats?.clean_sheets || 0, color: "#7CC4A1" },
              { label: "Awards", val: awardPts, color: C.gold },
            ]}
            total={totalPts}
          />

          <div className="hp-awards">
            <div className="hp-awards__title">Awards</div>
            {awards.length ? (
              <div className="hp-awards__list">
                {awards.map((a) => (
                  <span key={a.id} className="aw">
                    <i className="ti ti-star-filled" />
                    {AWARD_LABELS[a.award_type] || a.award_type}
                  </span>
                ))}
              </div>
            ) : (
              <div className="hp-awards__empty">No awards this week.</div>
            )}
          </div>
        </div>
      </section>

      {season?.trend && (
        <section className="card">
          <CardTitle icon="ti-trending-up" title="Points trend" badge={`${year} · 8 weeks`} />
          <TrendChart data={season.trend} highlightWeek={week} />
        </section>
      )}
    </>
  );
}
