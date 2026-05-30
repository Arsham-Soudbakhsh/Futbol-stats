import React, { useContext, useEffect, useState } from 'react'
import { WeekContext } from './DashboardLayout'
import { useAuthStore } from '../store/authStore'
import { getAllPlayers, getWeeklySquad, upsertWeeklySquad, upsertRating } from '../lib/firebase'
import './pages.css'

const POS_CONFIG = {
  GK:  { label: 'GK',  color: '#8A9683', bg: 'rgba(138,150,131,.12)' },
  DEF: { label: 'DEF', color: 'var(--primary)', bg: 'var(--primary-soft)' },
  MID: { label: 'MID', color: 'var(--warning)', bg: 'rgba(214,162,61,.12)' },
  FWD: { label: 'FWD', color: 'var(--danger)',  bg: 'rgba(201,91,91,.12)' },
}

function PosBadge({ pos }) {
  if (!pos) return null
  const c = POS_CONFIG[pos] || {}
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 6px',
      borderRadius: 999, background: c.bg, color: c.color,
      textTransform: 'uppercase', letterSpacing: .3, flexShrink: 0,
    }}>
      {c.label}
    </span>
  )
}

export default function CaptainPage() {
  const { profile } = useAuthStore()
  const { week, year } = useContext(WeekContext)
  const [tab, setTab] = useState('squad')
  const [allPlayers, setAllPlayers] = useState([])
  const [selected, setSelected] = useState([])
  const [ratings, setRatings] = useState({})
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  if (profile?.role !== 'captain') return (
    <div className="card fade-up">
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Access denied. Captains only.</div>
    </div>
  )

  useEffect(() => {
    getAllPlayers().then(list => setAllPlayers(list.filter(p => p.id !== profile.id)))
  }, [])

  useEffect(() => {
    if (!profile.team_id) return
    getWeeklySquad(profile.team_id, week, year).then(sq => {
      if (sq?.player_ids) setSelected(sq.player_ids.filter(id => id !== profile.id))
    })
  }, [week, year])

  const togglePlayer = (id) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 4 ? [...prev, id] : prev
    )
  }

  const saveSquad = async () => {
    if (selected.length !== 4) { setMsg('Select exactly 4 players.'); return }
    setSaving(true); setMsg('')
    try {
      await upsertWeeklySquad(profile.team_id, week, year, [profile.id, ...selected])
      setMsg('ok:Squad saved!')
    } catch (e) { setMsg('err:' + e.message) }
    setSaving(false)
  }

  const handleRating = (pid, field, val) => {
    setRatings(prev => ({
      ...prev,
      [pid]: { ...(prev[pid] || { passing: 50, shooting: 50, defending: 50, dribbling: 50 }), [field]: parseInt(val) },
    }))
  }

  const saveRatings = async () => {
    setSaving(true); setMsg('')
    try {
      for (const [pid, r] of Object.entries(ratings)) {
        await upsertRating(profile.id, pid, week, year, r.passing||50, r.shooting||50, r.defending||50, r.dribbling||50)
      }
      setMsg('ok:Ratings saved!')
    } catch (e) { setMsg('err:' + e.message) }
    setSaving(false)
  }

  const isOk = msg.startsWith('ok:')
  const msgText = msg.replace(/^(ok|err):/, '')
  const fields = [['passing','Passing'],['shooting','Shooting'],['defending','Defending'],['dribbling','Dribbling']]

  return (
    <div className="page fade-up">
      <div className="card">
        <div className="card-title">
          <i className="ti ti-shield" />
          Captain panel
          <span className="badge">Week {week}</span>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {[['squad','ti-users','My squad'],['rate','ti-star','Rate players']].map(([id, icon, label]) => (
            <button key={id} className={`admin-tab${tab===id?' active':''}`}
              onClick={() => { setTab(id); setMsg('') }}>
              <i className={`ti ${icon}`} />{label}
            </button>
          ))}
        </div>

        {/* ── Squad tab ── */}
        {tab === 'squad' && (
          <>
            <p className="captain-info">
              Select 4 players for week {week}. You are automatically included as the 5th member.
            </p>

            {allPlayers.map(p => {
              const isSel = selected.includes(p.id)
              const initials = p.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)
              return (
                <div
                  key={p.id}
                  className={`captain-player-select${isSel ? ' captain-player-select--selected' : ''}`}
                  onClick={() => togglePlayer(p.id)}
                >
                  <div className="captain-player-select__avatar">{initials}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="captain-player-select__name">{p.full_name}</span>
                      <PosBadge pos={p.position} />
                    </div>
                    <div className="captain-player-select__role">{p.role}</div>
                  </div>

                  {isSel && <i className="ti ti-check captain-player-select__check" />}
                </div>
              )
            })}

            <div className="captain-count">
              Selected: <strong>{selected.length}/4</strong>
            </div>

            {msg && <div className={`admin-msg${isOk ? ' admin-msg--ok' : ' admin-msg--err'}`}>{msgText}</div>}

            <button className="btn btn-primary" onClick={saveSquad} disabled={saving}>
              <i className="ti ti-device-floppy" />
              {saving ? 'Saving…' : 'Confirm squad'}
            </button>
          </>
        )}

        {/* ── Rate tab ── */}
        {tab === 'rate' && (
          <>
            <p className="captain-info">
              Rate all players except yourself. Ratings from all 3 captains are averaged.
            </p>

            {allPlayers.map(p => {
              const r = ratings[p.id] || { passing: 50, shooting: 50, defending: 50, dribbling: 50 }
              const initials = p.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)
              return (
                <div key={p.id} className="rating-player-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--bg-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0,
                    }}>{initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="rating-player-name" style={{ marginBottom: 0 }}>{p.full_name}</span>
                        <PosBadge pos={p.position} />
                      </div>
                    </div>
                  </div>

                  {fields.map(([field, label]) => (
                    <div key={field} className="rating-row">
                      <span className="rating-label">{label}</span>
                      <input type="range" min="0" max="100" step="1" value={r[field]}
                        onChange={e => handleRating(p.id, field, e.target.value)} />
                      <span className="rating-val">{r[field]}</span>
                    </div>
                  ))}
                </div>
              )
            })}

            {msg && <div className={`admin-msg${isOk ? ' admin-msg--ok' : ' admin-msg--err'}`}>{msgText}</div>}

            <button className="btn btn-primary" onClick={saveRatings} disabled={saving}>
              <i className="ti ti-check" />
              {saving ? 'Saving…' : 'Save ratings'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
