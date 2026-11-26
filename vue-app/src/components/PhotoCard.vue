<script setup lang="ts">
import { IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/vue'

// Carte photo : une image, un nom et une description
defineProps<{
  nom: string
  description?: string
  image?: string // URL de l'image ; si vide, un dégradé s'affiche à la place
}>()
</script>

<template>
  <ion-card>
    <img v-if="image" class="photo" :src="image" :alt="nom" />
    <div v-else class="photo photo-vide"></div>

    <ion-card-header>
      <ion-card-title>{{ nom }}</ion-card-title>
      <ion-card-subtitle v-if="description">{{ description }}</ion-card-subtitle>
    </ion-card-header>
  </ion-card>
</template>

<!-- Styles : src/styles/composant-photo-card.css -->
<style scoped src="@/styles/composant-photo-card.css"></style>
