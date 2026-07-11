<script setup>
import { ref } from 'vue'
import { useIntake } from '../composables/useIntake'

const { staples, addEntry, removeStaple } = useIntake()

// In manage mode, tapping a chip removes the staple instead of logging it.
const managing = ref(false)

function onChip(s) {
  if (managing.value) removeStaple(s.id)
  else addEntry(s.name, s.kcal, s.protein)
}
</script>

<template>
  <div>
    <div class="seclabel">
      <span>Quick add</span>
      <button @click="managing = !managing">{{ managing ? 'Done' : 'Edit staples' }}</button>
    </div>
    <div class="quick">
      <button
        v-for="s in staples" :key="s.id"
        class="chip" :class="{ managing }"
        @click="onChip(s)"
      >
        <div class="cn">
          <span>{{ s.name }}</span>
          <span class="plus" :class="{ minus: managing }">{{ managing ? '✕' : '+' }}</span>
        </div>
        <div class="cm num">{{ s.kcal }} kcal · <b>{{ s.protein }}g</b> protein</div>
      </button>
      <div v-if="staples.length === 0" class="none">
        No staples yet — log a food below and tap ★ to save it here.
      </div>
    </div>
  </div>
</template>

<style scoped>
.quick {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  margin-bottom: 24px;
}
.chip {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 13px;
  padding: 12px 13px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.08s, background 0.15s;
  font-family: var(--disp);
  color: var(--text);
}
.chip:hover { border-color: var(--faint); background: var(--surface2); }
.chip:active { transform: scale(0.975); }
.chip.managing { border-color: var(--over); }
.cn {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cn .plus { color: var(--protein); font-size: 15px; font-weight: 700; }
.cn .plus.minus { color: var(--over); }
.cm { font-size: 12px; color: var(--muted); }
.cm b { color: var(--protein); font-weight: 600; }
.none {
  grid-column: 1 / -1;
  background: var(--surface);
  border: 1px dashed var(--line);
  border-radius: 13px;
  padding: 16px;
  text-align: center;
  color: var(--faint);
  font-size: 13px;
}

@media (max-width: 400px) {
  .quick { grid-template-columns: 1fr; }
}
</style>
