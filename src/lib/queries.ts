import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { dayKeyFromIso, dayRangeFromKey, startedAtForDay } from './dates'
import type { Exercise, MuscleGroup, SetWithWorkout, WorkoutSet, WorkoutWithSets } from './types'

// Exercises embed their muscle groups through the exercise_muscle_groups join
// table; PostgREST resolves the many-to-many automatically. Embedded rows come
// back in join-table order, so sort by the user's group order after fetching.
const EXERCISE_SELECT = '*, muscle_groups(id, name, position)'
const WORKOUT_SELECT = `*, sets(*, exercise:exercises(${EXERCISE_SELECT}))`

function sortGroups<T extends Exercise>(exercise: T): T {
  exercise.muscle_groups.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
  return exercise
}

function useInvalidateAll() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries()
}

// ---------- exercises ----------

export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: async (): Promise<Exercise[]> => {
      const { data, error } = await supabase
        .from('exercises')
        .select(EXERCISE_SELECT)
        .order('position')
        .order('name')
      if (error) throw error
      return (data as unknown as Exercise[]).map(sortGroups)
    },
  })
}

export function useCreateExercise() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async (input: { name: string; muscle_group_ids: string[] }): Promise<Exercise> => {
      const { data: last, error: e1 } = await supabase
        .from('exercises')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
      if (e1) throw e1
      const position = ((last as { position: number }[])[0]?.position ?? -1) + 1
      const { data, error } = await supabase
        .from('exercises')
        .insert({ name: input.name, position })
        .select()
        .single()
      if (error) throw error
      const exercise = data as { id: string }
      if (input.muscle_group_ids.length > 0) {
        const { error: e2 } = await supabase.from('exercise_muscle_groups').insert(
          input.muscle_group_ids.map((gid) => ({
            exercise_id: exercise.id,
            muscle_group_id: gid,
          })),
        )
        if (e2) throw e2
      }
      const { data: full, error: e3 } = await supabase
        .from('exercises')
        .select(EXERCISE_SELECT)
        .eq('id', exercise.id)
        .single()
      if (e3) throw e3
      return sortGroups(full as unknown as Exercise)
    },
    onSuccess: invalidate,
  })
}

export function useReorderExercises() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const results = await Promise.all(
        orderedIds.map((id, i) => supabase.from('exercises').update({ position: i }).eq('id', id)),
      )
      const failed = results.find((r) => r.error)
      if (failed?.error) throw failed.error
    },
    onSuccess: invalidate,
  })
}

export function useUpdateExercise() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async (input: { id: string; name: string; muscle_group_ids: string[] }) => {
      const { error } = await supabase
        .from('exercises')
        .update({ name: input.name })
        .eq('id', input.id)
      if (error) throw error
      const { error: e2 } = await supabase
        .from('exercise_muscle_groups')
        .delete()
        .eq('exercise_id', input.id)
      if (e2) throw e2
      if (input.muscle_group_ids.length > 0) {
        const { error: e3 } = await supabase.from('exercise_muscle_groups').insert(
          input.muscle_group_ids.map((gid) => ({
            exercise_id: input.id,
            muscle_group_id: gid,
          })),
        )
        if (e3) throw e3
      }
    },
    onSuccess: invalidate,
  })
}

// ---------- muscle groups ----------

export function useMuscleGroups() {
  return useQuery({
    queryKey: ['muscle-groups'],
    queryFn: async (): Promise<MuscleGroup[]> => {
      const { data, error } = await supabase
        .from('muscle_groups')
        .select('*')
        .order('position')
        .order('name')
      if (error) throw error
      return data as MuscleGroup[]
    },
  })
}

export function useCreateMuscleGroup() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async (name: string): Promise<MuscleGroup> => {
      const { data: last, error: e1 } = await supabase
        .from('muscle_groups')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
      if (e1) throw e1
      const position = ((last as { position: number }[])[0]?.position ?? -1) + 1
      const { data, error } = await supabase
        .from('muscle_groups')
        .insert({ name, position })
        .select()
        .single()
      if (error) throw error
      return data as MuscleGroup
    },
    onSuccess: invalidate,
  })
}

export function useRenameMuscleGroup() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async (input: { id: string; name: string }) => {
      const { error } = await supabase
        .from('muscle_groups')
        .update({ name: input.name })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeleteMuscleGroup() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async (id: string) => {
      // exercise_muscle_groups rows cascade away with the group.
      const { error } = await supabase.from('muscle_groups').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useReorderMuscleGroups() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const results = await Promise.all(
        orderedIds.map((id, i) =>
          supabase.from('muscle_groups').update({ position: i }).eq('id', id),
        ),
      )
      const failed = results.find((r) => r.error)
      if (failed?.error) throw failed.error
    },
    onSuccess: invalidate,
  })
}

/** Exercise ids ordered by most recently logged, for quick-pick chips. */
export function useRecentExerciseIds() {
  return useQuery({
    queryKey: ['recent-exercises'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('sets')
        .select('exercise_id, logged_at')
        .order('logged_at', { ascending: false })
        .limit(400)
      if (error) throw error
      const seen: string[] = []
      for (const row of data as { exercise_id: string }[]) {
        if (!seen.includes(row.exercise_id)) seen.push(row.exercise_id)
        if (seen.length >= 12) break
      }
      return seen
    },
  })
}

// ---------- workout for a day ----------

export function useWorkoutForDay(day: string) {
  return useQuery({
    queryKey: ['workout', day],
    queryFn: async (): Promise<WorkoutWithSets | null> => {
      const { start, end } = dayRangeFromKey(day)
      const { data, error } = await supabase
        .from('workouts')
        .select(WORKOUT_SELECT)
        .gte('started_at', start)
        .lt('started_at', end)
        .order('started_at', { ascending: false })
        .limit(1)
      if (error) throw error
      const workout = (data as unknown as WorkoutWithSets[])[0] ?? null
      if (workout) workout.sets.sort((a, b) => a.position - b.position)
      return workout
    },
  })
}

export function useLogSet() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async (input: {
      workout: WorkoutWithSets | null
      exerciseId: string
      weight: number
      reps: number
      day: string
    }) => {
      let workoutId = input.workout?.id
      if (!workoutId) {
        const { data, error } = await supabase
          .from('workouts')
          .insert({ started_at: startedAtForDay(input.day) })
          .select()
          .single()
        if (error) throw error
        workoutId = (data as { id: string }).id
      }
      const position =
        Math.max(0, ...(input.workout?.sets.map((s) => s.position) ?? [0])) + 1
      const { error } = await supabase.from('sets').insert({
        workout_id: workoutId,
        exercise_id: input.exerciseId,
        position,
        weight: input.weight,
        reps: input.reps,
        logged_at: startedAtForDay(input.day),
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useUpdateSet() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async (input: {
      id: string
      weight: number
      reps: number
      note: string | null
    }) => {
      const { id, ...fields } = input
      const { error } = await supabase.from('sets').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeleteSet() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useUpdateWorkoutNote() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async (input: { id: string; note: string | null }) => {
      const { error } = await supabase
        .from('workouts')
        .update({ note: input.note })
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeleteWorkout() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workouts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

/** Day keys (local YYYY-MM-DD) that have at least one workout, for the calendar. */
export function useWorkoutDays() {
  return useQuery({
    queryKey: ['workout-days'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('workouts')
        .select('started_at')
        .order('started_at', { ascending: false })
        .limit(400)
      if (error) throw error
      const keys = new Set<string>()
      for (const row of data as { started_at: string }[]) {
        keys.add(dayKeyFromIso(row.started_at))
      }
      return [...keys]
    },
  })
}

export function useDeleteExercise() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: async (id: string) => {
      // Sets reference exercises with ON DELETE RESTRICT, so remove them first,
      // then prune any workouts that end up empty.
      const { data: setRows, error: e1 } = await supabase
        .from('sets')
        .select('workout_id')
        .eq('exercise_id', id)
      if (e1) throw e1
      const workoutIds = [...new Set((setRows as { workout_id: string }[]).map((r) => r.workout_id))]
      const { error: e2 } = await supabase.from('sets').delete().eq('exercise_id', id)
      if (e2) throw e2
      if (workoutIds.length > 0) {
        const { data: remaining, error: e3 } = await supabase
          .from('sets')
          .select('workout_id')
          .in('workout_id', workoutIds)
        if (e3) throw e3
        const stillUsed = new Set((remaining as { workout_id: string }[]).map((r) => r.workout_id))
        const emptyIds = workoutIds.filter((w) => !stillUsed.has(w))
        if (emptyIds.length > 0) {
          const { error: e4 } = await supabase.from('workouts').delete().in('id', emptyIds)
          if (e4) throw e4
        }
      }
      const { error: e5 } = await supabase.from('exercises').delete().eq('id', id)
      if (e5) throw e5
    },
    onSuccess: invalidate,
  })
}

// ---------- history ----------

export function useHistory() {
  return useQuery({
    queryKey: ['history'],
    queryFn: async (): Promise<WorkoutWithSets[]> => {
      const { data, error } = await supabase
        .from('workouts')
        .select(WORKOUT_SELECT)
        .order('started_at', { ascending: false })
        .limit(100)
      if (error) throw error
      const workouts = data as unknown as WorkoutWithSets[]
      for (const w of workouts) w.sets.sort((a, b) => a.position - b.position)
      return workouts
    },
  })
}

// ---------- per-exercise ----------

export interface LastSession {
  date: string
  sets: Pick<WorkoutSet, 'weight' | 'reps' | 'position'>[]
}

/** Most recent session for an exercise strictly before the given ISO timestamp. */
export function useLastSession(exerciseId: string, beforeIso: string) {
  return useQuery({
    queryKey: ['last-session', exerciseId, beforeIso],
    queryFn: async (): Promise<LastSession | null> => {
      const { data, error } = await supabase
        .from('sets')
        .select('workout_id, weight, reps, position, logged_at')
        .eq('exercise_id', exerciseId)
        .lt('logged_at', beforeIso)
        .order('logged_at', { ascending: false })
        .limit(80)
      if (error) throw error
      const rows = data as Pick<
        WorkoutSet,
        'workout_id' | 'weight' | 'reps' | 'position' | 'logged_at'
      >[]
      if (rows.length === 0) return null
      const target = rows[0].workout_id
      const sets = rows
        .filter((r) => r.workout_id === target)
        .sort((a, b) => a.position - b.position)
      return { date: rows[0].logged_at, sets }
    },
  })
}

export function useExerciseDetail(exerciseId: string) {
  return useQuery({
    queryKey: ['exercise-detail', exerciseId],
    queryFn: async (): Promise<{ exercise: Exercise; sets: SetWithWorkout[] }> => {
      const [exRes, setsRes] = await Promise.all([
        supabase.from('exercises').select(EXERCISE_SELECT).eq('id', exerciseId).single(),
        supabase
          .from('sets')
          .select('*, workout:workouts(id, started_at)')
          .eq('exercise_id', exerciseId)
          .order('logged_at', { ascending: true }),
      ])
      if (exRes.error) throw exRes.error
      if (setsRes.error) throw setsRes.error
      return {
        exercise: sortGroups(exRes.data as unknown as Exercise),
        sets: setsRes.data as unknown as SetWithWorkout[],
      }
    },
  })
}
