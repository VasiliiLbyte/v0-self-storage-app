/** Supabase nested selects may return an object or a single-element array depending on config. */
export function oneRelation<T>(rel: T | T[] | null | undefined): T | null {
  if (rel == null) return null
  return Array.isArray(rel) ? rel[0] ?? null : rel
}
