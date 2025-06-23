'use client'

import { useState } from 'react'
import type { MissionWithCounts } from '@/lib/types'

interface CallToVolunteersProps {
  missions: MissionWithCounts[] | null
}

export default function CallToVolunteers({ missions }: CallToVolunteersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copySuccess, setCopySuccess] = useState('');

  const incompleteMissions = missions?.filter(m => m.inscriptions_count < m.max_volunteers)

  const generateText = () => {
    if (!incompleteMissions || incompleteMissions.length === 0) {
      return "Toutes les missions sont complètes ! 🎉"
    }

    let text = "📢 Appel à Bénévoles pour le Festival du Film Court ! 🎬\n\n"
    text += "Nous avons encore besoin de vous pour faire de cette édition un succès ! Voici les missions où il reste des places :\n\n"

    incompleteMissions.forEach(m => {
      const missionUrl = `${window.location.origin}/mission/${m.id}`
      const placesRestantes = m.max_volunteers - m.inscriptions_count;
      text += `🔹 *${m.title}*\n`
      text += `   - Lieu : ${m.location}\n`
      text += `   - Date : ${new Date(m.start_time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}\n`
      text += `   - Créneau : ${new Date(m.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(m.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n`
      text += `   - Places restantes : ${placesRestantes}\n`
      text += `   - S'inscrire ici : ${missionUrl}\n\n`
    })

    text += "Merci pour votre aide précieuse ! ❤️"
    return text
  }

  const handleCopy = () => {
    const textToCopy = generateText();
    navigator.clipboard.writeText(textToCopy).then(() => {
        setCopySuccess('Texte copié !');
        setTimeout(() => setCopySuccess(''), 2000);
    }, () => {
        setCopySuccess('Erreur de copie.');
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 mt-4 font-bold text-white bg-green-600 rounded-md hover:bg-green-700"
      >
        Générer un Appel à Bénévoles
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-2xl p-6 bg-white rounded-lg shadow-xl">
            <h3 className="text-xl font-bold mb-4">Appel à Bénévoles</h3>
            <textarea
              readOnly
              className="w-full h-64 p-2 font-mono text-sm bg-gray-100 border rounded-md"
              value={generateText()}
            />
            <div className="flex items-center justify-between mt-4">
                <button
                    onClick={handleCopy}
                    className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                    Copier le texte
                </button>
                {copySuccess && <span className="text-sm text-green-600">{copySuccess}</span>}
                <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 font-semibold text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                    Fermer
                </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 