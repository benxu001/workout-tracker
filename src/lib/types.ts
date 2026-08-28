export interface MuscleGroup {
  id: string
  name: string
  position: number
}

export interface Exercise {
  id: string
  name: string
  muscle_groups: MuscleGroup[]
  position: number
  created_at: string
}

export interface Workout {
  id: string
  started_at: string
  note: string | null
}

export interface WorkoutSet {
  id: string
  workout_id: string
  exercise_id: string
  position: number
  weight: number
  reps: number
  note: string | null
  logged_at: string
}

export interface SetWithExercise extends WorkoutSet {
  exercise: Exercise
}

export interface WorkoutWithSets extends Workout {
  sets: SetWithExercise[]
}

export interface SetWithWorkout extends WorkoutSet {
  workout: Pick<Workout, 'id' | 'started_at'>
}
