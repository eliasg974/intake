<script setup>
import { ref } from 'vue'
import { useIntake } from '../composables/useIntake'

const { addEntry } = useIntake()

const name = ref('')
const kcal = ref('')
const prot = ref('')
const nameInput = ref(null)   // template ref for refocusing after add
const kcalInput = ref(null)

function submit() {
  const k = parseFloat(kcal.value) || 0
  const p = parseFloat(prot.value) || 0
  if (!name.value.trim() && !k && !p) return
  addEntry(name.value.trim(), k, p)
  name.value = ''
  kcal.value = ''
  prot.value = ''
  nameInput.value?.focus()
}
</script>

<template>
  <div>
    <div class="seclabel"><span>Add food</span></div>
    <div class="manual">
      <input
        ref="nameInput" v-model="name"
        placeholder="Food" autocomplete="off"
        @keydown.enter="kcalInput?.focus()"
      >
      <input
        ref="kcalInput" v-model="kcal"
        class="n num" placeholder="kcal" inputmode="numeric"
      >
      <input
        v-model="prot"
        class="n num" placeholder="prot" inputmode="numeric"
        @keydown.enter="submit"
      >
      <button class="addbtn" aria-label="Add food" @click="submit">+</button>
    </div>
  </div>
</template>

<style scoped>
.manual {
  display: grid;
  grid-template-columns: 1fr 64px 64px auto;
  gap: 8px;
  margin-bottom: 26px;
}
.manual input {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 11px;
  color: var(--text);
  font-size: 14px;
  padding: 11px 12px;
  font-family: var(--disp);
}
.manual input.n { text-align: center; padding: 11px 6px; }
.manual input:focus { outline: none; border-color: var(--faint); }
.manual input::placeholder { color: var(--faint); }
.addbtn {
  background: var(--protein);
  border: none;
  border-radius: 11px;
  color: #0E0F13;
  font-weight: 700;
  font-size: 20px;
  line-height: 1;
  padding: 0 15px;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.08s;
}
.addbtn:hover { opacity: 0.9; }
.addbtn:active { transform: scale(0.94); }

@media (max-width: 400px) {
  .manual { grid-template-columns: 1fr 56px 56px auto; }
}
</style>
