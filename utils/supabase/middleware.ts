import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Exclude static paths from creating a client entirely if you want, but Matcher does it well.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect routes. For now, we consider any path other than /login, /login/submit, /auth, and root (/) protected.
  const isPublicRoute = request.nextUrl.pathname === '/' || 
                        request.nextUrl.pathname.startsWith('/login') || 
                        request.nextUrl.pathname.startsWith('/auth') ||
                        request.nextUrl.pathname.startsWith('/api/auth')

  if (!user && !isPublicRoute) {
    // redirect to login if no user
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
