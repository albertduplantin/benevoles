import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // rafraîchit la session de l'utilisateur si elle a expiré.
  await supabase.auth.getUser()

  // Obligation de compléter le profil (téléphone)
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Si l'utilisateur est connecté, on vérifie son profil public.users
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('phone')
        .eq('id', user.id)
        .single()

      const missingPhone = !profile || !profile.phone || profile.phone.trim() === ''

      const currentPath = request.nextUrl.pathname
      const onCompletionPage = currentPath.startsWith('/complete-profile')

      if (missingPhone && !onCompletionPage) {
        const redirectUrl = new URL('/complete-profile', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }
  } catch {
    // on ignore les erreurs (ex. RLS) et laisse passer la requête
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/auth (auth routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
  ],
} 