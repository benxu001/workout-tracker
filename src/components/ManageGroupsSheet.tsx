import { useEffect, useState } from 'react'
import { Sheet } from './Sheet'
import { GripIcon } from './GripIcon'
import { useDragReorder } from '../lib/useDragReorder'
import {
  useCreateMuscleGroup,
  useDeleteMuscleGroup,
  useExercises,
  useMuscleGroups,
  useRenameMuscleGroup,
  useReorderMuscleGroups,
} from '../lib/queries'

export function ManageGroupsSheet({ onClose }: { onClose: () => void }) {
  const { data: groups = [] } = useMuscleGroups()
  const { data: exercises = [] } = useExercises()
  const createGroup = useCreateMuscleGroup()
  const renameGroup = useRenameMuscleGroup()
  const deleteGroup = useDeleteMuscleGroup()
  const reorder = useReorderMuscleGroups()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { items, dragIndex, rowRef, handleProps, dragStyle } = useDragReorder(
    groups,
    (ids) => reorder.mutate(ids),
    { isPending: reorder.isPending, disabled: editingId !== null },
  )

  useEffect(() => {
    if (!confirmDeleteId) return
    const t = setTimeout(() => setConfirmDeleteId(null), 2500)
    return () => clearTimeout(t)
  }, [confirmDeleteId])

  const usage = (id: string) =>
    exercises.filter((e) => e.muscle_groups.some((g) => g.id === id)).length

  const saveRename = (id: string, oldName: string) => {
    const next = editText.trim()
    if (!next || next === oldName) {
      setEditingId(null)
      return
    }
    renameGroup.mutate({ id, name: next }, { onSuccess: () => setEditingId(null) })
  }

  const addGroup = () => {
    const name = newName.trim()
    if (!name) return
    createGroup.mutate(name, { onSuccess: () => setNewName('') })
  }

  const iconBtn =
    'grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 active:bg-zinc-800'

  return (
    <Sheet title="Muscle groups" onClose={onClose}>
      <div className={dragIndex !== null ? 'select-none' : undefined}>
        {items.map((g, i) =>
          editingId === g.id ? (
            <div key={g.id} className="flex items-center gap-2 py-2">
              <input
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveRename(g.id, g.name)}
                className="min-w-0 flex-1 rounded-xl bg-zinc-800 px-4 py-2 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => saveRename(g.id, g.name)}
                disabled={renameGroup.isPending}
                className="shrink-0 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Save
              </button>
              <button onClick={() => setEditingId(null)} className={iconBtn}>
                ✕
              </button>
            </div>
          ) : (
            <div
              key={g.id}
              ref={rowRef(g.id)}
              style={dragStyle(i)}
              className={`relative flex items-center gap-1 py-1.5 ${
                dragIndex === i
                  ? 'rounded-xl bg-zinc-800 shadow-lg shadow-black/40'
                  : 'border-b border-zinc-800'
              }`}
            >
              <div
                {...handleProps(i)}
                className="grid h-9 w-8 shrink-0 cursor-grab touch-none place-items-center text-zinc-600 active:cursor-grabbing"
                aria-label={`Reorder ${g.name}`}
              >
                <GripIcon />
              </div>
              <span className="min-w-0 flex-1 truncate font-medium">
                {g.name}{' '}
                <span className="text-xs font-normal text-zinc-500">({usage(g.id)})</span>
              </span>
              <button
                onClick={() => {
                  setEditingId(g.id)
                  setEditText(g.name)
                }}
                className={iconBtn}
              >
                ✎
              </button>
              <button
                onClick={() => {
                  if (confirmDeleteId === g.id) {
                    deleteGroup.mutate(g.id)
                    setConfirmDeleteId(null)
                  } else {
                    setConfirmDeleteId(g.id)
                  }
                }}
                disabled={deleteGroup.isPending}
                className={
                  confirmDeleteId === g.id
                    ? 'shrink-0 rounded-lg bg-red-500/15 px-2 py-2 text-xs font-semibold text-red-400'
                    : iconBtn
                }
              >
                {confirmDeleteId === g.id
                  ? usage(g.id) > 0
                    ? `Untag ${usage(g.id)}?`
                    : 'Sure?'
                  : '✕'}
              </button>
            </div>
          ),
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addGroup()}
          placeholder="New group name"
          className="min-w-0 flex-1 rounded-xl bg-zinc-800 px-4 py-2.5 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={addGroup}
          disabled={!newName.trim() || createGroup.isPending}
          className="shrink-0 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {(createGroup.isError || renameGroup.isError || deleteGroup.isError || reorder.isError) && (
        <p className="mt-2 text-sm text-red-400">
          {createGroup.error?.message ??
            renameGroup.error?.message ??
            deleteGroup.error?.message ??
            reorder.error?.message}
        </p>
      )}
      <p className="mt-3 text-xs text-zinc-500">
        Drag the handle to reorder. Deleting a group removes its tag from all exercises.
      </p>
    </Sheet>
  )
}
