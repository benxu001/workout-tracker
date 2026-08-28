# Workout Tracker

Single-user lifting log. A React PWA on Vercel over Supabase Postgres, used
from a phone at the gym. There is exactly one user; do not add multi-user
concepts, sharing, or roles.

## Stack and layout

- Vite + React 19 + TypeScript, Tailwind v4, React Router, TanStack Query
- Supabase Postgres accessed directly from the browser with `@supabase/supabase-js`
- `src/lib/queries.ts` holds every query and mutation hook. Data access lives
  here, not in components.
- `src/lib/stats.ts` (Epley 1RM, grouping, formatting), `src/lib/dates.ts`
  (local day keys), `src/lib/export.ts` (JSON/CSV backup)
- `src/pages/` = tab screens, `src/components/` = sheets and widgets
- `api/keepalive.ts` is a Vercel edge function, not app code

## Verify before claiming done

```bash
npx tsc --noEmit && npm run build
```

There are no tests. Verify UI changes in a browser at phone width; the app is
never used on a desktop.

## Deploying

Push to `main` and Vercel deploys automatically. Do not run `vercel --prod`:
it ships local uncommitted state and drifts the live site from the repo.

## Database

Project ref `gsecgbymaulbupeorkiq`. Schema snapshot in `supabase/schema.sql`.

Migrations are applied through the Supabase API, so there is no migration
history in the repo and no `supabase/migrations/`. After any schema change,
update `supabase/schema.sql` by hand in the same commit, or the repo stops
describing reality.

**Row-level security is the whole security model.** Every table allows access
only where the JWT email equals the owner's. The publishable key ships in the
client bundle by design. A new table without an equivalent policy returns
empty results instead of an error, which reads like a broken query.

Schema notes that are easy to get wrong:

- `sets.position` orders sets within a workout, not within an exercise. Set
  numbers shown per exercise are derived at render time.
- Weight `0` means bodyweight. Show `BW`, and leave estimated 1RM blank rather
  than printing 0.
- `exercises.position` and `muscle_groups.position` hold the user's custom
  drag order and drive chip and list order everywhere.
- Exercises tag muscle groups through the `exercise_muscle_groups` join table.
  Renaming a group is a single-row update; deleting one cascades the join
  rows away. Reads embed the groups via PostgREST
  (`exercises.select('*, muscle_groups(...)')`) and sort them by the group's
  `position` client-side, since embedded rows come back unordered.
- Deleting an exercise is blocked by `on delete restrict` from `sets`. The
  delete flow removes its sets first, then prunes workouts left empty.
- Backdated entries are stamped at noon local; today's use the current time.
  This keeps ordering sane without a separate date column.

## Auth

Email plus password (`signInWithPassword`). Sessions persist in local storage.

Magic links were tried and abandoned: tapping one on a phone opens the default
browser, so the session lands there instead of in the installed PWA. A 6-digit
code was tried next and also abandoned, because Supabase requires custom SMTP
before email templates can be edited, and the built-in template carries no
token. Do not reintroduce either without setting up an email provider first.

The email link remains only as a way to reach the Account sheet and set a new
password.

## Offline

A generated service worker precaches the app shell so the PWA opens with no
signal. Supabase responses are deliberately not cached: stale lifting numbers
are worse than an honest failure. Logging still requires a connection, and
`OfflineBanner` says so.

Full offline-first logging was scoped and declined. It would need
client-generated UUIDs, a replayable mutation queue, and a visible sync state;
revisit only if the gym turns out to have no signal.

## Vercel specifics

`vercel.json` rewrites everything except `/api` to `index.html` for client-side
routes. Static files still win over that rewrite, which is why `/sw.js` serves
correctly.

A daily cron pings `/api/keepalive` so the free-tier Supabase project never
hits its 7-day inactivity pause, which would otherwise need a dashboard click
to undo. Setting the `CRON_SECRET` env var makes the route reject anything
without Vercel's bearer header; leaving it unset keeps the route open on
purpose, since a stopped keepalive is worse than a pingable endpoint.

## Conventions

- Blue (`blue-500`) is the accent; the UI is dark-only and mobile-only.
- Destructive actions confirm by tapping twice, with the second tap naming the
  consequence. They never use a modal.
- Weights are pounds throughout. There is no unit conversion anywhere.
- Reorderable lists share the `useDragReorder` hook; do not write a second
  drag implementation.
- Sheets whose whole purpose is typing something new (new exercise, new group,
  rename) autofocus their input. Search fields never do: the exercise picker
  opens on the plain list so you can browse and filter without the keyboard
  covering it, and it has no recent-exercises shortcut by choice.
