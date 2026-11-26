<script setup lang="ts">
import { computed } from 'vue'
import { beautifyAnswer } from '@/service/gemini'
import type { Auteur } from '@/type/message'

const props = defineProps<{
  texte: string
  auteur: Auteur
  date: Date
}>()

// Nom affiché au-dessus des bulles des AUTRES participants (pas des tiennes)
const NOMS: Record<Auteur, string> = { user: 'Moi', gemini: 'Gemini', autre: 'Autre' }
// ?? 'Autre' : si un auteur inattendu arrive quand même, on n'affiche pas "undefined"
const nom = computed(() => NOMS[props.auteur] ?? 'Autre')

// HTML mis en forme, calculé seulement pour Gemini et seulement si le texte change
const html = computed(() => beautifyAnswer(props.texte))
const heure = computed(() => props.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
</script>

<template>
  <!-- .ligne = avatar + bulle. Le CSS décide quand montrer l'avatar et le nom -->
  <div class="ligne" :class="auteur">
    <span v-if="auteur !== 'user'" class="avatar" aria-hidden="true">{{ nom.charAt(0) }}</span>

    <div class="contenu">
      <span v-if="auteur !== 'user'" class="nom">{{ nom }}</span>
      <div class="bulle">
        <!-- Gemini : Markdown mis en forme. v-html est sûr ICI car beautifyAnswer échappe tout d'abord -->
        <div v-if="auteur === 'gemini'" class="md" v-html="html"></div>
        <!-- Toi et les autres : texte brut, échappé automatiquement par {{ }} -->
        <p v-else>{{ texte }}</p>
        <small>{{ heure }}</small>
      </div>
    </div>
  </div>
</template>

<style scoped src="@/styles/composant-chat-bubble.css"></style>
