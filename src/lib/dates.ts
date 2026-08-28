export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export const todayKey = () => dayKey(new Date())

export const dayKeyFromIso = (iso: string) => dayKey(new Date(iso))

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDaysKey(key: string, n: number): string {
  const d = parseDayKey(key)
  d.setDate(d.getDate() + n)
  return dayKey(d)
}

export function dayRangeFromKey(key: string): { start: string; end: string } {
  const start = parseDayKey(key)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.toISOString(), end: end.toISOString() }
}

/** Timestamp for a workout/set on the given day: now for today, noon for past days. */
export function startedAtForDay(key: string): string {
  if (key === todayKey()) return new Date().toISOString()
  const d = parseDayKey(key)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

export function fmtDay(iso: string): string {
  const d = new Date(iso)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = '2-digit'
  return d.toLocaleDateString(undefined, opts)
}

export function fmtDayFull(iso: string): string {
  const d = new Date(iso)
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric'
  return d.toLocaleDateString(undefined, opts)
}

export function fmtHeaderDay(key: string): string {
  if (key === todayKey()) return 'Today'
  if (key === addDaysKey(todayKey(), -1)) return 'Yesterday'
  return fmtDayFull(parseDayKey(key).toISOString())
}
