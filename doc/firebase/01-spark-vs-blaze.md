# 01 — Spark vs Blaze : ce qui est gratuit

## Tableau des quotas gratuits (ce qui te concerne)

| Service | Spark (sans carte) | Blaze (avec carte) — part gratuite |
|---|---|---|
| **Cloud Functions** (ton API) | ❌ indisponible | 2 M appels/mois · 400 000 Go-s · 200 000 CPU-s · 5 Go sortants/mois · 120 min de build/jour · 500 Mo d'images Docker |
| **Firestore** (BDD, édition Standard) | 1 Gio stocké · 50 000 lectures/jour · 20 000 écritures/jour · 20 000 suppressions/jour · 10 Gio sortants/mois | Identique |
| **Cloud Storage** (photos/docs) | ❌ indisponible | Nouveau bucket en `us-central1`, `us-west1` ou `us-east1` : 5 Go stockés · 100 Go téléchargés/mois · 5 000 uploads/mois · 50 000 téléchargements/mois |
| **Authentication** | 50 000 utilisateurs actifs/mois | Identique (SMS payants) |
| **Cloud Messaging** (push) | Gratuit, sans quota | Gratuit, sans quota |
| **Cloud Scheduler** (tâches planifiées) | ❌ (nécessite Functions) | 3 tâches gratuites/mois **par compte de facturation** (pas par projet), puis 0,10 $/tâche/mois |

Sources : https://firebase.google.com/pricing · https://cloud.google.com/scheduler/pricing

## Option A — Spark strict (0 carte)

✅ Possible : app → Firestore en direct, Auth, push FCM envoyés depuis la console à la main.
❌ Impossible : API serveur, upload de fichiers, tâches planifiées, push automatiques.

**Pourquoi c'est un problème pour toi :** tu veux des photos/documents → Storage exige Blaze depuis le 30 oct. 2024 pour les nouveaux buckets (et depuis le 3 fév. 2026 pour tous). Contournement « mettre les images en base64 dans Firestore » : limite de 1 Mio par document, et chaque lecture de la photo coûte du quota de lecture → inutilisable pour des photos de plusieurs Mo.

## Option B — Blaze avec garde-fous ✅ (recommandé)

- Tu paies **uniquement ce qui dépasse** les quotas ci-dessus.
- Pour un usage perso/test, tu restes à 0 $ ou quelques centimes.
- Coût « caché » le plus fréquent : **le stockage des images Docker** de tes fonctions (chaque déploiement en crée une). Réglé en 1 commande → doc 08.

## Ce que représentent les quotas, concrètement

| Quota | Ce que ça donne |
|---|---|
| 2 M appels Functions/mois | ≈ 66 000 requêtes API/jour |
| 50 000 lectures Firestore/jour | Si `GET /items` renvoie 20 documents = 20 lectures → **2 500 appels/jour**. C'est souvent ce quota qui casse en premier → toujours mettre `.limit()` |
| 5 000 uploads Storage/mois | ≈ 166 photos/jour |
| 5 Go Storage | ≈ 1 500 photos de 3 Mo → compresse côté app avant upload (doc 05) |

## Décision

➡️ **Blaze.** Passe à `02-creer-projet.md`.
