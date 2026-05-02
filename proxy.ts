import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cs) {
          cs.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Protect /client/*, /owner/*, /admin/* — redirect to signin if not logged in
  const needsAuth =
    path.startsWith('/client') || path.startsWith('/owner') || path.startsWith('/admin')
  if (needsAuth && !user) {
    const url = new URL('/auth/signin', request.url)
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  // If logged in and hitting auth pages — redirect to correct dashboard
  if (user && path.startsWith('/auth')) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const dest =
      profile?.role === 'owner'
        ? '/owner/dashboard'
        : profile?.role === 'admin'
          ? '/admin/dashboard'
          : '/client/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}