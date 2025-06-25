# Configuration du Système de Communication Intégré

Ce guide explique comment configurer le système de communication intégré pour le portail des bénévoles.

## 🗄️ Configuration de la Base de Données

### 1. Créer les Tables
Exécutez le script SQL suivant dans votre console Supabase :

```sql
-- Exécuter le contenu du fichier communication_setup.sql
```

### 2. Vérifier les Tables
Assurez-vous que les tables suivantes ont été créées :
- `conversations`
- `conversation_participants`
- `messages`
- `announcements`
- `announcement_reads`

### 3. Vérifier les Policies RLS
Toutes les tables doivent avoir leurs policies RLS configurées pour la sécurité.

## 🚀 Fonctionnalités Disponibles

### 📢 Système d'Annonces
- Création d'annonces par les administrateurs
- Ciblage par rôle utilisateur (admin, responsable, bénévole)
- Priorités : faible, normale, élevée, urgente
- Date d'expiration optionnelle
- Marquage comme lu par utilisateur

### 💬 Messagerie Interne
- Conversations directes entre utilisateurs
- Conversations de groupe
- Messages en temps réel avec Supabase Realtime
- Historique des messages
- Indicateurs de lecture

### 🔔 Notifications Temps Réel
- Notifications push pour nouveaux messages
- Alertes pour annonces urgentes
- Compteurs de messages non lus
- Mise à jour en temps réel des interfaces

## 📱 Interface Utilisateur

### Pour les Bénévoles
- Page `/communication` pour accéder au centre de communication
- Onglet "Annonces" pour voir les informations importantes
- Onglet "Messages" pour les conversations
- Notifications en temps réel

### Pour les Administrateurs
- Création d'annonces depuis la page admin
- Formulaire avec aperçu en temps réel
- Ciblage précis des destinataires
- Gestion des priorités

## 🔧 Configuration Technique

### Variables d'Environnement
Aucune variable supplémentaire requise - utilise la configuration Supabase existante.

### Permissions Requises
- Lecture/écriture sur les tables de communication
- Utilisation de Supabase Realtime pour les mises à jour en temps réel

## 🔒 Sécurité

### Row Level Security (RLS)
- Seuls les participants peuvent voir les messages d'une conversation
- Seuls les utilisateurs ciblés peuvent voir les annonces
- Les administrateurs peuvent créer des annonces
- Chaque utilisateur ne peut marquer comme lues que ses propres annonces

### Validation des Données
- Validation côté client et serveur
- Sanitisation des contenus
- Vérification des permissions

## 🎯 Utilisation

### Créer une Annonce (Admin)
1. Aller sur la page admin
2. Utiliser le formulaire "Créer une Annonce"
3. Remplir titre, contenu, priorité
4. Sélectionner les destinataires
5. Optionnel : définir une date d'expiration
6. Prévisualiser et publier

### Voir les Annonces (Utilisateur)
1. Aller sur `/communication`
2. L'onglet "Annonces" s'ouvre par défaut
3. Filtrer par statut (toutes/non lues/urgentes)
4. Cliquer sur "Marquer comme lu" pour les annonces non lues

### Utiliser la Messagerie (Utilisateur)
1. Aller sur `/communication`
2. Cliquer sur l'onglet "Messages"
3. Sélectionner ou créer une conversation
4. Envoyer des messages en temps réel

## 📊 Monitoring

### Métriques Disponibles
- Nombre d'annonces actives
- Taux de lecture des annonces
- Activité des conversations
- Utilisateurs actifs

### Logs
- Création d'annonces
- Envoi de messages
- Erreurs de connexion temps réel

## 🔮 Évolutions Futures

### Fonctionnalités Prévues
- Pièces jointes dans les messages
- Réactions aux messages
- Conversations de groupe par mission
- Notifications push mobiles
- Intégration avec des services externes (WhatsApp, Telegram)

### Améliorations Techniques
- Compression des messages
- Archivage automatique
- Recherche dans l'historique
- Statistiques d'utilisation avancées

---

## 📞 Support

En cas de problème avec le système de communication :
1. Vérifier les logs Supabase
2. Tester la connectivité Realtime
3. Valider les permissions RLS
4. Consulter la documentation Supabase

Le système de communication est maintenant prêt à être utilisé ! 🚀 