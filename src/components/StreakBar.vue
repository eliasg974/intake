<script setup>
import { computed } from 'vue'
import { useIntake } from '../composables/useIntake'
import { keyOf } from '../utils/dates'

const { streak, bestStreak, totalsFor, isHit } = useIntake()

const todayHit = computed(() => isHit(totalsFor(keyOf(new Date()))))

const text = computed(() => {
  if (streak.value === 0) return 'No active streak — hit both targets today to start one'
  const days = `${streak.value} day${streak.value === 1 ? '' : 's'}`
  return todayHit.value ? `${days} on target` : `${days} — today still open`
})
</script>

<template>
  <div class="streak" :class="{ live: streak > 0 }">
    <span class="flame" aria-hidden="true">{{ streak > 0 ? '🔥' : '·' }}</span>
    <span class="txt num">{{ text }}</span>
    <span v-if="bestStreak > 1" class="best num">best {{ bestStreak }}</span>
  </div>
</template>

<style scoped>
.streak {
  display: flex;
  align-items: center;
  gap: 9px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 13px;
  padding: 10px 14px;
  margin-bottom: 22px;
  font-size: 12px;
  color: var(--faint);
}
.streak.live { color: var(--muted); }
.streak.live .txt { color: var(--protein); font-weight: 600; }
.flame { font-size: 13px; line-height: 1; }
.txt { flex: 1; }
.best { color: var(--faint); }
</style>
