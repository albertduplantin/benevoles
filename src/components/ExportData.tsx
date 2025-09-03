'use client'

import { useState } from 'react'
import { MissionWithCounts } from '@/lib/types'
import { ButtonSpinner } from '@/components/ui/Spinner'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ExportDataProps {
  missions: Array<Omit<MissionWithCounts, 'inscriptions_count'> & { inscriptions_count: number }> | null
  userRole?: string
}

interface ExportStats {
  totalMissions: number
  totalVolunteerSlots: number
  filledSlots: number
  coveragePercentage: number
  urgentMissions: number
  availableMissions: number
  fullMissions: number
}

export default function ExportData({ missions, userRole }: ExportDataProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<'excel' | 'pdf' | 'stats'>('excel')

  // Calculer les statistiques
  const calculateStats = (): ExportStats => {
    if (!missions || missions.length === 0) {
      return {
        totalMissions: 0,
        totalVolunteerSlots: 0,
        filledSlots: 0,
        coveragePercentage: 0,
        urgentMissions: 0,
        availableMissions: 0,
        fullMissions: 0
      }
    }

    const totalVolunteerSlots = missions.reduce((sum, mission) => sum + mission.max_volunteers, 0)
    const filledSlots = missions.reduce((sum, mission) => sum + mission.inscriptions_count, 0)
    const urgentMissions = missions.filter(mission => mission.is_urgent).length
    const availableMissions = missions.filter(mission => mission.inscriptions_count < mission.max_volunteers).length
    const fullMissions = missions.filter(mission => mission.inscriptions_count >= mission.max_volunteers).length

    return {
      totalMissions: missions.length,
      totalVolunteerSlots,
      filledSlots,
      coveragePercentage: totalVolunteerSlots > 0 ? Math.round((filledSlots / totalVolunteerSlots) * 100) : 0,
      urgentMissions,
      availableMissions,
      fullMissions
    }
  }

  // Export Excel
  const exportToExcel = async () => {
    if (!missions) return

    setIsExporting(true)
    try {
      // Préparer les données des missions
      const missionsData = missions.map(mission => ({
        'Titre': mission.title,
        'Description': mission.description || '',
        'Localisation': mission.location || '',
        'Date de début': new Date(mission.start_time).toLocaleDateString('fr-FR'),
        'Heure de début': new Date(mission.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        'Date de fin': new Date(mission.end_time).toLocaleDateString('fr-FR'),
        'Heure de fin': new Date(mission.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        'Places max': mission.max_volunteers,
        'Inscriptions': mission.inscriptions_count,
        'Places restantes': mission.max_volunteers - mission.inscriptions_count,
        'Statut': mission.inscriptions_count >= mission.max_volunteers ? 'Complet' : 'Disponible',
        'Urgent': mission.is_urgent ? 'Oui' : 'Non',
        'Créé le': new Date(mission.created_at).toLocaleDateString('fr-FR')
      }))

      // Créer le workbook
      const wb = XLSX.utils.book_new()
      
      // Feuille des missions
      const wsMissions = XLSX.utils.json_to_sheet(missionsData)
      XLSX.utils.book_append_sheet(wb, wsMissions, 'Missions')

      // Feuille des statistiques
      const stats = calculateStats()
      const statsData = [
        { 'Métrique': 'Total des missions', 'Valeur': stats.totalMissions },
        { 'Métrique': 'Total des places', 'Valeur': stats.totalVolunteerSlots },
        { 'Métrique': 'Places remplies', 'Valeur': stats.filledSlots },
        { 'Métrique': 'Taux de remplissage (%)', 'Valeur': stats.coveragePercentage },
        { 'Métrique': 'Missions urgentes', 'Valeur': stats.urgentMissions },
        { 'Métrique': 'Missions disponibles', 'Valeur': stats.availableMissions },
        { 'Métrique': 'Missions complètes', 'Valeur': stats.fullMissions }
      ]
      const wsStats = XLSX.utils.json_to_sheet(statsData)
      XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques')

      // Exporter le fichier
      const fileName = `missions-festival-${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)

    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error)
      alert('Erreur lors de l\'export Excel')
    } finally {
      setIsExporting(false)
    }
  }

  // Export PDF
  const exportToPDF = async () => {
    if (!missions) return

    setIsExporting(true)
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let yPosition = 20

      // Titre
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('📊 Rapport des Missions - Festival du Film Court', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      // Date d'export
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 20

      // Statistiques
      const stats = calculateStats()
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('📈 Statistiques Générales', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      const statsText = [
        `• Total des missions: ${stats.totalMissions}`,
        `• Total des places: ${stats.totalVolunteerSlots}`,
        `• Places remplies: ${stats.filledSlots}`,
        `• Taux de remplissage: ${stats.coveragePercentage}%`,
        `• Missions urgentes: ${stats.urgentMissions}`,
        `• Missions disponibles: ${stats.availableMissions}`,
        `• Missions complètes: ${stats.fullMissions}`
      ]

      statsText.forEach(text => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(text, 25, yPosition)
        yPosition += 7
      })

      yPosition += 10

      // Liste des missions
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('📋 Liste des Missions', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      missions.forEach((mission, index) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage()
          yPosition = 20
        }

        // Titre de la mission
        pdf.setFont('helvetica', 'bold')
        pdf.text(`${index + 1}. ${mission.title}`, 20, yPosition)
        yPosition += 6

        // Détails
        pdf.setFont('helvetica', 'normal')
        const details = [
          `   📍 ${mission.location || 'Non spécifié'}`,
          `   📅 ${new Date(mission.start_time).toLocaleDateString('fr-FR')} de ${new Date(mission.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} à ${new Date(mission.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
          `   👥 ${mission.inscriptions_count}/${mission.max_volunteers} places (${mission.inscriptions_count >= mission.max_volunteers ? 'Complet' : 'Disponible'})`,
          mission.is_urgent ? '   🚨 MISSION URGENTE' : ''
        ].filter(Boolean)

        details.forEach(detail => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage()
            yPosition = 20
          }
          pdf.text(detail, 25, yPosition)
          yPosition += 5
        })

        if (mission.description) {
          const description = mission.description.length > 100 
            ? mission.description.substring(0, 100) + '...' 
            : mission.description
          if (yPosition > pageHeight - 20) {
            pdf.addPage()
            yPosition = 20
          }
          pdf.text(`   📝 ${description}`, 25, yPosition)
          yPosition += 5
        }

        yPosition += 5
      })

      // Exporter le fichier
      const fileName = `rapport-missions-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      alert('Erreur lors de l\'export PDF')
    } finally {
      setIsExporting(false)
    }
  }

  // Export des statistiques uniquement
  const exportStats = async () => {
    setIsExporting(true)
    try {
      const stats = calculateStats()
      
      // Créer un fichier texte avec les statistiques
      const statsText = `
📊 STATISTIQUES DES MISSIONS - FESTIVAL DU FILM COURT
=====================================================

📅 Date d'export: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}

📈 MÉTRIQUES GÉNÉRALES:
• Total des missions: ${stats.totalMissions}
• Total des places: ${stats.totalVolunteerSlots}
• Places remplies: ${stats.filledSlots}
• Taux de remplissage: ${stats.coveragePercentage}%

🚨 MISSIONS URGENTES: ${stats.urgentMissions}
✅ MISSIONS DISPONIBLES: ${stats.availableMissions}
❌ MISSIONS COMPLÈTES: ${stats.fullMissions}

📊 RÉPARTITION:
• Missions disponibles: ${Math.round((stats.availableMissions / stats.totalMissions) * 100)}%
• Missions complètes: ${Math.round((stats.fullMissions / stats.totalMissions) * 100)}%
• Missions urgentes: ${Math.round((stats.urgentMissions / stats.totalMissions) * 100)}%

---
Généré par l'application de gestion des bénévoles
      `.trim()

      // Créer et télécharger le fichier
      const blob = new Blob([statsText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `statistiques-missions-${new Date().toISOString().split('T')[0]}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Erreur lors de l\'export des statistiques:', error)
      alert('Erreur lors de l\'export des statistiques')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExport = () => {
    switch (exportType) {
      case 'excel':
        exportToExcel()
        break
      case 'pdf':
        exportToPDF()
        break
      case 'stats':
        exportStats()
        break
    }
  }

  if (!missions || missions.length === 0) {
    return null
  }

  const stats = calculateStats()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            📊 Export de Données
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Exportez les missions et statistiques dans différents formats
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value as 'excel' | 'pdf' | 'stats')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isExporting}
          >
            <option value="excel">📈 Excel (Complet)</option>
            <option value="pdf">📄 PDF (Rapport)</option>
            <option value="stats">📊 Statistiques (TXT)</option>
          </select>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            {isExporting ? (
              <>
                <ButtonSpinner size="sm" />
                Export...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exporter
              </>
            )}
          </button>
        </div>
      </div>

      {/* Aperçu des statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalMissions}</div>
          <div className="text-sm text-blue-800">Missions</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.filledSlots}</div>
          <div className="text-sm text-green-800">Places remplies</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.coveragePercentage}%</div>
          <div className="text-sm text-orange-800">Taux de remplissage</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.urgentMissions}</div>
          <div className="text-sm text-red-800">Urgentes</div>
        </div>
      </div>
    </div>
  )
}
