import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Cette route OAuth reçoit ?code=... puis échange le code contre une session
// Problème précédent : on créait un premier NextResponse, on y plaçait les cookies
// puis on recréait un *nouvel* objet de réponse pour la redirection, perdant ainsi
// les cookies d’auth → l’utilisateur restait déconnecté.  
// Solution : préparer dès le départ la réponse de redirection et écrire les cookies
// dessus, sans jamais la recréer.

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // 1. Prépare la réponse de redirection (elle sera renvoyée en fin de fonction)
  const redirectResponse = NextResponse.redirect(`${origin}${next}`)

  // 2. Crée le client Supabase en lui donnant accès au *même* objet response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          redirectResponse.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          redirectResponse.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 3. Échange le code OAuth contre une session, ce qui écrira les cookies
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  // 4. Retourne la réponse (cookies inclus)
  return redirectResponse
} 