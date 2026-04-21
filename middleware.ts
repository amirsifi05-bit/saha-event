import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const CLIENT_ROUTES = ['/client']
const OWNER_ROUTES  = ['/owner']
const AUTH_ROUTES   = ['/auth']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cs) { cs.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })},
    }}
  )
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const needsAuth = [...CLIENT_ROUTES, ...OWNER_ROUTES].some(r => path.startsWith(r))
  if (needsAuth && !user) {
    return NextResponse.redirect(new URL(`/auth/signin?redirect=${path}`, request.url))
  }
  if (user && AUTH_ROUTES.some(r => path.startsWith(r))) {
    const { data: profile } = await supabase
      .from('users').select('role').eq('id', user.id).single()
    const dest = profile?.role === 'owner' ? '/owner/dashboard' : '/client/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}