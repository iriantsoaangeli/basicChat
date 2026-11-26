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
