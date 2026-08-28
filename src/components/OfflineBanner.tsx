import { useEffect, useState } from 'react'

/**
 * The app shell is cached, so it opens without a connection — but the data
 * comes from Supabase. Say so rather than showing empty screens.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="mb-3 rounded-xl bg-amber-500/10 px-4 py-2.5 text-sm text-amber-300">
      Offline — showing what was already loaded. New sets can't be saved yet.
    </div>
  )
}
