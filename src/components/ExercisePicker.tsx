import { useMemo, useState } from 'react'
import { Sheet } from './Sheet'
import { GroupFilter } from './GroupFilter'
import { MuscleGroupPicker } from './MuscleGroupPicker'
import { useCreateExercise, useExercises, useMuscleGroups } from '../lib/queries'
import type { Exercise } from '../lib/types'

export function ExercisePicker({
  onPick,
  onClose,
}: {
  onPick: (exercise: Exercise) => void
  onClose: () => void
}) {
  const { data: exercises = [] } = useExercises()
  const { data: allGroups = [] } = useMuscleGroups()
  const createExercise = useCreateExercise()
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<string | null>(null)
  const [creating, setCreating] = useState<string | null>(null)
  const [groups, setGroups] = useState<string[]>([])

  const q = search.trim().toLowerCase()
  const usedGroups = useMemo(
    () =>
      allGroups
        .filter((g) => exercises.some((e) => e.muscle_groups.some((mg) => mg.id === g.id)))
        .map((g) => g.name),
    [allGroups, exercises],
  )
  const filtered = useMemo(
    () =>
      exercises
        .filter((e) => (q ? e.name.toLowerCase().includes(q) : true))
        .filter((e) =>
          groupFilter ? e.muscle_groups.some((g) => g.name === groupFilter) : true,
        ),
    [exercises, q, groupFilter],
  )
  const exactMatch = exercises.some((e) => e.name.toLowerCase() === q)

  if (creating !== null) {
    return (
      <Sheet title="New exercise" onClose={onClose}>
        <div className="space-y-4">
          <p className="rounded-xl bg-zinc-800 px-4 py-3 text-lg font-semibold">{creating}</p>
          <div>
            <p className="mb-2 text-sm text-zinc-400">Muscle groups</p>
            <MuscleGroupPicker selected={groups} onChange={setGroups} />
          </div>
          <button
            disabled={createExercise.isPending}
            onClick={() =>
              createExercise.mutate(
                { name: creating, muscle_group_ids: groups },
                { onSuccess: (exercise) => onPick(exercise) },
              )
            }
            className="w-full rounded-xl bg-blue-500 py-3.5 text-lg font-semibold text-white active:scale-[0.98] disabled:opacity-50"
          >
            Add exercise
          </button>
          {createExercise.isError && (
            <p className="text-sm text-red-400">{createExercise.error.message}</p>
          )}
        </div>
      </Sheet>
    )
  }

  return (
    <Sheet title="Add exercise" onClose={onClose}>
      <div className="space-y-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search or type a new name"
          className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <GroupFilter groups={usedGroups} value={groupFilter} onChange={setGroupFilter} />
        <div className="divide-y divide-zinc-800">
          {filtered.map((e) => (
            <button
              key={e.id}
              onClick={() => onPick(e)}
              className="flex w-full items-center justify-between gap-3 py-3 text-left"
            >
              <span className="font-medium">{e.name}</span>
              <span className="text-right text-xs text-zinc-500">
                {e.muscle_groups.map((g) => g.name).join(' · ')}
              </span>
            </button>
          ))}
          {q && !exactMatch && (
            <button
              onClick={() => {
                setCreating(search.trim())
                setGroups([])
              }}
              className="w-full py-3 text-left font-medium text-blue-400"
            >
              ＋ Create “{search.trim()}”
            </button>
          )}
          {filtered.length === 0 && !q && (
            <p className="py-3 text-sm text-zinc-500">No exercises match.</p>
          )}
        </div>
      </div>
    </Sheet>
  )
}
