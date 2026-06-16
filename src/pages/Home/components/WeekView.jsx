import React from "react";
import CardTitle from "./CardTitle";
import Gauge from "./Gauge";
import KPI from "./KPI";
import Radar from "./Radar";
import ComparisonRadar from "./ComparisonRadar";
import TrendChart from "./TrendChart";
import { Empty } from "./States";
import { C } from "../constants";
import { AWARD_LABELS } from "../../../utils/points";
import { getMetricsConfig, normalizePosition } from "../../../utils/positionMetrics";

/**
 * Week view: hero gauge + KPI tiles + radar/comparison cards + season trend.
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
  peers, // { peersAvg, peerCount, rank, groupSize, percentile }
}) {
  const position = normalizePosition(profile?.position) || "MID";
  const cfg = getMetricsConfig(position);

  const tier =
    avgOverall >= 85 ? { label: "Elite", cls: "tier--elite", icon: "ti-crown" } :
    avgOverall >= 75 ? { label: "Excellent", cls: "tier--good", icon: "ti-star" } :
    avgOverall >= 65 ? { label: "Solid", cls: "tier--avg", icon: "ti-thumb-up" } :
    avgOverall >= 50 ? { label: "Average", cls: "tier--low", icon: "ti-line" } :
                       { label: "Building", cls: "tier--low", icon: "ti-seeding" };

  return (
    <>
      <section className="hp-hero card">
        <div className="hp-hero__gauge">
          <Gauge value={avgOverall} label="Overall" />
          <div className="hp-hero__chips">
            <span className={`chip ${tier.cls}`}>
              <i className={`ti ${tier.icon}`} /> {tier.label}
            </span>
            <span className="chip chip--gold">
              <i className="ti ti-trophy" /> {totalPts} pts
            </span>
            {peers?.rank && peers.groupSize > 1 && (
              <span className="chip chip--rank">
                <i className="ti ti-chart-arrows" />
                #{peers.rank} of {peers.groupSize} {position}
              </span>
            )}
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
          <CardTitle icon="ti-chart-radar"
            title={`${position} performance radar`}
            badge={`Week ${week}`} />
          {ratings && avgOverall > 0 ? (
            <div className="rad-wrap">
              <Radar position={position} values={ratings} size={180} />
              <div className="rad-skills">
                {cfg.metrics.map((m) => {
                  const v = ratings[m.key] ?? 0;
                  const animated = skillFill[m.key] ?? v;
                  return (
                    <div key={m.key} className="sk" title={m.tip}>
                      <span className="sk__name" style={{ color: m.color }}>
                        <i className={`ti ${m.icon}`} /> {m.label}
                      </span>
                      <div className="sk__track">
                        <div className="sk__fill"
                          style={{ width: `${animated}%`, background: m.color }} />
                      </div>
                      <span className="sk__val">{v}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <Empty icon="ti-mood-empty" text={`No ratings yet for week ${week}.`} />
          )}
        </div>

        <div className="card hp-cmp">
          <CardTitle icon="ti-versus"
            title={`You vs ${position} teammates`}
            badge={peers?.peerCount ? `${peers.peerCount} peer${peers.peerCount === 1 ? "" : "s"}` : "Week"} />
          {ratings && peers?.peersAvg ? (
            <>
              <div className="rad-wrap">
                <ComparisonRadar
                  position={position}
                  you={ratings}
                  peers={peers.peersAvg}
                  size={200}
                />
                <div className="cmp-side">
                  <div className="cmp-legend">
                    <span className="cmp-legend__row">
                      <span className="cmp-dot" style={{ background: cfg.color }} />
                      <span>You</span>
                      <strong>{ratings.overall ?? avgOverall}</strong>
                    </span>
                    <span className="cmp-legend__row">
                      <span className="cmp-dot cmp-dot--dashed" />
                      <span>Avg peers</span>
                      <strong>{peers.peersAvg.overall}</strong>
                    </span>
                    {peers.percentile != null && (
                      <div className="cmp-pct">
                        <div className="cmp-pct__lbl">Position percentile</div>
                        <div className="cmp-pct__val">
                          {peers.percentile}<span>%</span>
                        </div>
                        <div className="cmp-pct__bar">
                          <div className="cmp-pct__fill"
                            style={{ width: `${peers.percentile}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="cmp-deltas">
                {cfg.metrics.map((m) => {
                  const y = ratings[m.key] ?? 0;
                  const p = peers.peersAvg[m.key] ?? 0;
                  const diff = y - p;
                  const up = diff > 0;
                  return (
                    <div key={m.key} className="delta">
                      <span className="delta__name" style={{ color: m.color }}>
                        <i className={`ti ${m.icon}`} /> {m.label}
                      </span>
                      <span className={`delta__val ${up ? "delta--up" : diff < 0 ? "delta--down" : "delta--eq"}`}>
                        <i className={`ti ${up ? "ti-arrow-up-right" : diff < 0 ? "ti-arrow-down-right" : "ti-equal"}`} />
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <Empty icon="ti-users-group"
              text={ratings
                ? `No teammates rated yet at ${position} for week ${week}.`
                : `Waiting for your week ${week} ratings.`} />
          )}
        </div>
      </section>

      <section className="card hp-awcard">
        <CardTitle icon="ti-trophy" title="Your awards" badge={`Week ${week}`} />
        {awards.length === 0 ? (
          <Empty icon="ti-confetti" text="No awards yet this week. Keep grinding." />
        ) : (
          <ul className="aw-grid">
            {awards.map((a, i) => (
              <li key={i} className="aw aw--lg">
                <i className="ti ti-trophy" />
                {AWARD_LABELS[a.award_type] || a.award_type}
              </li>
            ))}
          </ul>
        )}
      </section>

      {season?.trend?.length > 0 && (
        <section className="card">
          <CardTitle icon="ti-trending-up" title="Season trend" badge={String(year)} />
          <TrendChart data={season.trend} />
        </section>
      )}
    </>
  );
}
