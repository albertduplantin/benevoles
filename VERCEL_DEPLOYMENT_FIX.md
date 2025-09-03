# 🔧 Correction du Déploiement Vercel

## 🚨 Problème Identifié

Le déploiement Vercel échoue avec l'erreur :
```
The specified Root Directory 'benevoles' does not exist. Please update your Project Settings.
```

## ✅ Solution

### **Option 1 : Correction via Dashboard Vercel (Recommandée)**

1. **Aller sur Vercel Dashboard**
   - URL : https://vercel.com/dashboard
   - Sélectionner le projet "benevoles"

2. **Modifier les Settings du Projet**
   - Aller dans "Settings" → "General"
   - Section "Root Directory"
   - **Laisser vide** ou mettre `.` (point)
   - **NE PAS** mettre "benevoles"

3. **Sauvegarder et Redéployer**
   - Cliquer sur "Save"
   - Aller dans "Deployments"
   - Cliquer sur "Redeploy" sur le dernier déploiement

### **Option 2 : Suppression et Recréation du Projet**

Si l'option 1 ne fonctionne pas :

1. **Supprimer le Projet Vercel**
   - Settings → General → Delete Project

2. **Recréer le Projet**
   - "New Project"
   - Importer depuis GitHub : `albertduplantin/benevoles`
   - **Root Directory** : Laisser vide
   - Framework : Next.js (détection automatique)

## 🔍 Vérification

### **Configuration Correcte**
- ✅ Root Directory : **vide** ou `.`
- ✅ Framework : **Next.js**
- ✅ Build Command : **npm run build** (automatique)
- ✅ Output Directory : **.next** (automatique)

### **Configuration Incorrecte**
- ❌ Root Directory : `benevoles`
- ❌ Root Directory : `/benevoles`
- ❌ Root Directory : `./benevoles`

## 📁 Structure du Projet

Votre projet a la structure suivante :
```
benevoles/                    ← Répertoire racine du repo GitHub
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
├── package.json
├── next.config.ts
├── vercel.json
└── ...
```

Vercel doit pointer vers la **racine du repository**, pas vers un sous-répertoire.

## 🚀 Redéploiement

Une fois la configuration corrigée :

1. **Déclencher un nouveau déploiement**
   - Via le dashboard Vercel : "Redeploy"
   - Ou via Git : `git commit --allow-empty -m "trigger redeploy" && git push`

2. **Vérifier le succès**
   - URL : https://benevoles.vercel.app
   - Tester les fonctionnalités principales

## 🔧 Fichiers Modifiés

- `vercel.json` : Configuration simplifiée
- `VERCEL_DEPLOYMENT_FIX.md` : Ce guide

## 📞 Support

Si le problème persiste :
1. Vérifier que le repository GitHub est accessible
2. Vérifier les permissions Vercel → GitHub
3. Consulter les logs de build dans Vercel Dashboard

---

**✅ Une fois corrigé, le déploiement devrait fonctionner parfaitement !**
