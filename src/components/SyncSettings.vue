<script setup>
import { ref, computed } from 'vue'
import { useSync } from '../composables/useSync'

const { enabled, user, status, lastSync, errorMsg, signIn, signOut, verifyCode, fullSync } = useSync()

const email = ref('')
const linkSent = ref(false)
const code = ref('')
const verifying = ref(false)

async function onSignIn() {
  if (!email.value.includes('@')) return
  linkSent.value = await signIn(email.value.trim())
}

async function onVerify() {
  if (code.value.trim().length < 6) return
  verifying.value = true
  const ok = await verifyCode(email.value.trim(), code.value)
  verifying.value = false
  if (ok) {
    linkSent.value = false
    code.value = ''
  }
}

const statusText = computed(() => {
  if (status.value === 'syncing') return 'syncing…'
  if (status.value === 'error') return errorMsg.value || 'sync error'
  if (lastSync.value) {
    const h = String(lastSync.value.getHours()).padStart(2, '0')
    const m = String(lastSync.value.getMinutes()).padStart(2, '0')
    return `synced ${h}:${m}`
  }
  return 'connected'
})
</script>

<template>
  <div class="sync">
    <div class="seclabel"><span>Sync</span></div>

    <!-- Supabase env vars not set: stay quiet, app is local-only -->
    <div v-if="!enabled" class="card off">
      <p class="hint">Sync is not configured — the app runs locally on this device only. See the README to enable it.</p>
    </div>

    <!-- signed out: email login -->
    <div v-else-if="!user" class="card">
      <template v-if="linkSent">
        <p class="hint ok">
          Email sent to {{ email }} — long-press the "Sign in" link, Copy Link, and paste it here:
        </p>
        <div class="row">
          <input
            v-model="code" autocomplete="one-time-code" autocapitalize="off"
            placeholder="paste sign-in link (or 6-digit code)" @keydown.enter="onVerify"
          >
          <button class="b" :disabled="verifying" @click="onVerify">
            {{ verifying ? 'Checking…' : 'Verify' }}
          </button>
        </div>
        <p v-if="errorMsg" class="hint err">{{ errorMsg }}</p>
      </template>
      <template v-else>
        <p class="hint">Sign in with your email to sync this device. Same email on every device = same data.</p>
        <div class="row">
          <input
            v-model="email" type="email" placeholder="you@example.com"
            autocomplete="email" @keydown.enter="onSignIn"
          >
          <button class="b" @click="onSignIn">Send login link</button>
        </div>
        <p v-if="errorMsg" class="hint err">{{ errorMsg }}</p>
      </template>
    </div>

    <!-- signed in: status -->
    <div v-else class="card">
      <div class="row between">
        <div class="who">
          <span class="mail">{{ user.email }}</span>
          <span class="st num" :class="{ err: status === 'error' }">{{ statusText }}</span>
        </div>
        <div class="acts">
          <button class="b" @click="fullSync">Sync now</button>
          <button class="b ghost" @click="signOut">Sign out</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sync { margin-top: 26px; }
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 13px;
  padding: 13px 14px;
}
.card.off { border-style: dashed; }
.hint { font-size: 12px; color: var(--faint); line-height: 1.5; }
.hint.ok { color: var(--protein); }
.hint.err { color: var(--over); margin-top: 8px; }

.row { display: flex; gap: 8px; margin-top: 10px; align-items: center; }
.card > .row:first-child { margin-top: 0; }
.row.between { justify-content: space-between; margin-top: 0; }

input {
  flex: 1;
  background: var(--surface2);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--text);
  font-family: var(--disp);
  font-size: 13px;
  padding: 9px 11px;
  min-width: 0;
}
input:focus { outline: none; border-color: var(--faint); }
input::placeholder { color: var(--faint); }

.b {
  background: var(--surface2);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--text);
  font-family: var(--disp);
  font-size: 12px;
  font-weight: 600;
  padding: 9px 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s;
}
.b:hover { border-color: var(--faint); }
.b.ghost { color: var(--muted); }

.who { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.mail { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; }
.st { font-size: 11px; color: var(--protein); }
.st.err { color: var(--over); }
.acts { display: flex; gap: 7px; }
</style>
