import React, { useContext, useEffect, useState } from 'react'
import { WeekContext } from './DashboardLayout'
import { useAuthStore } from '../store/authStore'
import { getTeams, getAllTeamStatsSeason, getAllTeamWeeklyStats } from '../lib/firebase'

const GREEN1 = 'var(--text)'
const GREEN2 = 'var(--primary)'
const GRADIENTGREEN = 'var(--gradient-primary)'

export default function LeaguePage() {
  const { week, year } = useContext(WeekContext)
  const { profile } = useAuthStore()
  const [teams, setTeams] = useState([])
  const [table, setTable] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('season') // season | week

  useEffect(() => {
    getTeams().then(setTeams)
  }, [])

  useEffect(() => {
    if (!teams.length) return
    setLoading(true)
    buildTable()
  }, [teams, week, year, viewMode])

  const buildTable = async () => {
    try {
      let statsRows = []
      if (viewMode === 'season') {
        statsRows = await getAllTeamStatsSeason(year)
      } else {
        statsRows = await getAllTeamWeeklyStats(week, year)
      }

      // Aggregate per team
      const agg = {}
      teams.forEach(t => {
        agg[t.id] = { id: t.id, name: t.name, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0 }
      })

      statsRows.forEach(s => {
        if (!agg[s.team_id]) return
        agg[s.team_id].played  += s.played || 0
        agg[s.team_id].wins    += s.wins || 0
        agg[s.team_id].draws   += s.draws || 0
        agg[s.team_id].losses  += s.losses || 0
        agg[s.team_id].gf      += s.goals_for || 0
        agg[s.team_id].ga      += s.goals_against || 0
      })

      const result = Object.values(agg).map(t => ({
        ...t,
        pts: t.wins * 3 + t.draws,
        gd: t.gf - t.ga,
        me: t.id === profile?.team_id,
      })).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)

      setTable(result)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const hasData = table.some(t => t.played > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .lg-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 18px;animation:fadeUp .2s ease both}
        .vp{padding:5px 14px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--border);color:var(--text-secondary);background:transparent;transition:all .18s;font-family:var(--font-sans)}
        .vp.on{background:var(--text);border-color:var(--text);color:#fff}
        tbody tr.me-row td{color:var(--text);font-weight:500}
        tbody tr.me-row{background:#e8f7ef}
        tbody tr:hover{background:var(--primary-soft)}
        .pos-badge{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:500}
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
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading…</div>
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
                {table.map((t, i) => (
                  <tr key={t.id} className={t.me ? 'me-row' : ''} style={{ borderBottom: '0.5px solid rgba(0,0,0,.05)', transition: 'background .15s' }}>
                    <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                      <div className="pos-badge" style={{ background: i === 0 ? 'var(--bg-secondary)' : i === 1 ? 'var(--surface-secondary)' : 'transparent', color: i === 0 ? 'var(--warning)' : 'var(--text-muted)', margin: '0 auto' }}>
                        {i + 1}
                      </div>
                    </td>
                    <td style={{ padding: '9px 8px', fontWeight: t.me ? 500 : 400, color: GREEN1 }}>
                      {t.name}
                      {t.me && <span style={{ fontSize: 10, color: GREEN2, marginLeft: 5 }}>★ you</span>}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
