/**
 * Honest failure state for a page-level query. Without it a fetch error
 * renders as an empty day or list, which reads like the data is gone.
 */
export function LoadError({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-red-400">Couldn't load — {error?.message ?? 'request failed'}</p>
      <button
        onClick={onRetry}
        className="mt-3 rounded-full border border-zinc-700 px-4 py-1.5 text-sm font-medium text-blue-400"
      >
        Retry
      </button>
    </div>
  )
}
