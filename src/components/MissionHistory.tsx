interface MissionHistoryProps {
  missions: Array<{
    created_at: string;
    missions: {
      id: number;
      title: string;
      description: string | null;
      location: string | null;
      start_time: string;
      end_time: string;
    } | null;
  }> | null;
}

export default function MissionHistory({ missions }: MissionHistoryProps) {
  if (!missions || missions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">🎬</div>
        <p className="text-gray-600 text-sm">Aucune mission effectuée</p>
        <p className="text-gray-500 text-xs mt-1">Inscrivez-vous à votre première mission !</p>
      </div>
    )
  }

  const totalMissions = missions.length
  const pastMissions = missions.filter(inscription => {
    const mission = inscription.missions;
    return mission && new Date(mission.start_time) < new Date();
  }).length
  const upcomingMissions = totalMissions - pastMissions

  return (
    <div className="space-y-4">
      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{totalMissions}</div>
          <div className="text-xs text-blue-700">Total</div>
        </div>
        <div className="text-center p-2 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">{pastMissions}</div>
          <div className="text-xs text-green-700">Terminées</div>
        </div>
        <div className="text-center p-2 bg-orange-50 rounded-lg">
          <div className="text-lg font-bold text-orange-600">{upcomingMissions}</div>
          <div className="text-xs text-orange-700">À venir</div>
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
      {missions.map((inscription, index) => {
        const mission = inscription.missions;
        if (!mission) return null;

        const missionDate = new Date(mission.start_time);
        const isPast = missionDate < new Date();
        const inscriptionDate = new Date(inscription.created_at);

        return (
          <div 
            key={`${mission.id}-${index}`}
            className={`p-4 rounded-lg border transition-all hover:shadow-md ${
              isPast 
                ? 'bg-gray-50 border-gray-200' 
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-gray-900 text-sm leading-tight">
                {mission.title}
              </h4>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isPast 
                  ? 'bg-gray-100 text-gray-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isPast ? 'Terminée' : 'À venir'}
              </span>
            </div>
            
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center">
                <span className="mr-1">📍</span>
                <span>{mission.location}</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">📅</span>
                <span>
                  {missionDate.toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'short',
                    year: missionDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                  })}
                </span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">⏰</span>
                <span>
                  {missionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(mission.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Inscrit le {inscriptionDate.toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
} 