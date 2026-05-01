import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const CLIENT_ROUTES = ['/client']
const OWNER_ROUTES = ['/owner']
const ADMIN_ROUTES = ['/admin']
const AUTH_ROUTES = ['/auth']

const AUTH_ALLOWED_WHEN_AUTHENTICATED = ['/auth/reset-password']

// Changed function name from 'middleware' to 'proxy'
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cs) {
          cs.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const needsAuth = [...CLIENT_ROUTES, ...OWNER_ROUTES, ...ADMIN_ROUTES].some((r) =>
    path.startsWith(r)
  )
  if (needsAuth && !user) {
    return NextResponse.redirect(new URL(`/auth/signin?redirect=${path}`, request.url))
  }

  const onAuthRoute = AUTH_ROUTES.some((r) => path.startsWith(r))
  const allowedWhileAuthed = AUTH_ALLOWED_WHEN_AUTHENTICATED.some((p) => path.startsWith(p))
  
  if (user && onAuthRoute && !allowedWhileAuthed) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    let dest = '/client/dashboard'
    if (profile?.role === 'owner') dest = '/owner/dashboard'
    else if (profile?.role === 'admin') dest = '/admin/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}