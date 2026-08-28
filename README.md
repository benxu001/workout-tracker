# Workout Tracker

A lifting log built for myself. Kept super simple and barebones, just the exact 
functionality I wanted without all the extra fluff from other workout trackers.

About 3,000 lines of TypeScript. There is exactly one user by design: no
accounts to manage, no sharing, no roles. That assumption is what keeps it
small.

## What it does

- Log sets against exercises, with weight, reps, and an optional note
- Backdate a workout you forgot to enter
- Per-exercise history with an estimated 1RM chart (Epley)
- Custom exercises and muscle groups, both drag-reorderable
- Rest timer
- JSON and CSV export of everything
- Opens and shows the shell with no signal; logging needs a connection

## Stack

Vite, React 19, TypeScript, Tailwind v4, React Router, TanStack Query, and
Recharts. Supabase Postgres is queried straight from the browser with
`@supabase/supabase-js`; there is no backend of my own beyond one Vercel
edge function that pings the database daily so the free tier does not pause.

Access control is entirely row-level security: every table allows access
only where the JWT email matches the owner's. The publishable key ships in
the client bundle, which is fine, and is why the policies have to be right.

## Layout

```
src/lib/queries.ts   every query and mutation hook; data access lives here
src/lib/stats.ts     1RM math, grouping, formatting
src/pages/           the tab screens
src/components/      sheets and widgets
supabase/schema.sql  tables, indexes, and RLS policies
api/keepalive.ts     Vercel cron target, not app code
```

## Running it

You need a Supabase project with `supabase/schema.sql` applied, and the
owner email in the RLS policies changed from the placeholder to yours.

```bash
npm install
echo 'VITE_SUPABASE_URL=...' >> .env.local
echo 'VITE_SUPABASE_ANON_KEY=...' >> .env.local
npm run dev
```

## Notes

[AGENTS.md](AGENTS.md) records the decisions the code cannot explain on its
own: why magic links and emailed codes were both abandoned, why Supabase
responses are deliberately never cached, and why full offline-first logging
was scoped and declined. It is the more interesting file if you are here to
read rather than to run.
