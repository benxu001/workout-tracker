import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const EMAIL_KEY = 'pending_auth_email'

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const verifiedFor = useRef<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Survive a reload between requesting the code and entering it.
  useEffect(() => {
    try {
      const pending = localStorage.getItem(EMAIL_KEY)
      if (pending) {
        setEmail(pending)
        setStep('code')
      }
    } catch {
      /* storage unavailable; start from the email step */
    }
  }, [])

  const sendCode = async () => {
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    try {
      localStorage.setItem(EMAIL_KEY, email.trim())
    } catch {
      /* not fatal */
    }
    setCode('')
    setStep('code')
  }

  const verify = async (token: string) => {
    if (verifiedFor.current === token) return
    verifiedFor.current = token
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: 'email',
    })
    setBusy(false)
    if (error) {
      setError(error.message)
      setCode('')
      verifiedFor.current = null
      return
    }
    try {
      localStorage.removeItem(EMAIL_KEY)
    } catch {
      /* not fatal */
    }
  }

  const onCodeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    setError(null)
    if (digits.length === 6) verify(digits)
  }

  const startOver = () => {
    try {
      localStorage.removeItem(EMAIL_KEY)
    } catch {
      /* not fatal */
    }
    setStep('email')
    setCode('')
    setError(null)
    verifiedFor.current = null
  }

  if (loading) {
    return <div className="grid min-h-dvh place-items-center text-zinc-600">Loading…</div>
  }

  if (!session) {
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6">
        <div className="w-full space-y-5">
          <div>
            <h1 className="text-3xl font-bold">Workout Tracker</h1>
            <p className="mt-1 text-zinc-400">
              {step === 'email'
                ? 'Sign in with a code sent to your email.'
                : `Enter the 6-digit code sent to ${email.trim()}.`}
            </p>
          </div>

          {step === 'email' ? (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && sendCode()}
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
              <button
                onClick={sendCode}
                disabled={!email.includes('@') || busy}
                className="w-full rounded-xl bg-blue-500 py-3.5 text-lg font-semibold text-white active:scale-[0.98] disabled:opacity-40"
              >
                {busy ? 'Sending…' : 'Send code'}
              </button>
            </>
          ) : (
            <>
              <input
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="000000"
                className="w-full rounded-xl bg-zinc-800 px-4 py-3.5 text-center font-mono text-3xl tracking-[0.4em] text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => verify(code)}
                disabled={code.length !== 6 || busy}
                className="w-full rounded-xl bg-blue-500 py-3.5 text-lg font-semibold text-white active:scale-[0.98] disabled:opacity-40"
              >
                {busy ? 'Verifying…' : 'Sign in'}
              </button>
              <div className="flex justify-between text-sm">
                <button onClick={startOver} className="text-zinc-500">
                  ‹ Use a different email
                </button>
                <button onClick={sendCode} disabled={busy} className="text-blue-400">
                  Resend code
                </button>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
