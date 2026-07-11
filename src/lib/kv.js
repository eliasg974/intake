/*
 * Storage layer. Everything the app persists goes through read()/write()
 * here, which gives us three things on top of raw localStorage:
 *
 *  1. a per-key "last updated" timestamp (needed to merge with the server)
 *  2. write listeners — the sync layer subscribes to pushes, the store
 *     subscribes to remote changes, and neither imports the other
 *  3. a no-op guard: writing an identical value does nothing, which is
 *     what prevents infinite loops between Vue watchers and sync pulls
 */

export const PREFIX = 'intake:'
const META = 'intake:meta'    // { [key]: ISO timestamp } — not synced
const DIRTY = 'intake:dirty'  // keys waiting to be pushed — not synced
const INTERNAL = new Set([META, DIRTY])

const listeners = new Set()

/** Subscribe to writes. fn(key, value, source) — source is 'local' | 'remote'. */
export function onWrite(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function rawGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function rawSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function read(key, fallback) {
  return rawGet(key, fallback)
}

/** ISO timestamp of the last write to `key`, or '' if unknown. */
export function stampOf(key) {
  return rawGet(META, {})[key] || ''
}

function setStamp(key, iso) {
  const m = rawGet(META, {})
  m[key] = iso
  rawSet(META, m)
}

/**
 * Write a value. Returns true if anything actually changed.
 * - source 'local': a user action on this device → listeners may push it
 * - source 'remote': pulled from the server → store reloads its refs;
 *   pass the server's `stamp` so this device doesn't look newer than it is
 */
export function write(key, value, { source = 'local', stamp } = {}) {
  const json = JSON.stringify(value)
  let existing = null
  try { existing = localStorage.getItem(key) } catch { /* ignore */ }

  if (existing === json) {
    // Same data — just converge the timestamp if the server's is newer.
    if (source === 'remote' && stamp) setStamp(key, stamp)
    return false
  }
  if (!rawSet(key, value)) return false
  setStamp(key, stamp || new Date().toISOString())
  listeners.forEach((fn) => fn(key, value, source))
  return true
}

/** All syncable data keys currently in storage. */
export function dataKeys() {
  const out = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(PREFIX) && !INTERNAL.has(k)) out.push(k)
  }
  return out
}

/** Does the key exist in storage at all? */
export function has(key) {
  try { return localStorage.getItem(key) !== null } catch { return false }
}

/* ---------- dirty queue (offline pushes) ---------- */

export function markDirty(key) {
  const d = new Set(rawGet(DIRTY, []))
  d.add(key)
  rawSet(DIRTY, [...d])
}

export function getDirty() {
  return rawGet(DIRTY, [])
}

export function clearDirty(keys) {
  const d = new Set(rawGet(DIRTY, []))
  keys.forEach((k) => d.delete(k))
  rawSet(DIRTY, [...d])
}

/* ---------- migration: stamp pre-existing data ----------
 * Keys written before timestamps existed have no stamp, which made
 * them lose every merge ("no stamp" read as "oldest"). Give any
 * unstamped NON-EMPTY key a fresh stamp and queue it for push, so
 * real history wins against accidental empty records. Empty values
 * are left unstamped on purpose: a fresh device full of [] must not
 * outrank the server. Runs once per device (no-op afterwards).
 */
function isEmptyValue(v) {
  return v == null || (Array.isArray(v) && v.length === 0)
}

;(function backfillStamps() {
  const m = rawGet(META, {})
  let changed = false
  for (const k of dataKeys()) {
    if (!m[k] && !isEmptyValue(rawGet(k, null))) {
      m[k] = new Date().toISOString()
      markDirty(k)
      changed = true
    }
  }
  if (changed) rawSet(META, m)
})()
