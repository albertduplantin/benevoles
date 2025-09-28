'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AuthButton from './AuthButton'

export default function AuthStatus() {
  const supabase = createClient()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setEmail(session?.user.email ?? null)
    }
    fetchSession()
    const { data: listener } = supabase.auth.onAuthStateChange(() => fetchSession())
    return () => listener.subscription.unsubscribe()
  }, [supabase])

  return <AuthButton user={email ? ({ email } as any) : null} />
}
