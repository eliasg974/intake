<script setup>
import { computed, ref } from 'vue'
import { useIntake } from '../composables/useIntake'
import { isToday, dayLabel } from '../utils/dates'
import MonthView from './MonthView.vue'

const { cursor, goToDay } = useIntake()

const calendarOpen = ref(false)

const onToday = computed(() => isToday(cursor.value))
const chipText = computed(() => (onToday.value ? 'today' : dayLabel(cursor.value)))
const subtitle = computed(() => (onToday.value ? "today's log" : 'logged day'))
</script>

<template>
  <header>
    <div class="brand">
      <h1>Intake</h1>
      <span>{{ subtitle }}</span>
    </div>
    <div class="datenav">
      <button aria-label="Previous day" @click="goToDay(-1)">‹</button>
      <div
        class="d" :class="{ today: onToday }"
        title="Open month overview"
        @click="calendarOpen = true"
      >{{ chipText }}</div>
      <button aria-label="Next day" @click="goToDay(1)">›</button>
    </div>
  </header>
  <MonthView v-if="calendarOpen" @close="calendarOpen = false" />
</template>

<style scoped>
header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 22px;
}
.brand { display: flex; flex-direction: column; gap: 2px; }
.brand h1 {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.brand span { font-size: 12px; color: var(--muted); letter-spacing: 0.04em; }

.datenav { display: flex; align-items: center; gap: 2px; }
.datenav button {
  background: none;
  border: none;
  color: var(--faint);
  font-size: 20px;
  line-height: 1;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}
.datenav button:hover { color: var(--text); background: var(--surface2); }
.datenav .d {
  font-family: var(--mono);
  font-size: 13px;
  color: var(--muted);
  min-width: 74px;
  text-align: center;
  cursor: pointer;
  padding: 5px 6px;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}
.datenav .d:hover { color: var(--text); background: var(--surface2); }
.datenav .d.today { color: var(--protein); }
</style>
