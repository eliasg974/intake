<script setup>
import { computed } from 'vue'
import { useIntake } from '../composables/useIntake'
import { dayLetter, isToday } from '../utils/dates'

const { week, targets } = useIntake()

/*
 * Each day renders a small vertical protein bar, scaled to the target.
 * A day counts as "hit" when protein >= target and kcal <= target
 * (or kcal target is 0 / nothing set).
 */
const days = computed(() =>
  week.value.map((d) => {
    const pPct = targets.value.protein > 0
      ? Math.min(100, (d.protein / targets.value.protein) * 100)
      : 0
    const proteinHit = targets.value.protein > 0 && d.protein >= targets.value.protein
    const kcalOk = targets.value.kcal === 0 || d.kcal <= targets.value.kcal
    return {
      ...d,
      pPct,
      hit: proteinHit && kcalOk,
      overKcal: targets.value.kcal > 0 && d.kcal > targets.value.kcal,
      letter: dayLetter(d.date),
      today: isToday(d.date),
      empty: d.protein === 0 && d.kcal === 0,
    }
  })
)

const hitCount = computed(() => days.value.filter((d) => d.hit).length)

const avg = computed(() => {
  const logged = days.value.filter((d) => !d.empty)
  if (logged.length === 0) return null
  return {
    protein: Math.round(logged.reduce((s, d) => s + d.protein, 0) / logged.length),
    kcal: Math.round(logged.reduce((s, d) => s + d.kcal, 0) / logged.length),
  }
})
</script>

<template>
  <div class="week">
    <div class="bars">
      <div v-for="d in days" :key="d.key" class="col" :title="`${d.protein}g · ${d.kcal} kcal`">
        <div class="barwrap">
          <div
            class="bar num"
            :class="{ hit: d.hit, overk: d.overKcal, empty: d.empty }"
            :style="{ height: Math.max(d.empty ? 0 : 6, d.pPct) + '%' }"
          ></div>
        </div>
        <span class="dl" :class="{ today: d.today }">{{ d.letter }}</span>
      </div>
    </div>
    <div class="wfoot">
      <span class="num">{{ hitCount }}/7 days on target</span>
      <span v-if="avg" class="num avg">avg {{ avg.protein }}g · {{ avg.kcal }} kcal</span>
    </div>
  </div>
</template>

<style scoped>
.week {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 14px 18px 12px;
  margin-bottom: 22px;
}
.bars {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  height: 64px;
}
.col { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.barwrap {
  flex: 1;
  width: 100%;
  max-width: 26px;
  background: var(--surface2);
  border-radius: 6px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.bar {
  width: 100%;
  background: var(--faint);
  border-radius: 6px 6px 0 0;
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.bar.hit { background: var(--protein); }
.bar.overk { background: var(--over); }
.bar.empty { background: transparent; }
.dl { font-size: 10px; color: var(--faint); font-family: var(--mono); }
.dl.today { color: var(--protein); }

.wfoot {
  display: flex;
  justify-content: space-between;
  margin-top: 9px;
  font-size: 12px;
  color: var(--muted);
}
.wfoot .avg { color: var(--faint); }
</style>
