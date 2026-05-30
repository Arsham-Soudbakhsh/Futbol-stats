// seedData.js
// این فایل رو توی src/lib/ بذار
// بعد یه بار از AdminPage صداش بزن یا مستقیم اجراش کن

import {
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import {
  setDoc, doc, serverTimestamp
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { upsertStats, upsertAward, upsertWeeklySquad, upsertRating } from './firebase'

// ─── FAKE PLAYERS ────────────────────────────────────────────
export const FAKE_USERS = [
  // Captains
  { email: 'captain1@test.com', password: 'test123', full_name: 'Dariush Karimi',  role: 'captain', team: 'Alpha' },
  { email: 'captain2@test.com', password: 'test123', full_name: 'Navid Hosseini',  role: 'captain', team: 'Beta'  },
  { email: 'captain3@test.com', password: 'test123', full_name: 'Reza Taheri',     role: 'captain', team: 'Gamma' },
  // Team Alpha players
  { email: 'alpha1@test.com', password: 'test123', full_name: 'Arsham Rezaei',   role: 'player', team: 'Alpha' },
  { email: 'alpha2@test.com', password: 'test123', full_name: 'Sina Pourali',    role: 'player', team: 'Alpha' },
  { email: 'alpha3@test.com', password: 'test123', full_name: 'Kamran Jafari',   role: 'player', team: 'Alpha' },
  { email: 'alpha4@test.com', password: 'test123', full_name: 'Mehdi Shirazi',   role: 'player', team: 'Alpha' },
  // Team Beta players
  { email: 'beta1@test.com',  password: 'test123', full_name: 'Amir Sadeghi',    role: 'player', team: 'Beta'  },
  { email: 'beta2@test.com',  password: 'test123', full_name: 'Hossein Moradi',  role: 'player', team: 'Beta'  },
  { email: 'beta3@test.com',  password: 'test123', full_name: 'Farhad Nazari',   role: 'player', team: 'Beta'  },
  { email: 'beta4@test.com',  password: 'test123', full_name: 'Saeed Ahmadi',    role: 'player', team: 'Beta'  },
  // Team Gamma players
  { email: 'gamma1@test.com', password: 'test123', full_name: 'Babak Eslami',    role: 'player', team: 'Gamma' },
  { email: 'gamma2@test.com', password: 'test123', full_name: 'Omid Rostami',    role: 'player', team: 'Gamma' },
  { email: 'gamma3@test.com', password: 'test123', full_name: 'Vahid Ghorbani',  role: 'player', team: 'Gamma' },
  { email: 'gamma4@test.com', password: 'test123', full_name: 'Pejman Akbari',   role: 'player', team: 'Gamma' },
]

// ─── WEEK 1 STATS ─────────────────────────────────────────────
const WEEK1_STATS = {
  'Dariush Karimi':  { goals: 3, assists: 2, clean_sheet: false },
  'Navid Hosseini':  { goals: 1, assists: 3, clean_sheet: true  },
  'Reza Taheri':     { goals: 0, assists: 1, clean_sheet: true  },
  'Arsham Rezaei':   { goals: 5, assists: 1, clean_sheet: false },
  'Sina Pourali':    { goals: 2, assists: 2, clean_sheet: false },
  'Kamran Jafari':   { goals: 1, assists: 0, clean_sheet: true  },
  'Mehdi Shirazi':   { goals: 0, assists: 3, clean_sheet: false },
  'Amir Sadeghi':    { goals: 4, assists: 1, clean_sheet: false },
  'Hossein Moradi':  { goals: 2, assists: 0, clean_sheet: true  },
  'Farhad Nazari':   { goals: 1, assists: 2, clean_sheet: false },
  'Saeed Ahmadi':    { goals: 0, assists: 1, clean_sheet: true  },
  'Babak Eslami':    { goals: 3, assists: 0, clean_sheet: false },
  'Omid Rostami':    { goals: 1, assists: 1, clean_sheet: false },
  'Vahid Ghorbani':  { goals: 2, assists: 3, clean_sheet: false },
  'Pejman Akbari':   { goals: 0, assists: 0, clean_sheet: true  },
}

// ─── WEEK 1 RATINGS (از هر کاپیتان) ──────────────────────────
const makeRating = (pass, shoot, def, drib) => ({ passing: pass, shooting: shoot, defending: def, dribbling: drib })

const RATINGS_BY_NAME = {
  'Arsham Rezaei':   makeRating(78, 85, 62, 71),
  'Sina Pourali':    makeRating(72, 74, 68, 79),
  'Kamran Jafari':   makeRating(65, 60, 82, 55),
  'Mehdi Shirazi':   makeRating(80, 70, 58, 73),
  'Dariush Karimi':  makeRating(75, 82, 65, 77),
  'Navid Hosseini':  makeRating(83, 68, 72, 66),
  'Reza Taheri':     makeRating(60, 55, 88, 52),
  'Amir Sadeghi':    makeRating(70, 80, 60, 74),
  'Hossein Moradi':  makeRating(68, 72, 75, 63),
  'Farhad Nazari':   makeRating(74, 69, 66, 80),
  'Saeed Ahmadi':    makeRating(62, 58, 84, 57),
  'Babak Eslami':    makeRating(77, 75, 63, 72),
  'Omid Rostami':    makeRating(65, 70, 70, 68),
  'Vahid Ghorbani':  makeRating(82, 65, 60, 78),
  'Pejman Akbari':   makeRating(58, 52, 90, 48),
}

// ─── MAIN SEED FUNCTION ───────────────────────────────────────
export async function seedAll(onProgress) {
  const year = new Date().getFullYear()
  const idMap = {} // name → uid

  onProgress('Creating user accounts…')

  // 1. Create auth accounts + profiles
  for (const u of FAKE_USERS) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, u.email, u.password)
      idMap[u.full_name] = cred.user.uid
      await setDoc(doc(db, 'profiles', cred.user.uid), {
        full_name: u.full_name,
        role: u.role,
        team_id: null,
        avatar_url: null,
        created_at: serverTimestamp(),
      })
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        onProgress(`${u.full_name} already exists, skipping…`)
      } else {
        onProgress(`Error creating ${u.full_name}: ${e.message}`)
      }
    }
  }

  onProgress('Creating teams…')

  // 2. Create teams
  const teams = [
    { name: 'Team Alpha', captain: 'Dariush Karimi' },
    { name: 'Team Beta',  captain: 'Navid Hosseini' },
    { name: 'Team Gamma', captain: 'Reza Taheri'    },
  ]
  const teamIdMap = {}
  for (const t of teams) {
    const captainId = idMap[t.captain]
    if (!captainId) continue
    const teamRef = doc(db, 'teams', t.name.toLowerCase().replace(' ', '_'))
    await setDoc(teamRef, {
      name: t.name,
      captain_id: captainId,
      created_at: serverTimestamp(),
    })
    teamIdMap[t.name] = teamRef.id

    // Update captain profile with team_id
    await setDoc(doc(db, 'profiles', captainId), { team_id: teamRef.id }, { merge: true })
  }

  // Update player profiles with team_id
  for (const u of FAKE_USERS) {
    const uid = idMap[u.full_name]
    if (!uid) continue
    const teamName = 'Team ' + u.team
    const teamId = teamIdMap[teamName]
    if (teamId) {
      await setDoc(doc(db, 'profiles', uid), { team_id: teamId }, { merge: true })
    }
  }

  onProgress('Inserting week 1 stats…')

  // 3. Weekly stats
  for (const [name, stats] of Object.entries(WEEK1_STATS)) {
    const uid = idMap[name]
    if (!uid) continue
    await upsertStats(uid, 1, year, stats)
  }

  onProgress('Setting awards…')

  // 4. Awards week 1
  const awards = [
    { type: 'best_player_week', name: 'Arsham Rezaei'  },
    { type: 'best_striker',     name: 'Arsham Rezaei'  },
    { type: 'best_overall',     name: 'Navid Hosseini' },
    { type: 'best_goalkeeper',  name: 'Reza Taheri'    },
    { type: 'best_defender',    name: 'Kamran Jafari'  },
    { type: 'best_midfielder',  name: 'Vahid Ghorbani' },
  ]
  for (const a of awards) {
    const uid = idMap[a.name]
    if (!uid) continue
    await upsertAward(a.type, uid, 1, year)
  }

  onProgress('Setting weekly squads…')

  // 5. Weekly squads (each captain + 4 from their team)
  const squadMap = {
    'Team Alpha': ['Dariush Karimi', 'Arsham Rezaei', 'Sina Pourali', 'Kamran Jafari', 'Mehdi Shirazi'],
    'Team Beta':  ['Navid Hosseini', 'Amir Sadeghi', 'Hossein Moradi', 'Farhad Nazari', 'Saeed Ahmadi'],
    'Team Gamma': ['Reza Taheri', 'Babak Eslami', 'Omid Rostami', 'Vahid Ghorbani', 'Pejman Akbari'],
  }
  for (const [teamName, members] of Object.entries(squadMap)) {
    const teamId = teamIdMap[teamName]
    if (!teamId) continue
    const playerIds = members.map(n => idMap[n]).filter(Boolean)
    await upsertWeeklySquad(teamId, 1, year, playerIds)
  }

  onProgress('Inserting captain ratings…')

  // 6. Captain ratings — each captain rates everyone except themselves
  const captains = ['Dariush Karimi', 'Navid Hosseini', 'Reza Taheri']
  for (const captainName of captains) {
    const captainId = idMap[captainName]
    if (!captainId) continue
    for (const [playerName, r] of Object.entries(RATINGS_BY_NAME)) {
      if (playerName === captainName) continue
      const playerId = idMap[playerName]
      if (!playerId) continue
      await upsertRating(captainId, playerId, 1, year, r.passing, r.shooting, r.defending, r.dribbling)
    }
  }

  onProgress('✅ Done! All fake data inserted.')
}
