"use client"

import { Calendar, Views, type View } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { localizer, messagesFr } from '@/lib/calendar'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Container from '@/components/Container'

export default function CalendarPage() {
  const supabase = createClient()
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [view, setView] = useState<View>(Views.MONTH)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data } = await supabase
        .from('missions')
        .select('id,title,start_time,end_time,is_urgent,is_long_term,inscriptions(user_id)')
      setEvents((data || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        start: new Date(m.start_time),
        end: new Date(m.end_time),
        allDay: false,
        joined: m.inscriptions?.some((i: any) => i.user_id === user?.id),
        is_urgent: m.is_urgent,
      })))
    }
    init()
  }, [])

  return (
    <div className="min-h-screen">
      <Header user={user} />
      <main className="py-8">
        <Container>
          <h1 className="text-2xl font-bold mb-6">Calendrier des missions</h1>

          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm">Vue:</label>
            <select value={view} onChange={e => setView(e.target.value as View)} className="border rounded px-2 py-1 text-sm">
              <option value={Views.MONTH}>Mois</option>
              <option value={Views.WEEK}>Semaine</option>
              <option value={Views.DAY}>Jour</option>
              <option value={Views.AGENDA}>Agenda</option>
            </select>
          </div>

          <div className="border rounded-lg shadow bg-white p-4">
            <Calendar
              localizer={localizer}
              messages={messagesFr as any}
              events={events}
              view={view}
              onView={(v)=>setView(v)}
              style={{ height: '70vh', minHeight: 400 }}
              eventPropGetter={(event)=>({
                style:{ backgroundColor: event.joined? '#6366f1':'#22c55e', color:'#fff'}
              })}
              onSelectEvent={(e)=>router.push(`/mission/${e.id}`)}
            />
          </div>

          <div className="mt-4 flex gap-4 text-sm">
            <span className="flex items-center gap-2"><span className="w-4 h-3 bg-[#6366f1] inline-block rounded-sm"></span> Inscrit·e</span>
            <span className="flex items-center gap-2"><span className="w-4 h-3 bg-[#22c55e] inline-block rounded-sm"></span> Autre mission</span>
          </div>
        </Container>
      </main>
    </div>
  )
}
