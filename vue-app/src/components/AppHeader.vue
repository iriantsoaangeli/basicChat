<script setup lang="ts">
import { IonHeader, IonToolbar } from '@ionic/vue'
import BadgeConnexion from '@/components/BadgeConnexion.vue'

// Texte affiché à gauche et à droite du header
defineProps<{
  left?: string
  right?: string
}>()
</script>

<template>
  <ion-header>
    <ion-toolbar>
      <!-- Zone gauche : prop "left" ou slot "left" -->
      <div slot="start" class="header-text">
        <slot name="left">{{ left }}</slot>
      </div>

      <!-- Badge de connexion, juste avant la zone droite (même slot "end") -->
      <BadgeConnexion slot="end" />

      <!-- Zone droite : prop "right" ou slot "right" -->
      <div slot="end" class="header-text">
        <slot name="right">{{ right }}</slot>
      </div>
    </ion-toolbar>
  </ion-header>
</template>

<!-- Styles partagés avec AppFooter : src/styles/composant-barres-header-footer.css -->
<style scoped src="@/styles/composant-barres-header-footer.css"></style>
