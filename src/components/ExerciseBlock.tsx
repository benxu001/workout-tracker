import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDeleteSet, useLastSession, useLogSet } from '../lib/queries'
import { fmtWeight, setLine } from '../lib/stats'
import { dayRangeFromKey, fmtDay } from '../lib/dates'
import { cursorToEnd } from '../lib/inputs'
import type { Exercise, SetWithExercise, WorkoutWithSets } from '../lib/types'

function Stepper({
  value,
  onChange,
  onDirty,
  step,
  label,
  decimals,
}: {
  value: string
  onChange: (v: string) => void
  onDirty: () => void
  step: number
  label: string
  decimals: boolean
}) {
  const bump = (delta: number) => {
    const current = parseFloat(value || '0') || 0
    const next = Math.max(0, Math.round((current + delta) * 100) / 100)
    onDirty()
    onChange(fmtWeight(next))
  }
  return (
    <div className="flex-1">
      <p className="mb-1 text-center text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => bump(-step)}
          className="h-12 w-11 shrink-0 rounded-xl bg-zinc-800 text-lg text-zinc-300 active:bg-zinc-700"
        >
          −
        </button>
        <input
          value={value}
          onChange={(e) => {
            onDirty()
            onChange(e.target.value)
          }}
          onFocus={cursorToEnd}
          inputMode={decimals ? 'decimal' : 'numeric'}
          className="h-12 w-full min-w-0 rounded-xl bg-zinc-800 text-center text-xl font-semibold text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => bump(step)}
          className="h-12 w-11 shrink-0 rounded-xl bg-zinc-800 text-lg text-zinc-300 active:bg-zinc-700"
        >
          ＋
        </button>
      </div>
    </div>
  )
}

export function ExerciseBlock({
  exercise,
  sets,
  workout,
  day,
  isActive,
  onActivate,
  onEditSet,
}: {
  exercise: Exercise
  sets: SetWithExercise[]
  workout: WorkoutWithSets | null
  day: string
  isActive: boolean
  onActivate: () => void
  onEditSet: (set: SetWithExercise) => void
}) {
  const logSet = useLogSet()
  const deleteSet = useDeleteSet()
  const lastSession = useLastSession(exercise.id, dayRangeFromKey(day).start)
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const dirty = useRef(false)
  const lastLogged = sets[sets.length - 1]

  useEffect(() => {
    if (!confirmDeleteId) return
    const t = setTimeout(() => setConfirmDeleteId(null), 2500)
    return () => clearTimeout(t)
  }, [confirmDeleteId])

  // Prefill from this day's last set whenever one is logged.
  useEffect(() => {
    if (lastLogged) {
      setWeight(fmtWeight(lastLogged.weight))
      setReps(String(lastLogged.reps))
      dirty.current = false
    }
  }, [sets.length, lastLogged?.id])

  // Before the first set, prefill from the last session's first set.
  useEffect(() => {
    if (!lastLogged && !dirty.current && lastSession.data) {
      const first = lastSession.data.sets[0]
      setWeight(fmtWeight(first.weight))
      setReps(String(first.reps))
    }
  }, [lastSession.data, lastLogged])

  const repsNum = parseInt(reps, 10)
  // Number() rejects trailing garbage where parseFloat would truncate it —
  // "185x" must disable the button, not silently log a bodyweight set.
  const weightNum = Number(weight.trim() || '0')
  const canLog =
    repsNum > 0 && Number.isFinite(weightNum) && weightNum >= 0 && !logSet.isPending

  const log = () => {
    if (!canLog) return
    logSet.mutate({
      workout,
      exerciseId: exercise.id,
      weight: weightNum,
      reps: repsNum,
      day,
    })
  }

  return (
    <div className="rounded-2xl bg-zinc-900 p-4">
      <div className="flex items-center justify-between" onClick={onActivate}>
        <Link
          to={`/exercise/${exercise.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-lg font-semibold"
        >
          {exercise.name} <span className="text-zinc-600">›</span>
        </Link>
        <span className="text-sm text-zinc-500">
          {sets.length} {sets.length === 1 ? 'set' : 'sets'}
        </span>
      </div>

      {sets.length > 0 && (
        <div className="mt-3 space-y-1">
          {sets.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <button
                onClick={() => onEditSet(s)}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-1.5 text-left active:bg-zinc-800"
              >
                <span className="w-5 text-sm text-zinc-600">{i + 1}</span>
                <span className="font-medium tabular-nums">
                  {s.weight > 0 ? `${fmtWeight(s.weight)} lb × ${s.reps}` : `BW × ${s.reps}`}
                </span>
                {s.note && <span className="truncate text-xs text-zinc-500">{s.note}</span>}
              </button>
              <button
                onClick={() => {
                  if (confirmDeleteId === s.id) {
                    deleteSet.mutate(s.id)
                    setConfirmDeleteId(null)
                  } else {
                    setConfirmDeleteId(s.id)
                  }
                }}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-sm ${
                  confirmDeleteId === s.id
                    ? 'bg-red-500/15 text-xs font-semibold text-red-400'
                    : 'text-zinc-600 active:bg-zinc-800'
                }`}
              >
                {confirmDeleteId === s.id ? 'Sure?' : '✕'}
              </button>
            </div>
          ))}
        </div>
      )}

      {isActive && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-zinc-500">
            {lastSession.isLoading
              ? '…'
              : lastSession.data
                ? `Last time (${fmtDay(lastSession.data.date)}): ${lastSession.data.sets
                    .map(setLine)
                    .join(' · ')}`
              : 'First time doing this — set the bar.'}
          </p>
          <div className="flex gap-3">
            <Stepper
              value={weight}
              onChange={setWeight}
              onDirty={() => (dirty.current = true)}
              step={5}
              label="lb"
              decimals
            />
            <Stepper
              value={reps}
              onChange={setReps}
              onDirty={() => (dirty.current = true)}
              step={1}
              label="reps"
              decimals={false}
            />
          </div>
          <button
            onClick={log}
            disabled={!canLog}
            className="w-full rounded-xl bg-blue-500 py-3.5 text-lg font-semibold text-white active:scale-[0.98] disabled:opacity-40"
          >
            {logSet.isPending ? 'Logging…' : 'Log set'}
          </button>
        </div>
      )}

      {(logSet.isError || deleteSet.isError) && (
        <p className="mt-2 text-sm text-red-400">
          {logSet.error?.message ?? deleteSet.error?.message}
        </p>
      )}
    </div>
  )
}
