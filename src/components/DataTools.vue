<script setup>
import { ref } from 'vue'
import { useIntake } from '../composables/useIntake'

const { exportData, importData } = useIntake()

const fileInput = ref(null)
const status = ref('')       // feedback line under the buttons
const statusKind = ref('ok') // 'ok' | 'err'

let statusTimer
function flash(msg, kind = 'ok') {
  status.value = msg
  statusKind.value = kind
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => { status.value = '' }, 4000)
}

function onExport() {
  exportData()
  flash('Backup downloaded')
}

async function onFilePicked(e) {
  const file = e.target.files?.[0]
  e.target.value = '' // allow re-picking the same file later
  if (!file) return
  try {
    const days = await importData(file)
    flash(`Restored ${days} day${days === 1 ? '' : 's'} of logs`)
  } catch (err) {
    flash(err.message || 'Import failed', 'err')
  }
}
</script>

<template>
  <div class="data">
    <div class="seclabel"><span>Data</span></div>
    <div class="btns">
      <button class="b" @click="onExport">Download backup</button>
      <button class="b" @click="fileInput?.click()">Restore backup</button>
      <input
        ref="fileInput" type="file" accept="application/json,.json"
        class="hidden" @change="onFilePicked"
      >
    </div>
    <p v-if="status" class="status" :class="statusKind">{{ status }}</p>
    <p v-else class="hint">Backups are JSON files with all your targets, staples and daily logs.</p>
  </div>
</template>

<style scoped>
.data { margin-top: 26px; }
.btns { display: flex; gap: 9px; }
.b {
  flex: 1;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--text);
  font-family: var(--disp);
  font-size: 13px;
  font-weight: 600;
  padding: 11px 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.b:hover { border-color: var(--faint); background: var(--surface2); }
.hidden { display: none; }
.status, .hint {
  margin-top: 8px;
  font-size: 12px;
  font-family: var(--mono);
}
.hint { color: var(--faint); }
.status.ok { color: var(--protein); }
.status.err { color: var(--over); }
</style>
