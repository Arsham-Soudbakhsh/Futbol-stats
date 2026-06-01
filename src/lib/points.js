export const POINTS = {
  goal: 10,
  assist: 5,
  clean_sheet: 20,
}

export const AWARD_POINTS = {
  best_player_week: 50,
  best_overall: 30,
  best_goalkeeper: 30,
  best_defender: 20,
  best_midfielder: 20,
  best_striker: 20,
  top_scorer_week: 35,
  top_assister_week: 30,
  best_ga_week: 40,
  most_cleansheets: 30,
  best_team_week: 15,
  // legacy
  team_of_month: 200,
}

export const calcStatPoints = (stats) => {
  if (!stats) return 0
  const cs = stats.clean_sheets != null ? stats.clean_sheets : (stats.clean_sheet ? 1 : 0)
  return (stats.goals || 0) * POINTS.goal + (stats.assists || 0) * POINTS.assist + cs * POINTS.clean_sheet
}

export const calcAwardPoints = (awards) => {
  if (!awards?.length) return 0
  return awards.reduce((sum, a) => sum + (AWARD_POINTS[a.award_type] || 0), 0)
}

// avgRatings: فقط رکوردهایی که absent نیستن رو حساب کن.
// اگر هیچ رکورد معتبری نبود (همه absent یا آرایه خالی) → همه صفر.
export const avgRatings = (ratings) => {
  const active = (ratings || []).filter(r => !r.absent)
  if (!active.length) return { passing: 0, shooting: 0, defending: 0, dribbling: 0, avg: 0 }
  const n = active.length
  const sum = active.reduce((acc, r) => ({
    passing:   acc.passing   + (r.passing   || 0),
    shooting:  acc.shooting  + (r.shooting  || 0),
    defending: acc.defending + (r.defending || 0),
    dribbling: acc.dribbling + (r.dribbling || 0),
  }), { passing: 0, shooting: 0, defending: 0, dribbling: 0 })
  const p  = Math.round(sum.passing   / n)
  const s  = Math.round(sum.shooting  / n)
  const d  = Math.round(sum.defending / n)
  const dr = Math.round(sum.dribbling / n)
  return { passing: p, shooting: s, defending: d, dribbling: dr, avg: Math.round((p+s+d+dr)/4) }
}

// avgRatingsStrict: مثل avgRatings ولی فقط وقتی دقیقاً requiredCount ریتر فعال داشت
// مقدار رو برمی‌گردونه، وگرنه null.
export const avgRatingsStrict = (ratings, requiredCount = 3) => {
  const active = (ratings || []).filter(r => !r.absent)
  if (active.length < requiredCount) return null
  return avgRatings(active)
}

export const getCurrentYear = () => new Date().getFullYear()

export const AWARD_LABELS = {
  best_player_week: 'Best player of the week',
  best_overall: 'Best overall',
  best_goalkeeper: 'Best GK of the week',
  best_defender: 'Best defender of the week',
  best_midfielder: 'Best midfielder of the week',
  best_striker: 'Best striker of the week',
  top_scorer_week: 'Top scorer of the week',
  top_assister_week: 'Top assister of the week',
  best_ga_week: 'Best G/A of the week',
  most_cleansheets: 'Most clean sheets',
  best_team_week: 'Best team of the week',
}
