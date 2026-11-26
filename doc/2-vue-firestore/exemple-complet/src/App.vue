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
