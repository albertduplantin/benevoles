import { fr } from 'date-fns/locale/fr'
import { dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'

const locales = { fr }

export const messagesFr = {
  date: 'Date',
  time: 'Heure',
  event: 'Événement',
  allDay: 'Toute la journée',
  week: 'Semaine',
  work_week: 'Sem. ouvrée',
  day: 'Jour',
  month: 'Mois',
  previous: 'Précédent',
  next: 'Suivant',
  yesterday: 'Hier',
  tomorrow: 'Demain',
  today: "Aujourd'hui",
  agenda: 'Agenda',
  noEventsInRange: 'Aucun événement.',
  showMore: (total: number) => `+ ${total} en plus`,
}

export const formatsFr = {
  timeGutterFormat: 'HH:mm',
  dayFormat: 'EEE d',
  weekdayFormat: (date: Date, culture: string, loc: any) => loc.format(date, 'EEE', culture),
}

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
})
