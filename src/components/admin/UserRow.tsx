"use client";

import { VolunteerCompleteProfile } from '@/lib/types';
import { useState } from 'react';

const WEEK_DAYS_LABELS: Record<string, string> = {
  'monday': 'Lun',
  'tuesday': 'Mar',
  'wednesday': 'Mer',
  'thursday': 'Jeu',
  'friday': 'Ven',
  'saturday': 'Sam',
  'sunday': 'Dim',
};

const SECTORS = [
  { key: 'accueil_billetterie', label: 'Accueil', color: 'bg-blue-100 text-blue-800' },
  { key: 'projections', label: 'Projections', color: 'bg-purple-100 text-purple-800' },
  { key: 'technique', label: 'Technique', color: 'bg-gray-100 text-gray-800' },
  { key: 'restauration', label: 'Restauration', color: 'bg-green-100 text-green-800' },
  { key: 'communication', label: 'Com', color: 'bg-pink-100 text-pink-800' },
  { key: 'logistique', label: 'Logistique', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'animation', label: 'Animation', color: 'bg-orange-100 text-orange-800' },
  { key: 'securite', label: 'Sécurité', color: 'bg-red-100 text-red-800' },
  { key: 'entretien', label: 'Entretien', color: 'bg-teal-100 text-teal-800' },
  { key: 'autre', label: 'Autre', color: 'bg-gray-200 text-gray-700' },
];

export default function UserRow({ user, missions }: { user: VolunteerCompleteProfile, missions: any[] }) {
  const [isEditOpen, setEditOpen] = useState(false);

  // Disponibilités (jours + créneaux)
  const jours = user.preferred_days ?? [];
  const creneaux = [
    user.preferred_morning ? 'Matin' : null,
    user.preferred_afternoon ? 'A-midi' : null,
    user.preferred_evening ? 'Soir' : null,
  ].filter(Boolean);

  // Compétences principales (max 3 secteurs avec niveau > 0)
  const mainSectors = SECTORS.filter(sector => {
    const val = user[sector.key as keyof VolunteerCompleteProfile];
    return typeof val === 'number' && val > 0;
  })
    .sort((a, b) => ((user[b.key as keyof VolunteerCompleteProfile] ?? 0) as number) - ((user[a.key as keyof VolunteerCompleteProfile] ?? 0) as number))
    .slice(0, 3);

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-2">{user.first_name} {user.last_name}</td>
      <td className="px-4 py-2">{user.phone ?? 'Non renseigné'}</td>
      <td className="px-4 py-2 text-center">{user.role}</td>
      <td className="px-4 py-2 text-center">
        <div className="flex flex-wrap gap-1 justify-center">
          {jours.map(j => (
            <span key={j} className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">{WEEK_DAYS_LABELS[j]}</span>
          ))}
          {creneaux.map(c => (
            <span key={c as string} className="inline-block px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded">{c}</span>
          ))}
        </div>
      </td>
      <td className="px-4 py-2 text-center">
        <div className="flex flex-wrap gap-1 justify-center">
          {mainSectors.length === 0 && <span className="text-xs text-gray-400">Aucune</span>}
          {mainSectors.map(sector => (
            <span key={sector.key} className={`inline-block px-2 py-1 rounded text-xs font-medium ${sector.color}`}>
              {sector.label} ({user[sector.key as keyof VolunteerCompleteProfile]})
            </span>
          ))}
        </div>
      </td>
      <td className="px-4 py-2 flex gap-2 justify-center items-center">
        <button
          className="text-blue-600 hover:text-blue-800 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={() => setEditOpen(true)}
          aria-label="Éditer le bénévole"
        >
          {/* Icône plume Material Design */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.24 3.56c-2.19 2.19-4.38 4.38-6.57 6.57-1.17 1.17-2.34 2.34-3.51 3.51-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0 1.17-1.17 2.34-2.34 3.51-3.51 2.19-2.19 4.38-4.38 6.57-6.57.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0z" />
          </svg>
        </button>
        <button
          className="text-red-600 hover:text-red-800 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Supprimer le bénévole"
        >
          {/* Icône poubelle Material Design */}
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m2 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7h12z" />
          </svg>
        </button>
        {isEditOpen && (
          <VolunteerEditModal user={user} missions={missions} onClose={() => setEditOpen(false)} />
        )}
      </td>
    </tr>
  );
}

function VolunteerEditModal({ user, missions, onClose }: { user: VolunteerCompleteProfile, missions: any[], onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-2 p-4 relative overflow-y-auto max-h-[90vh]">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>✕</button>
        <h2 className="text-xl font-bold mb-4">Fiche bénévole</h2>
        <div className="mb-4">
          <div className="font-semibold text-lg">{user.first_name} {user.last_name}</div>
          <div className="text-sm text-gray-600">Rôle : <span className="font-medium text-gray-800">{user.role}</span></div>
          <div className="text-sm text-gray-600">Téléphone : <span className="font-medium text-gray-800">{user.phone ?? 'Non renseigné'}</span></div>
        </div>
        <div className="mb-4">
          <div className="font-semibold mb-1">Disponibilités</div>
          <div className="flex flex-wrap gap-1 mb-1">
            {(user.preferred_days ?? []).map(j => (
              <span key={j} className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">{WEEK_DAYS_LABELS[j]}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mb-1">
            {user.preferred_morning && <span className="inline-block px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded">Matin</span>}
            {user.preferred_afternoon && <span className="inline-block px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded">Après-midi</span>}
            {user.preferred_evening && <span className="inline-block px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded">Soir</span>}
          </div>
          {user.max_hours_per_week && <div className="text-xs text-gray-500">Max : {user.max_hours_per_week}h/semaine</div>}
          {user.availability_notes && <div className="text-xs text-gray-500">Notes : {user.availability_notes}</div>}
        </div>
        <div className="mb-4">
          <div className="font-semibold mb-1">Compétences principales</div>
          <div className="flex flex-wrap gap-1">
            {SECTORS.filter(sector => typeof user[sector.key as keyof VolunteerCompleteProfile] === 'number' && (user[sector.key as keyof VolunteerCompleteProfile] as number) > 0)
              .map(sector => (
                <span key={sector.key} className={`inline-block px-2 py-1 rounded text-xs font-medium ${sector.color}`}>
                  {sector.label} ({user[sector.key as keyof VolunteerCompleteProfile]})
                </span>
              ))}
          </div>
          {user.technical_notes && <div className="text-xs text-gray-500 mt-1">Notes : {user.technical_notes}</div>}
        </div>
        <div className="mb-4">
          <div className="font-semibold mb-1">Missions inscrites</div>
          {!missions || missions.length === 0 ? (
            <div className="text-xs text-gray-400">Aucune mission</div>
          ) : (
            <ul className="space-y-2">
              {missions.map(mission => (
                <li key={mission.id} className="border rounded p-2">
                  <div className="font-medium text-gray-900">{mission.title}</div>
                  <div className="text-xs text-gray-600">
                    {new Date(mission.start_time).toLocaleDateString('fr-FR')} — {new Date(mission.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - {new Date(mission.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
} 