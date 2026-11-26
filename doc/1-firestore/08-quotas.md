# 08 — Quotas : quoi surveiller

En Spark, aucune facture possible. Le seul risque : l'app **ne marche plus jusqu'au lendemain ~10h-11h** quand un quota est atteint.

## Ce que coûte l'exemple

| Action | Lectures | Écritures | Suppressions |
|---|---|---|---|
| Ouvrir la liste (20 notes) | 20 | — | — |
| Ouvrir une photo en grand | 1 (0 si déjà vue) | — | — |
| Créer une note sans photo | — | 1 | — |
| Créer une note avec photo | — | 2 | — |
| Modifier une note en changeant la photo | — | 2 | 1 |
| Supprimer une note avec photo | — | — | 2 |

Avec 50 000 lectures/jour : environ **2 500 ouvertures de la liste par jour**.

## Les réflexes

| Réflexe | Protège |
|---|---|
| Toujours `limit()` dans les requêtes + bouton « Voir plus » | Lectures |
| Grande photo à part, lue seulement au clic | Téléchargement (10 Gio/mois) |
| Cache d'abord pour les photos | Lectures + téléchargement |
| Éviter le temps réel (`onSnapshot`) sur la liste | Lectures |
| Tester sur l'**émulateur** | Tout : une boucle infinie peut vider 50 000 lectures en quelques minutes |

## Où regarder

🔗 `https://console.firebase.google.com/project/PROJECT_ID/firestore/usage` — lectures, écritures, suppressions par jour.
