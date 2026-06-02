import React from "react";
import RankBadge from "./RankBadge";
import MiniBar from "./MiniBar";

/**
 * Card that renders one ranked leaderboard:
 *   - title + accent colour + icon at the top
 *   - table of players sorted by `valKey`
 *   - optional extra numeric columns (G + A for the combined card)
 */
export default function LeaderCard({
  title,
  icon,
  accent,
  rows,
  valKey,
  extraCols,
  emptyLabel,
}) {
  const max = rows[0] ? valKey(rows[0]) : 0;
  const hasData = rows.some((r) => valKey(r) > 0);

  return (
    <div className="tga-card card">
      <div className="tga-card__header">
        <i className={`ti ${icon}`} style={{ color: accent, fontSize: 16 }} />
        <span className="tga-card__title">{title}</span>
      </div>

      {!hasData ? (
        <div className="no-stats" style={{ padding: "24px 0" }}>
          <i className="ti ti-database-off no-stats__icon" />
          <div className="no-stats__text">{emptyLabel}</div>
        </div>
      ) : (
        <div className="rt-wrap">
          <table className="tga-table">
            <thead>
              <tr>
                <th style={{ width: 36, textAlign: "center" }}>#</th>
                <th>Player</th>
                {extraCols &&
                  extraCols.map((c) => (
                    <th key={c} style={{ width: 36, textAlign: "center" }}>
                      {c}
                    </th>
                  ))}
                <th className="tga-bar-col">Progress</th>
                <th style={{ width: 56, textAlign: "center" }}>Val</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.id} className={p.me ? "me" : ""}>
                  <td style={{ textAlign: "center" }}>
                    <RankBadge i={i} />
                  </td>
                  <td>
                    <div className="tga-player">
                      <span className={`player-name ${p.me ? "is-me" : ""}`}>
                        {p.full_name}
                      </span>
                      {p.me && <span className="you-tag">YOU</span>}
                    </div>
                  </td>
                  {extraCols &&
                    extraCols.map((c, ci) => (
                      <td key={c} style={{ textAlign: "center" }}>
                        <span className={`stat-num ${p._extras?.[ci] ? "pos" : ""}`}>
                          {p._extras?.[ci] ?? 0}
                        </span>
                      </td>
                    ))}
                  <td className="tga-bar-col">
                    <MiniBar val={valKey(p)} max={max} accent={accent} />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className="pts-total">{valKey(p)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
