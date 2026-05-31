import React, { useContext, useEffect, useState, useMemo } from 'react'
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

const RATING_FIELDS = [
  { key: 'passing',   label: 'Passing',   icon: 'ti-arrows-right-left', color: 'var(--primary)' },
  { key: 'shooting',  label: 'Shooting',  icon: 'ti-target-arrow',      color: 'var(--danger)' },
  { key: 'defending', label: 'Defending', icon: 'ti-shield',            color: '#3b82f6' },
  { key: 'dribbling', label: 'Dribbling', icon: 'ti-run',               color: 'var(--warning)' },
]

function PosBadge({ pos }) {
  if (!pos) return null
  const c = POS_CONFIG[pos] || {}
  return (
    <span className="cp-pos-badge" style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function ratingTone(v) {
  if (v >= 75) return 'var(--primary)'
  if (v >= 55) return 'var(--warning)'
  if (v >= 35) return '#e89856'
  return 'var(--danger)'
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
  const [search, setSearch] = useState('')
  const [posFilter, setPosFilter] = useState('ALL')

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
    if (selected.length !== 4) { setMsg('err:Select exactly 4 players.'); return }
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

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allPlayers.filter(p => {
      if (posFilter !== 'ALL' && p.position !== posFilter) return false
      if (q && !p.full_name.toLowerCase().includes(q)) return false
      return true
    })
  }, [allPlayers, search, posFilter])

  const ratedCount = useMemo(() => Object.keys(ratings).length, [ratings])

  const selectedPlayers = selected.map(id => allPlayers.find(p => p.id === id)).filter(Boolean)

  return (
    <div className="page fade-up cp-page">
      <div className="card cp-hero">
        <div className="cp-hero__row">
          <div className="cp-hero__icon"><i className="ti ti-shield-star" /></div>
          <div className="cp-hero__text">
            <div className="cp-hero__title">Captain panel</div>
            <div className="cp-hero__sub">Week {week} · {year}</div>
          </div>
          <span className="cp-hero__pill">
            <i className="ti ti-crown" />
            Captain
          </span>
        </div>

        <div className="cp-tabs">
          {[
            { id: 'squad', icon: 'ti-users-group', label: 'Choose squad', count: `${selected.length}/4` },
            { id: 'rate',  icon: 'ti-star-filled', label: 'Rate players', count: ratedCount || null },
          ].map(t => (
            <button key={t.id}
              className={`cp-tab${tab === t.id ? ' cp-tab--active' : ''}`}
              onClick={() => { setTab(t.id); setMsg('') }}>
              <i className={`ti ${t.icon}`} />
              <span>{t.label}</span>
              {t.count != null && <span className="cp-tab__count">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Squad tab ── */}
      {tab === 'squad' && (
        <>
          <div className="card cp-squad-summary">
            <div className="cp-summary__head">
              <div>
                <div className="cp-summary__title">Your weekly squad</div>
                <div className="cp-summary__sub">Pick 4 teammates · you join as the 5th</div>
              </div>
              <div className="cp-summary__counter">
                <span className="cp-summary__num">{selected.length}</span>
                <span className="cp-summary__den">/ 4</span>
              </div>
            </div>

            <div className="cp-slots">
              {[0,1,2,3].map(i => {
                const p = selectedPlayers[i]
                return (
                  <div key={i} className={`cp-slot${p ? ' cp-slot--filled' : ''}`}
                       onClick={() => p && togglePlayer(p.id)}>
                    {p ? (
                      <>
                        <div className="cp-slot__avatar">{getInitials(p.full_name)}</div>
                        <div className="cp-slot__name">{p.full_name.split(' ')[0]}</div>
                        <PosBadge pos={p.position} />
                        <i className="ti ti-x cp-slot__remove" />
                      </>
                    ) : (
                      <>
                        <i className="ti ti-plus cp-slot__plus" />
                        <div className="cp-slot__empty">Slot {i + 1}</div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card">
            <div className="cp-toolbar">
              <div className="cp-search">
                <i className="ti ti-search" />
                <input
                  type="text"
                  placeholder="Search players…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="cp-pos-tabs">
                {['ALL','GK','DEF','MID','FWD'].map(p => (
                  <button key={p}
                    className={`cp-pos-tab${posFilter === p ? ' cp-pos-tab--active' : ''}`}
                    onClick={() => setPosFilter(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="cp-player-grid">
              {filteredPlayers.map(p => {
                const isSel = selected.includes(p.id)
                const disabled = !isSel && selected.length >= 4
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`cp-player-card${isSel ? ' cp-player-card--selected' : ''}${disabled ? ' cp-player-card--disabled' : ''}`}
                    onClick={() => !disabled && togglePlayer(p.id)}
                  >
                    <div className="cp-player-card__avatar">{getInitials(p.full_name)}</div>
                    <div className="cp-player-card__body">
                      <div className="cp-player-card__name">{p.full_name}</div>
                      <div className="cp-player-card__meta">
                        <PosBadge pos={p.position} />
                        <span className="cp-player-card__role">{p.role}</span>
                      </div>
                    </div>
                    <div className="cp-player-card__check">
                      {isSel ? <i className="ti ti-check" /> : <i className="ti ti-plus" />}
                    </div>
                  </button>
                )
              })}
              {!filteredPlayers.length && (
                <div className="cp-empty">No players match.</div>
              )}
            </div>

            {msg && <div className={`admin-msg${isOk ? ' admin-msg--ok' : ' admin-msg--err'}`}>{msgText}</div>}

            <div className="cp-action-bar">
              <div className="cp-action-bar__status">
                <i className={`ti ${selected.length === 4 ? 'ti-circle-check-filled' : 'ti-info-circle'}`}
                   style={{ color: selected.length === 4 ? 'var(--success)' : 'var(--text-muted)' }} />
                {selected.length === 4 ? 'Ready to confirm' : `Pick ${4 - selected.length} more`}
              </div>
              <button className="btn btn-primary" onClick={saveSquad}
                disabled={saving || selected.length !== 4}>
                <i className="ti ti-device-floppy" />
                {saving ? 'Saving…' : 'Confirm squad'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Rate tab ── */}
      {tab === 'rate' && (
        <>
          <div className="card cp-rate-intro">
            <div className="cp-rate-intro__icon"><i className="ti ti-star-filled" /></div>
            <div className="cp-rate-intro__body">
              <div className="cp-rate-intro__title">Rate your teammates</div>
              <div className="cp-rate-intro__sub">
                Score Passing, Shooting, Defending and Dribbling from 0–100.
                Ratings from all 3 captains are averaged.
              </div>
            </div>
            <div className="cp-rate-intro__count">
              <span>{ratedCount}</span>
              <small>/ {allPlayers.length}</small>
            </div>
          </div>

          <div className="cp-toolbar cp-toolbar--standalone">
            <div className="cp-search">
              <i className="ti ti-search" />
              <input
                type="text"
                placeholder="Search players…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="cp-pos-tabs">
              {['ALL','GK','DEF','MID','FWD'].map(p => (
                <button key={p}
                  className={`cp-pos-tab${posFilter === p ? ' cp-pos-tab--active' : ''}`}
                  onClick={() => setPosFilter(p)}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="cp-rate-list">
            {filteredPlayers.map(p => {
              const r = ratings[p.id] || { passing: 50, shooting: 50, defending: 50, dribbling: 50 }
              const avg = Math.round((r.passing + r.shooting + r.defending + r.dribbling) / 4)
              const touched = ratings[p.id] != null
              return (
                <div key={p.id} className={`cp-rate-card${touched ? ' cp-rate-card--touched' : ''}`}>
                  <div className="cp-rate-card__head">
                    <div className="cp-rate-card__avatar">{getInitials(p.full_name)}</div>
                    <div className="cp-rate-card__id">
                      <div className="cp-rate-card__name">
                        {p.full_name}
                        <PosBadge pos={p.position} />
                      </div>
                      <div className="cp-rate-card__role">{p.role || 'player'}</div>
                    </div>
                    <div className="cp-rate-card__avg" style={{
                      background: `conic-gradient(${ratingTone(avg)} ${avg * 3.6}deg, var(--bg-secondary) 0deg)`
                    }}>
                      <div className="cp-rate-card__avg-inner">
                        <span className="cp-rate-card__avg-num">{avg}</span>
                        <span className="cp-rate-card__avg-label">OVR</span>
                      </div>
                    </div>
                  </div>

                  <div className="cp-rate-grid">
                    {RATING_FIELDS.map(f => {
                      const v = r[f.key]
                      const tone = ratingTone(v)
                      return (
                        <div key={f.key} className="cp-rate-stat">
                          <div className="cp-rate-stat__head">
                            <i className={`ti ${f.icon}`} style={{ color: f.color }} />
                            <span className="cp-rate-stat__label">{f.label}</span>
                            <span className="cp-rate-stat__val" style={{ color: tone }}>{v}</span>
                          </div>
                          <div className="cp-rate-stat__slider">
                            <div className="cp-rate-stat__track">
                              <div className="cp-rate-stat__fill"
                                   style={{ width: `${v}%`, background: tone }} />
                            </div>
                            <input
                              type="range" min="0" max="100" step="1"
                              value={v}
                              onChange={e => handleRating(p.id, f.key, e.target.value)}
                              style={{ '--thumb-color': tone }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {!filteredPlayers.length && (
              <div className="cp-empty">No players match.</div>
            )}
          </div>

          {msg && <div className={`admin-msg${isOk ? ' admin-msg--ok' : ' admin-msg--err'}`}>{msgText}</div>}

          <div className="cp-action-bar cp-action-bar--sticky">
            <div className="cp-action-bar__status">
              <i className="ti ti-checks" style={{ color: 'var(--primary)' }} />
              {ratedCount} of {allPlayers.length} rated
            </div>
            <button className="btn btn-primary" onClick={saveRatings} disabled={saving || ratedCount === 0}>
              <i className="ti ti-check" />
              {saving ? 'Saving…' : 'Save ratings'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
