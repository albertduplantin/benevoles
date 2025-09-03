# 🔔 Guide de Configuration des Notifications

## ⚠️ **Problème Identifié**

L'erreur "Could not find the 'read' column of 'notifications' in the schema cache" indique que la table `notifications` existe mais qu'il manque des colonnes importantes.

## 🛠️ **Solution : Exécuter le Script SQL**

### **Étape 1 : Accéder à Supabase**
1. Allez sur [supabase.com](https://supabase.com)
2. Connectez-vous à votre compte
3. Sélectionnez votre projet "benevoles"

### **Étape 2 : Ouvrir l'Éditeur SQL**
1. Dans le menu de gauche, cliquez sur **"SQL Editor"**
2. Cliquez sur **"New query"**

### **Étape 3 : Exécuter le Script de Diagnostic et Correction**

**⚠️ IMPORTANT : Si l'erreur persiste, utilisez ce script complet :**

1. Copiez tout le contenu du fichier `notifications_diagnostic.sql`
2. Collez-le dans l'éditeur SQL
3. Cliquez sur **"Run"** pour exécuter le script

**Ce script va :**
- ✅ Diagnostiquer l'état actuel de la table
- ✅ Supprimer et recréer la table complètement
- ✅ Créer toutes les colonnes nécessaires
- ✅ Configurer les index et politiques RLS
- ✅ Créer les triggers automatiques
- ✅ Vérifier que tout fonctionne

**OU** pour une correction légère :
1. Copiez tout le contenu du fichier `notifications_fix.sql`
2. Collez-le dans l'éditeur SQL
3. Cliquez sur **"Run"** pour exécuter le script

### **Étape 4 : Vérifier la Création**
1. Allez dans **"Table Editor"**
2. Vérifiez que la table `notifications` a été créée
3. Vérifiez que les triggers ont été créés

## 📋 **Scripts SQL Disponibles**

### **Script de Correction (`notifications_fix.sql`)**
Pour corriger une table existante avec des colonnes manquantes :
- Ajoute les colonnes manquantes (`read`, `type`, `mission_id`, `updated_at`)
- Crée les index et politiques RLS
- Vérifie l'existence avant d'ajouter

### **Script Complet (`notifications_setup.sql`)**
Pour créer la table depuis zéro :

### **Table Notifications**
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Politiques RLS**
- Les utilisateurs peuvent voir leurs propres notifications
- Les utilisateurs peuvent marquer leurs notifications comme lues
- Les utilisateurs peuvent supprimer leurs propres notifications
- Les admins peuvent créer des notifications pour tous les utilisateurs

### **Triggers Automatiques**
- **Inscription à une mission** : Notification de confirmation
- **Nouvelle mission** : Notification à tous les bénévoles
- **Mission urgente** : Notification d'alerte
- **Nettoyage automatique** : Suppression après 30 jours

## 🔧 **Vérification du Fonctionnement**

Après avoir exécuté le script :

1. **Testez l'envoi de notification** :
   - Allez sur `/admin`
   - Cliquez sur "Envoyer une notification"
   - Remplissez le formulaire et envoyez

2. **Vérifiez la réception** :
   - Cliquez sur l'icône de notification dans le header
   - Vous devriez voir la notification

3. **Testez les notifications automatiques** :
   - Inscrivez-vous à une mission
   - Une notification de confirmation devrait apparaître

## 🚨 **En Cas de Problème**

Si vous rencontrez encore des erreurs :

1. **Vérifiez les permissions** :
   - Assurez-vous que votre utilisateur a le rôle `admin` ou `responsable`
   - Vérifiez dans la table `users` que votre `role` est correct

2. **Vérifiez la table** :
   - La table `notifications` doit exister
   - Les colonnes doivent correspondre au script

3. **Vérifiez les triggers** :
   - Les fonctions et triggers doivent être créés
   - Vérifiez dans l'onglet "Database" > "Functions"

## 📞 **Support**

Si le problème persiste, vérifiez :
- Les logs de la console du navigateur
- Les logs de Supabase dans l'onglet "Logs"
- La structure de la table `notifications`

---

**Une fois le script exécuté, le système de notifications fonctionnera parfaitement !** ✅
