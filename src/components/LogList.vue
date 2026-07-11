<script setup>
import { computed } from 'vue'
import { useIntake } from '../composables/useIntake'

const { entries, staples, removeEntry, duplicateEntry, addStaple } = useIntake()

const reversed = computed(() => entries.value.slice().reverse())

// Already saved as a staple? (same name + macros)
function isStaple(e) {
  return staples.value.some(
    (s) => s.name === e.name && s.kcal === e.kcal && s.protein === e.protein
  )
}
</script>

<template>
  <div>
    <div class="seclabel"><span>Log</span></div>
    <div class="log">
      <div v-if="entries.length === 0" class="empty">
        Nothing logged yet. <b>Tap a staple</b> or add a food above.
      </div>
      <div v-for="e in reversed" :key="e.id" class="row">
        <span class="name">{{ e.name }}</span>
        <span class="m num">{{ e.kcal }}</span>
        <span class="m p num">{{ e.protein }}g</span>
        <button
          class="ic" :class="{ saved: isStaple(e) }"
          :aria-label="isStaple(e) ? 'Saved as staple' : 'Save as staple'"
          :title="isStaple(e) ? 'Saved as staple' : 'Save as staple'"
          @click="!isStaple(e) && addStaple(e.name, e.kcal, e.protein)"
        >★</button>
        <button class="ic" aria-label="Log again" title="Log again" @click="duplicateEntry(e.id)">⧉</button>
        <button class="ic del" aria-label="Remove" title="Remove" @click="removeEntry(e.id)">✕</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.log {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid var(--line);
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--surface);
  padding: 13px 14px;
  animation: in 0.25s ease;
}
@keyframes in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: none; }
}
.row .name {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row .m { font-size: 13px; color: var(--muted); min-width: 46px; text-align: right; }
.row .m.p { color: var(--protein); }
.ic {
  background: none;
  border: none;
  color: var(--faint);
  font-size: 15px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 6px;
  line-height: 1;
  transition: color 0.15s, background 0.15s;
}
.ic:hover { color: var(--text); background: var(--surface2); }
.ic.saved { color: var(--protein); cursor: default; }
.ic.saved:hover { background: none; }
.ic.del:hover { color: var(--over); }
.empty {
  background: var(--surface);
  padding: 26px 16px;
  text-align: center;
  color: var(--faint);
  font-size: 13px;
}
.empty b { color: var(--muted); font-weight: 600; }
</style>
