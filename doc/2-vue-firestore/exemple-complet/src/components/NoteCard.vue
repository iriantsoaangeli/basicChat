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
