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
