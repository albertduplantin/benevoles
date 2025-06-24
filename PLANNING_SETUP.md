# Système de Planning Global

Ce document explique comment utiliser et configurer le système de planning global pour les coordinateurs de festivals.

## 🎯 **Vue d'ensemble**

Le système de planning permet aux coordinateurs et responsables de :
- Visualiser toutes les missions sur différentes vues (calendrier, timeline, par bénévole, par secteur)
- Détecter automatiquement les conflits d'horaires
- Filtrer les missions selon différents critères
- Analyser les statistiques de couverture
- Optimiser la répartition des bénévoles

## 📅 **Vues Disponibles**

### **1. Vue Calendrier**
- **Description** : Affichage mensuel classique avec missions par jour
- **Avantages** : Vision globale, navigation intuitive par mois
- **Code couleur** : Vert (complet), Jaune (partiellement couvert), Rouge (places disponibles)

### **2. Vue Timeline** 
- **Description** : Planning détaillé jour par jour avec horaires précis
- **Avantages** : Détails complets des missions, bénévoles assignés, durées
- **Utilisation** : Idéal pour la gestion quotidienne

### **3. Vue par Bénévole**
- **Description** : Liste des bénévoles avec leurs missions respectives
- **Avantages** : Voir la charge de travail de chaque personne
- **Statistiques** : Heures totales, nombre de missions par bénévole

### **4. Vue par Secteur**
- **Description** : Missions groupées par domaine d'activité
- **Secteurs détectés automatiquement** :
  - 🎫 Accueil & Billetterie
  - 🎬 Projections
  - 🔧 Technique
  - 🍽️ Restauration
  - 📢 Communication
  - 📦 Logistique
  - 🎭 Animation
  - 🛡️ Sécurité
  - 🧹 Entretien

## 🔍 **Système de Filtres**

### **Filtres Disponibles**
- **Dates** : Début et fin de période
- **Bénévole** : Voir les missions d'une personne spécifique
- **Responsable** : Missions d'un coordinateur
- **Lieu** : Filtrer par emplacement
- **Statut** : Toutes, places disponibles, complet, avec conflits

### **Filtres Actifs**
- Badges visuels des filtres appliqués
- Suppression rapide par clic sur le badge
- Bouton "Réinitialiser" pour tout effacer

## ⚠️ **Détection des Conflits**

### **Types de Conflits Détectés**
1. **Chevauchement d'horaires** : Même bénévole sur 2 missions simultanées
2. **Calcul automatique** : Détection en temps réel
3. **Détails précis** : Heure de début/fin du conflit, durée

### **Résolution Suggérée**
- Réassigner le bénévole à une seule mission
- Modifier les horaires d'une mission
- Trouver un remplaçant

## 📊 **Statistiques et Analytics**

### **Métriques Globales**
- **Taux de couverture** : Pourcentage de places occupées
- **Conflits détectés** : Nombre et gravité
- **Répartition temporelle** : Missions par jour
- **Charge par bénévole** : Heures moyennes

### **Indicateurs de Performance**
- 🟢 **Couverture excellente** : ≥ 80%
- 🟡 **Couverture correcte** : 60-79%
- 🔴 **Couverture insuffisante** : < 60%

## 🔐 **Permissions d'Accès**

### **Qui peut accéder au planning ?**
- ✅ **Administrateurs** : Accès complet
- ✅ **Responsables** : Accès complet  
- ❌ **Bénévoles** : Pas d'accès (voir uniquement leurs propres missions)

### **URL d'accès**
```
/planning
```

## 🛠️ **Configuration Technique**

### **Types TypeScript**
- `PlanningMission` : Mission avec bénévoles et statistiques
- `ConflictDetection` : Structure des conflits détectés
- `PlanningStats` : Métriques et statistiques
- `PlanningFilters` : Critères de filtrage

### **Composants Créés**
```
src/components/planning/
├── PlanningView.tsx          # Composant principal
├── PlanningFilters.tsx       # Système de filtres
├── CalendarView.tsx          # Vue calendrier
├── TimelineView.tsx          # Vue timeline
├── VolunteerView.tsx         # Vue par bénévole
├── SectorView.tsx            # Vue par secteur
├── PlanningStats.tsx         # Affichage des statistiques
└── ConflictsList.tsx         # Liste des conflits
```

## 🚀 **Utilisation Pratique**

### **Workflow Recommandé**
1. **Commencer par la vue Calendrier** pour une vision globale
2. **Utiliser les filtres** pour cibler des périodes/secteurs
3. **Vérifier les conflits** régulièrement
4. **Analyser les statistiques** pour optimiser la couverture
5. **Utiliser la vue par Bénévole** pour équilibrer les charges

### **Cas d'Usage Typiques**
- **Préparation du festival** : Vérifier la couverture globale
- **Gestion quotidienne** : Vue timeline pour le jour J
- **Résolution de conflits** : Identifier et corriger les problèmes
- **Équilibrage des équipes** : Vue par bénévole et par secteur

## 🔧 **Maintenance**

### **Données Requises**
- Missions créées avec horaires précis
- Bénévoles inscrits aux missions
- Lieux et responsables renseignés

### **Performance**
- Calculs en temps réel côté client
- Optimisé pour des centaines de missions
- Responsive pour tablettes et mobiles

## 📝 **Notes d'Implementation**

### **Détection Automatique des Secteurs**
La catégorisation se base sur des mots-clés dans le titre et lieu :
- "accueil", "billetterie" → Accueil & Billetterie
- "projection", "salle" → Projections
- "technique", "son", "régie" → Technique
- etc.

### **Gestion des Couleurs**
Chaque secteur a sa couleur distinctive pour faciliter la lecture visuelle.

---

**🎬 Système développé pour optimiser la gestion des bénévoles lors des festivals de cinéma.** 