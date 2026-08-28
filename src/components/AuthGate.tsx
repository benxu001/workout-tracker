import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="grid min-h-dvh place-items-center text-zinc-600">Loading…</div>
  }

  if (!session) {
    const sendLink = async () => {
      setError(null)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      })
      if (error) setError(error.message)
      else setSent(true)
    }
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6">
        <div className="w-full space-y-5">
          <div>
            <h1 className="text-3xl font-bold">Workout Tracker</h1>
            <p className="mt-1 text-zinc-400">Sign in with a magic link.</p>
          </div>
          {sent ? (
            <p className="rounded-xl bg-blue-500/10 p-4 text-blue-300">
              Link sent — check your email on this device and tap it.
            </p>
          ) : (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputMode="email"
                autoComplete="email"
                className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
              <button
                onClick={sendLink}
                disabled={!email.includes('@')}
                className="w-full rounded-xl bg-blue-500 py-3.5 text-lg font-semibold text-white active:scale-[0.98] disabled:opacity-40"
              >
                Send magic link
              </button>
            </>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
