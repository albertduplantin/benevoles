'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from './Header'
import type { User } from '@supabase/supabase-js'
import Link from 'next/link'

export default function HomeHeader() {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user ?? null)
      if (data.user) {
        // Vérifier le rôle côté client
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()
        setIsAdmin(profile?.role === 'admin')
      }
    })
  }, [])

  return (
    <>
      <Header user={user} isAdmin={isAdmin} />
    </>
  )
} 