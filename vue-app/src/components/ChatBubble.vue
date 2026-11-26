<script setup lang="ts">
import type { Auteur } from '@/type/message'

defineProps<{
  texte: string
  auteur: Auteur
  date: Date
}>()

</script>

<template>
  <div class="bulle" :class="auteur">
    <p>{{ texte }}</p>
    <small>{{ date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}</small>
  </div>
</template>

<style scoped src="@/styles/composant-chat-bubble.css"></style>