# Intake

Daily protein + kcal tracker. Vue 3 + Vite, data stored in `localStorage` (no backend, no account — everything stays in your browser).

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

Production build:

```bash
npm run build     # outputs to dist/
npm run preview   # test the built version locally
```

## Structure

```
src/
  main.js                    entry point
  App.vue                    layout, wires components together
  styles/base.css            design tokens + shared classes
  utils/dates.js             date key / label helpers
  composables/useIntake.js   THE store — all state, persistence, actions
  components/
    DateNav.vue              header + prev/next day navigation
    GaugeCard.vue            reusable gauge (protein=build, kcal=budget)
    WeekView.vue             last-7-days bars, hit count, averages
    TargetsEditor.vue        edit protein/kcal targets
    QuickAdd.vue             staple chips + "Edit staples" remove mode
    ManualAdd.vue            name/kcal/protein form
    LogList.vue              day log: ★ save as staple, ⧉ log again, ✕ delete
```

The key pattern to study is `useIntake.js`: module-scoped `ref`s shared by
every component that calls `useIntake()`, with `watch`ers that persist to
`localStorage`. It's the poor-man's Pinia — if the app grows, moving to
Pinia is a drop-in change.

## Storage keys

- `intake:targets` — `{ protein, kcal }`
- `intake:staples` — array of quick-add foods
- `intake:log:YYYY-MM-DD` — one array of entries per day

## Roadmap ideas

- Per-100g entry mode (macros per 100g + grams eaten → auto math)
- CSV export of all days
- Daily weight log + trend line in the week view
- Food search via Open Food Facts API (has BE products, barcode data)
- PWA manifest + service worker → installable on iPhone home screen

## Sync + iPhone setup (one-time)

### 1. Supabase (the sync backend)

1. Create a free project at supabase.com.
2. SQL Editor → run:

```sql
create table kv (
  user_id uuid not null default auth.uid(),
  key text not null,
  value jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
alter table kv enable row level security;
create policy "own rows" on kv
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

3. Settings → API: copy the Project URL and anon public key.
4. Locally: `cp .env.example .env.local`, paste both values, restart `npm run dev`.
5. Authentication → URL Configuration: add your deployed URL (and
   http://localhost:5173 for dev) to the redirect allow list.

### 2. Deploy (needed so your phone can reach the app)

1. Push this folder to a GitHub repo.
2. On Cloudflare Pages / Netlify / Vercel: import the repo,
   build command `npm run build`, output directory `dist`.
3. In the host's dashboard, add the two `VITE_SUPABASE_*` env vars.
4. Deploy → you get an HTTPS URL. Every `git push` redeploys.

### 3. Connect devices

1. Open the deployed URL on the Mac → Sync section → sign in with
   your email (magic link).
2. iPhone Safari → same URL → sign in with the SAME email →
   Share → Add to Home Screen.
3. Done. Log on one device, open the other, it pulls on focus.

### How sync behaves

- Local-first: the app always works offline; changes queue and push
  when back online.
- Merge is per key (per day), newest timestamp wins.
- Sign out never deletes local data — it just stops syncing.
