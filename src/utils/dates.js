const pad = (n) => String(n).padStart(2, '0')

/** Local date key like "2026-07-02" — used as the storage key per day. */
export const keyOf = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const isToday = (d) => keyOf(d) === keyOf(new Date())

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Thu 2 Jul" */
export const dayLabel = (d) =>
  `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`

/** Short weekday letter for the week strip: "T" */
export const dayLetter = (d) => DAYS[d.getDay()][0]

/** Returns a new Date shifted by `delta` days. */
export const shifted = (d, delta) => {
  const c = new Date(d)
  c.setDate(c.getDate() + delta)
  return c
}

/** Last `n` days ending today, oldest first. */
export const lastNDays = (n) => {
  const out = []
  for (let i = n - 1; i >= 0; i--) out.push(shifted(new Date(), -i))
  return out
}
