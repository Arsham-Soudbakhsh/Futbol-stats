import React, { useContext, useEffect, useState } from 'react'
import { WeekContext } from './DashboardLayout'
import { useAuthStore } from '../store/authStore'
import { getPlayerStats, getAwards, getRatingsForPlayer } from '../lib/firebase'
import { calcStatPoints, calcAwardPoints, avgRatings, AWARD_LABELS } from '../lib/points'

const GREEN1 = 'var(--text)'
const GREEN2 = 'var(--primary)'
const GREEN3 = 'var(--primary-active)'
const GREEN4 = 'var(--primary-soft)'
const GREEN5 = 'var(--success)'

export default function HomePage() {
  const { week, year } = useContext(WeekContext)
  const { profile, isGuest } = useAuthStore()
  const [view, setView] = useState('week')
  const [stats, setStats] = useState(null)
  const [awards, setAwards] = useState([])
  const [ratings, setRatings] = useState(null)
  const [allStats, setAllStats] = useState(null)
  const [allRatings, setAllRatings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [skillWidths, setSkillWidths] = useState({ passing: 0, shooting: 0, defending: 0, dribbling: 0 })

  useEffect(() => {
    if (!profile) return
    setLoading(true)
    setSkillWidths({ passing: 0, shooting: 0, defending: 0, dribbling: 0 })
    Promise.all([
      getPlayerStats(profile.id, week, year),
      getAwards(week, year),
      getRatingsForPlayer(profile.id, week, year),
    ]).then(([st, aw, rt]) => {
      setStats(st)
      setAwards((aw || []).filter(a => a.player_id === profile.id))
      const r = avgRatings(rt || [])
      setRatings(r)
      setLoading(false)
      setTimeout(() => {
        setSkillWidths({ passing: r.passing, shooting: r.shooting, defending: r.defending, dribbling: r.dribbling })
      }, 80)
    })
  }, [week, year, profile])

  useEffect(() => {
    if (view !== 'total' || !profile) return
    const fetchAll = async () => {
      let totalGoals = 0, totalAssists = 0, totalCS = 0, totalAwardPts = 0
      let passSum = 0, shootSum = 0, defSum = 0, dribSum = 0, ratingWeeks = 0
      for (let w = 1; w <= 8; w++) {
        const [st, aw, rt] = await Promise.all([
          getPlayerStats(profile.id, w, year),
          getAwards(w, year),
          getRatingsForPlayer(profile.id, w, year),
        ])
        if (st) {
          totalGoals += st.goals || 0
          totalAssists += st.assists || 0
          totalCS += st.clean_sheet ? 1 : 0
        }
        const myAw = (aw || []).filter(a => a.player_id === profile.id)
        totalAwardPts += calcAwardPoints(myAw)
        if (rt && rt.length) {
          const r = avgRatings(rt)
          passSum += r.passing; shootSum += r.shooting
          defSum += r.defending; dribSum += r.dribbling
          ratingWeeks++
        }
      }
      setAllStats({ goals: totalGoals, assists: totalAssists, cs: totalCS, awardPts: totalAwardPts })
      if (ratingWeeks > 0) {
        setAllRatings({
          passing: Math.round(passSum / ratingWeeks),
          shooting: Math.round(shootSum / ratingWeeks),
          defending: Math.round(defSum / ratingWeeks),
          dribbling: Math.round(dribSum / ratingWeeks),
        })
      }
    }
    fetchAll()
  }, [view, year, profile])

  if (loading && !isGuest) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN2, animation: 'pulse .9s ease-in-out infinite', animationDelay: i * 0.2 + 's' }} />
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}`}</style>
    </div>
  )

  const statPts = calcStatPoints(stats)
  const awardPts = calcAwardPoints(awards)
  const totalPts = statPts + awardPts
  const avgOverall = ratings ? Math.round((ratings.passing + ratings.shooting + ratings.defending + ratings.dribbling) / 4) : 0
  const radarPts = ratings ? buildRadar([ratings.passing, ratings.shooting, ratings.defending, ratings.dribbling]) : null

  const skillList = [
    { name: 'Passing', val: skillWidths.passing, color: GREEN2 },
    { name: 'Shooting', val: skillWidths.shooting, color: GREEN3 },
    { name: 'Defending', val: skillWidths.defending, color: GREEN2 },
    { name: 'Dribbling', val: skillWidths.dribbling, color: GREEN2 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <style>{`
        @keyframes pulse{0%,100%{opacity:.2;transform:scale(.8)}50%{opacity:1;transform:scale(1.2)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .hp-fade{animation:fadeUp .22s ease both}
        .sc-hp{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;position:relative;overflow:hidden;transition:all .2s}
        .sc-hp:hover{border-color:var(--primary);transform:translateY(-2px)}
        .sc-hp.dark{background:var(--text);border-color:var(--navy)}
        .sk-fill-anim{height:100%;border-radius:3px;transition:width .7s cubic-bezier(.4,0,.2,1)}
        .vp{padding:5px 14px;border-radius:20px;font-size:11px;font-weight:500;cursor:pointer;border:1px solid var(--border);color:var(--text-secondary);background:transparent;transition:all .18s;font-family:var(--font-sans)}
        .vp.on{background:var(--text);border-color:var(--text);color:#fff}
        .aw-pill{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:20px;font-size:11px;font-weight:500;background:color-mix(in oklab, var(--accent) 14%, transparent);color:var(--warning);border:0.5px solid #e8c070}
        .tp-item{background:var(--bg-secondary);border-radius:8px;padding:10px 12px;text-align:center}
        .tp-item.dark{background:var(--navy)}
      `}</style>

      {isGuest && (
        <div style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--text)' }}>
          <i className="ti ti-eye" style={{ fontSize: 16, color: 'var(--primary)', flexShrink: 0 }} />
          <span>You're browsing as a guest. <strong>Sign in</strong> to see your personal stats, ratings, and awards.</span>
        </div>
      )}

      {isGuest ? (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
          <i className="ti ti-lock" style={{ fontSize: 32, color: 'var(--border-strong)', display: 'block', marginBottom: 12 }} />
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>Personal stats are private</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Sign in to see your goals, assists, ratings, and awards.</div>
          <a href="/auth" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: 'var(--gradient-primary)', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
            <i className="ti ti-login" style={{ fontSize: 14 }} />Sign in
          </a>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={`vp${view === 'week' ? ' on' : ''}`} onClick={() => setView('week')}>Week {week}</button>
            <button className={`vp${view === 'total' ? ' on' : ''}`} onClick={() => setView('total')}>
              <i className="ti ti-sigma" style={{ fontSize: 12, marginRight: 3 }} />Total
            </button>
          </div>

      {view === 'week' ? (
        <>
          {/* Stat cards */}
          <div className="hp-fade" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, animationDelay: '.05s' }}>
            {[
              { icon: 'ti-ball-football', label: 'Goals', val: stats?.goals ?? 0, color: GREEN2 },
              { icon: 'ti-arrow-big-right', label: 'Assists', val: stats?.assists ?? 0, color: GREEN3 },
              { icon: 'ti-shield-check', label: 'Clean sheets', val: stats?.clean_sheet ? 1 : 0, color: GREEN3},
              { icon: 'ti-award', label: 'Points', val: totalPts, dark: true },
            ].map((c, i) => (
              <div key={c.label} className={`sc-hp${c.dark ? ' dark' : ''}`}>
                {c.color && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: c.color, borderRadius: '2px 2px 0 0' }} />}
                <div style={{ fontSize: 16, marginBottom: 6, color: c.dark ? 'rgba(255,255,255,.7)' : c.color }}>
                  <i className={`ti ${c.icon}`} />
                </div>
                <div style={{ fontSize: 10, color: c.dark ? 'rgba(255,255,255,.5)' : 'var(--text-muted)', marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 500, color: c.dark ? '#fff' : 'var(--text)', lineHeight: 1 }}>{c.val}</div>
                <div style={{ fontSize: 10, color: c.dark ? 'rgba(255,255,255,.35)' : 'var(--text-muted)', marginTop: 3 }}>Week {week}</div>
              </div>
            ))}
          </div>

          {/* Overall ratings */}
          <div className="hp-fade" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', animationDelay: '.12s' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-chart-radar" style={{ color: GREEN2, fontSize: 15 }} />
              Overall ratings
              <span style={{ fontSize: 10, padding: '2px 7px', background: 'var(--primary-soft)', color: GREEN1, borderRadius: 20, fontWeight: 400, marginLeft: 4 }}>Week {week}</span>
            </div>
            {ratings && avgOverall > 0 ? (
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 130, height: 130, flexShrink: 0 }}>
                  <svg width="130" height="130" viewBox="0 0 130 130">
                    {[18,34,50].map((r,i) => (
                      <polygon key={i} points={hexPoints(65,65,r)} fill="rgba(30,138,82,.05)" stroke="rgba(30,138,82,.12)" strokeWidth="1"/>
                    ))}
                    {[[65,12],[110,38],[110,90],[65,118],[20,90],[20,38]].map(([x,y],i) => (
                      <line key={i} x1="65" y1="65" x2={x} y2={y} stroke="rgba(30,138,82,.1)" strokeWidth="1"/>
                    ))}
                    {radarPts && (
                      <>
                        <polygon points={radarPts} fill="rgba(30,138,82,.18)" stroke="var(--blue)" strokeWidth="1.5"/>
                        {radarPts.split(' ').map((pt,i) => {
                          const [x,y] = pt.split(',')
                          return <circle key={i} cx={x} cy={y} r="3" fill="var(--blue)"/>
                        })}
                      </>
                    )}
                    <text x="65" y="9" textAnchor="middle" fontSize="8" fill="#8fa396">Pass</text>
                    <text x="117" y="40" textAnchor="start" fontSize="8" fill="#8fa396">Shot</text>
                    <text x="117" y="95" textAnchor="start" fontSize="8" fill="#8fa396">Def</text>
                    <text x="65" y="128" textAnchor="middle" fontSize="8" fill="#8fa396">Drib</text>
                  </svg>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {skillList.map(s => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 60, flexShrink: 0 }}>{s.name}</span>
                      <div style={{ flex: 1, height: 5, background: 'var(--text-muted)', borderRadius: 3, overflow: 'hidden' }}>
                        <div className="sk-fill-anim" style={{ width: s.val + '%', background: s.color }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 500, color: GREEN1, minWidth: 24, textAlign: 'right' }}>{s.val}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 2, paddingTop: 8, borderTop: '0.5px solid rgba(0,0,0,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Avg overall</span>
                    <span style={{ fontSize: 15, fontWeight: 500, color: GREEN1 }}>{avgOverall}<span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/100</span></span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No ratings yet for week {week}.</div>
            )}
          </div>

          {/* Awards */}
          <div className="hp-fade" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', animationDelay: '.2s' }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-ribbon" style={{ color: GREEN2, fontSize: 15 }} />
              Awards
              <span style={{ fontSize: 10, padding: '2px 7px', background: 'var(--primary-soft)', color: GREEN1, borderRadius: 20, fontWeight: 400, marginLeft: 4 }}>Week {week}</span>
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
              {awards.length > 0
                ? awards.map(a => (
                  <span key={a.id} className="aw-pill">
                    <i className="ti ti-star" style={{ fontSize: 11 }} />
                    {AWARD_LABELS[a.award_type] || a.award_type}
                  </span>
                ))
                : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No awards this week yet.</span>
              }
            </div>
            <div style={{ display: 'flex', gap: 14, paddingTop: 8, borderTop: '0.5px solid rgba(0,0,0,.07)' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Stat pts <strong style={{ color: GREEN2 }}>{statPts}</strong></span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Award pts <strong style={{ color: GREEN2 }}>{awardPts}</strong></span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total <strong style={{ color: GREEN1 }}>{totalPts}</strong></span>
            </div>
          </div>
        </>
      ) : (
        /* Total view */
        <div className="hp-fade" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="ti ti-sigma" style={{ color: GREEN2, fontSize: 15 }} />
            Season totals
            <span style={{ fontSize: 10, padding: '2px 7px', background: 'var(--primary-soft)', color: GREEN1, borderRadius: 20, fontWeight: 400, marginLeft: 4 }}>{year}</span>
          </div>
          {allStats ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 16 }}>
                {[
                  { label: 'Goals', val: allStats.goals, icon: 'ti-ball-football', color: GREEN2 },
                  { label: 'Assists', val: allStats.assists, icon: 'ti-arrow-big-right', color: GREEN3 },
                  { label: 'Clean sheets', val: allStats.cs, icon: 'ti-shield-check', color: GREEN4 },
                  { label: 'Stat points', val: allStats.goals*10 + allStats.assists*5 + allStats.cs*10, icon: 'ti-chart-bar', color: GREEN2 },
                  { label: 'Award points', val: allStats.awardPts, icon: 'ti-award', color: 'var(--gold)' },
                  { label: 'Total points', val: allStats.goals*10 + allStats.assists*5 + allStats.cs*10 + allStats.awardPts, icon: 'ti-star', dark: true },
                ].map(item => (
                  <div key={item.label} className={`tp-item${item.dark ? ' dark' : ''}`}>
                    <div style={{ fontSize: 16, color: item.dark ? '#fff' : item.color, marginBottom: 4 }}>
                      <i className={`ti ${item.icon}`} />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 500, color: item.dark ? '#fff' : GREEN1, lineHeight: 1 }}>{item.val ?? 0}</div>
                    <div style={{ fontSize: 10, color: item.dark ? 'rgba(255,255,255,.5)' : 'var(--text-muted)', marginTop: 3 }}>{item.label}</div>
                  </div>
                ))}
              </div>
              {allRatings && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 8, letterSpacing: '.4px' }}>Avg overall ratings</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { name: 'Passing', val: allRatings.passing, color: GREEN2 },
                      { name: 'Shooting', val: allRatings.shooting, color: GREEN3 },
                      { name: 'Defending', val: allRatings.defending, color: GREEN2 },
                      { name: 'Dribbling', val: allRatings.dribbling, color: GREEN5 },
                    ].map(s => (
                      <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 60 }}>{s.name}</span>
                        <div style={{ flex: 1, height: 5, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: (s.val||0)+'%', height: '100%', background: s.color, borderRadius: 3, transition: 'width .7s cubic-bezier(.4,0,.2,1)' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 500, color: GREEN1, minWidth: 24, textAlign: 'right' }}>{s.val ?? 0}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading totals…</div>
          )}
        </div>
      )}
        </>
      )}
    </div>
  )
}

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    return `${Math.round(cx + r * Math.cos(angle))},${Math.round(cy + r * Math.sin(angle))}`
  }).join(' ')
}

function buildRadar(values) {
  const cx = 65, cy = 65, maxR = 50, n = values.length
  return values.map((v, i) => {
    const angle = (Math.PI * 2 / n) * i - Math.PI / 2
    const r = (v / 100) * maxR
    return `${Math.round(cx + r * Math.cos(angle))},${Math.round(cy + r * Math.sin(angle))}`
  }).join(' ')
}
