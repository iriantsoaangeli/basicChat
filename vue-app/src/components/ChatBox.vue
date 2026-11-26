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
    <p v-if="enAttente" class="ecrit">Gemini écrit…</p>
    <p v-if="!messages.length && !enAttente" class="vide">Pose ta première question à Gemini 👋</p>
  </div>
</template>

<style scoped src="@/styles/composant-chat-box.css"></style>