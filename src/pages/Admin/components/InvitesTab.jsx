import React from "react";

/**
 * Tab: create / list / delete invite codes. Codes are split visually
 * into "player" and "captain" via the role tag.
 */
export default function InvitesTab({
  inviteCodes,
  onCreatePlayer,
  onCreateCaptain,
  onRemove,
}) {
  return (
    <div className="card admin-section">
      <div className="admin-section__header">
        <div className="card-title" style={{ margin: 0 }}>
          <i className="ti ti-key" /> Invite codes
        </div>
      </div>

      <div className="invite-actions">
        <button className="admin-save" onClick={onCreatePlayer}>
          <i className="ti ti-user-plus" /> Player code
        </button>
        <button className="admin-save admin-save--alt" onClick={onCreateCaptain}>
          <i className="ti ti-crown" /> Captain code
        </button>
      </div>

      {inviteCodes.length === 0 ? (
        <div className="no-stats" style={{ padding: "20px 0" }}>
          <i className="ti ti-key-off no-stats__icon" />
          <div className="no-stats__text">No invite codes yet.</div>
        </div>
      ) : (
        <div className="invite-list">
          {inviteCodes.map((code) => (
            <div key={code.id} className="invite-row">
              <div className="invite-row__main">
                <code className="invite-code">{code.code}</code>
                <div className="invite-meta">
                  <span className={`invite-tag ${code.role}`}>{code.role}</span>
                  <span className={`invite-tag ${code.used ? "used" : "unused"}`}>
                    {code.used ? "USED" : "UNUSED"}
                  </span>
                </div>
              </div>
              <button
                className="invite-del"
                onClick={() => onRemove(code.code)}
                aria-label="Delete invite"
              >
                <i className="ti ti-trash" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
