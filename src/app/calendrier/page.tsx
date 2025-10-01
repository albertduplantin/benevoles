"use client"

import { Calendar, Views } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { localizer, messagesFr } from '@/lib/calendar'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function CalendarPage() {
  const [events,setEvents]=useState<any[]>([])
  const supabase=createClient()
  const router=useRouter()

  useEffect(()=>{
    const fetch=async()=>{
      const { data } = await supabase
        .from('missions')
        .select('id,title,start_time,end_time,is_urgent,inscriptions(user_id)')
      const { data: { user } } = await supabase.auth.getUser()
      setEvents((data||[]).map(m=>({
        id:m.id,
        title:m.title,
        start:new Date(m.start_time),
        end:new Date(m.end_time),
        allDay:false,
        joined: m.inscriptions?.some((i:any)=>i.user_id===user?.id),
        is_urgent:m.is_urgent
      })))
    }
    fetch()
  },[])

  return (
    <div className="p-6">
      <Calendar
        localizer={localizer}
        messages={messagesFr as any}
        events={events}
        defaultView={Views.MONTH}
        style={{ height: 600 }}
        eventPropGetter={(event)=>({
          style:{ backgroundColor: event.joined? '#2563eb':'#10b981', color:'#fff'}
        })}
        onSelectEvent={(e)=>router.push(`/mission/${e.id}`)}
      />
    </div>
  )
}
