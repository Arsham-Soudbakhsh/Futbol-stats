export const AWARD_POINTS = {
  best_player_week: 50,
  best_overall: 30,
  best_goalkeeper: 20,
  best_defender: 20,
  best_midfielder: 20,
  best_striker: 20,
  team_of_month: 200,
}

export const calcStatPoints = (stats) => {
  if (!stats) return 0
  return (stats.goals || 0) * 10 + (stats.assists || 0) * 5 + (stats.clean_sheet ? 10 : 0)
}

export const calcAwardPoints = (awards) => {
  if (!awards?.length) return 0
  return awards.reduce((sum, a) => sum + (AWARD_POINTS[a.award_type] || 0), 0)
}

export const avgRatings = (ratings) => {
  if (!ratings?.length) return { passing: 0, shooting: 0, defending: 0, dribbling: 0, avg: 0 }
  const n = ratings.length
  const sum = ratings.reduce((acc, r) => ({
    passing: acc.passing + (r.passing || 0),
    shooting: acc.shooting + (r.shooting || 0),
    defending: acc.defending + (r.defending || 0),
    dribbling: acc.dribbling + (r.dribbling || 0),
  }), { passing: 0, shooting: 0, defending: 0, dribbling: 0 })
  const p = Math.round(sum.passing / n)
  const s = Math.round(sum.shooting / n)
  const d = Math.round(sum.defending / n)
  const dr = Math.round(sum.dribbling / n)
  return { passing: p, shooting: s, defending: d, dribbling: dr, avg: Math.round((p+s+d+dr)/4) }
}

export const getCurrentYear = () => new Date().getFullYear()

export const AWARD_LABELS = {
  best_player_week: 'Best player of the week',
  best_overall: 'Best overall',
  best_goalkeeper: 'Best goalkeeper',
  best_defender: 'Best defender',
  best_midfielder: 'Best midfielder',
  best_striker: 'Best striker',
  team_of_month: 'Team of the month',
}
