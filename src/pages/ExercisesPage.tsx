import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useExercises, useMuscleGroups, useReorderExercises } from '../lib/queries'
import { useDragReorder } from '../lib/useDragReorder'
import { GroupFilter } from '../components/GroupFilter'
import { GripIcon } from '../components/GripIcon'
import { NewExerciseSheet } from '../components/NewExerciseSheet'
import { ManageGroupsSheet } from '../components/ManageGroupsSheet'

export function ExercisesPage() {
  const { data: exercises = [], isLoading } = useExercises()
  const { data: allGroups = [] } = useMuscleGroups()
  const reorder = useReorderExercises()
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<string | null>(null)
  const [newOpen, setNewOpen] = useState(false)
  const [groupsOpen, setGroupsOpen] = useState(false)
  const [reorderMode, setReorderMode] = useState(false)

  const q = search.trim().toLowerCase()
  // Reordering only makes sense against the full list, not a filtered subset,
  // so entering the mode clears both and any later filtering leaves it.
  const canReorder = reorderMode && q === '' && groupFilter === null
  const { items, dragIndex, rowRef, handleProps, dragStyle } = useDragReorder(
    exercises,
    (ids) => reorder.mutate(ids),
    { isPending: reorder.isPending, disabled: !canReorder },
  )

  const usedGroups = useMemo(
    () =>
      allGroups
        .filter((g) => exercises.some((e) => e.muscle_groups.some((mg) => mg.id === g.id)))
        .map((g) => g.name),
    [allGroups, exercises],
  )

  const visible = items
    .filter((e) => (q ? e.name.toLowerCase().includes(q) : true))
    .filter((e) => (groupFilter ? e.muscle_groups.some((g) => g.name === groupFilter) : true))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Exercises</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setGroupsOpen(true)}
            className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm text-zinc-300"
          >
            Groups
          </button>
          <button
            onClick={() => setNewOpen(true)}
            className="rounded-full bg-blue-500 px-4 py-1.5 text-sm font-semibold text-white"
          >
            ＋ New
          </button>
        </div>
      </div>
      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setReorderMode(false)
        }}
        placeholder="Search"
        className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
      />
      <GroupFilter
        groups={usedGroups}
        value={groupFilter}
        onChange={(g) => {
          setGroupFilter(g)
          setReorderMode(false)
        }}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {canReorder ? 'Drag the handles to set your order.' : `${exercises.length} exercises`}
        </p>
        <button
          onClick={() => {
            if (reorderMode) {
              setReorderMode(false)
            } else {
              setSearch('')
              setGroupFilter(null)
              setReorderMode(true)
            }
          }}
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            reorderMode
              ? 'bg-blue-500 text-white'
              : 'border border-zinc-700 text-zinc-400'
          }`}
        >
          {reorderMode ? 'Done' : 'Reorder'}
        </button>
      </div>
      {isLoading ? (
        <p className="py-20 text-center text-zinc-600">Loading…</p>
      ) : (
        <div
          className={`rounded-2xl bg-zinc-900 px-2 ${dragIndex !== null ? 'select-none' : ''}`}
        >
          {visible.map((e) => {
            const i = items.indexOf(e)
            const dragging = dragIndex === i
            return (
              <div
                key={e.id}
                ref={rowRef(e.id)}
                style={dragStyle(i)}
                className={`relative flex items-center ${
                  dragging
                    ? 'rounded-xl bg-zinc-800 shadow-lg shadow-black/40'
                    : 'border-b border-zinc-800/70 last:border-0'
                }`}
              >
                {canReorder && (
                  <div
                    {...handleProps(i)}
                    className="grid h-11 w-8 shrink-0 cursor-grab touch-none place-items-center text-zinc-600 active:cursor-grabbing"
                    aria-label={`Reorder ${e.name}`}
                  >
                    <GripIcon />
                  </div>
                )}
                <Link
                  to={`/exercise/${e.id}`}
                  className={`flex min-w-0 flex-1 items-center justify-between gap-3 py-3.5 ${
                    canReorder ? 'pr-2' : 'px-2'
                  }`}
                >
                  <span className="truncate font-medium">{e.name}</span>
                  <span className="shrink-0 text-right text-xs text-zinc-500">
                    {e.muscle_groups.map((g) => g.name).join(' · ')}{' '}
                    <span className="text-zinc-600">›</span>
                  </span>
                </Link>
              </div>
            )
          })}
          {visible.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-500">No matches.</p>
          )}
        </div>
      )}
      {newOpen && <NewExerciseSheet onClose={() => setNewOpen(false)} />}
      {groupsOpen && <ManageGroupsSheet onClose={() => setGroupsOpen(false)} />}
    </div>
  )
}
