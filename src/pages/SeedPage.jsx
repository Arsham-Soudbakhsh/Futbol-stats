import React, { useState } from 'react'
import { seedAll } from '../lib/seedData'

export default function SeedPage() {
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const addLog = (msg) => setLogs(prev => [...prev, msg])

  const run = async () => {
    setRunning(true)
    setLogs([])
    setDone(false)
    try {
      await seedAll(addLog)
      setDone(true)
    } catch (e) {
      addLog('❌ Error: ' + e.message)
    }
    setRunning(false)
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: '0 16px' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>🌱 Seed fake data</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
          این دکمه ۱۵ بازیکن fake با آمار هفته ۱ می‌سازه.<br />
          <strong style={{ color: 'var(--danger)' }}>فقط یه بار بزن!</strong> اگه دوباره بزنی account ها duplicate نمیشن ولی وقت می‌بره.
        </div>

        <button
          onClick={run}
          disabled={running || done}
          style={{
            padding: '9px 20px', borderRadius: 10, border: 'none',
            background: done ? 'var(--primary)' : running ? 'var(--text-muted)' : 'var(--text)',
            color: '#fff', fontSize: 13, fontWeight: 500, cursor: running || done ? 'default' : 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {done ? '✅ Done!' : running ? 'Running…' : 'Run seed'}
        </button>

        {logs.length > 0 && (
          <div style={{
            marginTop: 14, background: 'var(--surface-secondary)', borderRadius: 10,
            padding: '10px 12px', maxHeight: 280, overflowY: 'auto',
          }}>
            {logs.map((l, i) => (
              <div key={i} style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#3d5a45', marginBottom: 3 }}>
                {l}
              </div>
            ))}
          </div>
        )}

        {done && (
          <div style={{ marginTop: 14, fontSize: 12, color: 'var(--primary)', lineHeight: 1.6 }}>
            ✅ همه داده‌ها وارد شدن!<br />
            حالا می‌تونی با این اکانت‌ها login کنی:<br /><br />
            <code style={{ background: 'var(--surface-secondary)', padding: '6px 10px', borderRadius: 6, display: 'block', fontSize: 11 }}>
              captain1@test.com / test123 (Dariush — Alpha)<br />
              captain2@test.com / test123 (Navid — Beta)<br />
              captain3@test.com / test123 (Reza — Gamma)<br />
              alpha1@test.com / test123 (Arsham)<br />
              beta1@test.com / test123 (Amir)<br />
              gamma1@test.com / test123 (Babak)
            </code>
          </div>
        )}
      </div>
    </div>
  )
}
