import { useState } from 'react'
import { Sheet } from './Sheet'
import { MuscleGroupPicker } from './MuscleGroupPicker'
import { useCreateExercise } from '../lib/queries'

export function NewExerciseSheet({ onClose }: { onClose: () => void }) {
  const createExercise = useCreateExercise()
  const [name, setName] = useState('')
  const [groups, setGroups] = useState<string[]>([])

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    createExercise.mutate({ name: trimmed, muscle_group_ids: groups }, { onSuccess: onClose })
  }

  return (
    <Sheet title="New exercise" onClose={onClose}>
      <div className="space-y-4">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exercise name"
          className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-lg font-semibold text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Muscle groups
          </p>
          <MuscleGroupPicker selected={groups} onChange={setGroups} />
        </div>
        <button
          onClick={save}
          disabled={!name.trim() || createExercise.isPending}
          className="w-full rounded-xl bg-blue-500 py-3.5 text-lg font-semibold text-white active:scale-[0.98] disabled:opacity-40"
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
