/**
 * Daily ping so the Supabase free-tier project never hits its 7-day
 * inactivity pause. Reads one row through the public REST endpoint with
 * the publishable key; row-level security keeps the response empty.
 */
export const config = { runtime: 'edge' }

export default async function handler(): Promise<Response> {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    return Response.json({ ok: false, error: 'missing supabase env' }, { status: 500 })
  }

  const started = Date.now()
  const res = await fetch(`${url}/rest/v1/exercises?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })

  return Response.json(
    { ok: res.ok, status: res.status, ms: Date.now() - started },
    { status: res.ok ? 200 : 502 },
  )
}
