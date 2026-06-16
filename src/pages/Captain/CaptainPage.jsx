import React, { useContext, useEffect, useState, useMemo, useRef, useCallback } from "react";
import { toast } from "sonner";
import { PageLoader } from "../../components/common/Loader";
import { WeekContext } from "../../components/layout/WeekContext";
import { createPortal } from "react-dom";
import { useAuthStore } from "../../store/authStore";
import {
  getAllPlayers,
  getWeeklySquad,
  upsertWeeklySquad,
  upsertRating,
  getRatingsByCaptain,
  getTeamById,
  confirmTeamName,
  getWeekAccess,
  getCaptainTeamForWeek,
  getCaptainTeamMapForWeek,
  bustCache,
  createNotificationsBatch,
  markRatingSubmission,
  getRatingSubmissions,
  hasVisibilityNotificationBeenSent,
  markVisibilityNotificationSent,
  claimVisibilityBroadcast,
  getOrCreateExpectedCaptainCount,
  logAuditEvent,
} from "../../services";
import {
  getMetricsConfig,
  normalizePosition,
  computeOverall,
  defaultMetrics,
} from "../../utils/positionMetrics";
import { normalizeRating } from "../../utils/ratingSchema";
import "./Captain.css";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function getInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ratingTone(v) {
  if (v >= 75) return "var(--primary)";
  if (v >= 55) return "var(--warning)";
  if (v >= 35) return "#e89856";
  return "var(--danger)";
}

function clampMetric(v) {
  const n = Number.parseInt(v, 10);
  if (Number.isNaN(n)) return 50;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return n;
}

/* Position pills now read from CSS tokens (see :root in index.css). */
function PosBadge({ pos }) {
  const n = normalizePosition(pos);
  if (!n) {
    return (
      <span
        aria-hidden="true"
        className="cp-pos-badge"
        style={{ visibility: "hidden", minWidth: 30 }}
      >
        —
      </span>
    );
  }
  return (
    <span
      className="cp-pos-badge"
      style={{
        background: `var(--pos-${n.toLowerCase()}-soft)`,
        color: `var(--pos-${n.toLowerCase()})`,
      }}
    >
      {n}
    </span>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function CaptainPage() {
  const { profile } = useAuthStore();
  const { week, year } = useContext(WeekContext);

  const [tab, setTab] = useState("squad");
  const [allPlayers, setAllPlayers] = useState([]);
  const [selected, setSelected] = useState([]);
  // ratings[playerId] = { m1, m2, m3, m4 } – only present when explicitly touched.
  const [ratings, setRatings] = useState({});
  const [absentPlayers, setAbsentPlayers] = useState({});
  const [saving, setSaving] = useState(false);
  const [squadLocked, setSquadLocked] = useState(false);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("ALL");
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null });
  const [team, setTeam] = useState(null);
  const [teamLoading, setTeamLoading] = useState(true);
  const [myTeamId, setMyTeamId] = useState(null);
  const [weekOpen, setWeekOpen] = useState(false);
  const [weekLoading, setWeekLoading] = useState(true);
  const [teamNameInput, setTeamNameInput] = useState("");
  const [confirmingName, setConfirmingName] = useState(false);
  const [hasSubmittedRatings, setHasSubmittedRatings] = useState(false);

  // Lightweight rate-limit guard: max 4 saveRatings calls / 60s.
  const saveTimestampsRef = useRef([]);

  const isCaptain = profile?.role === "captain";

  // Load roster
  useEffect(() => {
    if (!isCaptain) return;
    getAllPlayers().then((list) =>
      setAllPlayers(list.filter((p) => p.id !== profile.id))
    );
  }, [isCaptain, profile?.id]);

  // Load team
  useEffect(() => {
    if (!isCaptain || !profile?.id) {
      setMyTeamId(null); setTeam(null); setTeamNameInput(""); setTeamLoading(false);
      return;
    }
    setTeamLoading(true); setTeam(null); setTeamNameInput("");
    getCaptainTeamForWeek(profile.id, week, year)
      .then(async (tid) => {
        setMyTeamId(tid || null);
        if (!tid) { setTeamLoading(false); return; }
        const t = await getTeamById(tid);
        setTeam(t); setTeamNameInput(t?.name || ""); setTeamLoading(false);
      })
      .catch(() => setTeamLoading(false));
  }, [isCaptain, profile?.id, week, year]);

  // Load week access
  useEffect(() => {
    if (!isCaptain) return;
    setWeekLoading(true);
    getWeekAccess(week, year).then((wa) => {
      setWeekOpen(wa?.open === true); setWeekLoading(false);
    });
  }, [isCaptain, week, year]);

  // Load squad
  useEffect(() => {
    if (!isCaptain) return;
    setSquadLocked(false); setSelected([]);
    if (!myTeamId) return;
    getWeeklySquad(myTeamId, week, year).then((sq) => {
      if (!sq) return;
      if (sq.player_ids) setSelected(sq.player_ids.filter((id) => id !== profile.id));
      setSquadLocked(!!sq.locked);
    });
  }, [isCaptain, week, year, myTeamId, profile?.id]);

  // Load ratings — only count rows that are real (have a touched flag).
  useEffect(() => {
    if (!isCaptain || !profile?.id) return;
    setRatings({}); setAbsentPlayers({});
    getRatingsByCaptain(profile.id, week, year)
      .then((rows) => {
        const r = {}, a = {};
        for (const row of rows) {
          if (row.absent) {
            a[row.to_player_id] = true;
            continue;
          }
          const norm = normalizeRating(row);
          // Only seed metrics for rows that actually carry data.
          if (norm?.metrics && (norm.overall > 0 || row.overall > 0)) {
            r[row.to_player_id] = norm.metrics;
          }
        }
        setRatings(r);
        setAbsentPlayers(a);
        setHasSubmittedRatings(rows.length > 0);
      })
      .catch((e) => console.error("load ratings failed", e));
  }, [isCaptain, profile?.id, week, year]);

  // Modal scroll lock — uses overflow on <html> + scroll-padding to avoid
  // the iOS visual jump that position:fixed produced.
  useEffect(() => {
    if (!confirmModal.open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => { html.style.overflow = prev; };
  }, [confirmModal.open]);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allPlayers.filter((p) => {
      const np = normalizePosition(p.position);
      // "Unassigned" only surfaces under the ALL tab.
      if (posFilter !== "ALL" && np !== posFilter) return false;
      if (q && !p.full_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allPlayers, search, posFilter]);

  // Real touched count = explicit ratings ∪ absent flags.
  const ratedCount = useMemo(
    () => new Set([
      ...Object.keys(ratings),
      ...Object.keys(absentPlayers).filter((k) => absentPlayers[k]),
    ]).size,
    [ratings, absentPlayers]
  );

  const selectedPlayers = useMemo(
    () => selected.map((id) => allPlayers.find((p) => p.id === id)).filter(Boolean),
    [selected, allPlayers]
  );

  /* ─── Mutations ──────────────────────────────────────────────────────── */

  const togglePlayer = (id) => {
    if (squadLocked) return;
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const saveSquad = async () => {
    if (selected.length !== 4) {
      toast.error("Select exactly 4 players.");
      return;
    }
    // Optimistic lock — revert on failure.
    setSquadLocked(true);
    setSaving(true);
    try {
      await upsertWeeklySquad(myTeamId, week, year, [profile.id, ...selected]);
      toast.success("Squad saved.");
    } catch (e) {
      setSquadLocked(false);
      toast.error(e.message || "Failed to save squad.");
    }
    setSaving(false);
  };

  const requestUnlock = async () => {
    // Always re-check the server: local state may be stale after a refresh.
    try {
      const rows = await getRatingsByCaptain(profile.id, week, year);
      const realRows = (rows || []).filter(
        (r) => r.absent || (r.overall && r.overall > 0)
      );
      if (realRows.length > 0) {
        setHasSubmittedRatings(true);
        toast.error("Ratings already submitted — squad is permanently locked.");
        return;
      }
    } catch (e) {
      toast.error("Could not verify rating status. Try again.");
      return;
    }
    setSaving(true);
    try {
      // Same call without `locked: true` flag — service should leave it open.
      await upsertWeeklySquad(myTeamId, week, year, [profile.id, ...selected], { locked: false });
      setSquadLocked(false);
      toast.success("Squad unlocked. You can edit again.");
    } catch (e) {
      toast.error(e.message || "Failed to unlock squad.");
    }
    setSaving(false);
  };

  const handleMetric = (pid, mKey, val) => {
    const v = clampMetric(val);
    setRatings((prev) => {
      const cur = prev[pid] || defaultMetrics();
      return { ...prev, [pid]: { ...cur, [mKey]: v } };
    });
  };

  /**
   * Toggle absent. When un-marking absent we must drop any phantom ratings
   * row we may have created earlier, otherwise saveRatings would write a
   * 0/0/0/0 score that drags averages down.
   */
  const toggleAbsent = (id) => {
    setAbsentPlayers((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      // If we just unmarked, clear ratings entry that was never touched.
      if (!next[id]) {
        setRatings((r) => {
          if (!r[id]) return r;
          const overall = computeOverall(r[id]);
          if (overall === 0) {
            const { [id]: _drop, ...rest } = r;
            return rest;
          }
          return r;
        });
      }
      return next;
    });
  };

  const checkRateLimit = useCallback(async () => {
    const now = Date.now();
    const windowMs = 60_000;
    const max = 4;
    saveTimestampsRef.current = saveTimestampsRef.current.filter(
      (t) => now - t < windowMs
    );
    if (saveTimestampsRef.current.length >= max) {
      toast.error("Too many submit attempts. Please wait a minute.");
      return false;
    }
    // Server-side throttle: a submission doc for this captain+week already
    // exists and was written within the last `windowMs`? Reject.
    try {
      const submissions = await getRatingSubmissions(week, year);
      const mine = submissions.find((s) => s.captain_id === profile.id);
      const lastMs = mine?.submitted_at?.toMillis?.() ?? 0;
      if (lastMs && now - lastMs < windowMs) {
        toast.error("You just submitted. Please wait a minute before retrying.");
        return false;
      }
    } catch {
      /* offline / read failed — fall through and let the write attempt */
    }
    saveTimestampsRef.current.push(now);
    return true;
  }, [profile?.id, week, year]);

  const saveRatings = async () => {
    if (!(await checkRateLimit())) return;
    setSaving(true);
    // Build set of (touched) player ids — explicit metrics OR explicit absent.
    // Exclude the captain himself — captains never rate themselves and must
    // never receive a "captainName rated you" notification.
    const ids = new Set([
      ...Object.keys(ratings),
      ...Object.keys(absentPlayers).filter((k) => absentPlayers[k]),
    ]);
    ids.delete(profile.id);
    if (ids.size === 0) {
      toast.error("Rate at least one player before saving.");
      setSaving(false);
      return;
    }
    try {
      const captainName = profile?.full_name || profile?.name || "Your captain";

      // ── Parallel writes (Promise.all) instead of sequential await loop ──
      const writes = [...ids].map((pid) => {
        const p = allPlayers.find((x) => x.id === pid);
        const position = normalizePosition(p?.position) || "MID";
        const m = ratings[pid] || defaultMetrics();
        return upsertRating({
          fromId: profile.id,
          toId: pid,
          week, year, position,
          metrics: m,
          absent: !!absentPlayers[pid],
        });
      });
      await Promise.all(writes);

      // Notifications go out as a batch (single Firestore write).
      // Defensive double-filter: never notify self.
      const notifItems = [...ids]
        .filter((pid) => pid !== profile.id)
        .map((pid) => ({
          user_id: pid,
          title: `${captainName} rated you`,
          body: `Your rating for week ${week} will be visible once all captains submit.`,
          type: "rating_received",
          link: "/", week, year,
        }));
      createNotificationsBatch(notifItems).catch((e) =>
        console.warn("batch notif failed", e)
      );

      // Audit log – non-blocking.
      logAuditEvent({
        actor_id: profile.id,
        actor_name: captainName,
        action: "captain.submit_ratings",
        target: `week_${week}_${year}`,
        meta: { count: ids.size, week, year },
      }).catch(() => {});

      // ── Visibility broadcast (atomic claim — fixes race condition) ──
      try {
        await markRatingSubmission(profile.id, week, year);
        const [submissions, expected] = await Promise.all([
          getRatingSubmissions(week, year),
          getOrCreateExpectedCaptainCount(week, year),
        ]);
        if (expected > 0 && submissions.length >= expected) {
          // Atomic: only the first caller wins; others see `won = false`.
          const won = await claimVisibilityBroadcast(week, year);
          if (won) {
            const players = await getAllPlayers();
            const items = players
              .filter((p) => p.role !== "admin")
              .map((p) => ({
                user_id: p.id,
                title: `Your rating for week ${week} is now visible`,
                body: `All captains submitted their ratings. Check your Home page.`,
                type: "rating_visible", link: "/", week, year,
              }));
            await createNotificationsBatch(items);
          }
        }
      } catch (broadcastErr) { console.warn("visibility broadcast failed", broadcastErr); }

      toast.success("Ratings saved.");
      setHasSubmittedRatings(true);
      bustCache();
    } catch (e) {
      toast.error(e.message || "Failed to save ratings.");
    }
    setSaving(false);
  };

  const handleConfirmTeamName = async () => {
    const name = teamNameInput.trim();
    if (!name) return;
    setConfirmingName(true);
    try {
      await confirmTeamName(myTeamId, name);
      setTeam((prev) => ({ ...prev, name, name_confirmed: true }));
      toast.success("Team name confirmed.");
    } catch (e) { toast.error(e.message || "Failed to confirm name."); }
    setConfirmingName(false);
  };

  /* ─── Guards ─────────────────────────────────────────────────────────── */

  if (!isCaptain) {
    return (
      <div className="card fade-up">
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Access denied. Captains only.
        </div>
      </div>
    );
  }
  if (teamLoading) return <PageLoader />;

  if (!myTeamId) {
    return (
      <div className="page fade-up cp-page">
        <Hero week={week} year={year} />
        <div className="card cp-empty-state">
          <i className="ti ti-clock" />
          <h3>You haven&apos;t been assigned to a team for week {week} yet.</h3>
          <p>The admin needs to create a team for the current week and assign you to it.</p>
        </div>
      </div>
    );
  }

  if (team && !team.name_confirmed) {
    return (
      <div className="page fade-up cp-page">
        <Hero week={week} year={year} />
        <div className="card cp-empty-state">
          <i className="ti ti-edit" style={{ color: "var(--primary)" }} />
          <h3>Confirm your team name</h3>
          <p>The admin suggested this name. You can edit it or confirm as is.<br /><strong>This can only be done once.</strong></p>
          <input
            className="admin-input" type="text" value={teamNameInput}
            onChange={(e) => setTeamNameInput(e.target.value)}
            placeholder="Team name..."
            style={{ marginBottom: 16, width: "100%", maxWidth: 300, textAlign: "center", fontSize: 15, fontWeight: 600 }}
            onKeyDown={(e) => e.key === "Enter" && handleConfirmTeamName()}
          />
          <br />
          <button className="btn btn-primary" disabled={confirmingName || !teamNameInput.trim()}
            onClick={handleConfirmTeamName} style={{ minWidth: 180 }}>
            <i className="ti ti-check" />
            {confirmingName ? "Saving..." : "Confirm team name"}
          </button>
        </div>
      </div>
    );
  }

  if (!weekLoading && !weekOpen) {
    return (
      <div className="page fade-up cp-page">
        <Hero week={week} year={year} />
        <div className="card cp-empty-state">
          <i className="ti ti-lock" />
          <h3>Week {week} is not open yet</h3>
          <p>Wait for the admin to open access for this week.</p>
        </div>
      </div>
    );
  }

  const rateDisabled = !squadLocked;

  return (
    <div className="page fade-up cp-page">
      <Hero week={week} year={year}>
        <div className="cp-tabs" role="tablist">
          {[
            { id: "squad", icon: "ti-users-group", label: "Choose squad", count: `${selected.length}/4`, disabled: false, hint: null },
            { id: "rate",  icon: "ti-star-filled",  label: "Rate players",  count: ratedCount || null, disabled: rateDisabled, hint: rateDisabled ? "Lock your squad first" : null },
          ].map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              aria-disabled={t.disabled}
              title={t.hint || undefined}
              className={`cp-tab${tab === t.id ? " cp-tab--active" : ""}${t.disabled ? " cp-tab--disabled" : ""}`}
              onClick={() => { if (!t.disabled) setTab(t.id); }}
            >
              <i className={`ti ${t.icon}`} />
              <span>{t.label}</span>
              {t.count != null && <span className="cp-tab__count">{t.count}</span>}
            </button>
          ))}
        </div>
      </Hero>

      {tab === "squad" && (
        <SquadTab
          selected={selected} selectedPlayers={selectedPlayers} togglePlayer={togglePlayer}
          search={search} setSearch={setSearch} posFilter={posFilter} setPosFilter={setPosFilter}
          filteredPlayers={filteredPlayers} squadLocked={squadLocked} saving={saving}
          setConfirmModal={setConfirmModal}
          canRequestUnlock={squadLocked && !hasSubmittedRatings}
          onRequestUnlock={requestUnlock}
        />
      )}

      {tab === "rate" && !rateDisabled && (
        <RateTab
          allPlayers={allPlayers} filteredPlayers={filteredPlayers}
          ratings={ratings} absentPlayers={absentPlayers}
          handleMetric={handleMetric} toggleAbsent={toggleAbsent}
          search={search} setSearch={setSearch} posFilter={posFilter} setPosFilter={setPosFilter}
          ratedCount={ratedCount} saving={saving} setConfirmModal={setConfirmModal}
        />
      )}

      {confirmModal.open && createPortal(
        <ConfirmModal modal={confirmModal} setModal={setConfirmModal} saving={saving}
          week={week} year={year} selectedCount={selected.length} ratedCount={ratedCount}
          onConfirm={async () => {
            try {
              if (confirmModal.type === "squad") await saveSquad();
              else await saveRatings();
            } finally { setConfirmModal({ open: false, type: null }); }
          }} />,
        document.body
      )}
    </div>
  );
}

/* ─── Shared sub-components ─────────────────────────────────────────────── */

function Hero({ week, year, children }) {
  return (
    <div className="card cp-hero">
      <div className="cp-hero__row">
        <div className="cp-hero__icon"><i className="ti ti-shield-star" /></div>
        <div className="cp-hero__text">
          <div className="cp-hero__title">Captain panel</div>
          <div className="cp-hero__sub">Week {week} · {year}</div>
        </div>
        <span className="cp-hero__pill"><i className="ti ti-crown" /> Captain</span>
      </div>
      {children}
    </div>
  );
}

function PosTabs({ posFilter, setPosFilter, search, setSearch }) {
  return (
    <div className="cp-toolbar">
      <div className="cp-search">
        <i className="ti ti-search" />
        <input type="text" placeholder="Search players…"
          aria-label="Search players"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="cp-pos-tabs" role="tablist">
        {["ALL", "GK", "DEF", "MID", "FWD"].map((p) => (
          <button key={p}
            role="tab"
            aria-selected={posFilter === p}
            className={`cp-pos-tab${posFilter === p ? " cp-pos-tab--active" : ""}`}
            onClick={() => setPosFilter(p)}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function SquadTab(props) {
  const { selected, selectedPlayers, togglePlayer, filteredPlayers, squadLocked, saving,
    setConfirmModal, search, setSearch, posFilter, setPosFilter,
    canRequestUnlock, onRequestUnlock } = props;
  return (
    <>
      <div className="card cp-squad-summary">
        <div className="cp-summary__head">
          <div>
            <div className="cp-summary__title">Your weekly squad</div>
            <div className="cp-summary__sub">Pick 4 teammates · you join as the 5th</div>
          </div>
          <div className="cp-summary__counter">
            <span className="cp-summary__num">{selected.length}</span>
            <span className="cp-summary__den">/ 4</span>
          </div>
        </div>
        <div className="cp-slots">
          {[0, 1, 2, 3].map((i) => {
            const p = selectedPlayers[i];
            const filled = !!p;
            const label = filled
              ? `Remove ${p.full_name} from slot ${i + 1}`
              : `Empty squad slot ${i + 1}`;
            return (
              <button
                key={i}
                type="button"
                aria-label={label}
                disabled={squadLocked || !filled}
                className={`cp-slot${filled ? " cp-slot--filled" : ""}${squadLocked ? " cp-slot--locked" : ""}`}
                onClick={() => filled && !squadLocked && togglePlayer(p.id)}
              >
                {filled ? (
                  <>
                    <div className="cp-slot__avatar">{getInitials(p.full_name)}</div>
                    <div className="cp-slot__name">{p.full_name.split(" ")[0]}</div>
                    <PosBadge pos={p.position} />
                    {!squadLocked && <i className="ti ti-x cp-slot__remove" aria-hidden="true" />}
                  </>
                ) : (
                  <>
                    <i className="ti ti-plus cp-slot__plus" aria-hidden="true" />
                    <div className="cp-slot__empty">Slot {i + 1}</div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <PosTabs {...{ posFilter, setPosFilter, search, setSearch }} />
        <div className="cp-player-grid">
          {filteredPlayers.map((p) => {
            const isSel = selected.includes(p.id);
            const disabled = squadLocked || (!isSel && selected.length >= 4);
            return (
              <button key={p.id} type="button"
                aria-pressed={isSel}
                aria-label={`${isSel ? "Remove" : "Add"} ${p.full_name}`}
                disabled={disabled}
                className={`cp-player-card${isSel ? " cp-player-card--selected" : ""}${disabled ? " cp-player-card--disabled" : ""}`}
                onClick={() => !disabled && togglePlayer(p.id)}>
                <div className="cp-player-card__avatar">{getInitials(p.full_name)}</div>
                <div className="cp-player-card__body">
                  <div className="cp-player-card__name">{p.full_name}</div>
                  <div className="cp-player-card__meta">
                    <PosBadge pos={p.position} />
                    <span className="cp-player-card__role">{p.role}</span>
                  </div>
                </div>
                <div className="cp-player-card__check" aria-hidden="true">
                  {isSel ? <i className="ti ti-check" /> : <i className="ti ti-plus" />}
                </div>
              </button>
            );
          })}
          {!filteredPlayers.length && <div className="cp-empty">No players match.</div>}
        </div>

        {squadLocked && (
          <div className="admin-msg admin-msg--ok" role="status">
            <i className="ti ti-lock" /> Squad submitted and locked.
            {canRequestUnlock && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ marginLeft: 10 }}
                onClick={onRequestUnlock}
                disabled={saving}
              >
                <i className="ti ti-lock-open" /> Request unlock
              </button>
            )}
          </div>
        )}

        <div className="cp-action-bar">
          <div className="cp-action-bar__status">
            <i className={`ti ${selected.length === 4 ? "ti-circle-check-filled" : "ti-info-circle"}`}
              style={{ color: selected.length === 4 ? "var(--success)" : "var(--text-muted)" }} />
            {selected.length === 4 ? "Ready to confirm" : `Pick ${4 - selected.length} more`}
          </div>
          <button className="btn btn-primary"
            onClick={() => setConfirmModal({ open: true, type: "squad" })}
            disabled={saving || squadLocked || selected.length !== 4}>
            <i className="ti ti-device-floppy" />
            {saving ? "Saving…" : "Confirm squad"}
          </button>
        </div>
      </div>
    </>
  );
}

function RateTab(props) {
  const { allPlayers, filteredPlayers, ratings, absentPlayers, handleMetric, toggleAbsent,
    search, setSearch, posFilter, setPosFilter, ratedCount, saving, setConfirmModal } = props;

  // Split visible players into known position vs unassigned (only when ALL).
  const showUnassigned = posFilter === "ALL";
  const assignedPlayers = filteredPlayers.filter((p) => !!normalizePosition(p.position));
  const unassignedPlayers = filteredPlayers.filter((p) => !normalizePosition(p.position));

  return (
    <>
      <div className="card cp-rate-intro">
        <div className="cp-rate-intro__icon"><i className="ti ti-star-filled" /></div>
        <div className="cp-rate-intro__body">
          <div className="cp-rate-intro__title">Rate your teammates</div>
          <div className="cp-rate-intro__sub">
            Each player is rated on <strong>4 metrics specific to their position</strong>.
            Hover any metric for a hint. Ratings from all 3 captains are averaged.
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
          <input type="text" placeholder="Search players…"
            aria-label="Search players"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="cp-pos-tabs" role="tablist">
          {["ALL", "GK", "DEF", "MID", "FWD"].map((p) => (
            <button key={p}
              role="tab"
              aria-selected={posFilter === p}
              className={`cp-pos-tab${posFilter === p ? " cp-pos-tab--active" : ""}`}
              onClick={() => setPosFilter(p)}>{p}</button>
          ))}
        </div>
      </div>

      <div className="cp-rate-list">
        {assignedPlayers.map((p) => (
          <RateCard key={p.id} player={p}
            metrics={ratings[p.id] || defaultMetrics()}
            absent={!!absentPlayers[p.id]}
            onMetric={(k, v) => handleMetric(p.id, k, v)}
            onAbsent={() => toggleAbsent(p.id)}
            touched={ratings[p.id] != null || !!absentPlayers[p.id]}
          />
        ))}

        {showUnassigned && unassignedPlayers.length > 0 && (
          <div className="cp-unassigned-group">
            <div className="cp-unassigned-group__head">
              <i className="ti ti-help-circle" /> Unassigned position
              <span className="badge" style={{ marginLeft: 6 }}>{unassignedPlayers.length}</span>
              <span className="cp-unassigned-group__hint">
                Ask admin to set positions for these players.
              </span>
            </div>
            {unassignedPlayers.map((p) => (
              <RateCard key={p.id} player={p}
                metrics={ratings[p.id] || defaultMetrics()}
                absent={!!absentPlayers[p.id]}
                onMetric={(k, v) => handleMetric(p.id, k, v)}
                onAbsent={() => toggleAbsent(p.id)}
                touched={ratings[p.id] != null || !!absentPlayers[p.id]}
              />
            ))}
          </div>
        )}

        {!filteredPlayers.length && <div className="cp-empty">No players match.</div>}
      </div>

      <div className="cp-action-bar cp-action-bar--sticky">
        <div className="cp-action-bar__status">
          <i className="ti ti-checks" style={{ color: "var(--primary)" }} />
          {ratedCount} of {allPlayers.length} rated
        </div>
        <button className="btn btn-primary"
          onClick={() => setConfirmModal({ open: true, type: "ratings" })}
          disabled={saving || ratedCount === 0}>
          <i className="ti ti-check" />
          {saving ? "Saving…" : "Save ratings"}
        </button>
      </div>
    </>
  );
}

function RateCard({ player, metrics, absent, onMetric, onAbsent, touched }) {
  const pos = normalizePosition(player.position) || "MID";
  const cfg = getMetricsConfig(pos);
  const overall = computeOverall(metrics);
  const tone = ratingTone(overall);
  return (
    <div className={`cp-rate-card${touched ? " cp-rate-card--touched" : ""}`}
         style={{ borderLeft: `3px solid ${cfg.color}` }}>
      <div className="cp-rate-card__head">
        <div className="cp-rate-card__avatar">{getInitials(player.full_name)}</div>
        <div className="cp-rate-card__id">
          <div className="cp-rate-card__name">
            {player.full_name}
            <PosBadge pos={player.position} />
          </div>
          <div className="cp-rate-card__role">{player.role || "player"}</div>
          <button type="button"
            aria-pressed={absent}
            className={`cp-absent-btn ${absent ? "cp-absent-btn--active" : ""}`}
            onClick={onAbsent}>
            <i className="ti ti-user-off" /> Absent
          </button>
        </div>
        <div className="cp-rate-card__avg"
          style={{ background: `conic-gradient(${tone} ${overall * 3.6}deg, var(--bg-secondary) 0deg)` }}>
          <div className="cp-rate-card__avg-inner">
            <span className="cp-rate-card__avg-num">{overall}</span>
            <span className="cp-rate-card__avg-label">OVR</span>
          </div>
        </div>
      </div>

      {absent ? (
        <div className="cp-player-absent">
          <i className="ti ti-user-off" /> Player was absent this week
        </div>
      ) : (
        <div className="cp-rate-grid">
          {cfg.metrics.map((m) => {
            const v = metrics[m.key] ?? 50;
            const t = ratingTone(v);
            return (
              <div key={m.key} className="cp-rate-stat" title={m.tip}>
                <div className="cp-rate-stat__head">
                  <i className={`ti ${m.icon}`} style={{ color: m.color }} />
                  <span className="cp-rate-stat__label">{m.label}</span>
                  <span className="cp-rate-stat__val" style={{ color: t }}>{v}</span>
                </div>
                <div className="cp-rate-stat__tip">{m.tip}</div>
                <div className="cp-rate-stat__slider">
                  <div className="cp-rate-stat__track">
                    <div className="cp-rate-stat__fill" style={{ width: `${v}%`, background: t }} />
                  </div>
                  <input
                    type="range" min="0" max="100" step="1" value={v}
                    aria-label={`${m.label} rating`}
                    onChange={(e) => onMetric(m.key, e.target.value)}
                    style={{ "--thumb-color": t }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConfirmModal({ modal, setModal, saving, week, year, selectedCount, ratedCount, onConfirm }) {
  return (
    <div className="cp-modal-backdrop"
      onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setModal({ open: false, type: null }); }}>
      <div className="cp-modal" role="dialog" aria-modal="true" aria-labelledby="cp-modal-title">
        <div className={`cp-modal__icon ${modal.type === "ratings" ? "cp-modal__icon--rating" : ""}`}>
          <i className={`ti ${modal.type === "ratings" ? "ti-star-filled" : "ti-shield-check"}`} />
        </div>
        <div className="cp-modal__eyebrow">Week {week} · {year}</div>
        <h3 id="cp-modal-title">{modal.type === "squad" ? "Confirm Squad" : "Submit Ratings"}</h3>
        <p>
          {modal.type === "squad"
            ? "You are about to submit your weekly squad. Please review your selection carefully before continuing."
            : "You are about to submit player ratings. Please make sure all values are correct before continuing."}
        </p>
        <div className="cp-modal__info">
          {modal.type === "squad" ? `${selectedCount}/4 players selected` : `${ratedCount} players rated`}
        </div>
        <div className="cp-modal__warning">
          <i className="ti ti-alert-triangle" /> This action may not be reversible.
        </div>
        <div className="cp-modal__actions">
          <button type="button" className="btn" disabled={saving}
            onClick={() => setModal({ open: false, type: null })}>
            Go Back
          </button>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={onConfirm}>
            {saving ? "Saving..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
