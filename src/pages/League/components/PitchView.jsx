import React from "react";
import { PageLoader } from "../../../components/common/Loader";
import FieldSVG from "./FieldSVG";
import { POSITIONS, POS_COLOR } from "../constants";

// The football pitch with bubbles drawn for each filled slot.
export default function PitchView({ teamName, loading, players, lineup }) {
  return (
    <div className="lg-card" style={{ padding: 12 }}>
      <div className="lg-card__title">
        <i className="ti ti-layout-board lg-card__icon" />
        {teamName} — lineup
      </div>

      {loading ? (
        <PageLoader label="Loading lineup" minHeight={140} />
      ) : !players.length ? (
        <div className="lt-empty-state">No players assigned to this team yet.</div>
      ) : (
        <div className="lt-pitch">
          <FieldSVG />
          {POSITIONS.map((slot) => (
            <PitchSlot key={slot.slot} slot={slot} player={lineup[slot.slot]} />
          ))}
        </div>
      )}
    </div>
  );
}

function PitchSlot({ slot, player: p }) {
  return (
    <div className="lt-slot" style={{ left: slot.x + "%", top: slot.y + "%" }}>
      {p ? (
        <>
          <div className="lt-bubble" style={{ background: POS_COLOR[slot.pos] }}>
            {p.full_name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="lt-name">{p.full_name.split(" ")[0]}</div>
          <div className="lt-pos">{slot.pos}</div>
        </>
      ) : (
        <>
          <div className="lt-empty">
            <i className="ti ti-minus" />
          </div>
          <div className="lt-pos" style={{ color: "rgba(255,255,255,.45)" }}>
            {slot.pos}
          </div>
        </>
      )}
    </div>
  );
}
