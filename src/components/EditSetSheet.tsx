import { useState } from 'react'
import { Sheet } from './Sheet'
import { useDeleteSet, useUpdateSet } from '../lib/queries'
import { fmtWeight } from '../lib/stats'
import { cursorToEnd } from '../lib/inputs'
import type { SetWithExercise } from '../lib/types'

export function EditSetSheet({
  set,
  onClose,
}: {
  set: SetWithExercise
  onClose: () => void
}) {
  const updateSet = useUpdateSet()
  const deleteSet = useDeleteSet()
  const [weight, setWeight] = useState(fmtWeight(set.weight))
  const [reps, setReps] = useState(String(set.reps))
  const [note, setNote] = useState(set.note ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const repsNum = parseInt(reps, 10)
  // Number() rejects trailing garbage where parseFloat would truncate it —
  // invalid text must disable Save, not silently become a bodyweight set.
  const weightNum = Number(weight.trim() || '0')
  const canSave = repsNum > 0 && Number.isFinite(weightNum) && weightNum >= 0

  const save = () => {
    if (!canSave) return
    updateSet.mutate(
      {
        id: set.id,
        weight: weightNum,
        reps: repsNum,
        note: note.trim() || null,
      },
      { onSuccess: onClose },
    )
  }

  const remove = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    deleteSet.mutate(set.id, { onSuccess: onClose })
  }

  return (
    <Sheet title={`Edit set — ${set.exercise.name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex gap-3">
          <label className="flex-1">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              lb
            </span>
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onFocus={cursorToEnd}
              inputMode="decimal"
              className="h-12 w-full rounded-xl bg-zinc-800 text-center text-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="flex-1">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              reps
            </span>
            <input
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              onFocus={cursorToEnd}
              inputMode="numeric"
              className="h-12 w-full rounded-xl bg-zinc-800 text-center text-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          rows={2}
          className="w-full rounded-xl bg-zinc-800 px-4 py-3 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={save}
          disabled={!canSave || updateSet.isPending}
          className="w-full rounded-xl bg-blue-500 py-3.5 text-lg font-semibold text-white active:scale-[0.98] disabled:opacity-40"
        >
          Save
        </button>
        <button
          onClick={remove}
          disabled={deleteSet.isPending}
          className={`w-full rounded-xl py-3 font-medium ${
            confirmDelete ? 'bg-red-500 text-zinc-950' : 'bg-zinc-800 text-red-400'
          }`}
        >
          {confirmDelete ? 'Tap again to delete' : 'Delete set'}
        </button>
        {(updateSet.isError || deleteSet.isError) && (
          <p className="text-sm text-red-400">
            {updateSet.error?.message ?? deleteSet.error?.message}
          </p>
        )}
      </div>
    </Sheet>
  )
}
