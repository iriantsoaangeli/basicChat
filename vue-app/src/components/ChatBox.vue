<script setup lang="ts">
import ChatBubble from './ChatBubble.vue'
import type { Message } from '@/type/message'

const props = defineProps<{
  messages: Message[]
  enAttente: boolean
}>()

// Même jour ? toDateString() = "Thu Nov 27 2026" (sans l'heure)
function memeJour(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

// Faut-il un séparateur de jour avant le message n° i ?
function nouveauJour(i: number): boolean {
  const ici = props.messages[i]
  const avant = props.messages[i - 1]
  if (!ici || !avant) return true          // le 1er message ouvre toujours un jour
  return !memeJour(ici.createdAt.toDate(), avant.createdAt.toDate())
}

// "Aujourd'hui", "Hier", ou "mardi 25 novembre" (+ l'année si ce n'est pas celle-ci)
function libelleJour(d: Date): string {
  const aujourdhui = new Date()
  const hier = new Date()
  hier.setDate(hier.getDate() - 1)
  if (memeJour(d, aujourdhui)) return "Aujourd'hui"
  if (memeJour(d, hier)) return 'Hier'
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: d.getFullYear() === aujourdhui.getFullYear() ? undefined : 'numeric',
  })
}
</script>

<template>
  <div class="chat-box">
    <!-- Conversation vide : on présente Gemini et on dit quoi faire -->
    <div v-if="!messages.length && !enAttente" class="vide">
      <span class="vide-avatar" aria-hidden="true">G</span>
      <p class="vide-nom">Gemini</p>
      <p class="vide-texte">Pose ta première question dans le champ en bas.</p>
    </div>

    <!-- <template> = groupe invisible : un séparateur (parfois) + une bulle par message -->
    <template v-for="(m, i) in messages" :key="m.id">
      <p v-if="nouveauJour(i)" class="jour">{{ libelleJour(m.createdAt.toDate()) }}</p>
      <ChatBubble :texte="m.texte" :auteur="m.auteur" :date="m.createdAt.toDate()" />
    </template>

    <p v-if="enAttente" class="ecrit" role="status">TchangGPT écrit…</p>
  </div>
</template>

<style scoped src="@/styles/composant-chat-box.css"></style>
