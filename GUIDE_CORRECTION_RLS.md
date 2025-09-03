# 🔧 Guide de Correction des Problèmes RLS

## 🚨 Problèmes Identifiés

D'après les logs d'erreur, il y a deux problèmes principaux :

1. **Erreur 403 Forbidden** lors des inscriptions
2. **Erreur de politique RLS** sur la table `notifications`

## 📋 Solution

### Étape 1 : Exécuter le Script de Correction

1. **Connectez-vous à votre projet Supabase**
2. **Allez dans l'onglet "SQL Editor"**
3. **Copiez et collez le contenu du fichier `fix_all_rls_issues.sql`**
4. **Exécutez le script**

### Étape 2 : Vérifier les Résultats

Le script va :
- ✅ Corriger les politiques RLS pour la table `inscriptions`
- ✅ Corriger les politiques RLS pour la table `notifications`
- ✅ Tester automatiquement les permissions
- ✅ Afficher un rapport de succès/échec

### Étape 3 : Tester l'Application

Après avoir exécuté le script :
1. **Rafraîchissez votre application** (`benevoles.vercel.app/calendar`)
2. **Essayez de vous inscrire à une mission**
3. **Vérifiez que l'inscription fonctionne**

## 🔍 Détails Techniques

### Problème 1 : Inscriptions
- **Cause** : Politiques RLS trop restrictives
- **Solution** : Politiques permissives pour les utilisateurs authentifiés

### Problème 2 : Notifications
- **Cause** : Trigger automatique bloqué par les politiques RLS
- **Solution** : Politique d'insertion permissive pour les triggers système

## 📊 Résultats Attendus

Après correction, vous devriez avoir :
- ✅ **Inscriptions fonctionnelles** : Les bénévoles peuvent s'inscrire
- ✅ **Notifications automatiques** : Les triggers fonctionnent
- ✅ **Sécurité maintenue** : Seuls les utilisateurs autorisés peuvent agir
- ✅ **Interface responsive** : Plus d'erreurs 403/400

## 🆘 En Cas de Problème

Si le script échoue :
1. **Vérifiez les logs d'erreur** dans Supabase
2. **Exécutez les scripts individuels** :
   - `fix_inscriptions_rls.sql` pour les inscriptions
   - `fix_notifications_rls.sql` pour les notifications
3. **Contactez le support** avec les messages d'erreur

## 📝 Scripts Disponibles

- `fix_all_rls_issues.sql` - **Script principal** (recommandé)
- `fix_inscriptions_rls.sql` - Correction des inscriptions uniquement
- `fix_notifications_rls.sql` - Correction des notifications uniquement

---

**⚠️ Important** : Exécutez le script `fix_all_rls_issues.sql` dans Supabase pour résoudre tous les problèmes d'un coup.
