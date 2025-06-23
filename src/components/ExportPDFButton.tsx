'use client'

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Mission, UserProfile, Inscription } from '@/lib/types'

interface ExportPDFButtonProps {
  mission: Mission
  inscriptions: (Inscription & { user: UserProfile })[]
}

export default function ExportPDFButton({ mission, inscriptions }: ExportPDFButtonProps) {
  const handleExport = () => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(mission.title, 14, 18)
    doc.setFontSize(12)
    doc.text(`Lieu : ${mission.location || ''}`, 14, 28)
    doc.text(
      `Date : ${new Date(mission.start_time).toLocaleDateString('fr-FR')}  |  Créneau : ${new Date(mission.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(mission.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      14,
      36
    )
    doc.text(`Nombre de bénévoles inscrits : ${inscriptions.length}`, 14, 44)

    autoTable(doc, {
      startY: 52,
      head: [["Nom", "Prénom", "Téléphone"]],
      body: inscriptions.map(i => [
        i.user.last_name || '',
        i.user.first_name || '',
        i.user.accepts_contact_sharing ? (i.user.phone || '') : 'Non partagé'
      ]),
      styles: { fontSize: 11 },
      headStyles: { fillColor: [30, 64, 175] },
    })

    doc.save(`Mission_${mission.title.replace(/\s+/g, '_')}.pdf`)
  }

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 mt-4 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
    >
      Exporter la liste PDF
    </button>
  )
} 