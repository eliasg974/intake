<script setup>
import { ref, computed } from 'vue'
import { useIntake } from '../composables/useIntake'
import { keyOf, isToday } from '../utils/dates'

const emit = defineEmits(['close'])

const { cursor, targets, totalsFor, isHit, goToDate, goToToday } = useIntake()

// The month being displayed — starts at the viewed day's month.
const shown = ref(new Date(cursor.value.getFullYear(), cursor.value.getMonth(), 1))

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const label = computed(() => `${MONTHS[shown.value.getMonth()]} ${shown.value.getFullYear()}`)

function shiftMonth(delta) {
  shown.value = new Date(shown.value.getFullYear(), shown.value.getMonth() + delta, 1)
}

/*
 * Cells for a Monday-first grid. Each day gets a state:
 *   hit    — protein hit AND kcal within budget  (green)
 *   over   — logged but kcal over budget          (red)
 *   logged — logged, neither of the above         (grey)
 *   empty  — nothing logged
 */
const cells = computed(() => {
  void cursor.value // re-render when the viewed day (and its entries) change
  const y = shown.value.getFullYear()
  const m = shown.value.getMonth()
  const first = new Date(y, m, 1)
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const offset = (first.getDay() + 6) % 7 // Mon = 0
  const todayKey = keyOf(new Date())

  const out = []
  for (let i = 0; i < offset; i++) out.push({ blank: true, key: 'b' + i })
  for (let n = 1; n <= daysInMonth; n++) {
    const date = new Date(y, m, n)
    const key = keyOf(date)
    const t = totalsFor(key)
    let state = 'empty'
    if (t.logged) {
      if (isHit(t)) state = 'hit'
      else if (targets.value.kcal > 0 && t.kcal > targets.value.kcal) state = 'over'
      else state = 'logged'
    }
    out.push({
      key, n, date, state,
      today: key === todayKey,
      selected: key === keyOf(cursor.value),
      future: key > todayKey,
      title: t.logged ? `${t.protein}g · ${t.kcal} kcal` : 'nothing logged',
    })
  }
  return out
})

const monthStats = computed(() => {
  const days = cells.value.filter((c) => !c.blank && c.state !== 'empty')
  const hit = days.filter((c) => c.state === 'hit').length
  return days.length ? `${hit}/${days.length} logged days on target` : 'nothing logged this month'
})

function pick(c) {
  if (c.blank || c.future) return
  goToDate(c.date)
  emit('close')
}

function pickToday() {
  goToToday()
  emit('close')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="cal" role="dialog" aria-label="Month overview">
      <div class="head">
        <button class="nav" aria-label="Previous month" @click="shiftMonth(-1)">‹</button>
        <span class="label">{{ label }}</span>
        <button class="nav" aria-label="Next month" @click="shiftMonth(1)">›</button>
      </div>

      <div class="grid dow">
        <span v-for="(d, i) in ['M','T','W','T','F','S','S']" :key="i">{{ d }}</span>
      </div>

      <div class="grid">
        <button
          v-for="c in cells" :key="c.key"
          class="cell" :class="[c.state, { blank: c.blank, today: c.today, selected: c.selected, future: c.future }]"
          :disabled="c.blank || c.future"
          :title="c.blank ? '' : c.title"
          @click="pick(c)"
        >
          <span v-if="!c.blank" class="num">{{ c.n }}</span>
          <span v-if="!c.blank" class="dot"></span>
        </button>
      </div>

      <div class="foot">
        <span class="stats num">{{ monthStats }}</span>
        <button class="todaybtn" @click="pickToday">Go to today</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 9, 12, 0.72);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 72px 16px 16px;
  z-index: 50;
}
.cal {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 18px;
  padding: 16px;
  width: 100%;
  max-width: 380px;
  animation: pop 0.18s ease;
}
@keyframes pop {
  from { opacity: 0; transform: translateY(-6px) scale(0.98); }
  to { opacity: 1; transform: none; }
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.head .label { font-size: 14px; font-weight: 600; }
.nav {
  background: none;
  border: none;
  color: var(--faint);
  font-size: 20px;
  line-height: 1;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}
.nav:hover { color: var(--text); background: var(--surface2); }

.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.grid.dow {
  margin-bottom: 4px;
}
.grid.dow span {
  text-align: center;
  font-size: 10px;
  font-family: var(--mono);
  color: var(--faint);
  padding: 2px 0;
}

.cell {
  aspect-ratio: 1;
  background: none;
  border: 1px solid transparent;
  border-radius: 10px;
  color: var(--muted);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  transition: background 0.15s, border-color 0.15s;
}
.cell:not(.blank):not(:disabled):hover { background: var(--surface2); }
.cell.blank { cursor: default; }
.cell.future { color: var(--faint); opacity: 0.4; cursor: default; }
.cell.today .num { color: var(--protein); font-weight: 700; }
.cell.selected { border-color: var(--faint); }

.dot { width: 5px; height: 5px; border-radius: 50%; background: transparent; }
.cell.hit .dot { background: var(--protein); }
.cell.over .dot { background: var(--over); }
.cell.logged .dot { background: var(--faint); }

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}
.foot .stats { font-size: 11px; color: var(--faint); }
.todaybtn {
  background: var(--surface2);
  border: 1px solid var(--line);
  border-radius: 9px;
  color: var(--text);
  font-family: var(--disp);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 11px;
  cursor: pointer;
  transition: border-color 0.15s;
}
.todaybtn:hover { border-color: var(--faint); }
</style>
