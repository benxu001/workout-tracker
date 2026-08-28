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
  position int not null default 0,
  created_at timestamptz not null default now()
);
create unique index exercises_name_key on public.exercises (lower(name));

-- Which muscle groups an exercise trains. Deleting either side removes the
-- link, so a group delete needs no cleanup pass over exercises.
create table public.exercise_muscle_groups (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  muscle_group_id uuid not null references public.muscle_groups(id) on delete cascade,
  primary key (exercise_id, muscle_group_id)
);
create index exercise_muscle_groups_group_idx
  on public.exercise_muscle_groups (muscle_group_id);

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
alter table public.exercise_muscle_groups enable row level security;
alter table public.workouts enable row level security;
alter table public.sets enable row level security;

create policy owner_all_muscle_groups on public.muscle_groups for all to authenticated
  using ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com');

create policy owner_all_exercises on public.exercises for all to authenticated
  using ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com');

create policy owner_all_exercise_muscle_groups on public.exercise_muscle_groups
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com');

create policy owner_all_workouts on public.workouts for all to authenticated
  using ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com');

create policy owner_all_sets on public.sets for all to authenticated
  using ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'ben.xu01@gmail.com');
