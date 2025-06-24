# Système de Notifications Internes

Ce document explique comment configurer et utiliser le système de notifications internes de l'application.

## 🔧 Installation

### 1. Exécuter le script SQL
Dans votre tableau de bord Supabase, allez dans l'onglet "SQL Editor" et exécutez le contenu de `notifications_setup.sql` :

```sql
-- Copiez et collez le contenu du fichier notifications_setup.sql
```

### 2. Vérifier les tables
Assurez-vous que les tables suivantes ont été créées :
- `notifications` : stocke toutes les notifications
- Index sur `user_id`, `is_read`, `created_at`, `mission_id`

## 📱 Fonctionnalités

### ✅ **Notifications automatiques**
- ✅ Nouvelle mission créée → notification à tous les bénévoles
- ✅ Inscription à une mission → confirmation à l'utilisateur

### ✅ **Interface utilisateur**
- ✅ Cloche de notifications dans le header
- ✅ Badge avec compteur de notifications non lues
- ✅ Panel déroulant avec liste des notifications
- ✅ Marquer comme lu/non lu
- ✅ Supprimer des notifications
- ✅ Formatage de la date relative

### ✅ **Panel administrateur**
- ✅ Envoyer des notifications manuelles
- ✅ Choisir les destinataires (tous les bénévoles ou mission spécifique)
- ✅ Types de notifications (info, succès, attention, erreur)
- ✅ Intégration dans la page admin

### ✅ **Temps réel**
- ✅ Notifications en temps réel via Supabase Realtime
- ✅ Mise à jour automatique du compteur
- ✅ Synchronisation multi-onglets

## 🎯 Utilisation

### Pour les bénévoles
1. **Voir les notifications** : Cliquez sur la cloche dans le header
2. **Marquer comme lu** : Cliquez sur la coche ✅
3. **Supprimer** : Cliquez sur l'icône de corbeille 🗑️
4. **Tout marquer comme lu** : Bouton en haut du panel

### Pour les admins
1. **Envoyer une notification** : Cliquez sur "Envoyer une notification" dans la page admin
2. **Choisir les destinataires** :
   - Tous les bénévoles
   - Bénévoles d'une mission spécifique
3. **Sélectionner le type** : Info, Succès, Attention, Erreur
4. **Écrire le message** : Titre + message (max 500 caractères)

### Déclencheurs automatiques
- **Nouvelle mission** : Notification automatique à tous les bénévoles
- **Inscription** : Confirmation automatique à l'utilisateur

## 🔧 Configuration avancée

### Personnaliser les notifications automatiques
Modifiez les triggers dans `notifications_setup.sql` :

```sql
-- Exemple : modifier le message de nouvelle mission
UPDATE function_body SET 
message = 'Nouvelle mission "' || NEW.title || '" disponible !'
WHERE function_name = 'notify_new_mission';
```

### Ajouter de nouveaux types de notifications
1. Modifier l'enum dans la table :
```sql
ALTER TABLE notifications 
DROP CONSTRAINT notifications_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('info', 'success', 'warning', 'error', 'urgent'));
```

2. Mettre à jour les composants React

### Notifications par email (optionnel)
Pour ajouter des notifications par email, intégrez un service comme :
- Resend
- SendGrid
- Mailgun

## 🚀 Améliorations futures possibles

### 🔄 **Notifications push web**
- Service Worker pour notifications hors ligne
- API Notification du navigateur

### 📊 **Analytics**
- Statistiques de lecture des notifications
- Taux d'engagement

### 🔕 **Préférences utilisateur**
- Désactiver certains types de notifications
- Fréquence des notifications

### 📱 **Mobile**
- Notifications push natives
- Deep linking vers les missions

### 🤖 **Intelligence artificielle**
- Notifications personnalisées
- Suggestions de missions

## 🛠️ Dépannage

### La cloche ne s'affiche pas
- Vérifiez que l'utilisateur est connecté
- Vérifiez l'import du composant `NotificationBell`

### Notifications non reçues
- Vérifiez les politiques RLS dans Supabase
- Vérifiez que les triggers sont actifs
- Vérifiez les logs d'erreur

### Pas de temps réel
- Vérifiez que Realtime est activé dans Supabase
- Vérifiez la connexion WebSocket

### Erreurs de permissions
- Vérifiez les politiques RLS
- Vérifiez les rôles des utilisateurs

## 📋 Checklist de test

### ✅ Test basique
- [ ] Créer une mission → notification automatique
- [ ] S'inscrire à une mission → confirmation
- [ ] Voir les notifications dans le header
- [ ] Marquer comme lu/non lu
- [ ] Supprimer une notification

### ✅ Test admin
- [ ] Envoyer notification à tous les bénévoles
- [ ] Envoyer notification à une mission spécifique
- [ ] Tester tous les types de notifications
- [ ] Vérifier le compteur de destinataires

### ✅ Test temps réel
- [ ] Ouvrir 2 onglets, recevoir notification sur les 2
- [ ] Marquer comme lu sur un onglet → mise à jour sur l'autre
- [ ] Vérifier la synchronisation du compteur

## 📞 Support

En cas de problème, vérifiez :
1. Les logs de la console du navigateur
2. Les logs de Supabase
3. Les politiques RLS
4. Les permissions utilisateur

Le système de notifications est maintenant prêt à l'emploi ! 🎉 