import React, { useContext, useEffect, useMemo, useState } from 'react'
import { PageLoader, SkeletonTable } from './Loader'
import { WeekContext } from './DashboardLayout'
import { useAuthStore } from '../store/authStore'
import {
  getTeams, getAllTeamStatsSeason, getAllTeamWeeklyStats,
  getAllPlayers, getWeeklyStats, getAllStats,
  getAwards, getAllAwards, getWeeklySquad,
} from '../lib/firebase'
import { calcStatPoints, calcAwardPoints } from '../lib/points'

const GREEN1 = 'var(--text)'
const GREEN2 = 'var(--primary)'
const GRADIENTGREEN = 'var(--gradient-primary)'

// Pitch slots (1-2-1-1)
const POSITIONS = [
  { slot: 'ST',   pos: 'ST',  x: 50, y: 16 },
  { slot: 'MID',  pos: 'MID', x: 50, y: 42 },
  { slot: 'DEF1', pos: 'DEF', x: 30, y: 68 },
  { slot: 'DEF2', pos: 'DEF', x: 70, y: 68 },
  { slot: 'GK',   pos: 'GK',  x: 50, y: 88 },
]
const POS_COLOR = {
  ST:  'linear-gradient(135deg,#e74c3c,#c0392b)',
  MID: 'linear-gradient(135deg,#2980b9,#1f5f8b)',
  DEF: 'linear-gradient(135deg,#27ae60,#1a6b3c)',
  GK:  'linear-gradient(135deg,#f39c12,#b9770e)',
}
// Auto position scorer (same idea as BestTeamPage)
const score = {
  GK:  (s) => (s.clean_sheets || 0) * 10 + 1,
  DEF: (s) => (s.clean_sheets || 0) * 4 + (s.assists || 0) * 1.5 + 1,
  MID: (s) => (s.assists || 0) * 5 + (s.goals || 0) * 2 + 1,
  ST:  (s) => (s.goals || 0) * 8 + (s.assists || 0) * 3 + 1,
}

export default function LeaguePage() {
  const { week, year } = useContext(WeekContext)
  const { profile } = useAuthStore()
  const [teams, setTeams] = useState([])
  const [table, setTable] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('season')
  const [selectedTeam, setSelectedTeam] = useState(null)

  useEffect(() => { getTeams().then(setTeams) }, [])

  useEffect(() => {
    if (!teams.length) return
    setLoading(true)
    buildTable()
  }, [teams, week, year, viewMode])

  // Reset selection when context changes
  useEffect(() => { setSelectedTeam(null) }, [week, year, viewMode])

  const buildTable = async () => {
    try {
      const statsRows = viewMode === 'season'
        ? await getAllTeamStatsSeason(year)
        : await getAllTeamWeeklyStats(week, year)

      const agg = {}
      teams.forEach(t => {
        agg[t.id] = { id: t.id, name: t.name, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 }
      })
      statsRows.forEach(s => {
        if (!agg[s.team_id]) return
        agg[s.team_id].played += s.played || 0
        agg[s.team_id].wins   += s.wins   || 0
        agg[s.team_id].draws  += s.draws  || 0
        agg[s.team_id].losses += s.losses || 0
        agg[s.team_id].gf     += s.goals_for     || 0
        agg[s.team_id].ga     += s.goals_against || 0
      })
      const result = Object.values(agg).map(t => ({
        ...t,
        pts: t.wins * 3 + t.draws,
        gd: t.gf - t.ga,
        me: t.id === profile?.team_id,
      })).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
      setTable(result)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const hasData = table.some(t => t.played > 0)
  const toggleTeam = (id) => setSelectedTeam(prev => prev === id ? null : id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .lg-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 18px;animation:fadeUp .2s ease both}
        .vp{padding:5px 14px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--border);color:var(--text-secondary);background:transparent;transition:all .18s;font-family:var(--font-sans)}
        .vp.on{background:var(--text);border-color:var(--text);color:#fff}
        tbody tr.me-row td{color:var(--text);font-weight:500}
        tbody tr.me-row{background:#e8f7ef}
        tbody tr.clickable{cursor:pointer}
        tbody tr.clickable:hover{background:var(--primary-soft)}
        tbody tr.open{background:var(--primary-soft)!important}
        .pos-badge{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500}
        .caret{display:inline-block;transition:transform .2s;color:var(--text-muted);font-size:11px;margin-left:6px}
        .caret.open{transform:rotate(90deg);color:var(--primary)}

        .lt-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:14px;margin-top:12px;animation:fadeUp .25s ease both}
        @media (max-width:880px){.lt-grid{grid-template-columns:1fr}}
        .lt-pitch{position:relative;border-radius:14px;overflow:hidden;aspect-ratio:3/4;max-width:480px;margin:0 auto;width:100%;box-shadow:0 12px 40px -16px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.06)}
        .lt-slot{position:absolute;transform:translate(-50%,-50%);text-align:center;transition:transform .25s cubic-bezier(.2,.7,.2,1)}
        .lt-bubble{width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;margin:0 auto;border:2px solid rgba(255,255,255,.85);box-shadow:0 6px 18px -4px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.4)}
        .lt-empty{width:50px;height:50px;border-radius:50%;border:2px dashed rgba(255,255,255,.4);display:flex;align-items:center;justify-content:center;margin:0 auto;color:rgba(255,255,255,.5);font-size:18px}
        .lt-name{font-size:11px;color:#fff;margin-top:5px;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,.6)}
        .lt-pos{font-size:9px;color:rgba(255,255,255,.78);font-weight:600;text-transform:uppercase;letter-spacing:.6px;margin-top:1px}

        .lt-points-row{display:flex;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border);transition:background .15s}
        .lt-points-row:last-child{border-bottom:none}
        .lt-points-row:hover{background:var(--primary-soft)}
        .lt-rank{width:24px;height:24px;border-radius:6px;background:var(--bg-secondary);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:var(--text-secondary);font-family:'DM Mono',monospace;flex-shrink:0}
        .lt-pos-pill{font-size:9px;padding:2px 7px;border-radius:4px;font-weight:700;letter-spacing:.6px;color:#fff}
        .lt-pts-pill{display:inline-block;padding:3px 11px;background:var(--gradient-primary);color:#fff;border-radius:20px;font-size:12px;font-weight:600;min-width:40px;text-align:center}
        .lt-empty-state{padding:24px 16px;text-align:center;color:var(--text-muted);font-size:13px}
      `}</style>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button className={`vp${viewMode === 'season' ? ' on' : ''}`} onClick={() => setViewMode('season')}>
          <i className="ti ti-list" style={{ fontSize: 11, marginRight: 4 }} />Season
        </button>
        <button className={`vp${viewMode === 'week' ? ' on' : ''}`} onClick={() => setViewMode('week')}>
          <i className="ti ti-calendar" style={{ fontSize: 11, marginRight: 4 }} />Week {week}
        </button>
      </div>

      <div className="lg-card">
        <div style={{ fontSize: 13, fontWeight: 500, color: GREEN1, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <i className="ti ti-trophy" style={{ color: GREEN2, fontSize: 16 }} />
          League table
          <span style={{ fontSize: 10, padding: '2px 8px', background: 'var(--primary-soft)', color: GREEN1, borderRadius: 20, fontWeight: 400, marginLeft: 4 }}>
            {viewMode === 'season' ? `Season ${year}` : `Week ${week}`}
          </span>
        </div>

        {loading ? (
          <PageLoader label="Loading league" minHeight={180} />
        ) : !hasData ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '20px 0', textAlign: 'center' }}>
            <i className="ti ti-database-off" style={{ fontSize: 24, display: 'block', marginBottom: 8, color: 'var(--border-strong)' }} />
            No team stats entered yet for {viewMode === 'week' ? `week ${week}` : `season ${year}`}.<br />
            <span style={{ fontSize: 11 }}>Go to Admin panel → Team stats to add data.</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['#','Team','P','W','D','L','GF','GA','GD','Pts'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', fontWeight: 500, color: 'var(--text-muted)', fontSize: 11, textAlign: h === 'Team' ? 'left' : 'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.map((t, i) => {
                  const isOpen = selectedTeam === t.id
                  return (
                    <React.Fragment key={t.id}>
                      <tr
                        className={`clickable${t.me ? ' me-row' : ''}${isOpen ? ' open' : ''}`}
                        onClick={() => toggleTeam(t.id)}
                        style={{ borderBottom: '0.5px solid rgba(0,0,0,.05)', transition: 'background .15s' }}
                      >
                        <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                          <div className="pos-badge" style={{ background: i === 0 ? 'var(--bg-secondary)' : i === 1 ? 'var(--surface-secondary)' : 'transparent', color: i === 0 ? 'var(--warning)' : 'var(--text-muted)', margin: '0 auto' }}>
                            {i + 1}
                          </div>
                        </td>
                        <td style={{ padding: '9px 8px', fontWeight: t.me ? 500 : 400, color: GREEN1 }}>
                          {t.name}
                          {t.me && <span style={{ fontSize: 10, color: GREEN2, marginLeft: 5 }}>★ you</span>}
                          <span className={`caret${isOpen ? ' open' : ''}`}>›</span>
                        </td>
                        <td style={{ padding: '9px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t.played}</td>
                        <td style={{ padding: '9px 8px', textAlign: 'center', color: GREEN2, fontWeight: 500 }}>{t.wins}</td>
                        <td style={{ padding: '9px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>{t.draws}</td>
                        <td style={{ padding: '9px 8px', textAlign: 'center', color: 'var(--danger)' }}>{t.losses}</td>
                        <td style={{ padding: '9px 8px', textAlign: 'center' }}>{t.gf}</td>
                        <td style={{ padding: '9px 8px', textAlign: 'center' }}>{t.ga}</td>
                        <td style={{ padding: '9px 8px', textAlign: 'center', color: t.gd > 0 ? GREEN2 : t.gd < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {t.gd > 0 ? '+' : ''}{t.gd}
                        </td>
                        <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                          <span style={{ display: 'inline-block', padding: '2px 10px', background: GRADIENTGREEN, color: '#fff', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                            {t.pts}
                          </span>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr>
                          <td colSpan={10} style={{ padding: 0, background: 'transparent' }}>
                            <TeamDetail teamId={t.id} teamName={t.name} week={week} year={year} viewMode={viewMode} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ───────────────────────── Team detail (pitch + points) ───────────────────────── */

function TeamDetail({ teamId, teamName, week, year, viewMode }) {
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState([])
  const [stats, setStats] = useState([])      // weekly_stats rows for selected scope
  const [awards, setAwards] = useState([])
  const [squad, setSquad] = useState(null)    // weekly_squads doc (positions map)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getAllPlayers(),
      viewMode === 'week' ? getWeeklyStats(week, year) : getAllStats(),
      viewMode === 'week' ? getAwards(week, year) : getAllAwards(),
      getWeeklySquad(teamId, week, year).catch(() => null),
    ]).then(([pl, st, aw, sq]) => {
      if (cancelled) return
      // For season mode, filter stats by year
      const filteredStats = viewMode === 'week' ? st : st.filter(s => s.year === year)
      const filteredAwards = viewMode === 'week' ? aw : aw.filter(a => a.year === year)
      setPlayers(pl.filter(p => p.team_id === teamId))
      setStats(filteredStats)
      setAwards(filteredAwards)
      setSquad(sq)
      setLoading(false)
    }).catch(e => { console.error(e); setLoading(false) })
    return () => { cancelled = true }
  }, [teamId, week, year, viewMode])

  // Aggregate per-player stats across the loaded set
  const perPlayer = useMemo(() => {
    return players.map(p => {
      const myStats = stats.filter(s => s.player_id === p.id)
      const agg = myStats.reduce((a, s) => ({
        goals: a.goals + (s.goals || 0),
        assists: a.assists + (s.assists || 0),
        clean_sheets: a.clean_sheets + (s.clean_sheets || (s.clean_sheet ? 1 : 0) || 0),
      }), { goals: 0, assists: 0, clean_sheets: 0 })
      const myAwards = awards.filter(a => a.player_id === p.id)
      const statPts = myStats.reduce((sum, s) => sum + calcStatPoints({
        goals: s.goals || 0,
        assists: s.assists || 0,
        clean_sheet: (s.clean_sheets || 0) > 0 || s.clean_sheet,
      }), 0)
      const awardPts = calcAwardPoints(myAwards.map(a => ({ award_type: a.award_type })))
      return {
        ...p,
        stats: agg,
        points: statPts + awardPts,
        statPts, awardPts,
        scores: {
          GK: score.GK(agg), DEF: score.DEF(agg),
          MID: score.MID(agg), ST: score.ST(agg),
        },
      }
    }).sort((a, b) => b.points - a.points)
  }, [players, stats, awards])

  // Build pitch lineup: prefer saved squad positions, else auto-derive
  const lineup = useMemo(() => {
    const byId = Object.fromEntries(perPlayer.map(p => [p.id, p]))
    const out = { GK: null, DEF1: null, DEF2: null, MID: null, ST: null }
    const used = new Set()

    if (squad?.positions && typeof squad.positions === 'object') {
      // positions map: { playerId: 'GK'|'DEF'|... }  or  { slot: playerId }
      // try slot-keyed first
      for (const slot of Object.keys(out)) {
        const pid = squad.positions[slot]
        if (pid && byId[pid]) { out[slot] = byId[pid]; used.add(pid) }
      }
      // then player-keyed
      Object.entries(squad.positions).forEach(([k, v]) => {
        if (used.has(k) || used.has(v)) return
        if (byId[k] && ['GK','DEF','MID','ST'].includes(v)) {
          if (v === 'GK' && !out.GK)        { out.GK = byId[k];   used.add(k) }
          else if (v === 'DEF' && !out.DEF1){ out.DEF1 = byId[k]; used.add(k) }
          else if (v === 'DEF' && !out.DEF2){ out.DEF2 = byId[k]; used.add(k) }
          else if (v === 'MID' && !out.MID) { out.MID = byId[k];  used.add(k) }
          else if (v === 'ST' && !out.ST)   { out.ST = byId[k];   used.add(k) }
        }
      })
    }

    const pick = (posKey) => {
      const pool = perPlayer.filter(p => !used.has(p.id) && p.scores[posKey] > 1)
      if (!pool.length) return null
      const best = [...pool].sort((a, b) => b.scores[posKey] - a.scores[posKey])[0]
      used.add(best.id)
      return best
    }
    if (!out.GK)   out.GK   = pick('GK')
    if (!out.DEF1) out.DEF1 = pick('DEF')
    if (!out.DEF2) out.DEF2 = pick('DEF')
    if (!out.MID)  out.MID  = pick('MID')
    if (!out.ST)   out.ST   = pick('ST')
    return out
  }, [perPlayer, squad])

  return (
    <div className="lt-grid" style={{ padding: '10px 4px 16px' }}>
      {/* Pitch */}
      <div className="lg-card" style={{ padding: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: GREEN1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-layout-board" style={{ color: GREEN2 }} />
          {teamName} — lineup
        </div>
        {loading ? (
          <PageLoader label="Loading lineup" minHeight={140} />
        ) : !players.length ? (
          <div className="lt-empty-state">No players assigned to this team yet.</div>
        ) : (
          <div className="lt-pitch">
            <FieldSVG />
            {POSITIONS.map(slot => {
              const p = lineup[slot.slot]
              return (
                <div key={slot.slot} className="lt-slot" style={{ left: slot.x + '%', top: slot.y + '%' }}>
                  {p ? (
                    <>
                      <div className="lt-bubble" style={{ background: POS_COLOR[slot.pos] }}>
                        {p.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div className="lt-name">{p.full_name.split(' ')[0]}</div>
                      <div className="lt-pos">{slot.pos}</div>
                    </>
                  ) : (
                    <>
                      <div className="lt-empty"><i className="ti ti-minus" /></div>
                      <div className="lt-pos" style={{ color: 'rgba(255,255,255,.45)' }}>{slot.pos}</div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Points box */}
      <div className="lg-card" style={{ padding: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: GREEN1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-trophy" style={{ color: GREEN2 }} />
          Player points
          <span style={{ fontSize: 10, padding: '2px 8px', background: 'var(--primary-soft)', borderRadius: 20, fontWeight: 400, marginLeft: 'auto' }}>
            {viewMode === 'season' ? `Season ${year}` : `Week ${week}`}
          </span>
        </div>
        {loading ? (
          <PageLoader label="Loading" minHeight={120} />
        ) : !perPlayer.length ? (
          <div className="lt-empty-state">No players for this team.</div>
        ) : (
          <>
            {perPlayer.map((p, i) => (
              <div key={p.id} className="lt-points-row">
                <div className="lt-rank">{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.full_name}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1, fontFamily: 'DM Mono, monospace' }}>
                    {p.stats.goals}G · {p.stats.assists}A · {p.stats.clean_sheets}CS
                    {p.awardPts > 0 && <> · +{p.awardPts} awards</>}
                  </div>
                </div>
                <span className="lt-pts-pill">{p.points}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

function FieldSVG() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 300 400" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pitchGradLg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1f6b35" />
          <stop offset="1" stopColor="#15532a" />
        </linearGradient>
        <pattern id="stripesLg" width="300" height="40" patternUnits="userSpaceOnUse">
          <rect width="300" height="20" fill="rgba(255,255,255,.03)" />
        </pattern>
      </defs>
      <rect width="300" height="400" fill="url(#pitchGradLg)" />
      <rect width="300" height="400" fill="url(#stripesLg)" />
      <rect x="10" y="10" width="280" height="380" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" fill="none" rx="2" />
      <line x1="10" y1="200" x2="290" y2="200" stroke="rgba(255,255,255,.3)" strokeWidth="1.2" />
      <circle cx="150" cy="200" r="42" stroke="rgba(255,255,255,.28)" strokeWidth="1.2" fill="none" />
      <circle cx="150" cy="200" r="2.5" fill="rgba(255,255,255,.4)" />
      <rect x="80" y="10" width="140" height="50" stroke="rgba(255,255,255,.28)" strokeWidth="1.2" fill="none" />
      <rect x="115" y="10" width="70" height="20" stroke="rgba(255,255,255,.22)" strokeWidth="1" fill="none" />
      <rect x="80" y="340" width="140" height="50" stroke="rgba(255,255,255,.28)" strokeWidth="1.2" fill="none" />
      <rect x="115" y="370" width="70" height="20" stroke="rgba(255,255,255,.22)" strokeWidth="1" fill="none" />
      <circle cx="150" cy="45" r="1.8" fill="rgba(255,255,255,.4)" />
      <circle cx="150" cy="355" r="1.8" fill="rgba(255,255,255,.4)" />
    </svg>
  )
}
