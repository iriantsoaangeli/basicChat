# 04 — Modéliser ses données

**Quand :** avant d'écrire les règles (doc 06) et le code (zip 2). Les deux en découlent.

## La méthode en 4 étapes

1. **Lister les écrans** de l'app.
2. Pour chaque écran : **ce qu'il affiche** et **la requête** qui va avec.
3. **Dessiner les documents** pour que chaque écran lise le moins de documents possible.
4. Pour chaque champ : **type, taille max, qui peut lire, qui peut écrire** → ça donne les règles et le modèle TypeScript.

---

## L'exemple « notes avec photo », étape par étape

### Étape 1-2 : écrans → requêtes

| Écran | Affiche | Requête | Lectures |
|---|---|---|---|
| Liste | Mes 20 dernières notes : miniature, titre, texte, date | `notes` où `owner == moi`, trié par `createdAt` décroissant, limite 20 | 20 |
| Photo en grand | La photo pleine taille d'une note | 1 document `photos/{photoId}` | 1 (0 si déjà vue : cache) |

### Étape 3 : les documents

```
notes/{noteId}                          ← id généré automatiquement
  owner      : "abc123"                 ← uid de l'auteur
  title      : "Courses"
  text       : "pain, lait"
  thumb      : "/9j/4AAQ..."            ← miniature base64 (~20 Ko), facultatif
  photoId    : "p7Hk2..."               ← lien vers photos/{photoId}, facultatif
  createdAt  : 26 nov. 2026 09:12       ← heure du serveur
  updatedAt  : 26 nov. 2026 09:12

photos/{photoId}                        ← à part : lue seulement quand on ouvre la photo
  owner      : "abc123"
  b64        : "/9j/4AAQ..."            ← grande photo base64 (≤ 700 000 caractères)
  createdAt  : 26 nov. 2026 09:12
```

Pourquoi la grande photo est à part : la liste de 20 notes ne télécharge que les miniatures (~400 Ko au total) au lieu de ~10 Mo (doc 05).

> Ce bloc est une **représentation**. Le code TypeScript qui crée réellement ces documents est dans le zip 2 : `src/models/note.ts` (la forme exacte) et `src/services/notes.ts` (l'envoi à Firestore).

### Étape 4 : le dictionnaire des champs

**`notes/{noteId}`**

| Champ | Type Firestore | Type TypeScript | Obligatoire | Limite | Écrit par | Modifiable ? |
|---|---|---|---|---|---|---|
| `owner` | string | `string` | oui | — | l'app (uid connecté) | non |
| `title` | string | `string` | oui | 1 à 100 caractères | l'app | oui |
| `text` | string | `string` | oui | 0 à 5 000 | l'app | oui |
| `thumb` | string | `string` | non | ≤ 30 000 | l'app | oui |
| `photoId` | string | `string` | non | — | l'app | oui |
| `createdAt` | timestamp | `Timestamp` | oui | = heure serveur | `serverTimestamp()` | non |
| `updatedAt` | timestamp | `Timestamp` | oui | = heure serveur | `serverTimestamp()` | oui (à chaque modif) |

Accès : **lecture, modification, suppression = l'auteur seulement.**

**`photos/{photoId}`**

| Champ | Type Firestore | Type TypeScript | Obligatoire | Limite | Modifiable ? |
|---|---|---|---|---|---|
| `owner` | string | `string` | oui | — | non |
| `b64` | string | `string` | oui | ≤ 700 000 caractères | non (on crée une nouvelle photo) |
| `createdAt` | timestamp | `Timestamp` | oui | = heure serveur | non |

Accès : **lecture, suppression = l'auteur seulement. Pas de modification.**

Ce tableau se traduit **ligne pour ligne** :
- en règles → doc 06 (`validNote`, `hasOnly`, `size() <= ...`) ;
- en types TypeScript → zip 2, doc 03 (`NoteDb`, `NoteCreate`, `NoteUpdate`).

---

## Les patterns utiles pour plus tard

| Besoin | SQL | Firestore |
|---|---|---|
| Afficher une info d'un autre document (ex : nom de l'auteur) | `JOIN` | Recopier le champ dans le document |
| Liste courte (tags, max 10) | Table | Tableau dans le document : `tags: ["perso", "urgent"]` |
| Liste longue (commentaires) | Table | Sous-collection : `notes/{id}/commentaires/{id}` |
| Un document par utilisateur (profil) | `WHERE user_id = ?` | Id du document = uid : `users/{uid}` |
| Compter | `COUNT(*)` | `getCountFromServer` (1 lecture par tranche de 1 000) |

## Limites de Firestore

| Limite | Conséquence |
|---|---|
| 1 Mio max par document | Photos compressées (doc 05) |
| Supprimer un document ne supprime **pas** ses sous-collections | Supprimer les sous-documents d'abord |
| Filtre + tri sur deux champs différents | Index composite (doc 07) |

---

## Grille vierge pour ta propre app

**Écrans**

| Écran | Affiche | Requête | Lectures |
|---|---|---|---|
| | | | |

**Dictionnaire des champs** (un tableau par collection)

| Champ | Type | Obligatoire | Limite | Écrit par | Modifiable ? |
|---|---|---|---|---|---|
| | | | | | |

Accès : lecture = … / création = … / modification = … / suppression = …

➡️ Suite : `05-photos-base64.md`
