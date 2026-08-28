import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useUpdateWorkoutNote, useWorkoutForDay } from '../lib/queries'
import { groupByExercise } from '../lib/stats'
import { addDaysKey, fmtHeaderDay, fmtDay, parseDayKey, todayKey } from '../lib/dates'
import { RestTimer } from '../components/RestTimer'
import { ExercisePicker } from '../components/ExercisePicker'
import { ExerciseBlock } from '../components/ExerciseBlock'
import { EditSetSheet } from '../components/EditSetSheet'
import { CalendarSheet } from '../components/CalendarSheet'
import { LoadError } from '../components/LoadError'
import type { Exercise, SetWithExercise } from '../lib/types'

export function LogPage() {
  // The viewed day lives in the URL (?day=YYYY-MM-DD) so other pages can link into it.
  const [searchParams, setSearchParams] = useSearchParams()
  const dayParam = searchParams.get('day')
  const day =
    dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) && dayParam <= todayKey()
      ? dayParam
      : todayKey()
  const setDay = (key: string) =>
    setSearchParams(key === todayKey() ? {} : { day: key }, { replace: true })

  const { data: workout = null, isLoading, isError, error, refetch } = useWorkoutForDay(day)
  const updateNote = useUpdateWorkoutNote()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pending, setPending] = useState<Exercise | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editingSet, setEditingSet] = useState<SetWithExercise | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const groups = groupByExercise(workout?.sets ?? [])
  const isToday = day === todayKey()

  // Reset selection when switching days.
  useEffect(() => {
    setActiveId(null)
    setPending(null)
    setNoteOpen(false)
  }, [day])

  // Once the pending exercise gets its first set, it lives in the workout.
  useEffect(() => {
    if (pending && groups.some((g) => g.exercise.id === pending.id)) {
      setActiveId(pending.id)
      setPending(null)
    }
  }, [pending, groups])

  const effectiveActiveId =
    pending?.id ?? activeId ?? groups[groups.length - 1]?.exercise.id ?? null

  const pick = (exercise: Exercise) => {
    setPickerOpen(false)
    if (groups.some((g) => g.exercise.id === exercise.id)) {
      setActiveId(exercise.id)
    } else {
      setPending(exercise)
    }
  }

  const empty = groups.length === 0 && !pending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => setDay(addDaysKey(day, -1))}
            className="grid h-10 w-9 place-items-center rounded-full text-xl text-zinc-500 active:bg-zinc-900"
            aria-label="Previous day"
          >
            ‹
          </button>
          <button onClick={() => setCalendarOpen(true)} className="px-1 text-center">
            <h1 className="text-xl font-bold">
              {fmtHeaderDay(day)} <span className="text-sm font-normal text-zinc-500">▾</span>
            </h1>
            {(isToday || day === addDaysKey(todayKey(), -1)) && (
              <p className="text-xs text-zinc-500">{fmtDay(parseDayKey(day).toISOString())}</p>
            )}
          </button>
          <button
            onClick={() => setDay(addDaysKey(day, 1))}
            disabled={isToday}
            className="grid h-10 w-9 place-items-center rounded-full text-xl text-zinc-500 active:bg-zinc-900 disabled:opacity-30"
            aria-label="Next day"
          >
            ›
          </button>
        </div>
        <RestTimer />
      </div>

      {!isToday && (
        <button onClick={() => setDay(todayKey())} className="text-sm font-medium text-blue-400">
          ↩ Jump to today
        </button>
      )}

      {isLoading && <p className="py-20 text-center text-zinc-600">Loading…</p>}

      {/* A failed fetch must not render as "No sets logged" — that reads like
          the workout is gone. With stale data cached, keep showing it. */}
      {!isLoading && isError && !workout && <LoadError error={error} onRetry={() => refetch()} />}

      {!isLoading && (workout || !isError) && (
        <>
          {empty && (
            <div className="py-14 text-center">
              <p className="text-lg font-medium text-zinc-300">No sets logged</p>
              <p className="mt-1 text-sm text-zinc-500">
                Add an exercise to start {isToday ? "today's" : 'this'} workout.
              </p>
            </div>
          )}

          {groups.map((g) => (
            <ExerciseBlock
              key={g.exercise.id}
              exercise={g.exercise}
              sets={g.sets}
              workout={workout}
              day={day}
              isActive={effectiveActiveId === g.exercise.id}
              onActivate={() => {
                setActiveId(g.exercise.id)
                setPending(null)
              }}
              onEditSet={setEditingSet}
            />
          ))}

          {pending && (
            <ExerciseBlock
              exercise={pending}
              sets={[]}
              workout={workout}
              day={day}
              isActive
              onActivate={() => {}}
              onEditSet={setEditingSet}
            />
          )}

          <button
            onClick={() => setPickerOpen(true)}
            className={`w-full rounded-2xl py-4 text-lg font-semibold active:scale-[0.98] ${
              empty
                ? 'bg-blue-500 text-white'
                : 'border border-dashed border-zinc-700 text-zinc-300'
            }`}
          >
            ＋ Add exercise
          </button>

          {workout && (
            <div>
              {noteOpen || workout.note ? (
                <>
                  <textarea
                    defaultValue={workout.note ?? ''}
                    placeholder="Workout note"
                    rows={2}
                    onBlur={(e) => {
                      const v = e.target.value.trim() || null
                      if (v !== workout.note) updateNote.mutate({ id: workout.id, note: v })
                    }}
                    className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {updateNote.isError && (
                    <p className="mt-1 text-sm text-red-400">
                      Note not saved — {updateNote.error.message}
                    </p>
                  )}
                </>
              ) : (
                <button onClick={() => setNoteOpen(true)} className="text-sm text-zinc-500">
                  ＋ Add workout note
                </button>
              )}
            </div>
          )}
        </>
      )}

      {pickerOpen && <ExercisePicker onPick={pick} onClose={() => setPickerOpen(false)} />}
      {editingSet && <EditSetSheet set={editingSet} onClose={() => setEditingSet(null)} />}
      {calendarOpen && (
        <CalendarSheet
          value={day}
          onPick={(k) => {
            setDay(k)
            setCalendarOpen(false)
          }}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </div>
  )
}
