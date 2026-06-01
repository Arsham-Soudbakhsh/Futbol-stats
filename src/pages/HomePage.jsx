import React, { useContext, useEffect, useMemo, useState } from 'react'
import Loader, { SkeletonStatsGrid } from './Loader'
import { WeekContext } from './DashboardLayout'
import { useAuthStore } from '../store/authStore'
import { getPlayerStats, getAwards, getRatingsForPlayer } from '../lib/firebase'
import { calcStatPoints, calcAwardPoints, avgRatings, AWARD_LABELS } from '../lib/points'

/* ===========================================================
   HomePage — Premium Redesign
   - Hero with radial overall gauge
   - KPI tiles with accent bars
   - Hex radar + animated skill bars
   - Points breakdown stacked bar
   - Awards as gold pills
   - Season view: 8-week area trend + totals + ratings
   Fully responsive (1 / 2 / 4 col grid).
   =========================================================== */

const C = {
  ink:    'var(--text)',
  sub:    'var(--text-secondary)',
  muted:  'var(--text-muted)',
  brand:  'var(--primary)',
  brand2: 'var(--primary-active)',
  soft:   'var(--primary-soft)',
  gold:   'var(--warning)',
  danger: 'var(--danger)',
  surf:   'var(--surface)',
  surf2:  'var(--surface-secondary)',
  bg2:    'var(--bg-secondary)',
  border: 'var(--border)',
  borderStrong: 'var(--border-strong)',
}

const WEEKS = Array.from({ length: 8 }, (_, i) => i + 1)

export default function HomePage() {
  const { week, year } = useContext(WeekContext)
  const { profile, isGuest } = useAuthStore()
  const [view, setView] = useState('week')
  const [stats, setStats] = useState(null)
  const [awards, setAwards] = useState([])
  const [ratings, setRatings] = useState(null)
  const [season, setSeason] = useState(null)        // {totals, ratings, trend:[{w,pts,goals,assists,cs}]}
  const [loading, setLoading] = useState(true)
  const [skillFill, setSkillFill] = useState({ passing: 0, shooting: 0, defending: 0, dribbling: 0 })

  /* ── Week load ── */
  useEffect(() => {
    if (!profile) return
    setLoading(true)
    setSkillFill({ passing: 0, shooting: 0, defending: 0, dribbling: 0 })
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
      requestAnimationFrame(() => setTimeout(() =>
        setSkillFill({ passing: r.passing, shooting: r.shooting, defending: r.defending, dribbling: r.dribbling }), 60))
    })
  }, [week, year, profile])

  /* ── Season load (also used for trend in week-view chart) ── */
  useEffect(() => {
    if (!profile) return
    let cancelled = false
    ;(async () => {
      const trend = []
      let tG=0,tA=0,tC=0,tAw=0
      let pS=0,sS=0,dS=0,drS=0,rW=0
      for (const w of WEEKS) {
        const [st, aw, rt] = await Promise.all([
          getPlayerStats(profile.id, w, year),
          getAwards(w, year),
          getRatingsForPlayer(profile.id, w, year),
        ])
        const g = st?.goals || 0
        const a = st?.assists || 0
        const cs = st?.clean_sheet ? 1 : 0
        const myAw = (aw || []).filter(x => x.player_id === profile.id)
        const ap = calcAwardPoints(myAw)
        const sp = calcStatPoints(st)
        tG+=g; tA+=a; tC+=cs; tAw+=ap
        if (rt && rt.length) {
          const rr = avgRatings(rt)
          pS+=rr.passing; sS+=rr.shooting; dS+=rr.defending; drS+=rr.dribbling; rW++
        }
        trend.push({ w, pts: sp + ap, goals: g, assists: a, cs })
      }
      if (cancelled) return
      setSeason({
        totals: { goals: tG, assists: tA, cs: tC, awardPts: tAw,
                  statPts: tG*10 + tA*5 + tC*10,
                  totalPts: tG*10 + tA*5 + tC*10 + tAw },
        ratings: rW ? {
          passing:  Math.round(pS/rW),
          shooting: Math.round(sS/rW),
          defending:Math.round(dS/rW),
          dribbling:Math.round(drS/rW),
        } : null,
        trend,
      })
    })()
    return () => { cancelled = true }
  }, [year, profile])

  /* ── Derived ── */
  const statPts  = calcStatPoints(stats)
  const awardPts = calcAwardPoints(awards)
  const totalPts = statPts + awardPts
  const avgOverall = ratings
    ? Math.round((ratings.passing + ratings.shooting + ratings.defending + ratings.dribbling) / 4)
    : 0

  /* ── Guest / loading ── */
  if (isGuest) return <GuestView />
  if (loading) return <Loader label="Loading your week" />

  return (
    <div className="hp">
      <HPStyles />

      {/* Header / view switch */}
      <header className="hp-head">
        <div>
          <div className="hp-greet">{greeting()},</div>
          <h1 className="hp-name">{profile?.name || 'Player'}</h1>
        </div>
        <div className="hp-seg" role="tablist">
          <button className={`hp-seg__btn${view==='week'?' on':''}`} onClick={()=>setView('week')}>
            <i className="ti ti-calendar-week"/> Week {week}
          </button>
          <button className={`hp-seg__btn${view==='total'?' on':''}`} onClick={()=>setView('total')}>
            <i className="ti ti-sigma"/> Season
          </button>
        </div>
      </header>

      {view === 'week' ? (
        <>
          {/* HERO — Overall gauge + KPI tiles */}
          <section className="hp-hero card">
            <div className="hp-hero__gauge">
              <Gauge value={avgOverall} label="Overall" />
              <div className="hp-hero__chips">
                <span className="chip chip--gold"><i className="ti ti-trophy"/> {totalPts} pts</span>
                <span className="chip"><i className="ti ti-ribbon"/> {awards.length} award{awards.length===1?'':'s'}</span>
              </div>
            </div>
            <div className="hp-kpis">
              <KPI icon="ti-ball-football" label="Goals"        val={stats?.goals ?? 0}        accent={C.brand}/>
              <KPI icon="ti-arrow-big-right" label="Assists"   val={stats?.assists ?? 0}      accent={C.brand2}/>
              <KPI icon="ti-shield-check"  label="Clean sheet" val={stats?.clean_sheet?1:0}   accent={C.gold}/>
              <KPI icon="ti-award"         label="Points"      val={totalPts} dark/>
            </div>
          </section>

          {/* GRID — Radar + Points breakdown */}
          <section className="hp-grid">
            <div className="card hp-rad">
              <CardTitle icon="ti-chart-radar" title="Performance radar" badge={`Week ${week}`} />
              {ratings && avgOverall > 0 ? (
                <div className="rad-wrap">
                  <Radar values={ratings} size={180} />
                  <div className="rad-skills">
                    {[
                      { k:'passing',   name:'Passing',   color:C.brand  },
                      { k:'shooting',  name:'Shooting',  color:C.brand2 },
                      { k:'defending', name:'Defending', color:C.gold   },
                      { k:'dribbling', name:'Dribbling', color:C.brand  },
                    ].map(s => (
                      <div key={s.k} className="sk">
                        <span className="sk__name">{s.name}</span>
                        <div className="sk__track">
                          <div className="sk__fill" style={{ width: `${skillFill[s.k]}%`, background: s.color }}/>
                        </div>
                        <span className="sk__val">{ratings[s.k]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : <Empty icon="ti-mood-empty" text={`No ratings yet for week ${week}.`} />}
            </div>

            <div className="card hp-pts">
              <CardTitle icon="ti-chart-pie" title="Points breakdown" badge={`Week ${week}`} />
              <PointsBreakdown
                items={[
                  { label:'Goals',    val: (stats?.goals||0)*10,        color:C.brand  },
                  { label:'Assists',  val: (stats?.assists||0)*5,       color:C.brand2 },
                  { label:'Clean sh.',val: (stats?.clean_sheet?20:0),   color:'#7CC4A1' },
                  { label:'Awards',   val: awardPts,                    color:C.gold   },
                ]}
                total={totalPts}
              />

              <div className="hp-awards">
                <div className="hp-awards__title">Awards</div>
                {awards.length ? (
                  <div className="hp-awards__list">
                    {awards.map(a => (
                      <span key={a.id} className="aw">
                        <i className="ti ti-star-filled"/>{AWARD_LABELS[a.award_type] || a.award_type}
                      </span>
                    ))}
                  </div>
                ) : <div className="hp-awards__empty">No awards this week.</div>}
              </div>
            </div>
          </section>

          {/* Season trend (mini, for context) */}
          {season?.trend && (
            <section className="card">
              <CardTitle icon="ti-trending-up" title="Points trend" badge={`${year} · 8 weeks`} />
              <TrendChart data={season.trend} highlightWeek={week} />
            </section>
          )}
        </>
      ) : (
        /* ───────── SEASON VIEW ───────── */
        <>
          {season ? (
            <>
              <section className="card">
                <CardTitle icon="ti-sigma" title="Season totals" badge={String(year)} />
                <div className="hp-totals">
                  <TotalTile icon="ti-ball-football" label="Goals"        val={season.totals.goals}    accent={C.brand}/>
                  <TotalTile icon="ti-arrow-big-right" label="Assists"   val={season.totals.assists}  accent={C.brand2}/>
                  <TotalTile icon="ti-shield-check"  label="Clean sheets" val={season.totals.cs}      accent={C.gold}/>
                  <TotalTile icon="ti-chart-bar"     label="Stat pts"     val={season.totals.statPts}/>
                  <TotalTile icon="ti-award"         label="Award pts"    val={season.totals.awardPts} accent={C.gold}/>
                  <TotalTile icon="ti-star"          label="Total pts"    val={season.totals.totalPts} dark/>
                </div>
              </section>

              <section className="card">
                <CardTitle icon="ti-trending-up" title="Weekly points" badge={`${year}`} />
                <TrendChart data={season.trend} />
              </section>

              {season.ratings && (
                <section className="card hp-grid hp-grid--season">
                  <div>
                    <CardTitle icon="ti-chart-radar" title="Average ratings" badge="Season" />
                    <div className="rad-wrap">
                      <Radar values={season.ratings} size={180} />
                      <div className="rad-skills">
                        {[
                          { k:'passing',  name:'Passing',  color:C.brand  },
                          { k:'shooting', name:'Shooting', color:C.brand2 },
                          { k:'defending',name:'Defending',color:C.gold   },
                          { k:'dribbling',name:'Dribbling',color:C.brand  },
                        ].map(s => (
                          <div key={s.k} className="sk">
                            <span className="sk__name">{s.name}</span>
                            <div className="sk__track">
                              <div className="sk__fill" style={{ width: `${season.ratings[s.k]}%`, background: s.color }}/>
                            </div>
                            <span className="sk__val">{season.ratings[s.k]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </>
          ) : <Loader />}
        </>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────
   Components
   ──────────────────────────────────────────────── */

function CardTitle({ icon, title, badge }) {
  return (
    <div className="card-title">
      <i className={`ti ${icon}`}/> <span>{title}</span>
      {badge && <span className="card-title__badge">{badge}</span>}
    </div>
  )
}

function KPI({ icon, label, val, accent, dark }) {
  return (
    <div className={`kpi${dark ? ' kpi--dark' : ''}`}>
      <div className="kpi__bar" style={{ background: dark ? 'rgba(255,255,255,.4)' : (accent || C.brand) }}/>
      <i className={`ti ${icon} kpi__icon`} style={{ color: dark ? 'rgba(255,255,255,.7)' : (accent || C.brand) }}/>
      <div className="kpi__label">{label}</div>
      <div className="kpi__val">{val}</div>
    </div>
  )
}

function TotalTile({ icon, label, val, accent, dark }) {
  return (
    <div className={`tt${dark ? ' tt--dark' : ''}`}>
      <i className={`ti ${icon} tt__icon`} style={{ color: dark ? '#fff' : (accent || C.brand) }}/>
      <div className="tt__val">{val ?? 0}</div>
      <div className="tt__label">{label}</div>
    </div>
  )
}

function Gauge({ value, label }) {
  const v = Math.max(0, Math.min(100, value || 0))
  const size = 148, stroke = 12, r = (size - stroke) / 2
  const C2 = 2 * Math.PI * r
  const off = C2 - (v / 100) * C2
  const tier = v >= 80 ? 'elite' : v >= 65 ? 'good' : v >= 50 ? 'avg' : 'low'
  const color = tier === 'elite' ? C.gold : tier === 'good' ? C.brand2 : tier === 'avg' ? C.brand : 'var(--text-muted)'
  return (
    <div className="gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.brand}/>
            <stop offset="100%" stopColor={color}/>
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-secondary)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#gg)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={C2} strokeDashoffset={off}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition:'stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)' }}/>
      </svg>
      <div className="gauge__inner">
        <div className="gauge__val">{v}</div>
        <div className="gauge__label">{label}</div>
      </div>
    </div>
  )
}

function Radar({ values, size = 180 }) {
  const cx = size/2, cy = size/2, maxR = size/2 - 22
  const keys = ['passing','shooting','defending','dribbling']
  const labels = ['PAS','SHO','DEF','DRI']
  const pt = (i, r) => {
    const a = (Math.PI*2/keys.length)*i - Math.PI/2
    return [cx + r*Math.cos(a), cy + r*Math.sin(a)]
  }
  const ringPts = (r) => keys.map((_,i)=>pt(i,r).join(',')).join(' ')
  const dataPts = keys.map((k,i)=>pt(i, (Math.max(0,Math.min(100,values[k]||0))/100)*maxR).join(',')).join(' ')
  return (
    <svg width={size} height={size} className="radar-svg">
      <defs>
        <radialGradient id="radFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.brand} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={C.brand} stopOpacity="0.08"/>
        </radialGradient>
      </defs>
      {[0.33, 0.66, 1].map((k,i) => (
        <polygon key={i} points={ringPts(maxR*k)} fill="none" stroke="var(--border)" strokeWidth="1"/>
      ))}
      {keys.map((_,i) => {
        const [x,y] = pt(i, maxR)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1"/>
      })}
      <polygon points={dataPts} fill="url(#radFill)" stroke={C.brand} strokeWidth="2"
        style={{ transition:'all .6s ease' }}/>
      {keys.map((k,i) => {
        const [x,y] = pt(i, (Math.max(0,Math.min(100,values[k]||0))/100)*maxR)
        return <circle key={k} cx={x} cy={y} r="3.5" fill="#fff" stroke={C.brand} strokeWidth="2"/>
      })}
      {labels.map((lb,i) => {
        const [x,y] = pt(i, maxR + 12)
        return <text key={lb} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fontWeight="700" fill="var(--text-muted)">{lb}</text>
      })}
    </svg>
  )
}

function PointsBreakdown({ items, total }) {
  const sum = items.reduce((s,i)=>s+i.val,0) || 1
  return (
    <div className="pb">
      <div className="pb__bar">
        {items.map((it,i) => (
          <div key={i} title={`${it.label}: ${it.val}`}
            className="pb__seg"
            style={{ width: `${(it.val/sum)*100}%`, background: it.color }}/>
        ))}
      </div>
      <div className="pb__legend">
        {items.map(it => (
          <div key={it.label} className="pb__item">
            <span className="pb__dot" style={{ background: it.color }}/>
            <span className="pb__lbl">{it.label}</span>
            <span className="pb__val">{it.val}</span>
          </div>
        ))}
      </div>
      <div className="pb__total">
        <span>Total points</span><strong>{total}</strong>
      </div>
    </div>
  )
}

function TrendChart({ data, highlightWeek }) {
  const W = 560, H = 160, pad = { l: 28, r: 12, t: 16, b: 24 }
  const innerW = W - pad.l - pad.r
  const innerH = H - pad.t - pad.b
  const max = Math.max(10, ...data.map(d=>d.pts))
  const x = (i) => pad.l + (innerW/(data.length-1 || 1))*i
  const y = (v) => pad.t + innerH - (v/max)*innerH
  const line = data.map((d,i)=>`${i===0?'M':'L'}${x(i)},${y(d.pts)}`).join(' ')
  const area = `${line} L${x(data.length-1)},${pad.t+innerH} L${x(0)},${pad.t+innerH} Z`
  const grid = [0.25,0.5,0.75,1].map(k => pad.t + innerH - innerH*k)
  return (
    <div className="trend-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="trend-svg">
        <defs>
          <linearGradient id="tArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.brand} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={C.brand} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {grid.map((gy,i) => (
          <line key={i} x1={pad.l} x2={W-pad.r} y1={gy} y2={gy} stroke="var(--border)" strokeDasharray="3 4"/>
        ))}
        <path d={area} fill="url(#tArea)"/>
        <path d={line} fill="none" stroke={C.brand} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"/>
        {data.map((d,i) => {
          const cx = x(i), cy = y(d.pts)
          const hot = highlightWeek === d.w
          return (
            <g key={d.w}>
              <circle cx={cx} cy={cy} r={hot ? 5.5 : 3.5} fill="#fff"
                stroke={hot ? C.gold : C.brand} strokeWidth={hot ? 3 : 2}/>
              <text x={cx} y={H-6} textAnchor="middle" fontSize="10" fill="var(--text-muted)" fontWeight="600">W{d.w}</text>
              {d.pts > 0 && (
                <text x={cx} y={cy-9} textAnchor="middle" fontSize="9" fontWeight="700" fill={C.ink}>{d.pts}</text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function Empty({ icon, text }) {
  return (
    <div className="hp-empty">
      <i className={`ti ${icon}`}/>
      <div>{text}</div>
    </div>
  )
}

// function Loader() {
//   return (
//     <div className="hp-loader">
//       {[0,1,2].map(i => <span key={i} style={{ animationDelay: `${i*0.18}s` }}/>)}
//       <HPStyles />
//     </div>
//   )
// }

function GuestView() {
  return (
    <div className="hp">
      <HPStyles />
      <div className="guest-banner">
        <i className="ti ti-eye"/>
        <span>You're browsing as a guest. <strong>Sign in</strong> to see your personal dashboard.</span>
      </div>
      <div className="guest-locked">
        <i className="ti ti-lock guest-locked__icon"/>
        <div className="guest-locked__title">Your dashboard is private</div>
        <div className="guest-locked__sub">Sign in to view goals, assists, ratings, and awards.</div>
        <a href="/auth" className="guest-cta"><i className="ti ti-login"/> Sign in</a>
      </div>
    </div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 5)  return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/* ────────────────────────────────────────────────
   Scoped styles
   ──────────────────────────────────────────────── */
function HPStyles() {
  return (
    <style>{`
      .hp { display:flex; flex-direction:column; gap:14px; animation: hpUp .35s ease both; }
      @keyframes hpUp { from{ opacity:0; transform:translateY(6px);} to{opacity:1;transform:none;} }
      @keyframes hpPulse { 0%,100%{ opacity:.25; transform:scale(.7);} 50%{opacity:1;transform:scale(1.15);} }

      .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 16px;
        box-shadow: var(--shadow-sm);
      }

      /* Header */
      .hp-head { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; flex-wrap:wrap; }
      .hp-greet { font-size:12px; color: var(--text-muted); letter-spacing:.4px; }
      .hp-name { font-family:'Inter Tight','Inter',sans-serif; font-size:26px; font-weight:700; color:var(--text); letter-spacing:-.6px; margin:2px 0 0; line-height:1.1; }

      .hp-seg { display:inline-flex; background: var(--bg-secondary); border:1px solid var(--border); border-radius:999px; padding:3px; gap:2px; }
      .hp-seg__btn {
        appearance:none; border:0; background:transparent; cursor:pointer;
        display:inline-flex; align-items:center; gap:6px;
        padding: 7px 14px; border-radius: 999px;
        font: 600 12px 'Inter',sans-serif; color: var(--text-muted);
        transition: all .18s ease;
      }
      .hp-seg__btn:hover { color: var(--text); }
      .hp-seg__btn.on { background: var(--gradient-primary); color: var(--text); box-shadow: var(--shadow-sm); }
      .hp-seg__btn i { font-size: 14px; }

      /* Hero */
      .hp-hero {
        display:grid;
        grid-template-columns: minmax(220px, 280px) 1fr;
        gap: 18px;
        align-items:center;
        background: linear-gradient(135deg, var(--surface) 0%, var(--surface-secondary) 100%);
        position:relative; overflow:hidden;
      }
      .hp-hero::before {
        content:''; position:absolute; inset:auto -40px -60px auto; width:240px; height:240px;
        background: radial-gradient(circle, var(--primary-glow), transparent 70%);
        pointer-events:none;
      }
      .hp-hero__gauge { display:flex; flex-direction:column; align-items:center; gap:12px; }
      .hp-hero__chips { display:flex; gap:6px; flex-wrap:wrap; justify-content:center; }

      .chip {
        display:inline-flex; align-items:center; gap:5px;
        padding: 5px 11px; border-radius: 999px;
        font: 600 11px 'Inter',sans-serif;
        background: var(--bg-secondary); color: var(--text-secondary); border:1px solid var(--border);
      }
      .chip i { font-size: 12px; }
      .chip--gold { background: color-mix(in oklab, var(--warning) 14%, transparent); color: var(--warning); border-color: color-mix(in oklab, var(--warning) 30%, transparent); }

      /* Gauge */
      .gauge { position:relative; }
      .gauge__inner { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
      .gauge__val { font-family:'Inter Tight',sans-serif; font-size:38px; font-weight:800; color:var(--text); letter-spacing:-1.5px; line-height:1; font-feature-settings:'tnum'; }
      .gauge__label { font-size:10px; font-weight:700; color:var(--text-muted); letter-spacing:1.2px; text-transform:uppercase; margin-top:4px; }

      /* KPIs */
      .hp-kpis { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:10px; }
      .kpi {
        position:relative; overflow:hidden;
        background: var(--surface); border:1px solid var(--border);
        border-radius: 14px; padding: 14px 12px;
        transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
      }
      .kpi:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--border-strong); }
      .kpi--dark { background: var(--gradient-primary); border-color: var(--text); color:#fff; }
      .kpi__bar { position:absolute; top:0; left:0; right:0; height:3px; }
      .kpi__icon { font-size: 18px; display:block; margin-bottom:6px; }
      .kpi__label { font-size:10px; font-weight:700; letter-spacing:.5px; text-transform:uppercase; color: var(--text-muted); }
      .kpi--dark .kpi__label { color: rgba(255,255,255,.55); }
      .kpi__val { font-family:'Inter Tight',sans-serif; font-size:28px; font-weight:800; color:var(--text); letter-spacing:-1.2px; line-height:1.05; margin-top:4px; font-feature-settings:'tnum'; }
      .kpi--dark .kpi__val { color:#fff; }

      /* Grid (radar + breakdown) */
      .hp-grid { display:grid; grid-template-columns: 1.1fr .9fr; gap:14px; }
      .hp-grid--season { grid-template-columns: 1fr; }

      .card-title {
        display:flex; align-items:center; gap:8px;
        font: 700 13px 'Inter',sans-serif; color: var(--text);
        margin-bottom: 14px;
      }
      .card-title i { color: var(--primary); font-size: 16px; }
      .card-title__badge {
        margin-left:auto;
        font-size:10px; font-weight:600; padding:3px 9px; border-radius:999px;
        background: var(--primary-soft); color: var(--primary);
      }

      /* Radar */
      .rad-wrap { display:flex; gap:16px; align-items:center; }
      .radar-svg { flex-shrink:0; }
      .rad-skills { flex:1; display:flex; flex-direction:column; gap:10px; min-width:0; }
      .sk { display:flex; align-items:center; gap:10px; }
      .sk__name { font-size:11px; font-weight:600; color: var(--text-muted); width:64px; flex-shrink:0; letter-spacing:.2px; }
      .sk__track { flex:1; height:6px; background: var(--bg-secondary); border-radius:999px; overflow:hidden; min-width:0; }
      .sk__fill { height:100%; border-radius:999px; transition: width .8s cubic-bezier(.4,0,.2,1); }
      .sk__val { font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:700; color:var(--text); min-width:26px; text-align:right; }

      /* Points breakdown */
      .pb { display:flex; flex-direction:column; gap:12px; }
      .pb__bar { display:flex; height:12px; border-radius:999px; overflow:hidden; background: var(--bg-secondary); }
      .pb__seg { transition: width .8s cubic-bezier(.4,0,.2,1); }
      .pb__legend { display:grid; grid-template-columns: 1fr 1fr; gap:8px 14px; }
      .pb__item { display:flex; align-items:center; gap:8px; font-size:12px; }
      .pb__dot { width:9px; height:9px; border-radius:3px; flex-shrink:0; }
      .pb__lbl { color: var(--text-secondary); flex:1; }
      .pb__val { font-family:'JetBrains Mono',monospace; font-weight:700; color:var(--text); }
      .pb__total { display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px solid var(--border); font-size:12px; color: var(--text-muted); }
      .pb__total strong { font-family:'Inter Tight',sans-serif; font-size:18px; color: var(--text); letter-spacing:-.5px; }

      /* Awards */
      .hp-awards { margin-top:14px; padding-top:14px; border-top:1px solid var(--border); }
      .hp-awards__title { font-size:10px; font-weight:700; color: var(--text-muted); letter-spacing:.5px; text-transform:uppercase; margin-bottom:8px; }
      .hp-awards__list { display:flex; gap:6px; flex-wrap:wrap; }
      .aw {
        display:inline-flex; align-items:center; gap:5px;
        padding:5px 11px; border-radius:999px;
        font: 600 11px 'Inter',sans-serif;
        background: linear-gradient(135deg, color-mix(in oklab, var(--warning) 18%, transparent), color-mix(in oklab, var(--warning) 8%, transparent));
        color: var(--warning);
        border:1px solid color-mix(in oklab, var(--warning) 30%, transparent);
      }
      .aw i { font-size: 11px; }
      .hp-awards__empty { font-size:12px; color: var(--text-muted); }

      /* Trend */
      .trend-wrap { width:100%; overflow:hidden; }
      .trend-svg { width:100%; height:auto; display:block; }

      /* Season totals */
      .hp-totals { display:grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap:10px; }
      .tt {
        background: var(--surface-secondary); border:1px solid var(--border);
        border-radius:14px; padding: 14px 10px; text-align:center;
        transition: all .2s ease;
      }
      .tt:hover { border-color: var(--border-strong); transform: translateY(-1px); }
      .tt--dark { background: var(--gradient-primary); border-color: var(--text); color:#fff; }
      .tt__icon { font-size:16px; display:block; margin-bottom:6px; }
      .tt__val { font-family:'Inter Tight',sans-serif; font-size:24px; font-weight:800; color: var(--text); letter-spacing:-1px; line-height:1; font-feature-settings:'tnum'; }
      .tt--dark .tt__val { color:#fff; }
      .tt__label { margin-top:5px; font-size:10px; font-weight:700; color: var(--text-muted); text-transform:uppercase; letter-spacing:.4px; }
      .tt--dark .tt__label { color: rgba(255,255,255,.55); }

      /* Empty / loader */
      .hp-empty { display:flex; flex-direction:column; align-items:center; gap:8px; padding: 22px 0; color: var(--text-muted); font-size:13px; }
      .hp-empty i { font-size: 26px; color: var(--border-strong); }

      .hp-loader { display:flex; align-items:center; justify-content:center; gap:8px; height:180px; }
      .hp-loader span { width:8px; height:8px; border-radius:50%; background: var(--primary); animation: hpPulse .9s ease-in-out infinite; }

      /* Guest */
      .guest-cta {
        display:inline-flex; align-items:center; gap:6px;
        padding: 10px 22px; border-radius: 12px;
        background: var(--gradient-primary); color:#fff;
        font: 600 13px 'Inter',sans-serif; text-decoration:none;
        box-shadow: var(--shadow-glow);
      }
      .guest-cta:hover { transform: translateY(-1px); }

      /* ── Responsive ── */
      @media (max-width: 900px) {
        .hp-hero { grid-template-columns: 1fr; text-align:center; }
        .hp-hero__chips { justify-content:center; }
        .hp-grid { grid-template-columns: 1fr; }
        .hp-totals { grid-template-columns: repeat(3, minmax(0,1fr)); }
      }
      @media (max-width: 560px) {
        .hp-name { font-size: 22px; }
        .hp-kpis { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .rad-wrap { flex-direction:column; align-items:stretch; }
        .rad-wrap .radar-svg { align-self:center; }
        .pb__legend { grid-template-columns: 1fr; }
        .hp-totals { grid-template-columns: repeat(2, minmax(0,1fr)); }
        .card { padding: 14px; border-radius: 16px; }
        .gauge { transform: scale(.92); }
      }
    `}</style>
  )
}