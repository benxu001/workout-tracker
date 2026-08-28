import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

/**
 * Page through a query that PostgREST would otherwise silently cap at the
 * project's max-rows setting (1000 by default). The builder must apply a
 * total order (use id as a final tiebreaker) so pages never skip or repeat.
 */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const size = 1000
  const rows: T[] = []
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1)
    if (error) throw error
    const batch = data ?? []
    rows.push(...batch)
    if (batch.length < size) return rows
  }
}
