import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linkSent, setLinkSent] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = async () => {
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setBusy(false)
    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? "Wrong email or password. If you haven't set a password yet, use the email link below, then set one under Account."
          : error.message,
      )
    }
  }

  const sendLink = async () => {
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin, shouldCreateUser: false },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setLinkSent(true)
  }

  if (loading) {
    return <div className="grid min-h-dvh place-items-center text-zinc-600">Loading…</div>
  }

  if (!session) {
    const canSubmit = email.includes('@') && password.length >= 6 && !busy

    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6">
        <form
          className="w-full space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (canSubmit) signIn()
          }}
        >
          <div className="mb-1">
            <h1 className="text-3xl font-bold">Workout Tracker</h1>
            <p className="mt-1 text-zinc-400">Sign in to your log.</p>
          </div>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="you@example.com"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Password"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-blue-500 py-3.5 text-lg font-semibold text-white active:scale-[0.98] disabled:opacity-40"
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          {linkSent ? (
            <p className="rounded-xl bg-blue-500/10 p-4 text-sm text-blue-300">
              Link sent. Opening it signs you in wherever your default browser is — use it to set
              a password under Account, then sign in here with it.
            </p>
          ) : (
            <button
              type="button"
              onClick={sendLink}
              disabled={!email.includes('@') || busy}
              className="w-full text-sm text-zinc-500 disabled:opacity-40"
            >
              Email me a sign-in link instead
            </button>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      </div>
    )
  }

  return <>{children}</>
}
