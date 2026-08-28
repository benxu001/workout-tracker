import { useEffect, useState } from 'react'
import { Sheet } from './Sheet'
import { supabase } from '../lib/supabase'

export function AccountSheet({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  const savePassword = async () => {
    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    setPassword('')
    setConfirm('')
    setSaved(true)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    onClose()
  }

  const field =
    'w-full rounded-xl bg-zinc-800 px-4 py-3 text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <Sheet title="Account" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-zinc-400">
          Signed in as <span className="text-zinc-200">{email ?? '…'}</span>
        </p>

        <div className="space-y-3 border-t border-zinc-800 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Set a password
          </p>
          <p className="text-xs text-zinc-500">
            Lets you sign in directly in the installed app, with no email round trip.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setSaved(false)
              setError(null)
            }}
            autoComplete="new-password"
            placeholder="New password"
            className={field}
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
              setSaved(false)
              setError(null)
            }}
            autoComplete="new-password"
            placeholder="Confirm password"
            className={field}
          />
          <button
            onClick={savePassword}
            disabled={busy || password.length === 0}
            className="w-full rounded-xl bg-blue-500 py-3.5 text-lg font-semibold text-white active:scale-[0.98] disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Save password'}
          </button>
          {saved && (
            <p className="text-sm text-blue-300">
              Password saved. Use it with your email to sign in anywhere.
            </p>
          )}
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="border-t border-zinc-800 pt-4">
          <button
            onClick={signOut}
            className="w-full rounded-xl bg-zinc-800 py-3 font-medium text-red-400"
          >
            Sign out
          </button>
        </div>
      </div>
    </Sheet>
  )
}
