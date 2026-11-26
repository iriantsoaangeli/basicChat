<script setup lang="ts">
import { ref } from 'vue'
import { IonTextarea } from '@ionic/vue'

const props = defineProps<{ disabled: boolean }>()
const emit = defineEmits<{ send: [texte: string] }>()

const texte = ref('')

function envoyer() {
    const propre = texte.value.trim()
    if (!propre || props.disabled) return
    emit('send', propre)
    texte.value = ''
}
</script>

<!-- .enter : seulement la touche Entrée ;
.exact : seulement si aucune autre touche n'est enfoncée. 
Shift+Entrée ne déclenche donc rien ici et garde son comportement normal : 
un retour à la ligne ;
.prevent : annule l'action par défaut. Sans lui, 
Entrée ajouterait d'abord un \n au texte. -->

<template>
  <ion-textarea
    v-model="texte"
    :disabled="disabled"
    placeholder="Écris un message…"
    :auto-grow="true"
    :rows="1"
    @keydown.enter.exact.prevent="envoyer"
  />
</template>

<!-- Styles : src/styles/composant-chat-input.css -->
<style scoped src="@/styles/composant-chat-input.css"></style>