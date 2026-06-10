import { updateSession } from '@/lib/supabase/proxy'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Run session refresh only on actual page navigations.
     * Excluded to avoid concurrent token refreshes that rotate the
     * Supabase refresh token and randomly log users out:
     * - api/  (route handlers refresh + persist cookies themselves)
     * - auth/ (public pages; /auth/callback sets its own cookies)
     * - _next/static, _next/image, favicon, and static asset files
     */
    '/((?!api/|auth/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff|woff2|ttf)$).*)',
  ],
}
