<script setup lang="ts">
import { IonFooter, IonToolbar } from '@ionic/vue'

// Texte affiché à gauche et à droite du footer
defineProps<{
  left?: string
  right?: string
}>()
</script>

<template>
  <ion-footer>
    <ion-toolbar>
      <!-- Zone gauche : prop "left" ou slot "left" -->
      <div slot="start" class="header-text">
        <slot name="left">{{ left }}</slot>
      </div>

      <!-- Zone droite : prop "right" ou slot "right" -->
      <div slot="end" class="header-text">
        <slot name="right">{{ right }}</slot>
      </div>
    </ion-toolbar>
  </ion-footer>
</template>

<!-- Styles partagés avec AppHeader : src/styles/composant-barres-header-footer.css -->
<style scoped src="@/styles/composant-barres-header-footer.css"></style>
