<script setup lang="ts">
import { IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/vue'

// Carte photo : une image, un nom et une description
defineProps<{
  nom: string
  description?: string
  image?: string // URL de l'image ; si vide, un dégradé s'affiche à la place
  lien?: string // route ouverte au clic (ex. /template/photo/3) ; sans lien, la carte n'est pas cliquable
}>()
</script>

<template>
  <!-- router-link : navigation Ionic (avec animation) au clic -->
  <ion-card :router-link="lien" :button="!!lien">
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
