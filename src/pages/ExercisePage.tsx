import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useExerciseDetail } from '../lib/queries'
import { epley, fmtWeight, setLine, totalVolume } from '../lib/stats'
import { dayKeyFromIso, fmtDay, fmtDayFull } from '../lib/dates'
import { ProgressChart, type ChartPoint } from '../components/ProgressChart'
import { EditExerciseSheet } from '../components/EditExerciseSheet'
import type { SetWithWorkout } from '../lib/types'

type Metric = 'e1rm' | 'top' | 'volume'

interface Session {
  workoutId: string
  started_at: string
  sets: SetWithWorkout[]
}

function groupSessions(sets: SetWithWorkout[]): Session[] {
  const map = new Map<string, Session>()
  for (const s of sets) {
    const entry = map.get(s.workout_id)
    if (entry) entry.sets.push(s)
    else map.set(s.workout_id, { workoutId: s.workout_id, started_at: s.workout.started_at, sets: [s] })
  }
  return [...map.values()].sort(
    (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
  )
}

const METRICS: { key: Metric; label: string; unit: string }[] = [
  { key: 'e1rm', label: 'Est 1RM', unit: 'lb' },
  { key: 'top', label: 'Top set', unit: 'lb' },
  { key: 'volume', label: 'Volume', unit: 'lb' },
]

export function ExercisePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data, isLoading } = useExerciseDetail(id)
  const [metric, setMetric] = useState<Metric>('e1rm')
  const [editOpen, setEditOpen] = useState(false)

  const sessions = useMemo(() => groupSessions(data?.sets ?? []), [data?.sets])
  const bodyweightOnly =
    sessions.length > 0 && sessions.every((s) => s.sets.every((x) => x.weight === 0))

  const chartData: ChartPoint[] = useMemo(
    () =>
      sessions.map((s) => {
        let value: number
        if (bodyweightOnly) value = Math.max(...s.sets.map((x) => x.reps))
        else if (metric === 'e1rm') value = Math.max(...s.sets.map((x) => epley(x.weight, x.reps)))
        else if (metric === 'top') value = Math.max(...s.sets.map((x) => x.weight))
        else value = totalVolume(s.sets)
        return { label: fmtDay(s.started_at), value: Math.round(value * 10) / 10 }
      }),
    [sessions, metric, bodyweightOnly],
  )

  if (isLoading) return <p className="py-20 text-center text-zinc-600">Loading…</p>
  if (!data) return <p className="py-20 text-center text-zinc-500">Exercise not found.</p>

  const allSets = data.sets
  const best = allSets.length
    ? allSets.reduce((a, b) => (epley(b.weight, b.reps) > epley(a.weight, a.reps) ? b : a))
    : null

  return (
    <div className="space-y-4">
      <div>
        <button onClick={() => navigate(-1)} className="mb-2 text-sm text-zinc-500">
          ‹ Back
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{data.exercise.name}</h1>
            {data.exercise.muscle_groups.length > 0 && (
              <p className="mt-0.5 text-sm text-zinc-500">
                {data.exercise.muscle_groups.join(' · ')}
              </p>
            )}
          </div>
          <button
            onClick={() => setEditOpen(true)}
            className="shrink-0 rounded-full border border-zinc-700 px-4 py-1.5 text-sm text-zinc-300"
          >
            Edit
          </button>
        </div>
      </div>

      {best && (
        <div className="flex gap-3 text-sm">
          <div className="flex-1 rounded-xl bg-zinc-900 p-3">
            <p className="text-zinc-500">Sessions</p>
            <p className="mt-0.5 text-lg font-semibold">{sessions.length}</p>
          </div>
          <div className="flex-1 rounded-xl bg-zinc-900 p-3">
            <p className="text-zinc-500">Best set</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums">{setLine(best)}</p>
          </div>
          {!bodyweightOnly && (
            <div className="flex-1 rounded-xl bg-zinc-900 p-3">
              <p className="text-zinc-500">Est 1RM</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {fmtWeight(Math.round(epley(best.weight, best.reps)))} lb
              </p>
            </div>
          )}
        </div>
      )}

      {!bodyweightOnly ? (
        <div className="flex rounded-xl bg-zinc-900 p-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium ${
                metric === m.key ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      ) : (
        sessions.length > 0 && (
          <p className="text-sm text-zinc-500">Bodyweight exercise — charting best reps per session.</p>
        )
      )}

      <ProgressChart data={chartData} unit={bodyweightOnly ? 'reps' : 'lb'} />

      <div className="space-y-3">
        {[...sessions].reverse().map((s) => (
          <Link
            key={s.workoutId}
            to={`/?day=${dayKeyFromIso(s.started_at)}`}
            className="block rounded-2xl bg-zinc-900 p-4 active:bg-zinc-800"
          >
            <p className="flex items-center justify-between text-sm font-semibold text-zinc-300">
              {fmtDayFull(s.started_at)}
              <span className="text-zinc-600">›</span>
            </p>
            <p className="mt-1 text-zinc-400 tabular-nums">{s.sets.map(setLine).join(' · ')}</p>
          </Link>
        ))}
        {sessions.length === 0 && (
          <p className="py-10 text-center text-sm text-zinc-500">
            Never logged — add it from the Log tab.
          </p>
        )}
      </div>

      {editOpen && (
        <EditExerciseSheet
          exercise={data.exercise}
          setCount={allSets.length}
          onClose={() => setEditOpen(false)}
          onDeleted={() => navigate('/exercises')}
        />
      )}
    </div>
  )
}
