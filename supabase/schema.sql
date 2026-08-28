-- Snapshot of the live schema for project gsecgbymaulbupeorkiq.
--
-- Migrations were applied through the Supabase API rather than the CLI, so
-- this file is a hand-maintained reference, not a migration history. It is
-- the only record of the schema outside the hosted database: keep it in sync
-- when you change tables, and it is enough to rebuild the project from
-- scratch alongside a JSON export from the app's Export button.

create table public.muscle_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create unique index muscle_groups_name_key on public.muscle_groups (lower(name));

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_groups text[] not null default '{}',
  position int not null default 0,
  created_at timestamptz not null default now()
);
create unique index exercises_name_key on public.exercises (lower(name));

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  note text
);

create table public.sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position int not null,
  weight numeric(6,2) not null default 0 check (weight >= 0),
  reps int not null check (reps between 1 and 1000),
  note text,
  logged_at timestamptz not null default now()
);
create index sets_exercise_time_idx on public.sets (exercise_id, logged_at desc);
create index sets_workout_idx on public.sets (workout_id, position);

-- Single-owner access. Every table is readable and writable only by this
-- email; a new table without an equivalent policy returns empty results
-- rather than an error, which is a confusing way to lose an afternoon.
alter table public.muscle_groups enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.sets enable row level security;

create policy owner_all_muscle_groups on public.muscle_groups for all to authenticated
  using ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com');

create policy owner_all_exercises on public.exercises for all to authenticated
  using ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com');

create policy owner_all_workouts on public.workouts for all to authenticated
  using ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com');

create policy owner_all_sets on public.sets for all to authenticated
  using ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com');

-- Renaming a muscle group has to rewrite the text[] tag on every exercise,
-- since exercises store group names rather than foreign keys.
create or replace function public.rename_muscle_group(old_name text, new_name text)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.exercises
  set muscle_groups = array_replace(muscle_groups, old_name, new_name)
  where old_name = any(muscle_groups);
$$;

create or replace function public.remove_muscle_group_from_exercises(gname text)
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.exercises
  set muscle_groups = array_remove(muscle_groups, gname)
  where gname = any(muscle_groups);
$$;
