# Zip 1 — Firestore (plan Spark gratuit, sans carte)

## Ce que couvre ce zip

Tout ce qui se passe **côté Firebase** : le projet, la base, la sécurité. Aucune ligne de Vue ici.

| Zip | Contenu |
|---|---|
| **1. firestore** (celui-ci) | Créer le projet et la base, comprendre NoSQL, règles de sécurité, index, quotas |
| 2. vue-firestore | Brancher Firestore dans le code Vue (TypeScript) |
| 3. vue-capacitor-apk | Créer le projet Vue de zéro et le transformer en APK |

**Ordre conseillé :** zip 3 (docs 01 à 03 : outils + projet Vue) → zip 1 (celui-ci) → zip 2 → zip 3 (docs 04 à 06 : APK).

## L'exemple utilisé partout

Une app de **notes avec photo**. Chaque utilisateur voit seulement ses notes.

## Checklist de ce zip

| # | Doc | Ce que tu fais | Résultat |
|---|-----|----------------|----------|
| 1 | `01-plan-spark.md` | Lire ce qui est gratuit / impossible | Tu sais ce que tu peux faire |
| 2 | `02-creer-projet-et-base.md` | 5 manipulations dans la console | Projet + base + config copiée |
| 3 | `03-comprendre-nosql.md` | Lire | Tu comprends collections/documents |
| 4 | `04-modeliser-ses-donnees.md` | Lire, puis remplir la grille pour ton app | Le plan de tes données |
| 5 | `05-photos-base64.md` | Lire | Tu sais comment les photos sont stockées |
| 6 | `06-regles-de-securite.md` | Copier `firestore.rules` | La sécurité de ta base |
| 7 | `07-index-deploiement-emulateur.md` | Copier 3 fichiers, 3 commandes | Règles en ligne + tests en local |
| 8 | `08-quotas.md` | Lire | Tu sais quoi surveiller |
| — | `Q&A.md` | Quand une question se pose | — |

## Convention

- `PROJECT_ID` = identifiant de ton projet Firebase (ex : `mes-notes-4f2a1`). Remplace-le partout.
- 🔗 = lien **direct** vers la bonne page de la console (plus fiable que les menus).
- 🖱️ = clic, avec le texte exact du bouton (console en anglais).
- `$` = commande à taper dans le terminal Linux (sans le `$`).
