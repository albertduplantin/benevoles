'use client'
import { useState } from 'react'

export default function ExportDashboardButton() {
  const [loading, setLoading] = useState(false)
  const handleClick = async () => {
    setLoading(true)
    const res = await fetch('/api/export-dashboard')
    if (res.ok) {
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `dashboard_${new Date().toISOString().slice(0,10)}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    }
    setLoading(false)
  }
  return (
    <button onClick={handleClick} disabled={loading}
      className="px-4 py-2 text-sm font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">
      {loading ? 'Génération…' : 'Exporter tableau PDF'}
    </button>
  )
}
