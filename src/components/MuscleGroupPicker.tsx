import { useMemo, useState } from 'react'
import { useCreateMuscleGroup, useMuscleGroups } from '../lib/queries'

/** Multi-select muscle group chips with the option to add new groups to the catalog. */
export function MuscleGroupPicker({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (groups: string[]) => void
}) {
  const { data: allGroups = [] } = useMuscleGroups()
  const createGroup = useCreateMuscleGroup()
  const [customOpen, setCustomOpen] = useState(false)
  const [custom, setCustom] = useState('')

  const options = useMemo(() => {
    const names = allGroups.map((g) => g.name)
    return [...names, ...selected.filter((g) => !names.includes(g))]
  }, [allGroups, selected])

  const toggle = (g: string) =>
    onChange(selected.includes(g) ? selected.filter((x) => x !== g) : [...selected, g])

  const addCustom = () => {
    const name = custom.trim()
    if (!name) return
    const existing = options.find((o) => o.toLowerCase() === name.toLowerCase())
    if (existing) {
      if (!selected.includes(existing)) onChange([...selected, existing])
      setCustom('')
      setCustomOpen(false)
      return
    }
    createGroup.mutate(name, {
      onSuccess: (group) => {
        onChange([...selected, group.name])
        setCustom('')
        setCustomOpen(false)
      },
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((g) => (
          <button
            key={g}
            onClick={() => toggle(g)}
            className={`rounded-full border px-3.5 py-1.5 text-sm ${
              selected.includes(g)
                ? 'border-blue-500/50 bg-blue-500/15 text-blue-300'
                : 'border-zinc-700 text-zinc-300'
            }`}
          >
            {g}
          </button>
        ))}
        {!customOpen && (
          <button
            onClick={() => setCustomOpen(true)}
            className="rounded-full border border-dashed border-zinc-600 px-3.5 py-1.5 text-sm text-zinc-400"
          >
            ＋ New group
          </button>
        )}
      </div>
      {customOpen && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder="e.g. Traps"
            className="min-w-0 flex-1 rounded-xl bg-zinc-800 px-4 py-2.5 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addCustom}
            disabled={createGroup.isPending}
            className="shrink-0 rounded-xl bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-100 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
      {createGroup.isError && (
        <p className="text-sm text-red-400">{createGroup.error.message}</p>
      )}
    </div>
  )
}
