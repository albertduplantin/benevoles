import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'
import type { MissionWithCounts } from '@/lib/types'

export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: missions } = await supabase
    .from('missions')
    .select('*, inscriptions_count:inscriptions(count)')

  if (!missions) {
    return NextResponse.json({ error: 'Aucune mission' }, { status: 500 })
  }

  const typed = missions.map(m => ({
    ...m,
    inscriptions_count: Array.isArray(m.inscriptions_count)
      ? (m.inscriptions_count as { count: number }[])[0]?.count || 0
      : (m.inscriptions_count as number)
  })) as MissionWithCounts[]

  // Génération Excel avec exceljs
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Portail Bénévoles'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Missions')

  sheet.columns = [
    { header: 'Titre', key: 'title', width: 30 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Lieu', key: 'location', width: 20 },
    { header: 'Inscrits', key: 'inscrits', width: 12 },
    { header: 'Urgente', key: 'urgent', width: 10 },
    { header: 'Long cours', key: 'long', width: 12 }
  ]

  typed.forEach(m => {
    const sheetName = m.title.substring(0, 28)

    // Ajouter onglet participants par mission
    const partSheet = workbook.addWorksheet(sheetName)
    partSheet.columns = [
      { header: 'Nom', key: 'nom', width: 20 },
      { header: 'Prénom', key: 'prenom', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Téléphone', key: 'tel', width: 15 },
      { header: 'Rôle', key: 'role', width: 12 }
    ]

    const row = sheet.addRow({
      title: m.title,
      date: m.is_long_term ? 'À planifier' : new Date(m.start_time!).toLocaleDateString('fr-FR'),
      location: m.location ?? '',
      inscrits: `${m.inscriptions_count}/${m.max_volunteers}`,
      urgent: m.is_urgent ? 'Oui' : 'Non',
      long: m.is_long_term ? 'Oui' : 'Non'
    })

    // Hyperlien depuis première feuille
    row.getCell('title').value = {
      text: m.title,
      hyperlink: `#'${sheetName}'!A1`
    }
  })

  // Récupérer inscriptions détaillées
  const { data: inscriptions } = await supabase
    .from('inscriptions')
    .select('mission_id, users(first_name,last_name,email,phone,role)')

  if (inscriptions) {
    inscriptions.forEach(i => {
      const mission = typed.find(m => m.id === i.mission_id)
      const sheetName = mission?.title.substring(0, 28)
      const ws = workbook.getWorksheet(sheetName!)
      if (ws && i.users) {
        const u: any = Array.isArray(i.users) ? i.users[0] : i.users
        if (u) {
          const rowData = {
            nom: u.last_name,
            prenom: u.first_name,
            email: u.email,
            tel: u.phone,
            role: u.role
          }
          ws.addRow(rowData)
          partGlobal.addRow({ mission: mission?.title ?? '', ...rowData })
        }
      }
    })
  }

  const buffer = await workbook.xlsx.writeBuffer()

  /* --- Sheet Participants global --- */
  const partGlobal = workbook.addWorksheet('Bénévoles')
  partGlobal.columns = [
    { header: 'Mission', key: 'mission', width: 30 },
    { header: 'Nom', key: 'nom', width: 20 },
    { header: 'Prénom', key: 'prenom', width: 20 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Téléphone', key: 'tel', width: 15 },
    { header: 'Rôle', key: 'role', width: 12 }
  ]

  if (inscriptions) {
    inscriptions.forEach(i => {
      const mission = typed.find(m => m.id === i.mission_id)
      const u: any = Array.isArray(i.users) ? i.users[0] : i.users
      if (mission && u) {
        partGlobal.addRow({
          mission: mission.title,
          nom: u.last_name,
          prenom: u.first_name,
          email: u.email,
          tel: u.phone,
          role: u.role
        })
      }
    })
  }

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="dashboard_${Date.now()}.xlsx"`
    }
  })
}
