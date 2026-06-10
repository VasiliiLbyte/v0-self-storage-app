import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Refresh the session only on protected app routes (document navigations).
     * Public pages skip middleware entirely to avoid unnecessary refresh churn.
     */
    '/dashboard/:path*',
    '/admin/:path*',
    '/booking/:path*',
  ],
}
