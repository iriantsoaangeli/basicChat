# Firebase gratuit au max pour l'API d'une app Vue + Capacitor — TL;DR

Dernière vérification des quotas : **25 nov. 2026** (source : https://firebase.google.com/pricing). Google change les quotas de temps en temps → revérifie cette page avant de lancer en prod.

## La réponse courte

1. **Le plan Spark (100 % gratuit, sans carte) ne suffit pas pour toi.** Il n'a ni Cloud Functions (= pas d'API serveur), ni Cloud Storage (= pas de photos/documents), ni tâches planifiées.
2. **Prends le plan Blaze** (carte bancaire obligatoire). Il inclut **les mêmes quotas gratuits que Spark + des quotas gratuits pour Functions et Storage**. Tant que tu restes dessous, tu paies 0.
3. **Tu poses 4 garde-fous** pour ne pas te réveiller avec une facture : alerte budget, spend cap sur Functions, `maxInstances` bas, nettoyage auto des images Docker. → doc 08.

## Deux façons de faire (détails : `Q&A.md`)

| | **Option B — recommandée** | Option D — API complète |
|---|---|---|
| Principe | L'app lit/écrit Firestore **en direct** (SDK + règles de sécurité) + 3 petites fonctions pour push et tâche de nuit | Tout passe par une API que tu écris (Express ou Flask) |
| Code serveur | ~80 lignes | ~150 lignes + toutes les routes à venir |
| Docs | 04c + 04d | 04a ou 04b + 06 + 07 |

## Ordre de lecture / checklist globale

| # | Option B (recommandée) | Option D | Ce que tu fais |
|---|---|---|---|
| 1 | `Q&A.md` + `01-spark-vs-blaze.md` | `01-spark-vs-blaze.md` | Comprendre ce qui est gratuit et comment ça marche |
| 2 | `02-creer-projet.md` | `02-creer-projet.md` | Créer le projet, Blaze, Firestore, Storage, outils |
| 2b | `02b-modeliser-ses-donnees.md` | idem | **Décider comment ranger tes données** (écrans → requêtes → documents) |
| 3 | `03-choix-node-ou-python.md` | idem | Choisir le langage des fonctions |
| 4 | `04c-option-a.md` | `04a-api-typescript.md` **ou** `04b-api-python.md` | Données + règles |
| 5 | `04d-option-b.md` | `06-push-et-taches.md` | Notifs push + tâche planifiée |
| 6 | `05-fichiers-et-securite.md` (règles **Storage** seulement) | `05-fichiers-et-securite.md` | Upload photos/docs |
| 7 | (déjà dans 04c/04d) | `07-app-vue-capacitor.md` | Brancher l'app Vue/Capacitor |
| 8 | `08-anti-facture.md` | `08-anti-facture.md` | **AVANT le premier déploiement** |

## Architecture de l'option D (docs 04a/04b, 06, 07)

```
App Vue (APK Capacitor)
   │
   ├── fetch() ───────────────► Cloud Function "api" (une seule, routes Express/Flask)
   │                                 │
   │                                 ├──► Firestore (base de données)
   │                                 └──► FCM (envoi notifs push)
   │
   └── SDK Firebase Storage ──► Cloud Storage (upload photos/docs DIRECT, sans passer par l'API)

Cloud Scheduler ──(1x/nuit)──► Cloud Function "nightlyCleanup"
```

- **Une seule fonction `api` pour toutes les routes** : 1 seul conteneur à garder chaud, 1 seul déploiement, moins d'images stockées.
- **Upload des fichiers en direct vers Storage** : un fichier de 5 Mo qui passe par ta fonction consomme du temps CPU + de la bande passante Functions. En direct, ça ne consomme que le quota Storage.

## Convention dans ces docs

- `PROJECT_ID` = l'identifiant de ton projet (ex : `mon-app-4f2a1`). Remplace-le partout.
- 🔗 = **lien direct** vers la bonne page de la console. Utilise-les plutôt que de chercher dans les menus : la navigation de la console change souvent, les URL beaucoup moins.
- 🖱️ = clic à faire, avec le texte exact du bouton (console en anglais : mets-la en anglais, les libellés de ces docs correspondent).
- `$` = commande terminal Linux.
