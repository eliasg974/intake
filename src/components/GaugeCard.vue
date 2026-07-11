<script setup>
import { computed } from 'vue'

/*
 * One reusable gauge. The two behaviours differ:
 *  - protein: hitting the target is GOOD  → green "target hit ✓"
 *  - kcal:    exceeding the target is BAD → red bar + "over budget"
 * `mode` switches between them.
 */
const props = defineProps({
  label: { type: String, required: true },
  value: { type: Number, required: true },
  target: { type: Number, required: true },
  unit: { type: String, required: true },
  mode: { type: String, default: 'build' }, // 'build' (protein) | 'budget' (kcal)
  hero: { type: Boolean, default: false },
})

const pct = computed(() => (props.target > 0 ? (props.value / props.target) * 100 : 0))
const width = computed(() => Math.min(100, pct.value) + '%')
const remaining = computed(() => props.target - props.value)
const over = computed(() => props.mode === 'budget' && props.value > props.target)
const hit = computed(() => props.mode === 'build' && props.target > 0 && props.value >= props.target)

const footLeft = computed(() => {
  if (props.mode === 'build') {
    return remaining.value > 0
      ? `${remaining.value} ${props.unit} to go`
      : `${Math.abs(remaining.value)} ${props.unit} over target`
  }
  return remaining.value >= 0
    ? `${remaining.value} ${props.unit} left`
    : `${Math.abs(remaining.value)} ${props.unit} over`
})

const footTag = computed(() => {
  if (hit.value) return 'target hit ✓'
  if (over.value) return 'over budget'
  return props.target > 0 ? Math.round(pct.value) + '%' : ''
})
</script>

<template>
  <div class="gauge" :class="{ hero }">
    <div class="grow">
      <div class="glabel">{{ label }}</div>
      <div class="gval">
        <span class="big num">{{ value }}</span>
        <span class="sep">/</span>
        <span class="tgt num">{{ target }}</span>
        <span class="unit">{{ unit }}</span>
      </div>
    </div>
    <div class="track">
      <div
        class="fill"
        :class="[mode === 'build' ? 'p' : 'k', { over }]"
        :style="{ width }"
      ></div>
    </div>
    <div class="gfoot">
      <span class="left">{{ footLeft }}</span>
      <span class="tag" :class="{ hit, overtag: over, pace: !hit && !over }">{{ footTag }}</span>
    </div>
  </div>
</template>

<style scoped>
.gauge {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px 18px;
}
.gauge.hero { padding: 18px 20px; }

.grow {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
}
.glabel {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}
.gval { display: flex; align-items: baseline; gap: 6px; }
.gval .big { font-size: 30px; font-weight: 600; line-height: 1; }
.gauge.hero .gval .big { font-size: 38px; }
.gval .sep { font-family: var(--mono); font-size: 16px; color: var(--faint); }
.gval .tgt { font-size: 16px; color: var(--muted); }
.gval .unit { font-size: 12px; color: var(--muted); margin-left: 1px; }

.track {
  height: 10px;
  background: var(--surface2);
  border-radius: 6px;
  overflow: hidden;
}
.gauge.hero .track { height: 13px; }
.fill {
  height: 100%;
  width: 0;
  border-radius: 6px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.fill.p { background: var(--protein); }
.fill.k { background: var(--kcal); }
.fill.over { background: var(--over); }

.gfoot {
  display: flex;
  justify-content: space-between;
  margin-top: 9px;
  font-size: 12px;
}
.gfoot .left { color: var(--muted); font-family: var(--mono); }
.gfoot .tag { font-weight: 600; letter-spacing: 0.02em; }
.tag.hit { color: var(--protein); }
.tag.overtag { color: var(--over); }
.tag.pace { color: var(--faint); }
</style>
