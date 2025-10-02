import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { MissionWithCounts } from '@/lib/types'

interface DashboardDocProps {
  missions: MissionWithCounts[]
  generatedAt: string
}

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: 'Helvetica' },
  sectionTitle: { fontSize: 14, marginBottom: 6, fontWeight: 700 },
  header: { fontSize: 18, marginBottom: 12, textAlign: 'center', fontWeight: 700 },
  row: { flexDirection: 'row', marginBottom: 2 },
  cell: { flexGrow: 1 },
  bold: { fontWeight: 700 }
})

export function DashboardDoc({ missions, generatedAt }: DashboardDocProps) {
  const upcoming = missions.filter(m => !m.start_time || new Date(m.start_time) >= new Date())
  const longTerm = missions.filter(m => m.is_long_term)
  const past = missions.filter(m => m.start_time && new Date(m.start_time) < new Date())

  const renderMissionRow = (m: MissionWithCounts) => (
    <View style={styles.row} key={m.id}>
      <Text style={[styles.cell, { flexBasis: '25%' }]}>{m.title}</Text>
      <Text style={[styles.cell, { flexBasis: '20%' }]}>
        {m.is_long_term ? 'À planifier' : new Date(m.start_time!).toLocaleDateString('fr-FR')}
      </Text>
      <Text style={[styles.cell, { flexBasis: '15%' }]}>{m.location}</Text>
      <Text style={[styles.cell, { flexBasis: '15%' }]}>
        {m.inscriptions_count}/{m.max_volunteers}
      </Text>
      <Text style={[styles.cell, { flexBasis: '10%' }]}>{m.is_urgent ? '⚠️' : ''}</Text>
    </View>
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Tableau de bord – Missions</Text>
        <Text style={{ marginBottom: 12 }}>Généré le {generatedAt}</Text>

        {upcoming.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>1. Missions à venir</Text>
            {upcoming.map(renderMissionRow)}
          </>
        )}

        {longTerm.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>2. Missions au long cours</Text>
            {longTerm.map(renderMissionRow)}
          </>
        )}

        {past.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>3. Missions terminées (30 derniers jours)</Text>
            {past.map(renderMissionRow)}
          </>
        )}
      </Page>
    </Document>
  )
}
