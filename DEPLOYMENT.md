# Guide de Déploiement Vercel - Application Bénévoles

## 🚀 Déploiement Automatique via GitHub

### Configuration Existante
✅ Repository GitHub : `https://github.com/albertduplantin/benevoles.git`  
✅ Intégration Vercel-GitHub active  
✅ Déploiement automatique configuré

### Variables d'Environnement Requises

#### Supabase (OBLIGATOIRES)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key  
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Stripe (OPTIONNELLES - pour les cotisations)
```
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Étapes de Déploiement Automatique

#### 1. Préparation Locale
```bash
# Vérifier le build local
npm run build

# Test fonctionnel local
npm run start
```

#### 2. Merge vers Main et Push
```bash
# Retourner à main et merger les changements
git checkout main
git merge deploy/vercel-production

# Pousser vers GitHub (déclenchera le déploiement automatique)
git push origin main
```

#### 3. Alternative : Pull Request
```bash
# Pousser la branche de déploiement
git push origin deploy/vercel-production

# Créer une Pull Request sur GitHub
# Le déploiement se fera après merge
```

#### 4. Vérification Variables d'Environnement
- Dashboard Vercel → Votre projet → Settings → Environment Variables
- S'assurer que toutes les variables sont présentes
- Redéployer si modification nécessaire

### 🔄 Stratégie de Rollback (Réversible)

#### Option 1: Rollback via Vercel Dashboard
1. Aller sur Vercel Dashboard
2. Sélectionner le projet
3. Onglet "Deployments"  
4. Cliquer sur "Promote to Production" sur le déploiement précédent

#### Option 2: Rollback via Git
```bash
# Revenir à la branche précédente
git checkout feature/notifications-system

# Supprimer la branche de déploiement si nécessaire
git branch -D deploy/vercel-production

# Redéployer la version précédente
vercel --prod
```

#### Option 3: Rollback d'Urgence
```bash
# Annuler le dernier commit
git revert HEAD

# Redéployer immédiatement
vercel --prod
```

### 📊 Vérifications Post-Déploiement

#### Checklist Fonctionnelle
- [ ] Page d'accueil accessible
- [ ] Authentification Supabase fonctionnelle
- [ ] Page admin accessible avec bon rôle
- [ ] Création de missions
- [ ] Inscription aux missions
- [ ] Profils utilisateurs
- [ ] Planning visible
- [ ] Préférences bénévoles
- [ ] Export PDF (si configuré)

#### Checklist Performance
- [ ] Temps de chargement < 3s
- [ ] Pas d'erreurs 500
- [ ] Images optimisées
- [ ] Base de données réactive

### 🛠 Résolution de Problèmes

#### Erreurs de Build
```bash
# Nettoyer le cache
rm -rf .next node_modules
npm install
npm run build
```

#### Erreurs de Variables d'Environnement
- Vérifier dans Vercel Dashboard
- Redéployer après modification des variables

#### Erreurs Supabase
- Vérifier les clés API
- Confirmer les politiques RLS
- Tester les connexions

### 🔐 Sécurité

#### Variables Sensibles
- Ne jamais commiter les fichiers .env
- Utiliser les variables d'environnement Vercel
- Rotation régulière des clés API

#### Monitoring
- Activer les logs Vercel
- Surveiller les métriques
- Configurer les alertes

### 📝 Notes Important

1. **Réversibilité**: Cette branche `deploy/vercel-production` permet un rollback facile
2. **Base de données**: Les migrations Supabase sont maintenues séparément
3. **Variables**: Toujours synchroniser entre local et production
4. **Tests**: Tester sur un environnement de staging avant production

### 🚨 En Cas d'Urgence

```bash
# Rollback immédiat
git checkout feature/notifications-system
vercel --prod

# Contact support si nécessaire
# Dashboard Vercel → Support
``` 