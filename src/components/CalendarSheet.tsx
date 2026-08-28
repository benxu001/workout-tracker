import { useMemo, useState } from 'react'
import { Sheet } from './Sheet'
import { useWorkoutDays } from '../lib/queries'
import { dayKey, parseDayKey, todayKey } from '../lib/dates'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function CalendarSheet({
  value,
  onPick,
  onClose,
}: {
  value: string
  onPick: (day: string) => void
  onClose: () => void
}) {
  const { data: days = [] } = useWorkoutDays()
  const workoutDays = useMemo(() => new Set(days), [days])
  const [month, setMonth] = useState(() => {
    const d = parseDayKey(value)
    d.setDate(1)
    return d
  })

  const today = todayKey()
  const year = month.getFullYear()
  const monthIdx = month.getMonth()
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate()
  const firstDow = new Date(year, monthIdx, 1).getDay()
  const now = new Date()
  const atCurrentMonth = year === now.getFullYear() && monthIdx === now.getMonth()

  const shiftMonth = (n: number) => {
    const d = new Date(year, monthIdx + n, 1)
    setMonth(d)
  }

  return (
    <Sheet title="Pick a day" onClose={onClose}>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => shiftMonth(-1)}
          className="grid h-10 w-10 place-items-center rounded-full text-xl text-zinc-400 active:bg-zinc-800"
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="font-semibold">
          {month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </p>
        <button
          onClick={() => shiftMonth(1)}
          disabled={atCurrentMonth}
          className="grid h-10 w-10 place-items-center rounded-full text-xl text-zinc-400 active:bg-zinc-800 disabled:opacity-30"
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <p key={i} className="pb-1 text-xs font-medium text-zinc-500">
            {d}
          </p>
        ))}
        {Array.from({ length: firstDow }, (_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const key = dayKey(new Date(year, monthIdx, i + 1))
          const disabled = key > today
          const selected = key === value
          const hasWorkout = workoutDays.has(key)
          return (
            <button
              key={key}
              disabled={disabled}
              onClick={() => onPick(key)}
              className={`relative mx-auto grid h-10 w-10 place-items-center rounded-full text-sm ${
                selected
                  ? 'bg-blue-500 font-semibold text-white'
                  : disabled
                    ? 'text-zinc-700'
                    : key === today
                      ? 'font-semibold text-blue-400 active:bg-zinc-800'
                      : 'text-zinc-200 active:bg-zinc-800'
              }`}
            >
              {i + 1}
              {hasWorkout && !selected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-blue-400" />
              )}
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500">Dotted days have workouts.</p>
    </Sheet>
  )
}
