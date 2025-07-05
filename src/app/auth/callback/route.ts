import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // La réponse que nous renverrons (sera transformée en redirection plus bas)
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Crée un client Supabase capable de poser / lire les cookies sur *cette* réponse
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Met à jour le cookie côté requête (utile pour les appels subséquents)
          request.cookies.set({ name, value, ...options })
          // Et surtout côté réponse, pour que le navigateur le reçoive
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Échange le code OAuth Google contre une session
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Transforme la réponse en redirection (les cookies déjà posés sont conservés)
  response = NextResponse.redirect(`${origin}${next}`)
  return response
} 