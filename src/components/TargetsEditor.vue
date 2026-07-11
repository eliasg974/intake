<script setup>
import { useIntake } from '../composables/useIntake'

const { targets, setTargets } = useIntake()

function onProtein(e) {
  setTargets(e.target.value, targets.value.kcal)
}
function onKcal(e) {
  setTargets(targets.value.protein, e.target.value)
}
</script>

<template>
  <div class="tedit">
    <div class="tfield">
      <label for="tp">Protein target (g)</label>
      <input
        id="tp" class="num" type="number" inputmode="numeric"
        :value="targets.protein" @input="onProtein"
      >
    </div>
    <div class="tfield">
      <label for="tk">Energy target (kcal)</label>
      <input
        id="tk" class="num" type="number" inputmode="numeric"
        :value="targets.kcal" @input="onKcal"
      >
    </div>
  </div>
</template>

<style scoped>
.tedit {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 22px;
  display: flex;
  gap: 14px;
}
.tfield { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.tfield label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}
.tfield input {
  background: var(--surface2);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--text);
  font-size: 16px;
  padding: 9px 11px;
  width: 100%;
}
.tfield input:focus { outline: none; border-color: var(--faint); }
</style>
