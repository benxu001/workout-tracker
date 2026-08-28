import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDeleteWorkout, useHistory } from '../lib/queries'
import { groupByExercise, setLine, totalVolume } from '../lib/stats'
import { dayKeyFromIso, fmtDayFull } from '../lib/dates'
import { ExportSheet } from '../components/ExportSheet'
import { AccountSheet } from '../components/AccountSheet'

export function HistoryPage() {
  const { data: workouts = [], isLoading } = useHistory()
  const deleteWorkout = useDeleteWorkout()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">History</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setExportOpen(true)}
            className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm text-zinc-300"
          >
            Export
          </button>
          <button
            onClick={() => setAccountOpen(true)}
            className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm text-zinc-300"
          >
            Account
          </button>
        </div>
      </div>

      {isLoading && <p className="py-20 text-center text-zinc-600">Loading…</p>}

      {!isLoading && workouts.length === 0 && (
        <p className="py-16 text-center text-zinc-500">No workouts yet.</p>
      )}

      {workouts.map((w) => {
        const volume = totalVolume(w.sets)
        return (
          <div key={w.id} className="rounded-2xl bg-zinc-900 p-4">
            <div className="flex items-center justify-between">
              <Link to={`/?day=${dayKeyFromIso(w.started_at)}`} className="font-semibold">
                {fmtDayFull(w.started_at)} <span className="text-zinc-600">›</span>
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">
                  {w.sets.length} sets
                  {volume > 0 && ` · ${Math.round(volume).toLocaleString()} lb`}
                </span>
                <button
                  onClick={() => {
                    if (confirmId === w.id) {
                      deleteWorkout.mutate(w.id)
                      setConfirmId(null)
                    } else {
                      setConfirmId(w.id)
                    }
                  }}
                  className={`text-xs ${
                    confirmId === w.id ? 'font-semibold text-red-400' : 'text-zinc-600'
                  }`}
                >
                  {confirmId === w.id ? 'Confirm?' : '✕'}
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {groupByExercise(w.sets).map((g) => (
                <div key={g.exercise.id} className="flex items-baseline justify-between gap-3">
                  <Link
                    to={`/exercise/${g.exercise.id}`}
                    className="shrink-0 text-sm font-medium text-zinc-200"
                  >
                    {g.exercise.name}
                  </Link>
                  <span className="text-right text-sm text-zinc-500 tabular-nums">
                    {g.sets.map(setLine).join(' · ')}
                  </span>
                </div>
              ))}
            </div>
            {w.note && <p className="mt-3 text-sm italic text-zinc-500">{w.note}</p>}
          </div>
        )
      })}

      {exportOpen && <ExportSheet onClose={() => setExportOpen(false)} />}
      {accountOpen && <AccountSheet onClose={() => setAccountOpen(false)} />}
    </div>
  )
}
