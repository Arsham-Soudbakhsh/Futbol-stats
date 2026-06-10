import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  getAllStats,
  getAllAwards,
  getAllRatings,
  getAllPlayers,
} from "../../services";
import { avgRatings, AWARD_LABELS, calcStatPoints, calcAwardPoints } from "../../utils/points";
import "./PlayerProfileDrawer.css";

/**
 * Player profile drawer.
 * - Desktop/tablet: slides from the right.
 * - Mobile (<=640px): bottom sheet (CSS handles this).
 *
 * Rendered via a React Portal to document.body so that no transformed /
 * filtered / contained ancestor can affect its `position: fixed` placement.
 * This fixes:
 *   1) drawer appearing below the fold instead of centered on screen
 *   2) drawer only taking up the parent's width on mobile (empty right side)
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

  // Lock body scroll while open (prevents background scrolling on mobile)
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

  const summary = useMemo(() => {
    if (!data || !player) return null;
    const myStats = data.stats.filter((s) => s.player_id === player.id);
    const goals = myStats.reduce((s, r) => s + (r.goals || 0), 0);
    const assists = myStats.reduce((s, r) => s + (r.assists || 0), 0);
    const clean_sheets = myStats.reduce((s, r) => s + (r.clean_sheets || 0), 0);
    const matches = myStats.length;

    const myRatings = data.ratings.filter((r) => r.to_player_id === player.id && !r.absent);
    const skills = avgRatings(myRatings);

    const myAwards = data.awards.filter((a) => {
      const ids = Array.isArray(a.player_ids) && a.player_ids.length
        ? a.player_ids
        : a.player_id ? [a.player_id] : [];
      return ids.includes(player.id);
    });

    const statPts = calcStatPoints({ goals, assists, clean_sheets });
    const awardPts = calcAwardPoints(myAwards);
    const totalPts = statPts + awardPts;

    const posMates = (data.players || [])
      .filter((p) => p.position === player.position)
      .map((p) => {
        const rs = data.ratings.filter((r) => r.to_player_id === p.id && !r.absent);
        const a = avgRatings(rs).avg || 0;
        return { id: p.id, name: p.full_name, avg: a, me: p.id === player.id };
      })
      .sort((a, b) => b.avg - a.avg);

    return {
      goals, assists, clean_sheets, matches,
      skills, awards: myAwards,
      statPts, awardPts, totalPts,
      posMates,
    };
  }, [data, player]);

  const initials = (player?.full_name || "?")
    .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  // SSR safety
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <div className={`ppd-overlay ${open ? "is-open" : ""}`} onClick={onClose} />
      <aside className={`ppd ${open ? "is-open" : ""}`} role="dialog" aria-modal="true">
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
            position={player?.position}
            avatar={player?.avatar_url}
            initials={initials}
            avg={summary?.skills.avg || 0}
            sho={summary?.skills.shooting || 0}
            pas={summary?.skills.passing || 0}
            dri={summary?.skills.dribbling || 0}
            def={summary?.skills.defending || 0}
          />
        </div>

        <div className="ppd__scroll">
          {loading && (
            <div className="ppd__loading"><i className="ti ti-loader-2 spin" /> Loading…</div>
          )}

          {summary && (
            <>
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
                  Performance vs {player?.position || "position"}
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
function FutCard({ name, position, avatar, initials, avg, sho, pas, dri, def }) {
  return (
    <div className="fut">
      <div className="fut__frame">
        <div className="fut__shine" />
        <div className="fut__top">
          <div className="fut__avg">
            <span className="fut__avg-lbl">AVG</span>
            <span className="fut__avg-num">{avg || "--"}</span>
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

        <div className="fut__stats">
          <FutStat lbl="Sho" v={sho} />
          <span className="fut__sep" />
          <FutStat lbl="Pas" v={pas} />
          <span className="fut__sep" />
          <FutStat lbl="Dri" v={dri} />
          <span className="fut__sep" />
          <FutStat lbl="Def" v={def} />
        </div>

        <div className="fut__pos">{position || "—"}</div>
      </div>
    </div>
  );
}

function FutStat({ lbl, v }) {
  return (
    <div className="fut__stat">
      <span className="fut__stat-lbl">{lbl}</span>
      <span className="fut__stat-v">{v || "--"}</span>
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
      {rows.map((r, i) => (
        <div key={r.id} className="ppd-chart__row">
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
        <span className="ppd-chart__dot" style={{ marginLeft: 14 }} /> Other players ({rows[0]?.id ? rows.length : 0})
      </div>
    </div>
  );
}
