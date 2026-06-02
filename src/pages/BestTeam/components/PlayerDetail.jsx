import React from "react";

// Detail card shown under the pitch when a player is selected.
export default function PlayerDetail({ player, onClose }) {
  return (
    <div className="bt-detail">
      <div className="bt-detail__head">
        <div>
          <div className="bt-detail__name">{player.full_name}</div>
          <div className="bt-detail__role">
            {player.position_normalized || player.role}
          </div>
        </div>
        <button
          onClick={onClose}
          className="bt-detail__close"
          aria-label="close"
        >
          <i className="ti ti-x" />
        </button>
      </div>

      <div className="bt-stat-grid">
        <Stat label="Goals" value={player.stats.goals} />
        <Stat label="Assists" value={player.stats.assists} />
        <Stat label="CS" value={player.stats.clean_sheets} />
        <Stat label="Rating" value={player.ratings.avg} />
      </div>
      <div className="bt-stat-grid">
        <Stat label="PAS" value={player.ratings.passing} />
        <Stat label="SHO" value={player.ratings.shooting} />
        <Stat label="DEF" value={player.ratings.defending} />
        <Stat label="DRI" value={player.ratings.dribbling} />
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bt-stat">
      <div className="bt-stat-val">{value}</div>
      <div className="bt-stat-lbl">{label}</div>
    </div>
  );
}
