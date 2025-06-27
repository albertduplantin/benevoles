'use client'

import { useState } from 'react'
import type { MissionWithVolunteers, UserProfile } from '@/lib/types'

interface CallToVolunteersProps {
  missions: MissionWithVolunteers[] | null;
  users?: UserProfile[] | null;
}

export default function CallToVolunteers({ missions, users }: CallToVolunteersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copySuccess, setCopySuccess] = useState('');

  const incompleteMissions = missions?.filter(m => m.inscriptions_count < m.max_volunteers)

  const generateText = () => {
    if (!incompleteMissions || incompleteMissions.length === 0) {
      return "Toutes les missions sont complètes ! 🎉"
    }

    // Détecter l'URL de base selon l'environnement
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    let text = "📢 Appel à Bénévoles pour le Festival du Film Court ! 🎬\n\n"
    text += "Nous avons encore besoin de vous pour faire de cette édition un succès ! Voici les missions où il reste des places :\n\n"

    incompleteMissions.forEach(m => {
      const missionUrl = `${baseUrl}/mission/${m.id}`
      const placesRestantes = m.max_volunteers - m.inscriptions_count;
      
      // Trouver le responsable de la mission
      const manager = m.manager_id ? users?.find(u => u.id === m.manager_id) : null;
      
      text += `🔹 *${m.title}*\n`
      text += `   - Lieu : ${m.location}\n`
      text += `   - Date : ${new Date(m.start_time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}\n`
      text += `   - Créneau : ${new Date(m.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(m.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}\n`
      
      // Ajouter la description si elle existe
      if (m.description && m.description.trim()) {
        text += `   - Description : ${m.description}\n`
      }
      
      text += `   - Places restantes : ${placesRestantes}\n`
      
      // Ajouter les informations du responsable si il y en a un
      if (manager) {
        text += `   - Responsable : ${manager.first_name} ${manager.last_name}`
        if (manager.phone) {
          text += ` (📞 ${manager.phone})`
        }
        text += `\n`
      }
      
      // Ajouter la liste des bénévoles déjà inscrits
      if (m.inscriptions && m.inscriptions.length > 0) {
        const volunteersNames = m.inscriptions
          .filter(inscription => inscription.users) // Filtrer les inscriptions avec détails utilisateur
          .map(inscription => {
            const user = inscription.users!;
            return `${user.first_name || ''} ${user.last_name || ''}`.trim();
          })
          .filter(name => name.length > 0) // Filtrer les noms vides
          .join(', ');
        
        if (volunteersNames) {
          text += `   - Bénévoles déjà inscrits : ${volunteersNames}\n`
        }
      }
      
      text += `   - 👆 S'inscrire ici : ${missionUrl}\n\n`
    })

    text += "Merci pour votre aide précieuse ! ❤️\n\n"
    text += "🔗 Portail bénévoles : " + baseUrl
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
                    📋 Copier le texte
                </button>
                <div className="flex items-center gap-4">
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
        </div>
      )}
    </>
  )
} 