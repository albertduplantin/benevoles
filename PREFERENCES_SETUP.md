# Configuration du Système de Préférences des Bénévoles

Ce système permet aux bénévoles de spécifier leurs disponibilités et leurs compétences/préférences sectorielles.

## 🔧 Installation

### 1. Exécuter le script SQL
Dans votre tableau de bord Supabase, allez dans l'onglet "SQL Editor" et exécutez le contenu de `volunteer_preferences_setup.sql` :

```sql
-- Copiez et collez le contenu du fichier volunteer_preferences_setup.sql
```

### 2. Vérifier les tables créées
Assurez-vous que les tables suivantes ont bien été créées :
- `user_availability` : stocke les disponibilités (jours préférés, créneaux)
- `user_sector_preferences` : stocke les préférences sectorielles et compétences
- `user_unavailability` : stocke les périodes d'indisponibilité (optionnel)

## 📱 Utilisation

### Pour les bénévoles
1. **Aller sur leur profil** : http://localhost:3000/profile
2. **Section "Mes Préférences"** : Configure automatiquement leurs préférences
3. **Disponibilités** : Cocher leurs jours et créneaux préférés
4. **Secteurs** : Noter leur niveau d'intérêt/expertise (0-3)
5. **Sauvegarder** : Les préférences sont stockées en base

### Pour les admins
1. **Page admin** : http://localhost:3000/admin
2. **Section "Préférences des Bénévoles"** : Vue d'ensemble de toutes les préférences
3. **Filtres disponibles** : Par secteur, par disponibilité, etc.

## 🎯 Fonctionnalités

### ✅ **Disponibilités**
- ✅ Sélection des jours de la semaine préférés
- ✅ Créneaux horaires (matin, après-midi, soirée)
- ✅ Nombre max d'heures par semaine (optionnel)
- ✅ Notes libres

### ✅ **Secteurs/Compétences**
- ✅ 10 secteurs d'activité du festival
- ✅ Niveau d'intérêt/expertise (0-3)
- ✅ Notes techniques spécifiques
- ✅ Notes d'expérience

### ✅ **Interface**
- ✅ Formulaire intuitif avec cases à cocher
- ✅ Sauvegarde automatique
- ✅ Messages de confirmation
- ✅ Gestion d'erreurs gracieuse

## 🔍 États des niveaux sectoriels

- **0** : Non intéressé / Pas de compétence
- **1** : Débutant / Curieux d'apprendre
- **2** : Intermédiaire / Quelques expériences
- **3** : Expert / Très expérimenté

## 🛠️ Dépannage

### Erreurs de chargement des préférences
Si vous voyez des erreurs dans la console :
1. Vérifiez que le script `volunteer_preferences_setup.sql` a été exécuté
2. Vérifiez que les tables existent dans Supabase
3. Vérifiez les politiques de sécurité (RLS)

### Les préférences ne se sauvegardent pas
1. Vérifiez que l'utilisateur est bien connecté
2. Vérifiez les permissions en base de données
3. Regardez les erreurs dans la console du navigateur

## 🚀 Prochaines améliorations possibles

- **Calendrier d'indisponibilités** : Périodes de vacances, etc.
- **Notifications intelligentes** : Proposer des missions selon les préférences
- **Statistiques** : Répartition des compétences dans l'équipe
- **Import/Export** : Sauvegarder les préférences

## 📊 Tables créées

```sql
user_availability {
  id: SERIAL PRIMARY KEY
  user_id: UUID REFERENCES auth.users(id)
  preferred_days: TEXT[]
  preferred_morning: BOOLEAN
  preferred_afternoon: BOOLEAN  
  preferred_evening: BOOLEAN
  max_hours_per_week: INTEGER
  notes: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}

user_sector_preferences {
  id: SERIAL PRIMARY KEY
  user_id: UUID REFERENCES auth.users(id)
  accueil_billetterie: INTEGER (0-3)
  projections: INTEGER (0-3)
  technique: INTEGER (0-3)
  restauration: INTEGER (0-3)
  communication: INTEGER (0-3)
  logistique: INTEGER (0-3)
  animation: INTEGER (0-3)
  securite: INTEGER (0-3)
  entretien: INTEGER (0-3)
  autre: INTEGER (0-3)
  technical_notes: TEXT
  experience_notes: TEXT
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

Le système de préférences est maintenant prêt à l'emploi ! 🎉 