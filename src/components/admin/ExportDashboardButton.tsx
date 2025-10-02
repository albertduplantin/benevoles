'use client'
import { useState } from 'react'

export default function ExportDashboardButton() {
  const [loading, setLoading] = useState(false)
  const handleClick = async () => {
    setLoading(true)
    window.location.href = '/api/export-dashboard'
    setLoading(false)
  }
  return (
    <div className="relative group inline-block">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 text-sm font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
      >
        {loading ? 'Génération…' : 'Télécharger Excel missions'}
      </button>
      {/* Tooltip */}
      <div
        className="absolute z-10 hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 w-56 right-0 mt-2"
      >
        Génère un fichier Excel (.xlsx) contenant&nbsp;:
        <ul className="list-disc ml-4 mt-1">
          <li>Onglet « Missions » récapitulatif</li>
          <li>Un onglet par mission avec les bénévoles inscrits, leur rôle et téléphone</li>
        </ul>
      </div>
    </div>
  )
}
