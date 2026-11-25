# Firebase gratuit au max pour l'API d'une app Vue + Capacitor — TL;DR

Dernière vérification des quotas : **25 nov. 2026** (source : https://firebase.google.com/pricing). Google change les quotas de temps en temps → revérifie cette page avant de lancer en prod.

## La réponse courte

1. **Le plan Spark (100 % gratuit, sans carte) ne suffit pas pour toi.** Il n'a ni Cloud Functions (= pas d'API serveur), ni Cloud Storage (= pas de photos/documents), ni tâches planifiées.
2. **Prends le plan Blaze** (carte bancaire obligatoire). Il inclut **les mêmes quotas gratuits que Spark + des quotas gratuits pour Functions et Storage**. Tant que tu restes dessous, tu paies 0.
3. **Tu poses 4 garde-fous** pour ne pas te réveiller avec une facture : alerte budget, spend cap sur Functions, `maxInstances` bas, nettoyage auto des images Docker. → doc 08.

## Ordre de lecture / checklist globale

| # | Doc | Ce que tu fais | Temps |
|---|-----|----------------|-------|
| 1 | `01-spark-vs-blaze.md` | Comprendre ce qui est gratuit et où | 5 min |
| 2 | `02-creer-projet.md` | Créer le projet, passer en Blaze, créer Firestore + Storage, installer les outils | 30 min |
| 3 | `03-choix-node-ou-python.md` | Choisir ton langage | 5 min |
| 4 | `04a-api-typescript.md` **ou** `04b-api-python.md` | Écrire et déployer l'API | 30 min |
| 5 | `05-fichiers-et-securite.md` | Upload photos/docs + règles de sécurité | 20 min |
| 6 | `06-push-et-taches.md` | Notifications push + tâche planifiée | 20 min |
| 7 | `07-app-vue-capacitor.md` | Brancher l'app Vue/Capacitor sur l'API | 20 min |
| 8 | `08-anti-facture.md` | **À faire AVANT le premier déploiement public** | 15 min |

## Architecture retenue (et pourquoi)

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
