'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AuthButton from './AuthButton'
import type { User } from '@supabase/supabase-js'

export default function AuthStatus() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Si on revient d'OAuth sur /?code=..., échanger le code côté client
    const url = new URL(window.location.href)
    const code = url.searchParams.get('code')
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(() => {
        url.searchParams.delete('code')
        url.searchParams.delete('state')
        window.history.replaceState({}, '', url.toString())
        fetchSession()
      })
    }

    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[AuthStatus] fetched session', session)
      setUser(session?.user ?? null)
    }
    fetchSession()
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthStatus] onAuthStateChange', event, session)
      fetchSession()
    })
    return () => listener.subscription.unsubscribe()
  }, [supabase])

  return <AuthButton user={user} />
}
