import React from "react";
import { TABS, TAB_LABEL, SCORE_FORMULA } from "../constants";

/**
 * Right-hand panel: position tabs + ranked player list for the active tab,
 * plus the scoring-formula explainer and a footer of players with no
 * position set.
 */
export default function PositionRankings({
  enriched,
  byPosition,
  activeTab,
  setActiveTab,
  selected,
  setSelected,
}) {
  const list = byPosition[activeTab] || [];

  return (
    <>
      <div className="pos-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`pos-tab${activeTab === tab ? " active-tab" : ""}`}
            onClick={() => {
              setActiveTab(tab);
              setSelected(null);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bt-rank-caption">
        {TAB_LABEL[activeTab]}s ranked by performance
        <span className="bt-rank-count">{list.length} players</span>
      </div>

      {list.length === 0 ? (
        <div className="bt-empty-state" style={{ padding: "16px 0" }}>
          <i
            className="ti ti-users"
            style={{ fontSize: 22, opacity: 0.3, display: "block", marginBottom: 6 }}
          />
          No {TAB_LABEL[activeTab].toLowerCase()}s registered yet.
        </div>
      ) : (
        <>
          {list.map((p, idx) => (
            <PlayerRankRow
              key={p.id}
              player={p}
              index={idx}
              activeTab={activeTab}
              isActive={selected?.id === p.id}
              onSelect={() => setSelected(selected?.id === p.id ? null : p)}
            />
          ))}

          <div className="bt-formula">
            <strong>Score formula ({activeTab}):</strong>
            <br />
            {SCORE_FORMULA[activeTab]}
          </div>
        </>
      )}

      <NoPositionList enriched={enriched} />
    </>
  );
}

function PlayerRankRow({ player: p, index: idx, activeTab, isActive, onSelect }) {
  const isWinner = idx === 0;
  const posScore = Math.round(p.scores[activeTab]);
  return (
    <div
      className={`bt-rank-row${isActive ? " active" : ""}`}
      onClick={onSelect}
    >
      <div className={`bt-rank-num${isWinner ? " gold" : ""}`}>
        {isWinner ? "👑" : idx + 1}
      </div>
      <div style={{ flex: 1 }}>
        <div className="bt-rank-name">
          {p.full_name}
          {isWinner && (
            <span className="bt-best-badge">BEST {activeTab}</span>
          )}
        </div>
        <div className="bt-rank-stats">
          {p.stats.goals}G · {p.stats.assists}A · {p.stats.clean_sheets}CS ·{" "}
          {p.ratings.avg} OVR
        </div>
      </div>
      <span className="pts-pill" title="Position score">{posScore}</span>
    </div>
  );
}

function NoPositionList({ enriched }) {
  const noPos = enriched.filter(
    (p) =>
      !p.position_normalized ||
      !["GK", "DEF", "MID", "ST"].includes(p.position_normalized),
  );
  if (!noPos.length) return null;

  return (
    <div className="bt-no-pos">
      <div className="bt-no-pos__head">⚠ No position set</div>
      {noPos.map((p) => (
        <div key={p.id} className="bt-no-pos__row">
          {p.full_name}
          <span className="bt-no-pos__raw">({p.position || "unknown"})</span>
        </div>
      ))}
    </div>
  );
}
