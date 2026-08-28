import { fetchAllRows, supabase } from './supabase'
import { dayKeyFromIso, todayKey } from './dates'
import type { Exercise, MuscleGroup, Workout, WorkoutSet } from './types'

// Exercises are exported as raw table rows, so muscle group tags live in the
// exercise_muscle_groups rows, mirroring the database.
type ExerciseRow = Omit<Exercise, 'muscle_groups'>

export interface ExerciseMuscleGroup {
  exercise_id: string
  muscle_group_id: string
}

export interface ExportBundle {
  exported_at: string
  app: 'workout-tracker'
  version: 2
  muscle_groups: MuscleGroup[]
  exercises: ExerciseRow[]
  exercise_muscle_groups: ExerciseMuscleGroup[]
  workouts: Workout[]
  sets: WorkoutSet[]
}

/**
 * Every row in the database, for a complete offline backup. Each table is
 * paged with fetchAllRows: a plain select stops at PostgREST's max-rows cap
 * (1000), which would quietly truncate the backup once sets outgrow it.
 */
export async function fetchExport(): Promise<ExportBundle> {
  const [muscle_groups, exercises, exercise_muscle_groups, workouts, sets] = await Promise.all([
    fetchAllRows<MuscleGroup>((from, to) =>
      supabase.from('muscle_groups').select('*').order('position').order('id').range(from, to),
    ),
    fetchAllRows<ExerciseRow>((from, to) =>
      supabase.from('exercises').select('*').order('position').order('id').range(from, to),
    ),
    fetchAllRows<ExerciseMuscleGroup>((from, to) =>
      supabase
        .from('exercise_muscle_groups')
        .select('*')
        .order('exercise_id')
        .order('muscle_group_id')
        .range(from, to),
    ),
    fetchAllRows<Workout>((from, to) =>
      supabase.from('workouts').select('*').order('started_at').order('id').range(from, to),
    ),
    fetchAllRows<WorkoutSet>((from, to) =>
      supabase
        .from('sets')
        .select('*')
        .order('logged_at')
        .order('position')
        .order('id')
        .range(from, to),
    ),
  ])

  return {
    exported_at: new Date().toISOString(),
    app: 'workout-tracker',
    version: 2,
    muscle_groups,
    exercises,
    exercise_muscle_groups,
    workouts,
    sets,
  }
}

function csvCell(value: string | number | null): string {
  if (value === null) return ''
  let s = String(value)
  // Spreadsheets execute cells starting with = + - @ as formulas. Only text
  // fields can carry one (numbers here are never negative), so neutralize
  // with a leading apostrophe, which Excel/Sheets hide on display.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** One row per set, ordered oldest first — opens cleanly in any spreadsheet. */
export function toCsv(bundle: ExportBundle): string {
  const exercises = new Map(bundle.exercises.map((e) => [e.id, e]))
  const workouts = new Map(bundle.workouts.map((w) => [w.id, w]))
  const tagged = new Set(
    bundle.exercise_muscle_groups.map((t) => `${t.exercise_id}:${t.muscle_group_id}`),
  )
  // bundle.muscle_groups is already in the user's chip order.
  const groupNames = (exerciseId: string) =>
    bundle.muscle_groups
      .filter((g) => tagged.has(`${exerciseId}:${g.id}`))
      .map((g) => g.name)
      .join(' | ')

  const header = [
    'date',
    'exercise',
    'muscle_groups',
    'set',
    'weight_lb',
    'reps',
    'est_1rm_lb',
    'set_note',
    'workout_note',
  ]

  const perWorkoutExerciseCount = new Map<string, number>()
  const rows = [...bundle.sets]
    .sort((a, b) => a.logged_at.localeCompare(b.logged_at) || a.position - b.position)
    .map((s) => {
      const exercise = exercises.get(s.exercise_id)
      const workout = workouts.get(s.workout_id)
      const key = `${s.workout_id}:${s.exercise_id}`
      const setNumber = (perWorkoutExerciseCount.get(key) ?? 0) + 1
      perWorkoutExerciseCount.set(key, setNumber)
      // Bodyweight sets have no meaningful 1RM, so leave the cell empty.
      const e1rm =
        s.weight > 0 ? Math.round(s.weight * (s.reps > 1 ? 1 + s.reps / 30 : 1) * 10) / 10 : null

      return [
        // Local day, matching the app's day buckets — slicing the ISO string
        // would give the UTC date, off by one for evening workouts.
        workout ? dayKeyFromIso(workout.started_at) : '',
        exercise?.name ?? '',
        exercise ? groupNames(exercise.id) : '',
        setNumber,
        s.weight,
        s.reps,
        e1rm,
        s.note,
        workout?.note ?? '',
      ]
        .map(csvCell)
        .join(',')
    })

  return [header.join(','), ...rows].join('\n')
}

export function downloadFile(filename: string, contents: string, mime: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

export const exportFilename = (ext: string) => `workout-tracker-${todayKey()}.${ext}`
