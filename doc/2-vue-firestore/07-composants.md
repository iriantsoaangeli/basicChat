# 07 — Les composants

**Où :** `src/components/` (crée le dossier) et `src/App.vue` (existe déjà : remplace son contenu).

## `NoteForm.vue` — le formulaire

**À quoi ça sert :** saisir titre, texte, photo. Il **ne touche pas à Firestore** : il émet l'événement `submit` avec les valeurs ; c'est `App.vue` qui le relie à `useNotes().add`.

**Fichier :** `src/components/NoteForm.vue`

```vue
<!-- src/components/NoteForm.vue
     RÔLE : formulaire de création. Il ne parle pas à Firestore : il envoie l'événement `submit`
     au parent, qui appelle useNotes().add(...) -->
<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ submit: [title: string, text: string, photo: File | undefined] }>()

const title = ref('')
const text = ref('')
const photo = ref<File | undefined>()
const fileInput = ref<HTMLInputElement | null>(null)

function onFile(e: Event) {
  photo.value = (e.target as HTMLInputElement).files?.[0]
}

function send() {
  if (!title.value.trim()) return
  emit('submit', title.value.trim(), text.value, photo.value)
  title.value = ''
  text.value = ''
  photo.value = undefined
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <form @submit.prevent="send">
    <input v-model="title" placeholder="Titre" maxlength="100" required />
    <textarea v-model="text" placeholder="Texte" maxlength="5000" />
    <input ref="fileInput" type="file" accept="image/*" @change="onFile" />
    <button type="submit" :disabled="disabled">Ajouter</button>
  </form>
</template>
```

| Élément | Rôle |
|---|---|
| `maxlength="100"` / `"5000"` | Mêmes limites que les règles : l'utilisateur est bloqué avant l'envoi |
| `accept="image/*"` | Dans l'APK, ouvre la galerie / l'appareil photo |
| `fileInput.value.value = ''` | Vide le champ fichier après l'envoi |

## `NoteCard.vue` — une note

**À quoi ça sert :** afficher une note avec sa miniature. Au clic sur la miniature, charge la grande photo (1 lecture, ou 0 si déjà vue).

**Fichier :** `src/components/NoteCard.vue`

```vue
<!-- src/components/NoteCard.vue
     RÔLE : afficher UNE note. Affiche la miniature ; au clic, charge la grande photo. -->
<script setup lang="ts">
import { ref } from 'vue'
import type { Note } from '@/models/note'
import { getPhoto, toSrc } from '@/services/photos'

const props = defineProps<{ note: Note }>()
const emit = defineEmits<{ delete: [note: Note] }>()

const bigPhoto = ref<string | null>(null)

async function openPhoto() {
  if (!props.note.photoId) return
  bigPhoto.value = await getPhoto(props.note.photoId) // 1 lecture, ou 0 si déjà en cache
}
</script>

<template>
  <article>
    <img v-if="note.thumb" :src="toSrc(note.thumb)" width="80" alt="" @click="openPhoto" />
    <h3>{{ note.title }}</h3>
    <p>{{ note.text }}</p>
    <small>{{ note.createdAt?.toLocaleString() }}</small>
    <button @click="emit('delete', note)">Supprimer</button>
    <img v-if="bigPhoto" :src="toSrc(bigPhoto)" style="max-width: 100%" alt="" @click="bigPhoto = null" />
  </article>
</template>
```

## `App.vue` — l'écran

**À quoi ça sert :** assembler formulaire, liste et `useNotes()`. Au démarrage (`onMounted`), `load()` connecte l'utilisateur en anonyme et charge la 1re page.

**Fichier :** `src/App.vue`

```vue
<!-- src/App.vue
     RÔLE : l'écran principal. Il relie le formulaire, la liste et useNotes(). -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useNotes } from '@/composables/useNotes'
import NoteForm from '@/components/NoteForm.vue'
import NoteCard from '@/components/NoteCard.vue'

const { notes, loading, error, hasMore, load, loadMore, add, remove } = useNotes()

onMounted(load) // au démarrage : connexion anonyme + chargement de la 1re page
</script>

<template>
  <main>
    <h1>Mes notes</h1>
    <NoteForm :disabled="loading" @submit="add" />
    <p v-if="error" style="color: red">{{ error }}</p>
    <p v-if="loading">Chargement…</p>
    <NoteCard v-for="n in notes" :key="n.id" :note="n" @delete="remove" />
    <button v-if="hasMore" :disabled="loading" @click="loadMore">Voir plus</button>
  </main>
</template>
```

`src/main.ts` (créé par Vue) ne change pas : il monte `App.vue`.

➡️ Suite : `08-tester.md`
