import { ref } from "vue";
import { supabase } from "../lib/supabase";
import {
	onWrite,
	read,
	write,
	stampOf,
	dataKeys,
	markDirty,
	getDirty,
	clearDirty,
} from "../lib/kv";

/*
 * Sync engine. Local-first:
 *  - every local write is pushed to Supabase (queued while offline)
 *  - on load / tab focus / coming back online, a full merge runs:
 *    per key, whichever side has the newer timestamp wins
 *
 * Table (see README for the SQL):
 *   kv(user_id uuid, key text, value jsonb, updated_at timestamptz)
 *   primary key (user_id, key), RLS: users only see their own rows.
 */

const enabled = supabase !== null;
const user = ref(null);
const status = ref(enabled ? "signedout" : "off"); // off|signedout|syncing|synced|error
const lastSync = ref(null);
const errorMsg = ref("");

let pushTimer = null;

async function flushDirty() {
	if (!user.value) return;
	const keys = getDirty();
	if (keys.length === 0) return;
	const rows = keys.map((k) => ({
		user_id: user.value.id,
		key: k,
		value: read(k, null),
		updated_at: stampOf(k) || new Date().toISOString(),
	}));
	const { error } = await supabase.from("kv").upsert(rows);
	if (error) throw error;
	clearDirty(keys);
}

async function fullSync() {
	if (!enabled || !user.value) return;
	status.value = "syncing";
	errorMsg.value = "";
	try {
		await flushDirty();

		const { data: rows, error } = await supabase
			.from("kv")
			.select("key,value,updated_at");
		if (error) throw error;

		const remote = new Map(rows.map((r) => [r.key, r]));
		const all = new Set([...dataKeys(), ...remote.keys()]);
		const toPush = [];

		for (const key of all) {
			const r = remote.get(key);
			const localStamp = stampOf(key);
			if (r && (!localStamp || r.updated_at > localStamp)) {
				// Server is newer → take it. Store refs reload via the kv listener.
				write(key, r.value, { source: "remote", stamp: r.updated_at });
			} else if (!r || localStamp > r.updated_at) {
				// This device is newer (or server never saw the key) → push it.
				toPush.push({
					user_id: user.value.id,
					key,
					value: read(key, null),
					updated_at: localStamp || new Date().toISOString(),
				});
			}
			// Equal stamps → already in sync, nothing to do.
		}

		if (toPush.length) {
			const { error: upErr } = await supabase.from("kv").upsert(toPush);
			if (upErr) throw upErr;
		}

		lastSync.value = new Date();
		status.value = "synced";
	} catch (e) {
		status.value = "error";
		errorMsg.value = e.message || "Sync failed";
	}
}

/* Push local writes, debounced so rapid logging becomes one request. */
function schedulePush() {
	clearTimeout(pushTimer);
	pushTimer = setTimeout(async () => {
		try {
			await flushDirty();
			lastSync.value = new Date();
			if (status.value !== "error") status.value = "synced";
		} catch (e) {
			status.value = "error";
			errorMsg.value = e.message || "Push failed";
		}
	}, 1500);
}

/* ---------- auth ---------- */

async function signIn(email) {
	errorMsg.value = "";
	const { error } = await supabase.auth.signInWithOtp({
		email,
		options: { emailRedirectTo: window.location.origin },
	});
	if (error) {
		errorMsg.value = error.message;
		return false;
	}
	return true;
}

async function signOut() {
	await supabase.auth.signOut();
	user.value = null;
	status.value = "signedout";
}

/**
 * Sign in from inside the app (needed in the iPhone PWA, where tapping
 * the email link would open Safari instead). Accepts either the 6-digit
 * code, or the full sign-in link pasted from the email — the link
 * contains a token we can verify directly.
 */
async function verifyCode(email, input) {
	errorMsg.value = "";
	const raw = input.trim();
	let result;
	if (raw.startsWith("http") || raw.includes("token=")) {
		let tokenHash = null;
		try {
			tokenHash = new URL(raw).searchParams.get("token");
		} catch {
			/* not a valid URL */
		}
		if (!tokenHash) {
			errorMsg.value =
				"Couldn't read that link — copy the full sign-in link from the email";
			return false;
		}
		result = await supabase.auth.verifyOtp({
			token_hash: tokenHash,
			type: "email",
		});
		if (result.error) {
			const retry = await supabase.auth.verifyOtp({
				token_hash: tokenHash,
				type: "magiclink",
			});
			if (!retry.error) result = retry;
		}
	} else {
		result = await supabase.auth.verifyOtp({
			email,
			token: raw,
			type: "email",
		});
	}
	if (result.error) {
		errorMsg.value = result.error.message;
		return false;
	}
	return true;
}

/* ---------- module init (runs once) ---------- */

if (enabled) {
	onWrite((key, _value, source) => {
		if (source !== "local") return;
		markDirty(key);
		if (user.value) schedulePush();
	});

	supabase.auth.getSession().then(({ data }) => {
		if (data.session) {
			user.value = data.session.user;
			fullSync();
		}
	});

	supabase.auth.onAuthStateChange((_event, session) => {
		const wasSignedOut = !user.value;
		user.value = session?.user ?? null;
		if (user.value && wasSignedOut) fullSync();
		if (!user.value) status.value = "signedout";
	});

	window.addEventListener("online", () => fullSync());
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible") fullSync();
	});
}

export function useSync() {
	return {
		enabled,
		user,
		status,
		lastSync,
		errorMsg,
		signIn,
		signOut,
		verifyCode,
		fullSync,
	};
}
