// src/services/notes.ts
// RÔLE : toutes les opérations sur les notes (créer, lister, lire, modifier, supprimer).
// Les composants n'appellent QUE ces fonctions, jamais Firestore directement.
import {
  addDoc,
  deleteDoc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { ensureUser } from '@/firebase'
import {
  noteDoc,
  noteDocRead,
  notesRead,
  notesWrite,
  type Note,
  type NoteCreate,
  type NoteDb,
  type NoteUpdate,
} from '@/models/note'
import { deletePhoto, makeThumb, savePhoto } from '@/services/photos'

const PAGE_SIZE = 20

/** CRÉER une note (avec photo facultative). Renvoie l'id de la note. */
export async function createNote(title: string, text: string, photo?: File): Promise<string> {
  const user = await ensureUser()
  const data: NoteCreate = {
    owner: user.uid,
    title,
    text,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  if (photo) {
    data.thumb = await makeThumb(photo)   // petite image dans la note (pour la liste)
    data.photoId = await savePhoto(photo) // grande image dans photos/{id} (pour le détail)
  }
  const ref = await addDoc(notesWrite, data)
  return ref.id
}

/** LISTER mes notes, 20 par page. Passe `after` (renvoyé par l'appel précédent) pour la suite. */
export async function listMyNotes(after?: QueryDocumentSnapshot<Note, NoteDb>) {
  const user = await ensureUser()
  const base = [where('owner', '==', user.uid), orderBy('createdAt', 'desc')] as const
  const q = after
    ? query(notesRead, ...base, startAfter(after), limit(PAGE_SIZE))
    : query(notesRead, ...base, limit(PAGE_SIZE))
  const snap = await getDocs(q)
  return {
    notes: snap.docs.map((d) => d.data()),
    last: snap.docs.at(-1),                 // à repasser en `after` pour la page suivante
    hasMore: snap.docs.length === PAGE_SIZE,
  }
}

/** LIRE une note par son id */
export async function getNote(id: string): Promise<Note | null> {
  const snap = await getDoc(noteDocRead(id))
  return snap.exists() ? snap.data() : null
}

/** MODIFIER le titre / texte, et éventuellement remplacer la photo */
export async function updateNote(
  note: Note,
  changes: { title?: string; text?: string; photo?: File },
): Promise<void> {
  const data: NoteUpdate = { updatedAt: serverTimestamp() }
  if (changes.title !== undefined) data.title = changes.title
  if (changes.text !== undefined) data.text = changes.text
  if (changes.photo) {
    data.thumb = await makeThumb(changes.photo)
    data.photoId = await savePhoto(changes.photo)
  }
  await updateDoc(noteDoc(note.id), { ...data })
  // l'ancienne grande photo ne sert plus → on la supprime pour libérer de la place
  if (changes.photo && note.photoId) await deletePhoto(note.photoId)
}

/** SUPPRIMER une note et sa grande photo */
export async function deleteNote(note: Note): Promise<void> {
  if (note.photoId) await deletePhoto(note.photoId)
  await deleteDoc(noteDoc(note.id))
}
