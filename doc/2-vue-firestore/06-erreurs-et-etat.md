# 06 — Messages d'erreur et état réactif

## `src/services/errors.ts`

**À quoi ça sert :** Firebase renvoie des codes (`permission-denied`, `resource-exhausted`…). Ce fichier les traduit en phrases pour l'utilisateur.

**Fichier :** `src/services/errors.ts`

```ts
// src/services/errors.ts
// RÔLE : transformer les erreurs Firebase en messages compréhensibles pour l'utilisateur.
import { FirebaseError } from 'firebase/app'

export function errorMessage(e: unknown): string {
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case 'permission-denied':
        return "Action refusée par les règles de sécurité."
      case 'resource-exhausted':
        return 'Limite gratuite du jour atteinte. Réessaie demain vers 11h.'
      case 'unavailable':
        return 'Pas de connexion au serveur. Vérifie internet.'
      case 'failed-precondition':
        return 'Index manquant : déploie firestore.indexes.json (voir la console du navigateur).'
    }
    return `Erreur Firebase : ${e.code}`
  }
  return e instanceof Error ? e.message : String(e)
}
```

| Code | Cause habituelle |
|---|---|
| `permission-denied` | Les règles refusent : champ en trop, mauvais `owner`, requête sans `where('owner', ...)`, règles pas déployées |
| `resource-exhausted` | Quota gratuit du jour atteint |
| `unavailable` | Pas d'internet (les données en cache restent lisibles) |
| `failed-precondition` | Index composite pas encore déployé ou pas encore construit |

## `src/composables/useNotes.ts`

**À quoi ça sert :** les services renvoient des données ; les composants ont besoin de variables **réactives** (qui mettent l'écran à jour toutes seules) : la liste, « chargement en cours », le message d'erreur, « il y a une page suivante ». Ce composable les fournit et appelle les services.

**Où :** crée le dossier `src/composables/`.

**Fichier :** `src/composables/useNotes.ts`

```ts
// src/composables/useNotes.ts
// RÔLE : garder la liste des notes dans un état réactif (ref) que les composants affichent.
// Gère aussi "chargement en cours", les erreurs et la pagination.
import { ref } from 'vue'
import type { QueryDocumentSnapshot } from 'firebase/firestore'
import type { Note, NoteDb } from '@/models/note'
import { createNote, deleteNote, listMyNotes, updateNote } from '@/services/notes'
import { errorMessage } from '@/services/errors'

export function useNotes() {
  const notes = ref<Note[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(false)
  let last: QueryDocumentSnapshot<Note, NoteDb> | undefined

  // Exécute une action en gérant loading + error
  async function run(action: () => Promise<void>) {
    loading.value = true
    error.value = null
    try {
      await action()
    } catch (e) {
      error.value = errorMessage(e)
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  /** (Re)charge la première page */
  const load = () =>
    run(async () => {
      const page = await listMyNotes()
      notes.value = page.notes
      last = page.last
      hasMore.value = page.hasMore
    })

  /** Ajoute la page suivante à la liste */
  const loadMore = () =>
    run(async () => {
      if (!last) return
      const page = await listMyNotes(last)
      notes.value.push(...page.notes)
      last = page.last
      hasMore.value = page.hasMore
    })

  const add = (title: string, text: string, photo?: File) =>
    run(async () => {
      await createNote(title, text, photo)
      const page = await listMyNotes()
      notes.value = page.notes
      last = page.last
      hasMore.value = page.hasMore
    })

  const edit = (note: Note, changes: { title?: string; text?: string; photo?: File }) =>
    run(async () => {
      await updateNote(note, changes)
      const page = await listMyNotes()
      notes.value = page.notes
      last = page.last
      hasMore.value = page.hasMore
    })

  const remove = (note: Note) =>
    run(async () => {
      await deleteNote(note)
      notes.value = notes.value.filter((n) => n.id !== note.id)
    })

  return { notes, loading, error, hasMore, load, loadMore, add, edit, remove }
}
```

| Élément | Rôle |
|---|---|
| `notes`, `loading`, `error`, `hasMore` | Variables réactives affichées par `App.vue` |
| `run(action)` | Met `loading` à vrai, exécute, attrape l'erreur et la traduit. Évite de répéter `try/catch` partout. |
| `last` | Dernier document de la page affichée, pour que `loadMore` reparte de là |
| `add`, `edit` | Appellent le service puis rechargent la 1re page (pour voir la nouvelle note en haut) |
| `remove` | Supprime puis retire la note de la liste locale (pas de relecture = pas de lectures consommées) |

➡️ Suite : `07-composants.md`
