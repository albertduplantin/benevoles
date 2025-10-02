import { NextRequest, NextResponse } from 'next/server'
import { pdf } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { DashboardDoc } from '@/pdf/DashboardDoc'
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

  const doc = <DashboardDoc missions={typed} generatedAt={new Date().toLocaleString('fr-FR')} />
  const pdfBuffer = await pdf(doc).toBuffer() as unknown as ArrayBuffer
  const uint8 = new Uint8Array(pdfBuffer)

  return new NextResponse(uint8, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="dashboard_${Date.now()}.pdf"`
    }
  })
}
