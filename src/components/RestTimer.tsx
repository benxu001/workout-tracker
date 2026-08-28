import { useEffect, useState } from 'react'

const STORAGE_KEY = 'rest_timer_ends_at'
const PRESETS = [60, 90, 120, 180, 300]

function fmt(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function loadEndsAt(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

/** Standalone optional rest timer. Never started by logging a set. */
export function RestTimer() {
  const [endsAt, setEndsAt] = useState<number | null>(loadEndsAt)
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (endsAt === null) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endsAt])

  const start = (seconds: number) => {
    const t = Date.now() + seconds * 1000
    setEndsAt(t)
    setOpen(false)
    try {
      localStorage.setItem(STORAGE_KEY, String(t))
    } catch {
      /* ignore */
    }
  }

  const clear = () => {
    setEndsAt(null)
    setOpen(false)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }

  if (endsAt !== null) {
    const remaining = Math.ceil((endsAt - now) / 1000)
    if (remaining <= 0) {
      return (
        <button
          onClick={clear}
          className="animate-pulse rounded-full bg-red-500/20 px-4 py-1.5 text-sm font-semibold text-red-300"
        >
          Rest done — tap to reset
        </button>
      )
    }
    return (
      <div className="flex items-center gap-1.5">
        <span className="rounded-full bg-blue-500/15 px-3 py-1.5 font-mono text-sm font-semibold text-blue-300 tabular-nums">
          {fmt(remaining)}
        </span>
        <button
          onClick={() => {
            if (endsAt === null) return
            const next = endsAt + 30_000
            setEndsAt(next)
            try {
              localStorage.setItem(STORAGE_KEY, String(next))
            } catch {
              /* ignore */
            }
          }}
          className="rounded-full bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-300"
        >
          +30s
        </button>
        <button
          onClick={clear}
          className="grid h-7 w-7 place-items-center rounded-full bg-zinc-800 text-xs text-zinc-400"
          aria-label="Stop timer"
        >
          ✕
        </button>
      </div>
    )
  }

  if (open) {
    return (
      <div className="flex items-center gap-1.5">
        {PRESETS.map((s) => (
          <button
            key={s}
            onClick={() => start(s)}
            className="rounded-full bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200"
          >
            {fmt(s)}
          </button>
        ))}
        <button
          onClick={() => setOpen(false)}
          className="grid h-7 w-7 place-items-center rounded-full bg-zinc-800 text-xs text-zinc-400"
          aria-label="Close timer"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm text-zinc-400"
    >
      ⏱ Rest
    </button>
  )
}
