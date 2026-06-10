import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        // Middleware is the sole token refresher. Browser auto-refresh races
        // against server refresh and, with reuse detection on, revokes the session.
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    )
  }
  return client
}
