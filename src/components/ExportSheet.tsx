import { useState } from 'react'
import { Sheet } from './Sheet'
import { downloadFile, exportFilename, fetchExport, toCsv } from '../lib/export'

export function ExportSheet({ onClose }: { onClose: () => void }) {
  const [busy, setBusy] = useState<'json' | 'csv' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const run = async (kind: 'json' | 'csv') => {
    setBusy(kind)
    setError(null)
    setDone(null)
    try {
      const bundle = await fetchExport()
      if (kind === 'json') {
        downloadFile(
          exportFilename('json'),
          JSON.stringify(bundle, null, 2),
          'application/json',
        )
      } else {
        downloadFile(exportFilename('csv'), toCsv(bundle), 'text/csv')
      }
      setDone(`${bundle.sets.length} sets across ${bundle.workouts.length} workouts`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <Sheet title="Export data" onClose={onClose}>
      <div className="space-y-3">
        <button
          onClick={() => run('json')}
          disabled={busy !== null}
          className="w-full rounded-xl bg-blue-500 py-3.5 text-lg font-semibold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {busy === 'json' ? 'Preparing…' : 'Download JSON backup'}
        </button>
        <p className="text-xs text-zinc-500">
          Complete copy of every exercise, workout, and set — the file to keep if you ever need
          to restore.
        </p>
        <button
          onClick={() => run('csv')}
          disabled={busy !== null}
          className="w-full rounded-xl bg-zinc-800 py-3.5 text-lg font-semibold text-zinc-100 active:scale-[0.98] disabled:opacity-50"
        >
          {busy === 'csv' ? 'Preparing…' : 'Download CSV'}
        </button>
        <p className="text-xs text-zinc-500">
          One row per set with estimated 1RM — opens in Numbers, Excel, or Sheets.
        </p>
        {done && <p className="text-sm text-blue-300">Exported {done}.</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </Sheet>
  )
}
