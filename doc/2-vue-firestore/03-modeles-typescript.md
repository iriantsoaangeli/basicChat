# 03 — Les modèles TypeScript : la forme exacte des documents

## À quoi servent ces fichiers

Ce sont les **gabarits** des documents. Ils disent à TypeScript, champ par champ, ce qu'on stocke et ce qu'on envoie. Résultat : si tu écris `titel` au lieu de `title`, ou un nombre à la place d'un texte, **le code ne compile pas** au lieu d'envoyer une donnée fausse à Firestore.

Ils contiennent aussi les **références** : les chemins vers les collections (`notes`, `photos`), utilisés par les services.

## Pourquoi 4 types pour une note ?

Parce qu'une note n'a pas la même forme selon le moment :

| Type | Quand | Différence |
|---|---|---|
| `NoteDb` | Ce qui est **stocké** dans Firestore | Dates = `Timestamp` Firestore ; pas d'`id` (l'id est le nom du document, pas un champ) |
| `Note` | Ce que **l'app affiche** | `id` inclus ; dates = `Date` JavaScript |
| `NoteCreate` | Ce qu'on **envoie pour créer** | Dates = `serverTimestamp()` (c'est le serveur qui met l'heure) ; `owner` obligatoire |
| `NoteUpdate` | Ce qu'on **envoie pour modifier** | Tout est facultatif sauf `updatedAt` ; pas de `owner` ni `createdAt` (figés par les règles) |

Correspondance avec le dictionnaire du zip 1 (doc 04) et les règles (doc 06) :

| Champ | `NoteDb` | `NoteCreate` | `NoteUpdate` | Règle |
|---|---|---|---|---|
| `owner` | `string` | `string` (obligatoire) | — (interdit) | `isOwner(...)`, non modifiable |
| `title` | `string` | `string` | `string?` | `size() > 0 && <= 100` |
| `text` | `string` | `string` | `string?` | `size() <= 5000` |
| `thumb` | `string?` | `string?` | `string?` | `size() <= 30000` |
| `photoId` | `string?` | `string?` | `string?` | `is string` |
| `createdAt` | `Timestamp` | `FieldValue` | — (interdit) | `== request.time`, non modifiable |
| `updatedAt` | `Timestamp` | `FieldValue` | `FieldValue` | `== request.time` |

## `src/models/note.ts`

**Où :** crée le dossier `src/models/`.

**Fichier :** `src/models/note.ts`

```ts
// src/models/note.ts
// RÔLE : décrire EXACTEMENT ce qu'est une note, côté Firestore et côté app,
// et donner à TypeScript les "références" (chemins) vers la collection `notes`.
import {
  collection,
  doc,
  type DocumentReference,
  type FieldValue,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'

// ---------- 1. Ce qui est STOCKÉ dans Firestore (document notes/{noteId}) ----------
export interface NoteDb {
  owner: string        // uid de l'auteur
  title: string        // 1 à 100 caractères
  text: string         // 0 à 5000 caractères
  thumb?: string       // miniature en base64 (≤ 30 000 caractères)
  photoId?: string     // id du document photos/{photoId} (grande photo)
  createdAt: Timestamp // date serveur
  updatedAt: Timestamp // date serveur
}

// ---------- 2. Ce que l'APP manipule (id inclus, vraies dates JavaScript) ----------
export interface Note {
  id: string
  owner: string
  title: string
  text: string
  thumb?: string
  photoId?: string
  createdAt: Date | null // null juste après création, le temps que le serveur réponde
  updatedAt: Date | null
}

// ---------- 3. Ce qu'on ENVOIE pour créer / modifier ----------
// Les dates sont des `serverTimestamp()` (FieldValue) : c'est le serveur qui les remplit.
export interface NoteCreate {
  owner: string
  title: string
  text: string
  thumb?: string
  photoId?: string
  createdAt: FieldValue
  updatedAt: FieldValue
}

export interface NoteUpdate {
  title?: string
  text?: string
  thumb?: string
  photoId?: string
  updatedAt: FieldValue
}

// ---------- 4. Convertisseur : document Firestore → objet Note de l'app ----------
export const noteConverter: FirestoreDataConverter<Note, NoteDb> = {
  // App → Firestore : pas utilisé pour écrire (on écrit NoteCreate / NoteUpdate), donc refusé
  toFirestore(): NoteDb {
    throw new Error('Écris avec NoteCreate / NoteUpdate, pas avec Note')
  },
  // Firestore → App
  fromFirestore(snap: QueryDocumentSnapshot<NoteDb>, options?: SnapshotOptions): Note {
    // serverTimestamps: 'estimate' → donne une date estimée tant que le serveur n'a pas répondu
    const d = snap.data({ ...options, serverTimestamps: 'estimate' })
    return {
      id: snap.id,
      owner: d.owner,
      title: d.title,
      text: d.text,
      thumb: d.thumb,
      photoId: d.photoId,
      createdAt: d.createdAt?.toDate() ?? null,
      updatedAt: d.updatedAt?.toDate() ?? null,
    }
  },
}

// ---------- 5. Références (chemins) ----------
/** Pour LIRE : renvoie directement des objets Note */
export const notesRead = collection(db, 'notes').withConverter(noteConverter)

/** Pour ÉCRIRE : collection brute, on vérifie le contenu avec `satisfies NoteCreate` */
export const notesWrite = collection(db, 'notes')

/** Référence d'une note précise : notes/{id} */
export function noteDoc(id: string): DocumentReference {
  return doc(db, 'notes', id)
}

/** Même chose mais en lecture typée */
export function noteDocRead(id: string): DocumentReference<Note, NoteDb> {
  return doc(db, 'notes', id).withConverter(noteConverter)
}
```

### Partie par partie

| Partie | Rôle |
|---|---|
| 1-3. Interfaces | Les 4 formes décrites ci-dessus |
| 4. `noteConverter` | Transforme **automatiquement** un document lu (`NoteDb`) en objet `Note` : ajoute l'`id`, convertit les dates. `toFirestore` est volontairement bloqué : pour écrire, on utilise `NoteCreate` / `NoteUpdate`, plus précis. |
| `serverTimestamps: 'estimate'` | Juste après une création, la date serveur n'est pas encore connue sur le téléphone : on affiche une date estimée au lieu de `null`. |
| 5. `notesRead` | Collection `notes` **avec** le convertisseur → `getDocs(query(notesRead, ...))` renvoie directement des `Note`. |
| 5. `notesWrite` | Collection `notes` **sans** convertisseur → pour `addDoc(notesWrite, data)` où `data` est un `NoteCreate`. |
| 5. `noteDoc(id)` / `noteDocRead(id)` | Chemin d'une note précise `notes/{id}`, en écriture / en lecture typée. |

## `src/models/photo.ts`

**Fichier :** `src/models/photo.ts`

```ts
// src/models/photo.ts
// RÔLE : décrire le document qui contient une grande photo en base64.
import { collection, doc, type FieldValue, type Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'

// Limites — DOIVENT être identiques à celles de firestore.rules
export const PHOTO_MAX_CHARS = 700_000 // ≈ 510 Ko de JPEG (un document fait 1 Mio max)
export const THUMB_MAX_CHARS = 30_000  // ≈ 22 Ko (miniature rangée dans la note)

// Ce qui est STOCKÉ : photos/{photoId}
export interface PhotoDb {
  owner: string
  b64: string // l'image JPEG encodée en base64, sans le préfixe "data:..."
  createdAt: Timestamp
}

// Ce qu'on ENVOIE pour créer
export interface PhotoCreate {
  owner: string
  b64: string
  createdAt: FieldValue
}

export const photosWrite = collection(db, 'photos')

export function photoDoc(id: string) {
  return doc(db, 'photos', id)
}
```

| Partie | Rôle |
|---|---|
| `PHOTO_MAX_CHARS`, `THUMB_MAX_CHARS` | Limites de taille. **Doivent rester identiques** à `firestore.rules` (700000 et 30000). |
| `PhotoDb` / `PhotoCreate` | Stocké / envoyé (même logique que la note). Pas de type « update » : une photo ne se modifie pas. |
| `photosWrite`, `photoDoc(id)` | Chemins vers `photos` et `photos/{id}`. |

➡️ Suite : `04-photos.md`
