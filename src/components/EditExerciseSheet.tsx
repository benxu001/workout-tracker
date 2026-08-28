import { useState } from 'react'
import { Sheet } from './Sheet'
import { MuscleGroupPicker } from './MuscleGroupPicker'
import { useDeleteExercise, useUpdateExercise } from '../lib/queries'
import type { Exercise } from '../lib/types'

export function EditExerciseSheet({
  exercise,
  setCount,
  onClose,
  onDeleted,
}: {
  exercise: Exercise
  setCount: number
  onClose: () => void
  onDeleted: () => void
}) {
  const updateExercise = useUpdateExercise()
  const deleteExercise = useDeleteExercise()
  const [name, setName] = useState(exercise.name)
  const [groups, setGroups] = useState<string[]>(exercise.muscle_groups.map((g) => g.id))
  const [confirmDelete, setConfirmDelete] = useState(false)

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    updateExercise.mutate(
      { id: exercise.id, name: trimmed, muscle_group_ids: groups },
      { onSuccess: onClose },
    )
  }

  const remove = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    deleteExercise.mutate(exercise.id, {
      onSuccess: () => {
        onClose()
        onDeleted()
      },
    })
  }

  return (
    <Sheet title="Edit exercise" onClose={onClose}>
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
            Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-lg font-semibold text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Muscle groups
          </p>
          <MuscleGroupPicker selected={groups} onChange={setGroups} />
        </div>
        <button
          onClick={save}
          disabled={!name.trim() || updateExercise.isPending}
          className="w-full rounded-xl bg-blue-500 py-3.5 text-lg font-semibold text-white active:scale-[0.98] disabled:opacity-40"
        >
          Save
        </button>
        <button
          onClick={remove}
          disabled={deleteExercise.isPending}
          className={`w-full rounded-xl py-3 font-medium ${
            confirmDelete ? 'bg-red-500 text-white' : 'bg-zinc-800 text-red-400'
          }`}
        >
          {deleteExercise.isPending
            ? 'Deleting…'
            : confirmDelete
              ? setCount > 0
                ? `Tap again — deletes ${setCount} logged ${setCount === 1 ? 'set' : 'sets'} too`
                : 'Tap again to permanently delete'
              : 'Delete exercise'}
        </button>
        {(updateExercise.isError || deleteExercise.isError) && (
          <p className="text-sm text-red-400">
            {updateExercise.error?.message ?? deleteExercise.error?.message}
          </p>
        )}
      </div>
    </Sheet>
  )
}
