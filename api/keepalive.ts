/**
 * Daily ping so the Supabase free-tier project never hits its 7-day
 * inactivity pause. Reads one row through the public REST endpoint with
 * the publishable key; row-level security keeps the response empty.
 *
 * Vercel signs cron invocations with `Authorization: Bearer $CRON_SECRET`
 * whenever that env var exists, so setting it locks the endpoint to the
 * cron. With it unset the route stays open: an unauthenticated ping is
 * harmless, and failing closed here would silently stop the keepalive and
 * let the project pause.
 */
export const config = { runtime: 'edge' }

export default async function handler(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

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
