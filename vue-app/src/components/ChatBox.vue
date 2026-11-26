<script setup lang="ts">
import ChatBubble from './ChatBubble.vue'
import type { Message } from '@/type/message'

defineProps<{
  messages: Message[]
  enAttente: boolean
}>()
</script>

<template>
  <div class="chat-box">
    <ChatBubble
      v-for="m in messages"
      :key="m.id"
      :texte="m.texte"
      :auteur="m.auteur"
      :date="m.createdAt.toDate()"
    />
    <div v-if="enAttente" class="ecrit" role="status" aria-label="Gemini écrit">
      <span></span><span></span><span></span>
    </div>
    <p v-if="!messages.length && !enAttente" class="vide">
      Aucun message pour l'instant. Écris ta question en bas pour démarrer la conversation avec Gemini.
    </p>
  </div>
</template>

<style scoped src="@/styles/composant-chat-box.css"></style>