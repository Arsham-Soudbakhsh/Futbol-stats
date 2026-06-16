import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getAllStats,
  getAllAwards,
  getAllRatings,
  getAllPlayers,
} from "../../services";
import { avgRatings, AWARD_LABELS, calcStatPoints, calcAwardPoints } from "../../utils/points";
import { getMetricsConfig, normalizePosition } from "../../utils/positionMetrics";
import "./PlayerProfileDrawer.css";

/**
 * Player profile drawer.
 * - Desktop/tablet: slides from the right.
 * - Mobile (<=640px): bottom sheet (CSS handles this).
 *
 * The FUT card and supporting widgets read labels from the position-aware
 * METRICS_BY_POSITION config so a striker shows Finishing / Ball Holding /
 * Positioning / Link-up instead of generic Sho/Pas/Dri/Def.
 */
export default function PlayerProfileDrawer({ player, open, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !player?.id) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([getAllStats(), getAllAwards(), getAllRatings(), getAllPlayers()])
      .then(([stats, awards, ratings, players]) => {
        if (cancelled) return;
        setData({ stats, awards, ratings, players });
        setLoading(false);
      })
      .catch(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [open, player?.id]);

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollBarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollBarW > 0) document.body.style.paddingRight = `${scrollBarW}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  const posKey = normalizePosition(player?.position); // GK/DEF/MID/FWD
  const metricsCfg = useMemo(() => getMetricsConfig(player?.position), [player?.position]);

  const summary = useMemo(() => {
    if (!data || !player) return null;
    const myStats = data.stats.filter((s) => s.player_id === player.id);
    const goals = myStats.reduce((s, r) => s + (r.goals || 0), 0);
    const assists = myStats.reduce((s, r) => s + (r.assists || 0), 0);
    const clean_sheets = myStats.reduce((s, r) => s + (r.clean_sheets || 0), 0);
    const matches = myStats.length;

    const myRatings = data.ratings.filter((r) => r.to_player_id === player.id && !r.absent);
    const skills = avgRatings(myRatings, player.position);

    const myAwards = data.awards.filter((a) => {
      const ids = Array.isArray(a.player_ids) && a.player_ids.length
        ? a.player_ids
        : a.player_id ? [a.player_id] : [];
      return ids.includes(player.id);
    });

    const statPts = calcStatPoints({ goals, assists, clean_sheets }, player?.position);
    const awardPts = calcAwardPoints(myAwards);
    const totalPts = statPts + awardPts;

    const posMates = (data.players || [])
      .filter((p) => normalizePosition(p.position) === posKey && posKey)
      .map((p) => {
        const rs = data.ratings.filter((r) => r.to_player_id === p.id && !r.absent);
        const a = avgRatings(rs, p.position).avg || 0;
        return { id: p.id, name: p.full_name, avg: a, me: p.id === player.id };
      })
      .sort((a, b) => b.avg - a.avg);

    return {
      goals, assists, clean_sheets, matches,
      skills, awards: myAwards,
      statPts, awardPts, totalPts,
      posMates,
    };
  }, [data, player, posKey]);

  const initials = (player?.full_name || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  if (typeof document === "undefined") return null;

  // Themed accent for the FUT card — uses the position color from the metrics
  // config so the card visibly belongs to GK / DEF / MID / FWD.
  const cardAccent = metricsCfg?.color || "var(--primary)";

  return createPortal(
    <>
      <div className={`ppd-overlay ${open ? "is-open" : ""}`} onClick={onClose} />
      <aside
        className={`ppd ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        data-pos={posKey || "NONE"}
        style={{ "--ppd-accent": cardAccent }}
      >
        <header className="ppd__top">
          <div className="ppd__title">
            <i className="ti ti-user-circle" />
            <span>Player profile</span>
          </div>
          <button className="ppd__close" onClick={onClose} aria-label="Close">
            <i className="ti ti-x" />
          </button>
        </header>

        <div className="ppd__sticky">
          <FutCard
            name={player?.full_name}
            position={posKey || player?.position}
            avatar={player?.avatar_url}
            initials={initials}
            avg={summary?.skills.overall || summary?.skills.avg || 0}
            metricsCfg={metricsCfg}
            metricValues={summary?.skills}
          />
        </div>

        <div className="ppd__scroll">
          {loading && (
            <div className="ppd__loading"><i className="ti ti-loader-2 spin" /> Loading…</div>
          )}

          {summary && (
            <>
              <section className="ppd-section">
                <h4 className="ppd-h4"><i className="ti ti-activity" /> Attributes</h4>
                <MetricsList cfg={metricsCfg} values={summary.skills} />
              </section>

              <section className="ppd-section">
                <h4 className="ppd-h4"><i className="ti ti-chart-pie" /> Season stats</h4>
                <div className="ppd-stats">
                  <Stat label="Goals" val={summary.goals} icon="ti-ball-football" />
                  <Stat label="Assists" val={summary.assists} icon="ti-arrow-big-right" />
                  <Stat label="Clean sheets" val={summary.clean_sheets} icon="ti-shield-check" />
                  <Stat label="Matches" val={summary.matches} icon="ti-calendar" />
                  <Stat label="Total pts" val={summary.totalPts} icon="ti-award" highlight />
                  <Stat label="Award pts" val={summary.awardPts} icon="ti-trophy" />
                </div>
              </section>

              <section className="ppd-section">
                <h4 className="ppd-h4">
                  <i className="ti ti-trophy" /> Awards
                  <span className="ppd-count">{summary.awards.length}</span>
                </h4>
                {summary.awards.length === 0 ? (
                  <div className="ppd-empty">No awards yet.</div>
                ) : (
                  <ul className="ppd-awards">
                    {summary.awards.map((a, i) => (
                      <li key={i}>
                        <i className="ti ti-medal" />
                        <span>{AWARD_LABELS[a.award_type] || a.award_type}</span>
                        <span className="ppd-awards__wk">W{a.week_number}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="ppd-section">
                <h4 className="ppd-h4">
                  <i className="ti ti-chart-bar" />
                  Performance vs {posKey || player?.position || "position"}
                </h4>
                <PositionChart rows={summary.posMates} />
              </section>
            </>
          )}
        </div>
      </aside>
    </>,
    document.body
  );
}

/* ------------------------------- FUT card ------------------------------- */
/**
 * The FUT card now reads its 4 stat labels from the position config so a
 * striker shows Finishing / Ball Holding / Positioning / Link-up etc.
 */
function FutCard({ name, position, avatar, initials, avg, metricsCfg, metricValues }) {
  const metrics = metricsCfg?.metrics || [];
  return (
    <div className="fut">
      <div className="fut__frame">
        <div className="fut__shine" />
        <div className="fut__glow" />
        <div className="fut__top">
          <div className="fut__avg">
            <span className="fut__avg-num">{avg || "--"}</span>
            <span className="fut__avg-lbl">OVR</span>
            {position && <span className="fut__avg-pos">{position}</span>}
          </div>
          <div className="fut__photo">
            {avatar ? (
              <img src={avatar} alt={name} />
            ) : (
              <div className="fut__photo-ph">{initials}</div>
            )}
          </div>
        </div>

        <div className="fut__name">{name || "—"}</div>

        <div className="fut__stats fut__stats--grid">
          {metrics.map((m) => (
            <FutStat
              key={m.key}
              lbl={shortLabel(m.label)}
              full={m.label}
              v={metricValues?.[m.key] || 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Compress long metric labels (e.g. "Attacking Impact" → "ATK") for the
 *  stat row inside the FUT card. */
function shortLabel(label = "") {
  const map = {
    "Shot Stopping": "SHO",
    "Positioning": "POS",
    "Distribution": "DIS",
    "Communication": "COM",
    "Defending": "DEF",
    "Passing": "PAS",
    "Decision Making": "DEC",
    "Attacking Impact": "ATK",
    "Dribbling": "DRI",
    "Defensive Work Rate": "DEF",
    "Finishing": "FIN",
    "Ball Holding": "HLD",
    "Link-up Play": "LNK",
  };
  return map[label] || label.slice(0, 3).toUpperCase();
}

function FutStat({ lbl, full, v }) {
  return (
    <div className="fut__stat" title={full}>
      <span className="fut__stat-v">{v || "--"}</span>
      <span className="fut__stat-lbl">{lbl}</span>
    </div>
  );
}

/* --------------------------- Metrics list --------------------------- */
function MetricsList({ cfg, values }) {
  if (!cfg) return null;
  return (
    <div className="ppd-metrics">
      {cfg.metrics.map((m) => {
        const v = Number(values?.[m.key] || 0);
        return (
          <div className="ppd-metric" key={m.key}>
            <div className="ppd-metric__head">
              <i className={`ti ${m.icon}`} style={{ color: m.color }} />
              <span className="ppd-metric__lbl">{m.label}</span>
              <span className="ppd-metric__v">{v || 0}</span>
            </div>
            <div className="ppd-metric__bar">
              <div
                className="ppd-metric__fill"
                style={{
                  width: `${Math.max(0, Math.min(100, v))}%`,
                  background: `linear-gradient(90deg, ${m.color}, color-mix(in oklab, ${m.color} 55%, transparent))`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, val, icon, highlight }) {
  return (
    <div className={`ppd-stat ${highlight ? "is-hl" : ""}`}>
      <i className={`ti ${icon}`} />
      <div className="ppd-stat__v">{val}</div>
      <div className="ppd-stat__l">{label}</div>
    </div>
  );
}

/* ---------------------------- Position chart ---------------------------- */
function PositionChart({ rows }) {
  if (!rows || rows.length === 0) {
    return <div className="ppd-empty">No data.</div>;
  }
  const max = Math.max(100, ...rows.map((r) => r.avg));
  return (
    <div className="ppd-chart">
      {rows.map((r) => (
        <div key={r.id} className={`ppd-chart__row ${r.me ? "is-me-row" : ""}`}>
          <div className="ppd-chart__name" title={r.name}>
            {r.me ? "★ " : ""}{r.name}
          </div>
          <div className="ppd-chart__bar-wrap">
            <div
              className={`ppd-chart__bar ${r.me ? "is-me" : ""}`}
              style={{ width: `${(r.avg / max) * 100}%` }}
            />
          </div>
          <div className="ppd-chart__v">{r.avg || 0}</div>
        </div>
      ))}
      <div className="ppd-chart__legend">
        <span className="ppd-chart__dot is-me" /> You
        <span className="ppd-chart__dot" style={{ marginLeft: 14 }} /> Other players ({rows.length})
      </div>
    </div>
  );
}
