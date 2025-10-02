import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
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

  // Génération PDF avec pdf-lib
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage()
  const { width, height } = page.getSize()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontSizeTitle = 18
  const fontSizeText = 10

  page.drawText('Tableau de bord – Missions', {
    x: 50,
    y: height - 50,
    size: fontSizeTitle,
    font,
    color: rgb(0, 0, 0)
  })

  page.drawText(`Généré le ${new Date().toLocaleString('fr-FR')}`, {
    x: 50,
    y: height - 70,
    size: fontSizeText,
    font,
    color: rgb(0, 0, 0)
  })

  let yCursor = height - 90
  const lineHeight = 14

  const addText = (text: string) => {
    page.drawText(text, { x: 50, y: yCursor, size: fontSizeText, font })
    yCursor -= lineHeight
    if (yCursor < 40) {
      yCursor = height - 40
      pdfDoc.addPage()
    }
  }

  addText('Titre | Date | Lieu | Inscrits | Urgente | Long cours')
  addText('----------------------------------------------------------------')

  typed.forEach(m => {
    const line = `${m.title} | ${m.is_long_term ? 'À planifier' : new Date(m.start_time!).toLocaleDateString('fr-FR')} | ${m.location ?? ''} | ${m.inscriptions_count}/${m.max_volunteers} | ${m.is_urgent ? 'Oui' : 'Non'} | ${m.is_long_term ? 'Oui' : 'Non'}`
    addText(line)
  })

  const pdfBytes = await pdfDoc.save()

  return new NextResponse(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="dashboard_${Date.now()}.pdf"`
    }
  })
}
