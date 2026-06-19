import React, { useEffect, useMemo, useState } from "react";

const METRIC_LABELS = {
  goals: "Goals",
  assists: "Assists",
  ga: "G + A",
  overall: "Overall (avg rating)",
  clean_sheets: "Clean Sheets",
  cs_overall: "Clean Sheets + Overall",
};

export default function NewContractDialog({
  me, players, onClose, onSubmit,
  myTotal = 0,
  pointsMap = {},
}) {
  const [search, setSearch] = useState("");
  const [hunted, setHunted] = useState(null);
  const [metric, setMetric] = useState("");
  const [stake, setStake] = useState(10);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players.filter((p) =>
      !q || (p.full_name || p.name || "").toLowerCase().includes(q),
    );
  }, [players, search]);

  const samePos = !!hunted &&
    String(me.position || "").toUpperCase() === String(hunted.position || "").toUpperCase();
  const targetIsGK = String(hunted?.position || "").toUpperCase() === "GK";
  const meIsGK = String(me?.position || "").toUpperCase() === "GK";

  const availableMetrics = useMemo(() => {
    if (!hunted) return [];
    if (samePos) {
      if (targetIsGK && meIsGK) return ["clean_sheets", "overall", "cs_overall"];
      return ["goals", "assists", "ga", "overall"];
    }
    return ["goals", "assists", "ga"];
  }, [hunted, samePos, targetIsGK, meIsGK]);

  useEffect(() => {
    if (metric && !availableMetrics.includes(metric)) setMetric("");
  }, [availableMetrics, metric]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const oppTotal = hunted ? Math.max(0, Math.floor(pointsMap[hunted.id] || 0)) : 0;
  const maxStake = hunted ? Math.max(1, Math.min(myTotal || Infinity, oppTotal || Infinity)) : 0;

  // Clamp stake when the opponent or budget changes.
  useEffect(() => {
    if (!hunted) return;
    setStake((s) => {
      const n = Number(s) || 0;
      if (n < 1) return 1;
      if (maxStake && n > maxStake) return maxStake;
      return n;
    });
  }, [hunted, maxStake]);

  const step = !hunted ? 1 : !metric ? 2 : 3;
  const stakeNum = Number(stake);
  const stakeValid = stakeNum > 0 && (!maxStake || stakeNum <= maxStake);

  const submit = async (e) => {
    e.preventDefault();
    if (!hunted || !metric || !stakeValid) return;
    setBusy(true);
    try { await onSubmit({ hunted_id: hunted.id, metric, stake: stakeNum }); }
    finally { setBusy(false); }
  };

  return (
    <div className="hunt-modal__overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="hunt-modal card" onClick={(e) => e.stopPropagation()}>
        <header className="hunt-modal__head">
          <h3><i className="ti ti-crosshair" /> New challenge</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <i className="ti ti-x" />
          </button>
        </header>

        <form onSubmit={submit} className="hunt-modal__body">
          <div className="hunt-steps">
            <span className={`hunt-steps__dot ${step >= 1 ? "on" : ""}`} />
            <span className={`hunt-steps__dot ${step >= 2 ? "on" : ""}`} />
            <span className={`hunt-steps__dot ${step >= 3 ? "on" : ""}`} />
          </div>

          <label className="hunt-field">
            <span>1. Search a player</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Player name…"
              autoFocus
            />
          </label>

          <div className="hunt-players">
            {filtered.length === 0 && (
              <div className="hunt-empty-mini">No player found</div>
            )}
            {filtered.slice(0, 30).map((p) => {
              const pts = Math.max(0, Math.floor(pointsMap[p.id] || 0));
              return (
                <button
                  type="button"
                  key={p.id}
                  className={`hunt-player ${hunted?.id === p.id ? "on" : ""}`}
                  onClick={() => { setHunted(p); setMetric(""); }}
                >
                  <span className="hunt-player__name">{p.full_name || p.name}</span>
                  <span className="hunt-player__meta">
                    <span className="hunt-player__pts" title="Total points">
                      <i className="ti ti-coins" /> {pts}
                    </span>
                    <span className="hunt-player__pos">{p.position || "—"}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {hunted && (
            <>
              <div className="hunt-info">
                <span>My position: <b>{me.position || "?"}</b></span>
                <span>Opponent: <b>{hunted.position || "?"}</b></span>
                <span className={`hunt-pill ${samePos ? "ok" : "off"}`}>
                  {samePos ? "Same position" : "Different position"}
                </span>
              </div>

              <div className="hunt-budget">
                <div className="hunt-budget__row">
                  <span className="hunt-budget__label">Your points</span>
                  <span className="hunt-budget__value">{myTotal}</span>
                </div>
                <div className="hunt-budget__row">
                  <span className="hunt-budget__label">Opponent points</span>
                  <span className="hunt-budget__value hunt-budget__value--opp">{oppTotal}</span>
                </div>
                <div className="hunt-budget__row hunt-budget__row--max">
                  <span className="hunt-budget__label">Max stake</span>
                  <span className="hunt-budget__value">{maxStake || 0}</span>
                </div>
              </div>

              <label className="hunt-field">
                <span>2. Metric</span>
                <select value={metric} onChange={(e) => setMetric(e.target.value)} required>
                  <option value="">— Pick one —</option>
                  {availableMetrics.map((m) =>
                    <option key={m} value={m}>{METRIC_LABELS[m]}</option>
                  )}
                </select>
              </label>

              <label className="hunt-field">
                <span>3. Stake (points)</span>
                <input
                  type="number"
                  min={1}
                  max={maxStake || undefined}
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                />
                <input
                  className="hunt-range"
                  type="range"
                  min={1}
                  max={Math.max(1, maxStake)}
                  value={Math.min(Math.max(1, stakeNum || 1), Math.max(1, maxStake))}
                  onChange={(e) => setStake(Number(e.target.value))}
                />
                <small>
                  {maxStake
                    ? `Up to ${maxStake} pts (limited by the opponent's balance).`
                    : "Opponent has no points yet — stake is limited."}
                  {" "}The opponent may raise; you'll then accept or cancel.
                </small>
                {!stakeValid && (
                  <small className="hunt-warn">
                    <i className="ti ti-alert-triangle" /> Stake must be between 1 and {maxStake}.
                  </small>
                )}
              </label>
            </>
          )}

          <footer className="hunt-modal__foot">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={busy || !hunted || !metric || !stakeValid}
            >
              {busy ? "Sending…" : <><i className="ti ti-send" /> Send challenge</>}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
