# 01 — Le plan Spark : ce qui est gratuit, ce qui est impossible

## Ce que tu utilises

| Service | Quota gratuit Spark |
|---|---|
| **Firestore** (base de données) | 1 Gio stocké · 50 000 lectures/jour · 20 000 écritures/jour · 20 000 suppressions/jour · 10 Gio téléchargés/mois |
| **Authentication** (connexion anonyme) | 50 000 utilisateurs actifs/mois |

- Les quotas journaliers repartent à zéro **vers minuit heure du Pacifique = vers 10h-11h à Madagascar**.
- Le quota gratuit ne vaut que pour **une seule base par projet** : garde la base `(default)`.

## Ce qui est impossible en Spark

| Impossible | Ce qu'on fait à la place |
|---|---|
| Code serveur (Cloud Functions) | L'app parle directement à Firestore ; les **règles de sécurité** protègent (doc 06) |
| Stockage de fichiers (Cloud Storage) | Photos en **base64** dans Firestore (doc 05) |
| Notifs push automatiques, tâches planifiées | Pas dans ce projet |
| Fichiers PDF / documents | Pas dans ce projet (trop gros pour un document) |

## Quand un quota est dépassé

- **Aucune facture** : il n'y a pas de carte.
- Les opérations échouent avec le code `resource-exhausted` jusqu'à la remise à zéro.

## ⚠️ Règle d'or

Ne clique **jamais** sur **Upgrade**, **Modify plan** ou **Blaze**, même quand la console le propose. C'est le seul chemin vers une facture.
