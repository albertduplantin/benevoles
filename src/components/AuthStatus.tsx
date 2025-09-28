'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AuthButton from './AuthButton'
import type { User } from '@supabase/supabase-js'

export default function AuthStatus() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    }
    fetchSession()
    const { data: listener } = supabase.auth.onAuthStateChange(() => fetchSession())
    return () => listener.subscription.unsubscribe()
  }, [supabase])

  return <AuthButton user={user} />
}
