# 05 — Les opérations sur les notes (CRUD)

## À quoi sert ce fichier

C'est **le seul endroit** où les notes sont lues et écrites dans Firestore. Les composants appellent ces fonctions, jamais Firestore directement.

| Fonction | Fait | Fonctions Firestore utilisées | Coût |
|---|---|---|---|
| `createNote(title, text, photo?)` | Crée la note (+ la photo) | `addDoc` | 1 écriture (2 avec photo) |
| `listMyNotes(after?)` | 20 notes, triées par date ; page suivante avec `after` | `query`, `where`, `orderBy`, `limit`, `startAfter`, `getDocs` | 1 lecture par note |
| `getNote(id)` | Une note | `getDoc` | 1 lecture |
| `updateNote(note, changes)` | Modifie titre/texte, remplace la photo | `updateDoc` (+ `deleteDoc` ancienne photo) | 1 écriture (+1 écriture +1 suppression si photo) |
| `deleteNote(note)` | Supprime la photo puis la note | `deleteDoc` | 1 suppression (2 avec photo) |

**Où :** `src/services/notes.ts`

**Fichier :** `src/services/notes.ts`

```ts
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
```

## Points importants

| Point | Explication |
|---|---|
| `const data: NoteCreate = {...}` | Le gabarit du doc 03. TypeScript refuse tout champ manquant ou en trop. |
| `owner: user.uid` | Obligatoire : la règle `isOwner(request.resource.data.owner)` refuse sinon. |
| `serverTimestamp()` | Obligatoire : la règle `createdAt == request.time` refuse une date locale. |
| `where('owner', '==', user.uid)` | Obligatoire : la règle de lecture n'autorise que ses notes. Sans ce filtre, **toute la requête** est refusée. |
| `where` + `orderBy` sur 2 champs | Nécessite l'index composite (zip 1, doc 07). Sinon erreur `failed-precondition`. |
| `limit(PAGE_SIZE)` + `startAfter` | Pagination : on ne lit jamais plus de 20 notes à la fois. |
| `{ ...data }` dans `updateDoc` | `updateDoc` attend un objet générique ; la copie garde la vérification de type faite sur `data`. |
| Ordre dans `deleteNote` | Photo d'abord : si l'app est coupée entre les deux, il reste au pire une note sans photo (visible, supprimable) plutôt qu'une photo orpheline invisible qui occupe de la place. |

## Exemple d'appel direct (pour tester dans la console du navigateur ou un composant)

```ts
import { createNote, listMyNotes } from '@/services/notes'

const id = await createNote('Courses', 'pain, lait')       // crée notes/{id}
const { notes } = await listMyNotes()                       // relit mes 20 dernières
console.log(id, notes)
```

➡️ Suite : `06-erreurs-et-etat.md`
