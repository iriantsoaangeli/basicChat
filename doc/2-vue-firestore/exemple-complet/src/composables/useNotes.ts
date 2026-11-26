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
