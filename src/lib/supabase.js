import { createClient } from '@supabase/supabase-js'

/*
 * Configured via environment variables (in .env.local for dev, and in
 * your hosting dashboard for the deployed app):
 *
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 *
 * When these are absent, `supabase` is null and the app runs 100% local —
 * sync UI shows "not configured" and nothing else changes.
 */

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && anonKey ? createClient(url, anonKey) : null
