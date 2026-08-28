export function GroupFilter({
  groups,
  value,
  onChange,
}: {
  groups: string[]
  value: string | null
  onChange: (group: string | null) => void
}) {
  const chip = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm ${
        active
          ? 'border-blue-500/50 bg-blue-500/15 text-blue-300'
          : 'border-zinc-700 text-zinc-400'
      }`}
    >
      {label}
    </button>
  )
  return (
    <div className="flex flex-wrap gap-2">
      {chip('All', value === null, () => onChange(null))}
      {groups.map((g) => chip(g, value === g, () => onChange(value === g ? null : g)))}
    </div>
  )
}
