'use client'

import { useState } from 'react'
import { MissionWithCounts } from '@/lib/types'
import { ButtonSpinner } from '@/components/ui/Spinner'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

interface AdminExportDataProps {
  missions: Array<Omit<MissionWithCounts, 'inscriptions_count'> & { inscriptions_count: number }> | null
  userRole?: string
}

interface MissionWithVolunteers extends Omit<MissionWithCounts, 'inscriptions_count'> {
  inscriptions_count: number
  volunteers: Array<{
    user_id: string
    first_name: string | null
    last_name: string | null
    phone: string | null
    email: string | null
    role: string
    inscription_date: string
  }>
}

export default function AdminExportData({ missions }: AdminExportDataProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel')

  // Récupérer les données complètes des missions avec bénévoles
  const getMissionsWithVolunteers = async (): Promise<MissionWithVolunteers[]> => {
    if (!missions) return []

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const missionsWithVolunteers = await Promise.all(
      missions.map(async (mission) => {
        // Récupérer les bénévoles inscrits
        const { data: inscriptions } = await supabase
          .from('inscriptions')
          .select(`
            user_id,
            created_at,
            users!inner(
              first_name,
              last_name,
              phone,
              role
            )
          `)
          .eq('mission_id', mission.id)

        // Récupérer les emails depuis auth.users
        const volunteers = await Promise.all(
          (inscriptions || []).map(async (inscription: any) => {
            const { data: authUser } = await supabase.auth.admin.getUserById(inscription.user_id)
            return {
              user_id: inscription.user_id,
              first_name: inscription.users?.first_name || '',
              last_name: inscription.users?.last_name || '',
              phone: inscription.users?.phone || '',
              email: authUser?.user?.email || '',
              role: inscription.users?.role || 'benevole',
              inscription_date: new Date(inscription.created_at).toLocaleDateString('fr-FR')
            }
          })
        )

        return {
          ...mission,
          volunteers
        }
      })
    )

    return missionsWithVolunteers
  }

  // Export Excel complet
  const exportToExcel = async () => {
    if (!missions) return

    setIsExporting(true)
    try {
      const missionsWithVolunteers = await getMissionsWithVolunteers()
      
      // Créer le workbook
      const wb = XLSX.utils.book_new()

      // 1. Feuille "Vue d'ensemble"
      const overviewData = [
        { 'Métrique': 'Total des missions', 'Valeur': missions.length },
        { 'Métrique': 'Total des places disponibles', 'Valeur': missions.reduce((sum, m) => sum + m.max_volunteers, 0) },
        { 'Métrique': 'Total des inscriptions', 'Valeur': missions.reduce((sum, m) => sum + m.inscriptions_count, 0) },
        { 'Métrique': 'Taux de remplissage (%)', 'Valeur': Math.round((missions.reduce((sum, m) => sum + m.inscriptions_count, 0) / missions.reduce((sum, m) => sum + m.max_volunteers, 0)) * 100) },
        { 'Métrique': 'Missions urgentes', 'Valeur': missions.filter(m => m.is_urgent).length },
        { 'Métrique': 'Missions complètes', 'Valeur': missions.filter(m => m.inscriptions_count >= m.max_volunteers).length },
        { 'Métrique': 'Missions avec places disponibles', 'Valeur': missions.filter(m => m.inscriptions_count < m.max_volunteers).length }
      ]
      const wsOverview = XLSX.utils.json_to_sheet(overviewData)
      XLSX.utils.book_append_sheet(wb, wsOverview, 'Vue d\'ensemble')

      // 2. Feuille "Missions détaillées"
      const missionsData = missionsWithVolunteers.map(mission => ({
        'ID Mission': mission.id,
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
        'Statut': mission.inscriptions_count >= mission.max_volunteers ? 'COMPLET' : 'DISPONIBLE',
        'Urgent': mission.is_urgent ? 'OUI' : 'NON',
        'Créé le': new Date(mission.created_at).toLocaleDateString('fr-FR'),
        'Bénévoles inscrits': mission.volunteers.map(v => `${v.first_name} ${v.last_name}`).join(', ')
      }))
      const wsMissions = XLSX.utils.json_to_sheet(missionsData)
      XLSX.utils.book_append_sheet(wb, wsMissions, 'Missions détaillées')

      // 3. Feuille "Liste des bénévoles par mission"
      const volunteersData: Array<{
        Mission: string
        Date: string
        Heure: string
        Localisation: string
        Prénom: string
        Nom: string
        Email: string
        Téléphone: string
        Rôle: string
        'Date d\'inscription': string
      }> = []
      missionsWithVolunteers.forEach(mission => {
        if (mission.volunteers.length === 0) {
          volunteersData.push({
            'Mission': mission.title,
            'Date': new Date(mission.start_time).toLocaleDateString('fr-FR'),
            'Heure': `${new Date(mission.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(mission.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
            'Localisation': mission.location || '',
            'Prénom': 'Aucun bénévole inscrit',
            'Nom': '',
            'Email': '',
            'Téléphone': '',
            'Rôle': '',
            'Date d\'inscription': ''
          })
        } else {
          mission.volunteers.forEach(volunteer => {
            volunteersData.push({
              'Mission': mission.title,
              'Date': new Date(mission.start_time).toLocaleDateString('fr-FR'),
              'Heure': `${new Date(mission.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(mission.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
              'Localisation': mission.location || '',
              'Prénom': volunteer.first_name || '',
              'Nom': volunteer.last_name || '',
              'Email': volunteer.email || '',
              'Téléphone': volunteer.phone || '',
              'Rôle': volunteer.role || 'benevole',
              'Date d\'inscription': volunteer.inscription_date
            })
          })
        }
      })
      const wsVolunteers = XLSX.utils.json_to_sheet(volunteersData)
      XLSX.utils.book_append_sheet(wb, wsVolunteers, 'Bénévoles par mission')

      // 4. Feuille "Liste complète des bénévoles"
      const allVolunteers = new Map()
      missionsWithVolunteers.forEach(mission => {
        mission.volunteers.forEach(volunteer => {
          if (!allVolunteers.has(volunteer.user_id)) {
            allVolunteers.set(volunteer.user_id, {
              'ID': volunteer.user_id,
              'Prénom': volunteer.first_name || '',
              'Nom': volunteer.last_name || '',
              'Email': volunteer.email || '',
              'Téléphone': volunteer.phone || '',
              'Rôle': volunteer.role || 'benevole',
              'Nombre de missions': 1,
              'Missions': mission.title
            })
          } else {
            const existing = allVolunteers.get(volunteer.user_id)
            existing['Nombre de missions'] += 1
            existing['Missions'] += `, ${mission.title}`
          }
        })
      })
      const wsAllVolunteers = XLSX.utils.json_to_sheet(Array.from(allVolunteers.values()))
      XLSX.utils.book_append_sheet(wb, wsAllVolunteers, 'Liste des bénévoles')

      // 5. Feuille "Contacts d'urgence"
      const emergencyContacts = Array.from(allVolunteers.values()).map(volunteer => ({
        'Nom complet': `${volunteer.Prénom} ${volunteer.Nom}`,
        'Téléphone': volunteer.Téléphone,
        'Email': volunteer.Email,
        'Rôle': volunteer.Rôle,
        'Nombre de missions': volunteer['Nombre de missions']
      }))
      const wsEmergency = XLSX.utils.json_to_sheet(emergencyContacts)
      XLSX.utils.book_append_sheet(wb, wsEmergency, 'Contacts d\'urgence')

      // Exporter le fichier
      const fileName = `rapport-complet-festival-${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)

    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error)
      alert('Erreur lors de l\'export Excel. Vérifiez votre connexion internet.')
    } finally {
      setIsExporting(false)
    }
  }

  // Export PDF professionnel
  const exportToPDF = async () => {
    if (!missions) return

    setIsExporting(true)
    try {
      const missionsWithVolunteers = await getMissionsWithVolunteers()
      
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let yPosition = 20

      // Fonction pour ajouter une nouvelle page si nécessaire
      const checkPageBreak = (requiredSpace: number = 20) => {
        if (yPosition > pageHeight - requiredSpace) {
          pdf.addPage()
          yPosition = 20
          return true
        }
        return false
      }

      // Page de couverture
      pdf.setFontSize(24)
      pdf.setFont('helvetica', 'bold')
      pdf.text('RAPPORT COMPLET DU FESTIVAL', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10

      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Gestion des Bénévoles - Export Administrateur', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 20

      pdf.setFontSize(12)
      pdf.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 30

      // Statistiques générales
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('STATISTIQUES GENERALES', 20, yPosition)
      yPosition += 15

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      const totalSlots = missions.reduce((sum, m) => sum + m.max_volunteers, 0)
      const totalInscriptions = missions.reduce((sum, m) => sum + m.inscriptions_count, 0)
      const urgentMissions = missions.filter(m => m.is_urgent).length
      const fullMissions = missions.filter(m => m.inscriptions_count >= m.max_volunteers).length

      const stats = [
        `Total des missions: ${missions.length}`,
        `Total des places disponibles: ${totalSlots}`,
        `Total des inscriptions: ${totalInscriptions}`,
        `Taux de remplissage: ${Math.round((totalInscriptions / totalSlots) * 100)}%`,
        `Missions urgentes: ${urgentMissions}`,
        `Missions complètes: ${fullMissions}`,
        `Missions avec places disponibles: ${missions.length - fullMissions}`
      ]

      stats.forEach(stat => {
        pdf.text(`• ${stat}`, 25, yPosition)
        yPosition += 7
      })

      yPosition += 15

      // Liste des missions avec bénévoles
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('DETAIL DES MISSIONS ET BENEVOLES', 20, yPosition)
      yPosition += 15

      missionsWithVolunteers.forEach((mission, index) => {
        checkPageBreak(40)

        // Titre de la mission
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text(`${index + 1}. ${mission.title}`, 20, yPosition)
        yPosition += 8

        // Détails de la mission
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        const missionDetails = [
          `Localisation: ${mission.location || 'Non spécifiée'}`,
          `Date: ${new Date(mission.start_time).toLocaleDateString('fr-FR')}`,
          `Heure: ${new Date(mission.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(mission.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
          `Places: ${mission.inscriptions_count}/${mission.max_volunteers} (${mission.inscriptions_count >= mission.max_volunteers ? 'COMPLET' : 'DISPONIBLE'})`,
          mission.is_urgent ? 'STATUT: MISSION URGENTE' : ''
        ].filter(Boolean)

        missionDetails.forEach(detail => {
          pdf.text(detail, 25, yPosition)
          yPosition += 5
        })

        if (mission.description) {
          const description = mission.description.length > 80 
            ? mission.description.substring(0, 80) + '...' 
            : mission.description
          pdf.text(`Description: ${description}`, 25, yPosition)
          yPosition += 5
        }

        yPosition += 5

        // Bénévoles inscrits
        if (mission.volunteers.length > 0) {
          pdf.setFont('helvetica', 'bold')
          pdf.text('Bénévoles inscrits:', 25, yPosition)
          yPosition += 5

          pdf.setFont('helvetica', 'normal')
          mission.volunteers.forEach(volunteer => {
            checkPageBreak(10)
            const volunteerInfo = `${volunteer.first_name || ''} ${volunteer.last_name || ''} - ${volunteer.phone || 'Pas de téléphone'} - ${volunteer.email || 'Pas d\'email'} (${volunteer.role})`
            pdf.text(`  • ${volunteerInfo}`, 30, yPosition)
            yPosition += 5
          })
        } else {
          pdf.setFont('helvetica', 'bold')
          pdf.text('Aucun bénévole inscrit', 25, yPosition)
          yPosition += 5
        }

        yPosition += 10
      })

      // Page des contacts d'urgence
      pdf.addPage()
      yPosition = 20

      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('CONTACTS D\'URGENCE', 20, yPosition)
      yPosition += 15

      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')

      const allVolunteers = new Map()
      missionsWithVolunteers.forEach(mission => {
        mission.volunteers.forEach(volunteer => {
          if (!allVolunteers.has(volunteer.user_id)) {
            allVolunteers.set(volunteer.user_id, volunteer)
          }
        })
      })

      Array.from(allVolunteers.values()).forEach((volunteer, index) => {
        checkPageBreak(15)
        pdf.text(`${index + 1}. ${volunteer.first_name || ''} ${volunteer.last_name || ''}`, 20, yPosition)
        pdf.text(`   Tél: ${volunteer.phone || 'Non renseigné'}`, 25, yPosition + 4)
        pdf.text(`   Email: ${volunteer.email || 'Non renseigné'}`, 25, yPosition + 8)
        pdf.text(`   Rôle: ${volunteer.role}`, 25, yPosition + 12)
        yPosition += 20
      })

      // Exporter le fichier
      const fileName = `rapport-complet-festival-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      alert('Erreur lors de l\'export PDF. Vérifiez votre connexion internet.')
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
    }
  }

  if (!missions || missions.length === 0) {
    return null
  }

  const totalSlots = missions.reduce((sum, m) => sum + m.max_volunteers, 0)
  const totalInscriptions = missions.reduce((sum, m) => sum + m.inscriptions_count, 0)
  const coveragePercentage = totalSlots > 0 ? Math.round((totalInscriptions / totalSlots) * 100) : 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            📋 Export Administrateur Complet
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Export complet avec toutes les données pour administration offline
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value as 'excel' | 'pdf')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            disabled={isExporting}
          >
            <option value="excel">📊 Excel (Complet)</option>
            <option value="pdf">📄 PDF (Rapport)</option>
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

      {/* Informations sur l'export */}
      <div className="bg-blue-50 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-blue-900 mb-2">📋 Contenu de l'export :</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
          <div>• Vue d'ensemble avec statistiques</div>
          <div>• Détail de toutes les missions</div>
          <div>• Liste des bénévoles par mission</div>
          <div>• Liste complète des bénévoles</div>
          <div>• Contacts d'urgence avec téléphones</div>
          <div>• Emails et informations de contact</div>
        </div>
      </div>

      {/* Aperçu des statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{missions.length}</div>
          <div className="text-sm text-blue-800">Missions</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalInscriptions}</div>
          <div className="text-sm text-green-800">Inscriptions</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{coveragePercentage}%</div>
          <div className="text-sm text-orange-800">Remplissage</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{missions.filter(m => m.is_urgent).length}</div>
          <div className="text-sm text-red-800">Urgentes</div>
        </div>
      </div>
    </div>
  )
}
