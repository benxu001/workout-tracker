import type { Exercise, SetWithExercise, WorkoutSet } from './types'

/** Epley estimated 1RM. For 1 rep, the weight itself. */
export function epley(weight: number, reps: number): number {
  return reps > 1 ? weight * (1 + reps / 30) : weight
}

export function fmtWeight(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100)
}

/** "185×8" or "BW×12" for weight 0. */
export function setLine(s: Pick<WorkoutSet, 'weight' | 'reps'>): string {
  return s.weight > 0 ? `${fmtWeight(s.weight)}×${s.reps}` : `BW×${s.reps}`
}

export interface ExerciseGroup {
  exercise: Exercise
  sets: SetWithExercise[]
}

/** Group a workout's sets by exercise, ordered by each exercise's first set. */
export function groupByExercise(sets: SetWithExercise[]): ExerciseGroup[] {
  const map = new Map<string, ExerciseGroup>()
  for (const s of [...sets].sort((a, b) => a.position - b.position)) {
    const entry = map.get(s.exercise_id)
    if (entry) entry.sets.push(s)
    else map.set(s.exercise_id, { exercise: s.exercise, sets: [s] })
  }
  return [...map.values()]
}

export function totalVolume(sets: Pick<WorkoutSet, 'weight' | 'reps'>[]): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0)
}