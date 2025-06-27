"use client";
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Container from '@/components/Container';
import CreateMissionForm from '@/components/admin/CreateMissionForm';
import CreateUserForm from '@/components/admin/CreateUserForm';
import MembershipSettings from '@/components/admin/MembershipSettings';
import MissionRow from './MissionRow';
import UserRow from '@/components/admin/UserRow';
import CallToVolunteers from '@/components/admin/CallToVolunteers';
import MissionEditModal from '@/components/admin/MissionEditModal';
import type { MissionWithCounts, MissionWithVolunteers, UserProfile, VolunteerCompleteProfile, PlanningMission } from '@/lib/types';

interface AdminPageClientProps {
  missions: MissionWithCounts[];
  users: UserProfile[];
  missionsWithVolunteers: MissionWithVolunteers[];
  uniqueUsers: VolunteerCompleteProfile[];
  session: any;
}

export default function AdminPageClient({ missions, users, missionsWithVolunteers, uniqueUsers, session }: AdminPageClientProps) {
  const [editingPlanningMission, setEditingPlanningMission] = useState<PlanningMission | null>(null);

  // Fonction pour transformer MissionWithCounts en PlanningMission
  const handleEditMission = (mission: MissionWithCounts) => {
    const planningMission: PlanningMission = {
      ...mission,
      volunteers: mission.inscriptions?.map(inscription => ({
        user_id: inscription.user_id,
        first_name: inscription.users?.first_name ?? null,
        last_name: inscription.users?.last_name ?? null,
        phone: inscription.users?.phone ?? null,
      })) || []
    };
    setEditingPlanningMission(planningMission);
  };

  return (
    <div className="min-h-screen">
      <Header user={session.user} title="Tableau de bord Administrateur" showBackToSite={true} />
      <main className="py-8">
        <Container maxWidth="xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Actions Rapides</h2>
          <p className="text-gray-600 mb-6">Accédez rapidement aux fonctionnalités principales</p>
          <div className="flex flex-wrap gap-4 mb-4">
            <CallToVolunteers missions={missionsWithVolunteers} users={users} />
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold"
            >
              🎯 Voir toutes les missions disponibles
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Missions</h2>
          <p className="text-gray-600 mb-6">Créez, modifiez et suivez toutes vos missions</p>
        </div>
        
        <CreateMissionForm onMissionCreated={() => Promise.resolve().then(() => { window.location.reload(); return undefined; })} users={users} />

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Toutes les missions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left">Titre</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Créneau</th>
                  <th className="px-4 py-2 text-center">Inscrits</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {missions && missions.length > 0 ? (
                  missions.map((mission: MissionWithCounts) => (
                    <MissionRow key={mission.id} mission={mission} users={users} onEdit={handleEditMission} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      Aucune mission créée pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editingPlanningMission && (
          <MissionEditModal
            mission={editingPlanningMission}
            users={users || []}
            onClose={() => setEditingPlanningMission(null)}
            onMissionUpdated={() => window.location.reload()}
          />
        )}

        <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Paramètres de Cotisation</h2>
            <p className="text-gray-600 mb-6">Configurez le montant de la cotisation annuelle</p>
            <MembershipSettings />
        </div>

        <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Utilisateurs</h2>
            <p className="text-gray-600 mb-6">Créez et gérez les comptes des bénévoles et responsables</p>
            <CreateUserForm />
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="px-4 py-2 text-left">Nom</th>
                            <th className="px-4 py-2 text-left">Téléphone</th>
                            <th className="px-4 py-2 text-center">Rôle</th>
                            <th className="px-4 py-2 text-center">Disponibilités</th>
                            <th className="px-4 py-2 text-center">Compétences principales</th>
                            <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueUsers.length > 0 ? (
                            uniqueUsers.map((user: VolunteerCompleteProfile) => {
                                // On filtre les missions où ce bénévole est inscrit
                                const userMissions = missions
                                    ? missions.filter((mission: MissionWithCounts) =>
                                        mission.inscriptions && mission.inscriptions.some((i: any) => i.user_id === user.id)
                                    )
                                    : [];
                                return (
                                    <UserRow key={user.id} user={user} missions={userMissions} />
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={7} className="p-4 text-center text-gray-500">
                                    Aucun utilisateur trouvé.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
        </Container>
      </main>
    </div>
  );
} 