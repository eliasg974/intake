import { ref, computed, watch } from 'vue'
import { keyOf, shifted, lastNDays } from '../utils/dates'
import { read, write, onWrite, dataKeys } from '../lib/kv'

/*
 * Shared store built from module-scoped refs — every component that
 * calls useIntake() gets the SAME refs. Persistence goes through
 * lib/kv.js, which also feeds the sync layer (see useSync.js);
 * this file never talks to the network.
 */

const LS = {
  targets: 'intake:targets',
  staples: 'intake:staples',
  day: (key) => `intake:log:${key}`,
}

const DEFAULT_TARGETS = { protein: 150, kcal: 2300 }

const DEFAULT_STAPLES = [
  { id: 's1', name: 'Skyr (150g)', kcal: 90, protein: 16 },
  { id: 's2', name: 'Egg (large)', kcal: 72, protein: 6 },
  { id: 's3', name: 'Tuna (1 can)', kcal: 116, protein: 26 },
  { id: 's4', name: 'Cottage (100g)', kcal: 98, protein: 11 },
]

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

/* ---------- state ---------- */

const targets = ref(read(LS.targets, DEFAULT_TARGETS))
const staples = ref(read(LS.staples, DEFAULT_STAPLES))
const cursor = ref(new Date())              // which day we're viewing
const entries = ref(read(LS.day(keyOf(new Date())), []))

/* ---------- persistence ---------- */

watch(targets, (t) => write(LS.targets, t), { deep: true })
watch(staples, (s) => write(LS.staples, s), { deep: true })

// When the viewed day changes, load that day's log.
watch(cursor, (d) => {
  entries.value = read(LS.day(keyOf(d)), [])
})

// When entries change, save them under the viewed day's key.
watch(entries, (e) => write(LS.day(keyOf(cursor.value)), e), { deep: true })

/*
 * When sync pulls newer data from the server, reload the refs that
 * display it. The watchers above will fire and re-write, but kv's
 * no-op guard sees identical data and stops the loop there.
 */
onWrite((key, value, source) => {
  if (source !== 'remote') return
  if (key === LS.targets) targets.value = value
  else if (key === LS.staples) staples.value = value
  else if (key === LS.day(keyOf(cursor.value))) entries.value = value
})

/* ---------- derived ---------- */

/**
 * Totals for any day, read from storage — except the currently viewed
 * day, which comes from the reactive `entries` so the UI updates live.
 */
function totalsFor(dateKey) {
  const list = dateKey === keyOf(cursor.value)
    ? entries.value
    : read(LS.day(dateKey), [])
  return {
    protein: list.reduce((s, e) => s + (e.protein || 0), 0),
    kcal: list.reduce((s, e) => s + (e.kcal || 0), 0),
    logged: list.length > 0,
  }
}

/**
 * ONE definition of a successful day, used by streak, week and month
 * views: protein target hit AND kcal within budget (if a budget is set).
 */
function isHit(t) {
  const pOk = targets.value.protein > 0 && t.protein >= targets.value.protein
  const kOk = targets.value.kcal === 0 || t.kcal <= targets.value.kcal
  return pOk && kOk
}

/**
 * Current streak of consecutive hit days ending today or yesterday.
 * Today counts as soon as it's hit, but an unfinished today doesn't
 * break the chain — you can't lose a streak at breakfast.
 */
const streak = computed(() => {
  void entries.value // register reactivity on today's log
  void targets.value
  let count = 0
  let d = new Date()
  if (isHit(totalsFor(keyOf(d)))) count++
  d = shifted(d, -1)
  while (count < 3650 && isHit(totalsFor(keyOf(d)))) {
    count++
    d = shifted(d, -1)
  }
  return count
})

/** Longest streak ever, scanned from all stored day logs. */
const bestStreak = computed(() => {
  void entries.value
  void targets.value
  const hits = new Set()
  for (const k of dataKeys()) {
    if (k.startsWith('intake:log:')) {
      const dateKey = k.slice('intake:log:'.length)
      if (isHit(totalsFor(dateKey))) hits.add(dateKey)
    }
  }
  let best = 0
  for (const key of hits) {
    const prev = keyOf(shifted(new Date(key), -1))
    if (hits.has(prev)) continue // not the start of a run
    let len = 1
    let d = shifted(new Date(key), 1)
    while (hits.has(keyOf(d))) {
      len++
      d = shifted(d, 1)
    }
    if (len > best) best = len
  }
  return best
})

const totals = computed(() => ({
  protein: entries.value.reduce((s, e) => s + (e.protein || 0), 0),
  kcal: entries.value.reduce((s, e) => s + (e.kcal || 0), 0),
}))

/** Last 7 days incl. today, with totals. */
const week = computed(() => {
  void entries.value // today's bar updates live as you log
  return lastNDays(7).map((d) => {
    const key = keyOf(d)
    const t = totalsFor(key)
    return { date: d, key, protein: t.protein, kcal: t.kcal }
  })
})

/* ---------- actions ---------- */

function addEntry(name, kcal, protein) {
  entries.value.push({
    id: uid(),
    name: name || 'Food',
    kcal: Math.round(kcal) || 0,
    protein: Math.round(protein) || 0,
  })
}

function removeEntry(id) {
  entries.value = entries.value.filter((e) => e.id !== id)
}

function duplicateEntry(id) {
  const e = entries.value.find((x) => x.id === id)
  if (e) addEntry(e.name, e.kcal, e.protein)
}

function addStaple(name, kcal, protein) {
  staples.value.push({
    id: uid(),
    name: name || 'Food',
    kcal: Math.round(kcal) || 0,
    protein: Math.round(protein) || 0,
  })
}

function removeStaple(id) {
  staples.value = staples.value.filter((s) => s.id !== id)
}

function setTargets(protein, kcal) {
  targets.value = {
    protein: Math.max(0, parseInt(protein) || 0),
    kcal: Math.max(0, parseInt(kcal) || 0),
  }
}

/* ---------- backup / restore ---------- */

/** Download every data key as one JSON file. */
function exportData() {
  const data = { app: 'intake', version: 1, exported: new Date().toISOString(), items: {} }
  for (const key of dataKeys()) {
    data.items[key] = read(key, null)
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `intake-backup-${keyOf(new Date())}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Restore from a backup file. Overwrites keys present in the file,
 * leaves everything else untouched (a merge, not a wipe). Restored
 * keys get fresh timestamps, so they also sync up to the server.
 * Returns the number of day logs imported. Throws on invalid files.
 */
async function importData(file) {
  const data = JSON.parse(await file.text())
  if (!data || data.app !== 'intake' || typeof data.items !== 'object') {
    throw new Error('Not an Intake backup file')
  }
  const keys = Object.keys(data.items).filter((k) => k.startsWith('intake:'))
  if (keys.length === 0) throw new Error('Backup contains no data')
  keys.forEach((k) => write(k, data.items[k]))
  // Reload reactive state from the (possibly changed) storage.
  targets.value = read(LS.targets, DEFAULT_TARGETS)
  staples.value = read(LS.staples, DEFAULT_STAPLES)
  entries.value = read(LS.day(keyOf(cursor.value)), [])
  return keys.filter((k) => k.startsWith('intake:log:')).length
}

function goToDay(delta) {
  cursor.value = shifted(cursor.value, delta)
}

function goToDate(d) {
  cursor.value = new Date(d)
}

function goToToday() {
  cursor.value = new Date()
}

export function useIntake() {
  return {
    // state
    targets, staples, cursor, entries,
    // derived
    totals, week, streak, bestStreak,
    // helpers (used by week/month views)
    totalsFor, isHit,
    // actions
    addEntry, removeEntry, duplicateEntry,
    addStaple, removeStaple,
    setTargets, goToDay, goToToday, goToDate,
    exportData, importData,
  }
}
