import React, { useContext, useEffect, useMemo, useState } from 'react'
import { PageLoader } from './Loader'
import { WeekContext } from './DashboardLayout'
import {
  getAllPlayers, getWeeklyStats, getAllRatings,
} from '../lib/firebase'
import { avgRatings } from '../lib/points'

/* ------------------------------------------------------------------
 *  Best XI of the week — 1-2-1-1 mini formation (GK, 2 DEF, MID, ST)
 *  Players don't have a position field, so we DERIVE positions from
 *  their week ratings + stats and pick the best at each slot.
 * -----------------------------------------------------------------*/

const POSITIONS = [
  { slot: 'ST',  pos: 'ST',  x: 50, y: 16 },
  { slot: 'MID', pos: 'MID', x: 50, y: 42 },
  { slot: 'DEF1', pos: 'DEF', x: 30, y: 68 },
  { slot: 'DEF2', pos: 'DEF', x: 70, y: 68 },
  { slot: 'GK',  pos: 'GK',  x: 50, y: 88 },
]

const POS_CLASS = { ST: 'pos-fwd', MID: 'pos-mid', DEF: 'pos-def', GK: 'pos-gk' }
const POS_COLOR = {
  ST:  'linear-gradient(135deg,#e74c3c,#c0392b)',
  MID: 'linear-gradient(135deg,#2980b9,#1f5f8b)',
  DEF: 'linear-gradient(135deg,#27ae60,#1a6b3c)',
  GK:  'linear-gradient(135deg,#f39c12,#b9770e)',
}

// score formulas — heavier on the slot's own metric
const score = {
  GK:  (s, r) => (s.clean_sheets || 0) * 10 + (r.defending || 0) * 0.3,
  DEF: (s, r) => (r.defending || 0) * 1.0 + (s.clean_sheets || 0) * 4 + (s.assists || 0) * 1.5,
  MID: (s, r) => ((r.passing || 0) + (r.dribbling || 0)) * 0.5 + (s.assists || 0) * 5 + (s.goals || 0) * 2,
  ST:  (s, r) => (r.shooting || 0) * 1.0 + (s.goals || 0) * 8 + (s.assists || 0) * 3,
}

export default function BestTeamPage() {
  const { week, year } = useContext(WeekContext)
  const [players, setPlayers] = useState([])
  const [stats, setStats] = useState([])
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setLoading(true)
    setSelected(null)
    Promise.all([
      getAllPlayers(),
      getWeeklyStats(week, year),
      getAllRatings(week, year),
    ]).then(([pl, st, rt]) => {
      setPlayers(pl.filter(p => p.role !== 'admin'))
      setStats(st)
      setRatings(rt)
      setLoading(false)
    })
  }, [week, year])

  // Build per-player aggregate (stats + averaged ratings)
  const enriched = useMemo(() => {
    const statsByPid = Object.fromEntries(stats.map(s => [s.player_id, s]))
    const ratingsByPid = {}
    ratings.forEach(r => {
      (ratingsByPid[r.to_player_id] ||= []).push(r)
    })
    return players.map(p => {
      const s = statsByPid[p.id] || { goals: 0, assists: 0, clean_sheets: 0 }
      const r = avgRatings(ratingsByPid[p.id] || [])
      return {
        ...p,
        stats: { goals: s.goals || 0, assists: s.assists || 0, clean_sheets: s.clean_sheets || 0 },
        ratings: r,
        scores: {
          GK: score.GK(s, r), DEF: score.DEF(s, r),
          MID: score.MID(s, r), ST: score.ST(s, r),
        },
      }
    })
  }, [players, stats, ratings])

  // Pick best XI: GK → 2× DEF → MID → ST, no reuse
  const bestXI = useMemo(() => {
    const used = new Set()
    const pick = (slotPos) => {
      const pool = enriched.filter(p => !used.has(p.id) && p.scores[slotPos] > 0)
      if (pool.length === 0) return null
      const best = [...pool].sort((a, b) => b.scores[slotPos] - a.scores[slotPos])[0]
      used.add(best.id)
      return best
    }
    return {
      GK:  pick('GK'),
      DEF1: pick('DEF'),
      DEF2: pick('DEF'),
      MID: pick('MID'),
      ST:  pick('ST'),
    }
  }, [enriched])

  const filledCount = Object.values(bestXI).filter(Boolean).length

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <style>{`
        .bt-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:14px}
        @media (max-width:880px){.bt-grid{grid-template-columns:1fr}}
        .bt-pitch{position:relative;border-radius:14px;overflow:hidden;
          box-shadow:0 12px 40px -16px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.06);
          aspect-ratio:3/4;max-width:520px;margin:0 auto;width:100%}
        .bt-slot{position:absolute;transform:translate(-50%,-50%);text-align:center;cursor:pointer;
          transition:transform .25s cubic-bezier(.2,.7,.2,1)}
        .bt-slot:hover{transform:translate(-50%,-50%) scale(1.08)}
        .bt-slot.active{transform:translate(-50%,-50%) scale(1.12)}
        .bt-bubble{width:54px;height:54px;border-radius:50%;display:flex;align-items:center;
          justify-content:center;color:#fff;font-weight:700;font-size:13px;letter-spacing:.4px;
          margin:0 auto;border:2px solid rgba(255,255,255,.85);
          box-shadow:0 6px 18px -4px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.4)}
        .bt-slot.active .bt-bubble{box-shadow:0 0 0 4px rgba(255,255,255,.35), 0 8px 22px -4px rgba(0,0,0,.55)}
        .bt-name{font-size:11px;color:#fff;margin-top:5px;font-weight:600;
          text-shadow:0 1px 4px rgba(0,0,0,.6);letter-spacing:.2px}
        .bt-pos{font-size:9px;color:rgba(255,255,255,.78);font-weight:600;
          text-transform:uppercase;letter-spacing:.6px;margin-top:1px}
        .bt-empty{width:54px;height:54px;border-radius:50%;border:2px dashed rgba(255,255,255,.4);
          display:flex;align-items:center;justify-content:center;margin:0 auto;
          color:rgba(255,255,255,.5);font-size:18px}
        .bt-detail{padding:14px;border-radius:12px;background:var(--primary-soft);
          border:1px solid var(--border);margin-top:12px;animation:fadeUp .2s ease}
        .bt-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
        .bt-stat{padding:8px 6px;background:var(--surface);border-radius:8px;text-align:center;
          border:1px solid var(--border)}
        .bt-stat-val{font-size:15px;font-weight:700;color:var(--primary);font-family:'DM Mono',monospace}
        .bt-stat-lbl{font-size:9px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px;margin-top:2px}
        .bt-list-row{display:flex;align-items:center;gap:10px;padding:10px 4px;
          border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s}
        .bt-list-row:last-child{border-bottom:none}
        .bt-list-row:hover{background:var(--primary-soft)}
        .bt-list-row.active{background:var(--primary-soft)}
        .bt-rank{width:24px;height:24px;border-radius:6px;background:var(--bg-secondary);
          display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;
          color:var(--text-secondary);font-family:'DM Mono',monospace;flex-shrink:0}
        .bt-pos-pill{font-size:9px;padding:2px 7px;border-radius:4px;font-weight:700;
          letter-spacing:.6px;color:#fff}
        .bt-empty-state{padding:24px 16px;text-align:center;color:var(--text-muted);font-size:13px}
      `}</style>

      <div className="bt-grid">
        {/* ── Field ── */}
        <div className="card" style={{ padding: 14 }}>
          <div className="card-title">
            <i className="ti ti-layout-board" />
            Best XI
            <span className="badge">Week {week}</span>
          </div>

          {loading ? (
            <PageLoader label="Building best XI" minHeight={200} />
          ) : filledCount === 0 ? (
            <div className="bt-empty-state">
              <i className="ti ti-ball-football" style={{ fontSize: 32, opacity: .4, display: 'block', marginBottom: 8 }} />
              No data for week {week} yet.<br />
              <span style={{ fontSize: 11 }}>Stats & captain ratings need to be entered first.</span>
            </div>
          ) : (
            <>
              <div className="bt-pitch">
                <FieldSVG />
                {POSITIONS.map(slot => {
                  const p = bestXI[slot.slot]
                  const isActive = selected?.id && p?.id === selected.id
                  return (
                    <div
                      key={slot.slot}
                      className={`bt-slot${isActive ? ' active' : ''}`}
                      style={{ left: slot.x + '%', top: slot.y + '%' }}
                      onClick={() => p && setSelected(selected?.id === p.id ? null : p)}
                    >
                      {p ? (
                        <>
                          <div
                            className="bt-bubble"
                            style={{ background: POS_COLOR[slot.pos] }}
                          >
                            {p.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <div className="bt-name">{p.full_name.split(' ')[0]}</div>
                          <div className="bt-pos">{slot.pos}</div>
                        </>
                      ) : (
                        <>
                          <div className="bt-empty"><i className="ti ti-minus" /></div>
                          <div className="bt-pos" style={{ color: 'rgba(255,255,255,.45)' }}>{slot.pos}</div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              {selected && (
                <div className="bt-detail">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{selected.full_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, textTransform: 'capitalize' }}>
                        {selected.role}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}
                      aria-label="close"
                    >
                      <i className="ti ti-x" />
                    </button>
                  </div>
                  <div className="bt-stat-grid">
                    <div className="bt-stat"><div className="bt-stat-val">{selected.stats.goals}</div><div className="bt-stat-lbl">Goals</div></div>
                    <div className="bt-stat"><div className="bt-stat-val">{selected.stats.assists}</div><div className="bt-stat-lbl">Assists</div></div>
                    <div className="bt-stat"><div className="bt-stat-val">{selected.stats.clean_sheets}</div><div className="bt-stat-lbl">CS</div></div>
                    <div className="bt-stat"><div className="bt-stat-val">{selected.ratings.avg}</div><div className="bt-stat-lbl">Rating</div></div>
                  </div>
                  <div className="bt-stat-grid">
                    <div className="bt-stat"><div className="bt-stat-val">{selected.ratings.passing}</div><div className="bt-stat-lbl">PAS</div></div>
                    <div className="bt-stat"><div className="bt-stat-val">{selected.ratings.shooting}</div><div className="bt-stat-lbl">SHO</div></div>
                    <div className="bt-stat"><div className="bt-stat-val">{selected.ratings.defending}</div><div className="bt-stat-lbl">DEF</div></div>
                    <div className="bt-stat"><div className="bt-stat-val">{selected.ratings.dribbling}</div><div className="bt-stat-lbl">DRI</div></div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Squad list ── */}
        <div className="card">
          <div className="card-title">
            <i className="ti ti-list-details" />
            Squad
            <span className="badge">{filledCount}/5</span>
          </div>

          {loading ? (
            <PageLoader label="Loading squad" minHeight={160} />
          ) : filledCount === 0 ? (
            <div className="bt-empty-state">
              <i className="ti ti-users" style={{ fontSize: 24, opacity: .4, display: 'block', marginBottom: 6 }} />
              Best XI will appear once stats & ratings are submitted.
            </div>
          ) : (
            <>
              {POSITIONS.map((slot, i) => {
                const p = bestXI[slot.slot]
                if (!p) return (
                  <div key={slot.slot} className="bt-list-row" style={{ opacity: .5, cursor: 'default' }}>
                    <div className="bt-rank">{i + 1}</div>
                    <div style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No qualifying {slot.pos.toLowerCase()}
                    </div>
                    <span className={`pos ${POS_CLASS[slot.pos]}`}>{slot.pos}</span>
                  </div>
                )
                const isActive = selected?.id === p.id
                return (
                  <div
                    key={slot.slot}
                    className={`bt-list-row${isActive ? ' active' : ''}`}
                    onClick={() => setSelected(selected?.id === p.id ? null : p)}
                  >
                    <div className="bt-rank">{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.full_name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1, fontFamily: 'DM Mono, monospace' }}>
                        {p.stats.goals}G · {p.stats.assists}A · {p.stats.clean_sheets}CS · {p.ratings.avg} OVR
                      </div>
                    </div>
                    <span className={`pos ${POS_CLASS[slot.pos]}`}>{slot.pos}</span>
                    <span className="pts-pill" title="Slot score">
                      {Math.round(p.scores[slot.pos === 'DEF' ? 'DEF' : slot.pos])}
                    </span>
                  </div>
                )
              })}
              <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-secondary)' }}>How it's calculated:</strong><br />
                GK: cleansheets weighted heavily · DEF: defending rating + CS · MID: passing+dribbling + assists · ST: shooting + goals
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function FieldSVG() {
  // Vertical pitch (3:4)
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 300 400" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pitchGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1f6b35" />
          <stop offset="1" stopColor="#15532a" />
        </linearGradient>
        <pattern id="stripes" width="300" height="40" patternUnits="userSpaceOnUse">
          <rect width="300" height="20" fill="rgba(255,255,255,.03)" />
        </pattern>
      </defs>
      <rect width="300" height="400" fill="url(#pitchGrad)" />
      <rect width="300" height="400" fill="url(#stripes)" />
      <rect x="10" y="10" width="280" height="380" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" fill="none" rx="2" />
      <line x1="10" y1="200" x2="290" y2="200" stroke="rgba(255,255,255,.3)" strokeWidth="1.2" />
      <circle cx="150" cy="200" r="42" stroke="rgba(255,255,255,.28)" strokeWidth="1.2" fill="none" />
      <circle cx="150" cy="200" r="2.5" fill="rgba(255,255,255,.4)" />
      {/* Top box (ST attacks) */}
      <rect x="80" y="10" width="140" height="50" stroke="rgba(255,255,255,.28)" strokeWidth="1.2" fill="none" />
      <rect x="115" y="10" width="70" height="20" stroke="rgba(255,255,255,.22)" strokeWidth="1" fill="none" />
      {/* Bottom box (GK) */}
      <rect x="80" y="340" width="140" height="50" stroke="rgba(255,255,255,.28)" strokeWidth="1.2" fill="none" />
      <rect x="115" y="370" width="70" height="20" stroke="rgba(255,255,255,.22)" strokeWidth="1" fill="none" />
      {/* Penalty spots */}
      <circle cx="150" cy="45" r="1.8" fill="rgba(255,255,255,.4)" />
      <circle cx="150" cy="355" r="1.8" fill="rgba(255,255,255,.4)" />
    </svg>
  )
}
