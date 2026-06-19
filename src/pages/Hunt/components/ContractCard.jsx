import React, { useEffect, useState } from "react";

const METRIC_LABEL = {
  goals: "Goals", assists: "Assists", ga: "G+A",
  overall: "Overall", clean_sheets: "Clean Sheets",
  cs_overall: "CS + Overall",
};

const STATUS_LABEL = {
  pending: "Pending",
  accepted: "Active",
  rejected: "Rejected",
  cancelled: "Cancelled",
  settled: "Settled",
};

const initials = (name) =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

export default function ContractCard({ c, me, onAccept, onReject, onCounter, onCancel }) {
  const iAmHunter = c.hunter_id === me;
  const myName  = iAmHunter ? c.hunter_name : c.hunted_name;
  const myPos   = iAmHunter ? c.hunter_pos  : c.hunted_pos;
  const oppName = iAmHunter ? c.hunted_name : c.hunter_name;
  const oppPos  = iAmHunter ? c.hunted_pos  : c.hunter_pos;
  const myRole  = iAmHunter ? "hunter" : "hunted";

  const awaitingRole = c.proposed_by === "hunter" ? "hunted" : "hunter";
  const myTurn = c.status === "pending" &&
    ((awaitingRole === "hunter" && iAmHunter) || (awaitingRole === "hunted" && !iAmHunter));
  const iLastProposed = c.status === "pending" &&
    ((c.proposed_by === "hunter" && iAmHunter) || (c.proposed_by === "hunted" && !iAmHunter));

  const [counter, setCounter] = useState(c.stake + 1);
  const [showCounter, setShowCounter] = useState(false);

  useEffect(() => {
    setCounter((v) => (Number(v) > c.stake ? v : c.stake + 1));
  }, [c.stake]);

  const iWon  = c.status === "settled" && c.winner_id === me;
  const iLost = c.status === "settled" && c.winner_id && c.winner_id !== me;

  const myScore  = c.result ? (iAmHunter ? c.result.hunter_value : c.result.hunted_value) : null;
  const oppScore = c.result ? (iAmHunter ? c.result.hunted_value : c.result.hunter_value) : null;

  const myAvatarMod  = c.status === "settled" ? (iWon ? "win" : "lose") : "";
  const oppAvatarMod = c.status === "settled" ? (iWon ? "lose" : "win") : "";

  const myDelta = c.hunt_delta?.[me];

  return (
    <div className={`hunt-card status-${c.status} ${iWon ? "win" : ""} ${iLost ? "lose" : ""}`}>
      <div className="hunt-card__top">
        <span className={`hunt-role-pill ${myRole}`}>
          <i className={`ti ${myRole === "hunter" ? "ti-crosshair" : "ti-target"}`} />
          {myRole === "hunter" ? "Hunter" : "Hunted"}
        </span>
        <span className={`hunt-status ${c.status}`}>{STATUS_LABEL[c.status]}</span>
      </div>

      <div className="hunt-vs">
        <div className="hunt-side me">
          <div className={`hunt-avatar ${myAvatarMod}`}>{initials(myName)}</div>
          <div className="hunt-side__name">{myName || "You"}</div>
          <div className="hunt-side__pos">{myPos || "—"}</div>
          {myScore != null && <div className="hunt-side__score">{myScore}</div>}
        </div>

        <div className="hunt-vs__center">
          <span className="hunt-vs__label">Metric</span>
          <span className="hunt-vs__metric">{METRIC_LABEL[c.metric] || c.metric}</span>
          <span className="hunt-vs__vs">VS</span>
          <span className="hunt-vs__stake">
            {c.stake}<span className="unit">pt</span>
          </span>
        </div>

        <div className="hunt-side">
          <div className={`hunt-avatar ${oppAvatarMod}`}>{initials(oppName)}</div>
          <div className="hunt-side__name">{oppName}</div>
          <div className="hunt-side__pos">{oppPos || "—"}</div>
          {oppScore != null && <div className="hunt-side__score">{oppScore}</div>}
        </div>
      </div>

      {c.status === "settled" && (
        <div className={`hunt-result ${iWon ? "win" : "lose"}`}>
          <i className={`ti ${iWon ? "ti-trophy" : "ti-skull"}`} />
          {iWon
            ? <>You won{Number.isFinite(myDelta) && ` · +${myDelta} pts`}</>
            : <>You lost{Number.isFinite(myDelta) && ` · ${myDelta} pts`}</>}
        </div>
      )}

      {c.status === "pending" && (
        <div className="hunt-card__actions">
          {myTurn && !showCounter && (
            <>
              <button className="btn btn--success" onClick={onAccept}>
                <i className="ti ti-check" /> Accept
              </button>
              <button className="btn" onClick={() => setShowCounter(true)}>
                <i className="ti ti-arrow-up" /> Counter
              </button>
              <button className="btn btn--danger" onClick={onReject}>
                <i className="ti ti-x" /> Reject
              </button>
            </>
          )}
          {myTurn && showCounter && (
            <div className="hunt-counter">
              <input
                type="number"
                min={c.stake + 1}
                value={counter}
                onChange={(e) => setCounter(e.target.value)}
                aria-label="New stake"
              />
              <button
                className="btn btn--primary"
                disabled={!(Number(counter) > c.stake)}
                onClick={() => onCounter(Number(counter))}
              >
                Send
              </button>
              <button className="btn" onClick={() => setShowCounter(false)}>Close</button>
            </div>
          )}
          {iLastProposed && (
            <>
              <span className="hunt-await">
                <span className="pulse" /> Waiting for opponent…
              </span>
              <button className="btn btn--danger" onClick={onCancel}>Cancel offer</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
