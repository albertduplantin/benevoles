'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addHours, addMinutes } from 'date-fns'
import { fr } from 'date-fns/locale/fr'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { createClient } from '@/lib/supabase/client'
import { Mission, UserProfile } from '@/lib/types'
import { ButtonSpinner } from '@/components/ui/Spinner'

const locales = {
  'fr': fr,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface AdvancedCalendarProps {
  userId: string
  userRole: string
}

interface CalendarEvent {
  id: number
  title: string
  start: Date
  end: Date
  mission: Mission
  isConflict: boolean
  isUserMission: boolean
  color: string
}

export default function AdvancedCalendar({ userId, userRole }: AdvancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<'month' | 'week' | 'day' | 'work_week' | 'agenda'>('month')
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null)
  const [conflicts, setConflicts] = useState<Map<number, number[]>>(new Map())
  const supabase = createClient()

  const getViewStartDate = (date: Date, view: string): Date => {
    const start = new Date(date)
    switch (view) {
      case 'week':
      case 'work_week':
        start.setDate(date.getDate() - date.getDay())
        break
      case 'day':
        // Pas de modification pour la vue jour
        break
      case 'agenda':
        // Vue agenda sur 30 jours
        break
      case 'month':
      default:
        start.setDate(1)
        break
    }
    return start
  }

  const getViewEndDate = (date: Date, view: string): Date => {
    const end = new Date(date)
    switch (view) {
      case 'week':
      case 'work_week':
        end.setDate(date.getDate() - date.getDay() + 6)
        break
      case 'day':
        // Pas de modification pour la vue jour
        break
      case 'agenda':
        // Vue agenda sur 30 jours
        end.setDate(date.getDate() + 30)
        break
      case 'month':
      default:
        end.setMonth(date.getMonth() + 1, 0)
        break
    }
    return end
  }

  useEffect(() => {
    loadMissions()
  }, [currentDate, view])

  const loadMissions = async () => {
    try {
      setIsLoading(true)
      
      // Calculer la plage de dates selon la vue
      const startDate = getViewStartDate(currentDate, view)
      const endDate = getViewEndDate(currentDate, view)



      // Charger les missions dans la plage de dates
      const { data: missions, error } = await supabase
        .from('missions')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString())
        .order('start_time', { ascending: true })

      if (error) {
        console.error('❌ Erreur Supabase:', error)
        throw error
      }



      // Charger les inscriptions de l'utilisateur séparément
      const { data: userInscriptions } = await supabase
        .from('inscriptions')
        .select('mission_id')
        .eq('user_id', userId)
        .eq('status', 'confirmed')

      const userMissionIds = new Set(userInscriptions?.map(ins => ins.mission_id) || [])

      // Convertir en événements calendrier
      const calendarEvents: CalendarEvent[] = (missions || [])
        .filter(mission => {
          // Filtrer les missions avec des timestamps valides
          const start = new Date(mission.start_time)
          const end = new Date(mission.end_time)
          return !isNaN(start.getTime()) && !isNaN(end.getTime()) && 
                 mission.start_time !== '1970-01-01T00:00:00Z'
        })
        .map(mission => {
          const start = new Date(mission.start_time)
          const end = new Date(mission.end_time)
          const isUserMission = userMissionIds.has(mission.id)

          return {
            id: mission.id,
            title: mission.title,
            start,
            end,
            mission,
            isConflict: false,
            isUserMission,
            color: getMissionColor(mission, isUserMission)
          }
        })

      // Détecter les conflits
      const eventsWithConflicts = detectConflicts(calendarEvents)
      setEvents(eventsWithConflicts)
      

      
      // Calculer les conflits pour l'affichage
      calculateConflicts(eventsWithConflicts)

    } catch (error) {
      console.error('Erreur lors du chargement des missions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMissionColor = (mission: any, isUserMission: boolean): string => {
    if (isUserMission) return '#10B981' // Vert pour les missions de l'utilisateur
    if (mission.is_urgent) return '#EF4444' // Rouge pour les missions urgentes
    if (mission.status === 'completed') return '#6B7280' // Gris pour les missions terminées
    return '#3B82F6' // Bleu par défaut
  }

  const eventPropGetter = useCallback((event: CalendarEvent) => {
    const style = {
      backgroundColor: event.isConflict ? '#FFC107' : event.color, // Jaune pour les conflits
      borderRadius: '5px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
      borderColor: event.isConflict ? '#E0A800' : event.color,
      borderWidth: '1px',
      borderStyle: 'solid',
    }
    return {
      style: style,
    }
  }, [])

  const detectConflicts = (events: CalendarEvent[]): CalendarEvent[] => {
    const eventsWithConflicts = [...events]
    
    for (let i = 0; i < eventsWithConflicts.length; i++) {
      for (let j = i + 1; j < eventsWithConflicts.length; j++) {
        const event1 = eventsWithConflicts[i]
        const event2 = eventsWithConflicts[j]
        
        // Vérifier si les événements se chevauchent
        if (isTimeOverlap(event1, event2)) {
          event1.isConflict = true
          event2.isConflict = true
        }
      }
    }
    
    return eventsWithConflicts
  }

  const isTimeOverlap = (event1: CalendarEvent, event2: CalendarEvent): boolean => {
    return event1.start < event2.end && event2.start < event1.end
  }

  const calculateConflicts = (events: CalendarEvent[]) => {
    const conflictMap = new Map<number, number[]>()
    
    events.forEach(event => {
      if (event.isConflict) {
        const conflictingEvents = events.filter(e => 
          e.id !== event.id && isTimeOverlap(event, e)
        ).map(e => e.id)
        
        if (conflictingEvents.length > 0) {
          conflictMap.set(event.id, conflictingEvents)
        }
      }
    })
    
    setConflicts(conflictMap)
  }

  const handleDragStart = (event: React.DragEvent, calendarEvent: CalendarEvent) => {
    if (userRole !== 'admin' && userRole !== 'responsable') return
    
    setDraggedEvent(calendarEvent)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', event.currentTarget.outerHTML)
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (event: React.DragEvent, targetDate: Date) => {
    event.preventDefault()
    
    if (!draggedEvent || (userRole !== 'admin' && userRole !== 'responsable')) return

    try {
      // Calculer le nouveau temps en gardant la durée
      const duration = draggedEvent.end.getTime() - draggedEvent.start.getTime()
      const newStart = new Date(targetDate)
      const newEnd = new Date(newStart.getTime() + duration)

      // Vérifier les conflits potentiels
      const hasConflict = events.some(e => 
        e.id !== draggedEvent.id && 
        isTimeOverlap(
          { ...draggedEvent, start: newStart, end: newEnd },
          e
        )
      )

      if (hasConflict) {
        alert('⚠️ Conflit détecté ! Cette plage horaire est déjà occupée.')
        return
      }

      // Mettre à jour la mission dans la base de données
      const { error } = await supabase
        .from('missions')
        .update({
          date: newStart.toISOString().split('T')[0],
          start_time: newStart.toTimeString().slice(0, 5),
          end_time: newEnd.toTimeString().slice(0, 5)
        })
        .eq('id', draggedEvent.id)

      if (error) throw error

      // Recharger les missions
      await loadMissions()

    } catch (error) {
      console.error('Erreur lors de la mise à jour de la mission:', error)
      alert('Erreur lors de la mise à jour de la mission.')
    } finally {
      setDraggedEvent(null)
    }
  }

  const renderMonthView = () => {
    const startDate = getViewStartDate(currentDate, 'month')
    const endDate = getViewEndDate(currentDate, 'month')
    const days = []
    const current = new Date(startDate)

    // Ajouter les jours du mois précédent
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const firstDayOfWeek = firstDayOfMonth.getDay()
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(firstDayOfMonth)
      prevDate.setDate(prevDate.getDate() - (firstDayOfWeek - i))
      days.push(prevDate)
    }

    // Ajouter les jours du mois actuel
    while (current.getMonth() === currentDate.getMonth()) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    // Ajouter les jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length
    for (let i = 0; i < remainingDays; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {/* En-têtes des jours */}
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
          <div key={day} className="bg-gray-100 p-2 text-center font-medium text-gray-700">
            {day}
          </div>
        ))}
        
        {/* Jours du calendrier */}
        {days.map((day, index) => {
          const dayEvents = events.filter(event => 
            event.start.toDateString() === day.toDateString()
          )
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()
          const isToday = day.toDateString() === new Date().toDateString()

          return (
            <div
              key={index}
              className={`bg-white min-h-[120px] p-1 ${
                !isCurrentMonth ? 'text-gray-400' : ''
              } ${isToday ? 'bg-blue-50 border-2 border-blue-300' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday ? 'text-blue-600' : ''
              }`}>
                {day.getDate()}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    draggable={userRole === 'admin' || userRole === 'responsable'}
                    onDragStart={(e) => handleDragStart(e, event)}
                    className={`text-xs p-1 rounded cursor-move ${
                      event.isConflict ? 'bg-red-100 border border-red-300' : ''
                    } ${event.isUserMission ? 'ring-2 ring-green-300' : ''}`}
                    style={{ backgroundColor: event.color + '20', borderColor: event.color }}
                    title={`${event.title} - ${event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-gray-600">
                      {event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {event.isConflict && (
                      <div className="text-red-600 text-xs">⚠️ Conflit</div>
                    )}
                  </div>
                ))}
                
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const startDate = getViewStartDate(currentDate, 'week')
    const days = []
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }

    return (
      <div className="space-y-4">
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-4">
          {days.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString()
            return (
              <div key={index} className={`text-center p-2 ${isToday ? 'bg-blue-100 rounded' : ''}`}>
                <div className="font-medium">{day.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                <div className={`text-lg ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                  {day.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Grille horaire */}
        <div className="grid grid-cols-7 gap-4">
          {days.map((day, index) => {
            const dayEvents = events.filter(event => 
              event.start.toDateString() === day.toDateString()
            ).sort((a, b) => a.start.getTime() - b.start.getTime())

            return (
              <div
                key={index}
                className="border rounded-lg p-2 min-h-[400px]"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
              >
                <div className="space-y-2">
                  {dayEvents.map(event => (
                    <div
                      key={event.id}
                      draggable={userRole === 'admin' || userRole === 'responsable'}
                      onDragStart={(e) => handleDragStart(e, event)}
                      className={`p-2 rounded cursor-move ${
                        event.isConflict ? 'bg-red-100 border border-red-300' : ''
                      } ${event.isUserMission ? 'ring-2 ring-green-300' : ''}`}
                      style={{ backgroundColor: event.color + '20', borderColor: event.color }}
                    >
                      <div className="font-medium text-sm">{event.title}</div>
                      <div className="text-xs text-gray-600">
                        {event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - 
                        {event.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {event.isConflict && (
                        <div className="text-red-600 text-xs">⚠️ Conflit</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = events.filter(event => 
      event.start.toDateString() === currentDate.toDateString()
    ).sort((a, b) => a.start.getTime() - b.start.getTime())

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-xl font-bold">
            {currentDate.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>

        <div
          className="border rounded-lg p-4 min-h-[500px]"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, currentDate)}
        >
          {dayEvents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Aucune mission prévue ce jour
            </div>
          ) : (
            <div className="space-y-3">
              {dayEvents.map(event => (
                <div
                  key={event.id}
                  draggable={userRole === 'admin' || userRole === 'responsable'}
                  onDragStart={(e) => handleDragStart(e, event)}
                  className={`p-4 rounded-lg cursor-move ${
                    event.isConflict ? 'bg-red-100 border border-red-300' : ''
                  } ${event.isUserMission ? 'ring-2 ring-green-300' : ''}`}
                  style={{ backgroundColor: event.color + '20', borderColor: event.color }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-lg">{event.title}</h4>
                      <p className="text-gray-600">{event.mission.description}</p>
                      <div className="text-sm text-gray-500 mt-2">
                        📍 {event.mission.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {event.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - 
                        {event.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {event.isConflict && (
                        <div className="text-red-600 text-sm">⚠️ Conflit détecté</div>
                      )}
                      {event.isUserMission && (
                        <div className="text-green-600 text-sm">✅ Votre mission</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    
    switch (view) {
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
      case 'work_week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
        break
      case 'agenda':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
        break
    }
    
    setCurrentDate(newDate)
  }

  const handleViewChange = (newView: 'month' | 'week' | 'day' | 'work_week' | 'agenda') => {
    setView(newView)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ButtonSpinner />
        <span className="ml-2">Chargement du calendrier...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Contrôles du calendrier */}
      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">📅 Calendrier Avancé</h2>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {(['month', 'week', 'day'] as const).map(v => (
              <button
                key={v}
                onClick={() => handleViewChange(v)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  view === v 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Vos missions</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Missions urgentes</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Autres missions</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-500 rounded"></div>
          <span>Missions terminées</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span>Conflits</span>
        </div>
      </div>

      {/* Instructions pour le drag & drop */}
      {(userRole === 'admin' || userRole === 'responsable') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600">💡</span>
            <span className="text-blue-800 font-medium">Drag & Drop activé</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            Vous pouvez glisser-déposer les missions pour les déplacer dans le temps. 
            Les conflits seront automatiquement détectés.
          </p>
        </div>
      )}

      {/* Vue du calendrier */}
      <div className="bg-white rounded-lg shadow">
        <div className="h-[700px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={view}
            date={currentDate}
            onNavigate={setCurrentDate}
            onView={handleViewChange}
            messages={{
              next: 'Suivant',
              previous: 'Précédent',
              today: 'Aujourd\'hui',
              month: 'Mois',
              week: 'Semaine',
              day: 'Jour',
              agenda: 'Agenda',
              date: 'Date',
              time: 'Heure',
              event: 'Événement',
              noEventsInRange: 'Aucune mission dans cette période.',
              showMore: (total) => `+ Voir ${total} de plus`,
            }}
            culture="fr"
            eventPropGetter={eventPropGetter}
          />
        </div>
      </div>

      {/* Statistiques des conflits */}
      {conflicts.size > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800 mb-2">⚠️ Conflits détectés</h3>
          <p className="text-red-700 text-sm">
            {conflicts.size} mission(s) ont des conflits d'horaire. 
            Considérez réorganiser ces missions pour éviter les chevauchements.
          </p>
        </div>
      )}
    </div>
  )
}
