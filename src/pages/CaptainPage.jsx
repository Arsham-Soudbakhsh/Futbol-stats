import React, { useContext, useEffect, useState, useMemo } from "react";
import { PageLoader } from './Loader'
import { WeekContext } from "./DashboardLayout";
import { createPortal } from "react-dom";
import { useAuthStore } from "../store/authStore";
import {
  getAllPlayers,
  getWeeklySquad,
  upsertWeeklySquad,
  upsertRating,
  getRatingsByCaptain,
  createTeam,
} from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import "./pages.css";

const POS_CONFIG = {
  GK: { label: "GK", color: "#8A9683", bg: "rgba(138,150,131,.12)" },
  DEF: { label: "DEF", color: "var(--primary)", bg: "var(--primary-soft)" },
  MID: { label: "MID", color: "var(--warning)", bg: "rgba(214,162,61,.12)" },
  FWD: { label: "FWD", color: "var(--danger)", bg: "rgba(201,91,91,.12)" },
};

const RATING_FIELDS = [
  {
    key: "passing",
    label: "Passing",
    icon: "ti-arrows-right-left",
    color: "var(--primary)",
  },
  {
    key: "shooting",
    label: "Shooting",
    icon: "ti-target-arrow",
    color: "var(--danger)",
  },
  { key: "defending", label: "Defending", icon: "ti-shield", color: "#3b82f6" },
  {
    key: "dribbling",
    label: "Dribbling",
    icon: "ti-run",
    color: "var(--warning)",
  },
];

const DEFAULT_RATING = {
  passing: 50,
  shooting: 50,
  defending: 50,
  dribbling: 50,
};

function PosBadge({ pos }) {
  if (!pos) return null;
  const c = POS_CONFIG[pos] || {};
  return (
    <span className="cp-pos-badge" style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ratingTone(v) {
  if (v >= 75) return "var(--primary)";
  if (v >= 55) return "var(--warning)";
  if (v >= 35) return "#e89856";
  return "var(--danger)";
}

export default function CaptainPage() {
  const { profile, setProfile } = useAuthStore();
  const { week, year } = useContext(WeekContext);
  const [tab, setTab] = useState("squad");
  const [allPlayers, setAllPlayers] = useState([]);
  const [selected, setSelected] = useState([]);
  const [ratings, setRatings] = useState({});
  const [absentPlayers, setAbsentPlayers] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [squadLocked, setSquadLocked] = useState(false);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("ALL");
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null });
  const [teamNameInput, setTeamNameInput] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [teamMsg, setTeamMsg] = useState("");

  const isCaptain = profile?.role === "captain";

  // load all players (excluding self) once we know the profile
  useEffect(() => {
    if (!isCaptain) return;
    getAllPlayers().then((list) =>
      setAllPlayers(list.filter((p) => p.id !== profile.id)),
    );
  }, [isCaptain, profile?.id]);

  // load weekly squad whenever week/year/team changes
  useEffect(() => {
    if (!isCaptain) return;
    setSquadLocked(false);
    setSelected([]);

    if (!profile.team_id) return;

    getWeeklySquad(profile.team_id, week, year).then((sq) => {
      if (!sq) return;
      if (sq.player_ids) {
        setSelected(sq.player_ids.filter((id) => id !== profile.id));
      }
      setSquadLocked(!!sq.locked);
    });
  }, [isCaptain, week, year, profile?.team_id, profile?.id]);

  // ── BUG FIX ──────────────────────────────────────────────────────────────
  // Previously `ratings` and `absentPlayers` were never rehydrated from
  // Firestore, so after the captain saved + refreshed the UI fell back to the
  // default state and it LOOKED like nothing was saved. Load them on mount /
  // whenever the week changes.
  useEffect(() => {
    if (!isCaptain || !profile?.id) return;
    setRatings({});
    setAbsentPlayers({});

    getRatingsByCaptain(profile.id, week, year)
      .then((rows) => {
        const r = {};
        const a = {};
        for (const row of rows) {
          r[row.to_player_id] = {
            passing: row.passing ?? 50,
            shooting: row.shooting ?? 50,
            defending: row.defending ?? 50,
            dribbling: row.dribbling ?? 50,
          };
          if (row.absent) a[row.to_player_id] = true;
        }
        setRatings(r);
        setAbsentPlayers(a);
      })
      .catch((e) => console.error("load ratings failed", e));
  }, [isCaptain, profile?.id, week, year]);
  useEffect(() => {
    if (!confirmModal.open) return;

    const scrollY = window.scrollY;

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";

      window.scrollTo(0, scrollY);
    };
  }, [confirmModal.open]);
  if (!isCaptain) {
    return (
      <div className="card fade-up">
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Access denied. Captains only.
        </div>
      </div>
    );
  }

  // ── If captain doesn't have a team yet, show team-creation form ──
  if (!profile?.team_id) {
    const handleCreateTeam = async () => {
      const name = teamNameInput.trim();
      if (!name) { setTeamMsg("err:لطفاً نام تیم را وارد کنید."); return; }
      setCreatingTeam(true);
      setTeamMsg("");
      try {
        const teamId = await createTeam(name, profile.id);
        // Update local profile so the page re-renders with team_id
        if (setProfile) setProfile({ ...profile, team_id: teamId });
        else window.location.reload();
      } catch (e) {
        setTeamMsg("err:" + e.message);
        setCreatingTeam(false);
      }
    };
    return (
      <div className="page fade-up cp-page">
        <div className="card cp-hero">
          <div className="cp-hero__row">
            <div className="cp-hero__icon"><i className="ti ti-shield-star" /></div>
            <div className="cp-hero__text">
              <div className="cp-hero__title">نام‌گذاری تیم</div>
              <div className="cp-hero__sub">قبل از انتخاب بازیکنان، یک نام برای تیم خود انتخاب کنید.</div>
            </div>
          </div>
        </div>
        <div className="card admin-section">
          <div className="card-title" style={{ margin: 0, marginBottom: 16 }}>
            <i className="ti ti-shield" /> تیم جدید
          </div>
          <div className="admin-field" style={{ maxWidth: 360 }}>
            <label><i className="ti ti-pencil" /> نام تیم</label>
            <input
              className="admin-input"
              type="text"
              placeholder="مثلاً: Team Alpha"
              value={teamNameInput}
              onChange={(e) => setTeamNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
            />
          </div>
          {teamMsg && (
            <div className={`admin-msg ${teamMsg.startsWith("ok") ? "ok" : "err"}`} style={{ marginTop: 12 }}>
              {teamMsg.replace(/^(ok|err):/, "")}
            </div>
          )}
          <div className="admin-actions" style={{ marginTop: 16 }}>
            <button className="admin-save" onClick={handleCreateTeam} disabled={creatingTeam}>
              <i className="ti ti-plus" />
              {creatingTeam ? "در حال ساخت..." : "ساخت تیم"}
            </button>
          </div>
        </div>
      </div>
    );
  }


  const togglePlayer = (id) => {
    if (squadLocked) return;
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev,
    );
  };

  const saveSquad = async () => {
    if (selected.length !== 4) {
      setMsg("err:Select exactly 4 players.");
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      await upsertWeeklySquad(profile.team_id, week, year, [
        profile.id,
        ...selected,
      ]);
      setSquadLocked(true);
      setMsg("ok:Squad saved!");
    } catch (e) {
      setMsg("err:" + e.message);
    }
    setSaving(false);
  };

  const handleRating = (pid, field, val) => {
    setRatings((prev) => ({
      ...prev,
      [pid]: {
        ...DEFAULT_RATING,
        ...(prev[pid] || {}),
        [field]: parseInt(val, 10),
      },
    }));
  };

  const toggleAbsent = (id) => {
    setAbsentPlayers((prev) => ({ ...prev, [id]: !prev[id] }));
    // mark as touched so it gets saved even if no slider was moved
    setRatings((prev) =>
      prev[id] ? prev : { ...prev, [id]: { ...DEFAULT_RATING } },
    );
  };

  const saveRatings = async () => {
    setSaving(true);
    setMsg("");

    // include any absent-only entries that don't yet have a ratings row
    const ids = new Set([
      ...Object.keys(ratings),
      ...Object.keys(absentPlayers).filter((k) => absentPlayers[k]),
    ]);

    if (ids.size === 0) {
      setMsg("err:Rate at least one player before saving.");
      setSaving(false);
      return;
    }

    try {
      for (const pid of ids) {
        const r = ratings[pid] || DEFAULT_RATING;
        await upsertRating(
          profile.id,
          pid,
          week,
          year,
          r.passing ?? 50,
          r.shooting ?? 50,
          r.defending ?? 50,
          r.dribbling ?? 50,
          !!absentPlayers[pid],
        );
      }
      setMsg("ok:Ratings saved!");
    } catch (e) {
      console.error(e);
      setMsg("err:" + e.message);
    }
    setSaving(false);
  };

  const isOk = msg.startsWith("ok:");
  const msgText = msg.replace(/^(ok|err):/, "");

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allPlayers.filter((p) => {
      if (posFilter !== "ALL" && p.position !== posFilter) return false;
      if (q && !p.full_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allPlayers, search, posFilter]);

  const ratedCount = useMemo(
    () =>
      new Set([
        ...Object.keys(ratings),
        ...Object.keys(absentPlayers).filter((k) => absentPlayers[k]),
      ]).size,
    [ratings, absentPlayers],
  );

  const selectedPlayers = selected
    .map((id) => allPlayers.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <div className="page fade-up cp-page">
      <div className="card cp-hero">
        <div className="cp-hero__row">
          <div className="cp-hero__icon">
            <i className="ti ti-shield-star" />
          </div>
          <div className="cp-hero__text">
            <div className="cp-hero__title">Captain panel</div>
            <div className="cp-hero__sub">
              Week {week} · {year}
            </div>
          </div>
          <span className="cp-hero__pill">
            <i className="ti ti-crown" />
            Captain
          </span>
        </div>

        <div className="cp-tabs">
          {[
            {
              id: "squad",
              icon: "ti-users-group",
              label: "Choose squad",
              count: `${selected.length}/4`,
            },
            {
              id: "rate",
              icon: "ti-star-filled",
              label: "Rate players",
              count: ratedCount || null,
            },
          ].map((t) => (
            <button
              key={t.id}
              className={`cp-tab${tab === t.id ? " cp-tab--active" : ""}`}
              onClick={() => {
                setTab(t.id);
                setMsg("");
              }}
            >
              <i className={`ti ${t.icon}`} />
              <span>{t.label}</span>
              {t.count != null && (
                <span className="cp-tab__count">{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Squad tab ── */}
      {tab === "squad" && (
        <>
          <div className="card cp-squad-summary">
            <div className="cp-summary__head">
              <div>
                <div className="cp-summary__title">Your weekly squad</div>
                <div className="cp-summary__sub">
                  Pick 4 teammates · you join as the 5th
                </div>
              </div>
              <div className="cp-summary__counter">
                <span className="cp-summary__num">{selected.length}</span>
                <span className="cp-summary__den">/ 4</span>
              </div>
            </div>

            <div className="cp-slots">
              {[0, 1, 2, 3].map((i) => {
                const p = selectedPlayers[i];
                return (
                  <div
                    key={i}
                    className={`cp-slot${p ? " cp-slot--filled" : ""}`}
                    onClick={() => p && togglePlayer(p.id)}
                  >
                    {p ? (
                      <>
                        <div className="cp-slot__avatar">
                          {getInitials(p.full_name)}
                        </div>
                        <div className="cp-slot__name">
                          {p.full_name.split(" ")[0]}
                        </div>
                        <PosBadge pos={p.position} />
                        <i className="ti ti-x cp-slot__remove" />
                      </>
                    ) : (
                      <>
                        <i className="ti ti-plus cp-slot__plus" />
                        <div className="cp-slot__empty">Slot {i + 1}</div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="cp-toolbar">
              <div className="cp-search">
                <i className="ti ti-search" />
                <input
                  type="text"
                  placeholder="Search players…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="cp-pos-tabs">
                {["ALL", "GK", "DEF", "MID", "FWD"].map((p) => (
                  <button
                    key={p}
                    className={`cp-pos-tab${posFilter === p ? " cp-pos-tab--active" : ""}`}
                    onClick={() => setPosFilter(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="cp-player-grid">
              {filteredPlayers.map((p) => {
                const isSel = selected.includes(p.id);
                const disabled = !isSel && selected.length >= 4;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`cp-player-card${isSel ? " cp-player-card--selected" : ""}${disabled ? " cp-player-card--disabled" : ""}`}
                    onClick={() => !disabled && togglePlayer(p.id)}
                  >
                    <div className="cp-player-card__avatar">
                      {getInitials(p.full_name)}
                    </div>
                    <div className="cp-player-card__body">
                      <div className="cp-player-card__name">{p.full_name}</div>
                      <div className="cp-player-card__meta">
                        <PosBadge pos={p.position} />
                        <span className="cp-player-card__role">{p.role}</span>
                      </div>
                    </div>
                    <div className="cp-player-card__check">
                      {isSel ? (
                        <i className="ti ti-check" />
                      ) : (
                        <i className="ti ti-plus" />
                      )}
                    </div>
                  </button>
                );
              })}
              {!filteredPlayers.length && (
                <div className="cp-empty">No players match.</div>
              )}
            </div>

            {msg && (
              <div
                className={`admin-msg${isOk ? " admin-msg--ok" : " admin-msg--err"}`}
              >
                {msgText}
              </div>
            )}

            {squadLocked && (
              <div className="admin-msg admin-msg--ok">
                Squad has already been submitted and is locked.
              </div>
            )}

            <div className="cp-action-bar">
              <div className="cp-action-bar__status">
                <i
                  className={`ti ${selected.length === 4 ? "ti-circle-check-filled" : "ti-info-circle"}`}
                  style={{
                    color:
                      selected.length === 4
                        ? "var(--success)"
                        : "var(--text-muted)",
                  }}
                />
                {selected.length === 4
                  ? "Ready to confirm"
                  : `Pick ${4 - selected.length} more`}
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setConfirmModal({ open: true, type: "squad" })}
                disabled={saving || squadLocked || selected.length !== 4}
              >
                <i className="ti ti-device-floppy" />
                {saving ? "Saving…" : "Confirm squad"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Rate tab ── */}
      {tab === "rate" && (
        <>
          <div className="card cp-rate-intro">
            <div className="cp-rate-intro__icon">
              <i className="ti ti-star-filled" />
            </div>
            <div className="cp-rate-intro__body">
              <div className="cp-rate-intro__title">Rate your teammates</div>
              <div className="cp-rate-intro__sub">
                Score Passing, Shooting, Defending and Dribbling from 0–100.
                Ratings from all 3 captains are averaged.
              </div>
            </div>
            <div className="cp-rate-intro__count">
              <span>{ratedCount}</span>
              <small>/ {allPlayers.length}</small>
            </div>
          </div>

          <div className="cp-toolbar cp-toolbar--standalone">
            <div className="cp-search">
              <i className="ti ti-search" />
              <input
                type="text"
                placeholder="Search players…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="cp-pos-tabs">
              {["ALL", "GK", "DEF", "MID", "FWD"].map((p) => (
                <button
                  key={p}
                  className={`cp-pos-tab${posFilter === p ? " cp-pos-tab--active" : ""}`}
                  onClick={() => setPosFilter(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="cp-rate-list">
            {filteredPlayers.map((p) => {
              const r = ratings[p.id] || DEFAULT_RATING;
              const avg = Math.round(
                (r.passing + r.shooting + r.defending + r.dribbling) / 4,
              );
              const touched = ratings[p.id] != null || absentPlayers[p.id];
              return (
                <div
                  key={p.id}
                  className={`cp-rate-card${touched ? " cp-rate-card--touched" : ""}`}
                >
                  <div className="cp-rate-card__head">
                    <div className="cp-rate-card__avatar">
                      {getInitials(p.full_name)}
                    </div>
                    <div className="cp-rate-card__id">
                      <div className="cp-rate-card__name">
                        {p.full_name}
                        <PosBadge pos={p.position} />
                      </div>
                      <div className="cp-rate-card__role">
                        {p.role || "player"}
                      </div>
                      <button
                        type="button"
                        className={`cp-absent-btn ${absentPlayers[p.id] ? "cp-absent-btn--active" : ""}`}
                        onClick={() => toggleAbsent(p.id)}
                      >
                        <i className="ti ti-user-off" />
                        Absent
                      </button>
                    </div>
                    <div
                      className="cp-rate-card__avg"
                      style={{
                        background: `conic-gradient(${ratingTone(avg)} ${avg * 3.6}deg, var(--bg-secondary) 0deg)`,
                      }}
                    >
                      <div className="cp-rate-card__avg-inner">
                        <span className="cp-rate-card__avg-num">{avg}</span>
                        <span className="cp-rate-card__avg-label">OVR</span>
                      </div>
                    </div>
                  </div>
                  {absentPlayers[p.id] ? (
                    <div className="cp-player-absent">
                      <i className="ti ti-user-off" />
                      Player was absent this week
                    </div>
                  ) : (
                    <div className="cp-rate-grid">
                      {RATING_FIELDS.map((f) => {
                        const v = r[f.key];
                        const tone = ratingTone(v);
                        return (
                          <div key={f.key} className="cp-rate-stat">
                            <div className="cp-rate-stat__head">
                              <i
                                className={`ti ${f.icon}`}
                                style={{ color: f.color }}
                              />
                              <span className="cp-rate-stat__label">
                                {f.label}
                              </span>
                              <span
                                className="cp-rate-stat__val"
                                style={{ color: tone }}
                              >
                                {v}
                              </span>
                            </div>
                            <div className="cp-rate-stat__slider">
                              <div className="cp-rate-stat__track">
                                <div
                                  className="cp-rate-stat__fill"
                                  style={{ width: `${v}%`, background: tone }}
                                />
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={v}
                                onChange={(e) =>
                                  handleRating(p.id, f.key, e.target.value)
                                }
                                style={{ "--thumb-color": tone }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {!filteredPlayers.length && (
              <div className="cp-empty">No players match.</div>
            )}
          </div>

          {msg && (
            <div
              className={`admin-msg${isOk ? " admin-msg--ok" : " admin-msg--err"}`}
            >
              {msgText}
            </div>
          )}

          <div className="cp-action-bar cp-action-bar--sticky">
            <div className="cp-action-bar__status">
              <i className="ti ti-checks" style={{ color: "var(--primary)" }} />
              {ratedCount} of {allPlayers.length} rated
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setConfirmModal({ open: true, type: "ratings" })}
              disabled={saving || ratedCount === 0}
            >
              <i className="ti ti-check" />
              {saving ? "Saving…" : "Save ratings"}
            </button>
          </div>
        </>
      )}

      {confirmModal.open &&
        createPortal(
          <div
            className="cp-modal-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !saving) {
                setConfirmModal({ open: false, type: null });
              }
            }}
          >
            <div className="cp-modal" role="dialog" aria-modal="true">
              <div
                className={`cp-modal__icon ${
                  confirmModal.type === "ratings"
                    ? "cp-modal__icon--rating"
                    : ""
                }`}
              >
                <i
                  className={`ti ${
                    confirmModal.type === "ratings"
                      ? "ti-star-filled"
                      : "ti-shield-check"
                  }`}
                />
              </div>

              <div className="cp-modal__eyebrow">
                Week {week} · {year}
              </div>

              <h3>
                {confirmModal.type === "squad"
                  ? "Confirm Squad"
                  : "Submit Ratings"}
              </h3>

              <p>
                {confirmModal.type === "squad"
                  ? "You are about to submit your weekly squad. Please review your selection carefully before continuing."
                  : "You are about to submit player ratings. Please make sure all values are correct before continuing."}
              </p>

              <div className="cp-modal__info">
                {confirmModal.type === "squad"
                  ? `${selected.length}/4 players selected`
                  : `${ratedCount} players rated`}
              </div>

              <div className="cp-modal__warning">
                <i className="ti ti-alert-triangle" />
                This action may not be reversible.
              </div>

              <div className="cp-modal__actions">
                <button
                  type="button"
                  className="btn"
                  disabled={saving}
                  onClick={() => setConfirmModal({ open: false, type: null })}
                >
                  Go Back
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={async () => {
                    try {
                      if (confirmModal.type === "squad") {
                        await saveSquad();
                      } else {
                        await saveRatings();
                      }
                    } finally {
                      setConfirmModal({
                        open: false,
                        type: null,
                      });
                    }
                  }}
                >
                  {saving ? "Saving..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
