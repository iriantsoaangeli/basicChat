<script setup lang="ts">
import { IonPage, IonContent, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'

// Éléments d'exemple pour la galerie (à remplacer par les vraies données)
const items = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  titre: `Élément ${i + 1}`,
  description: 'Description courte',
}))
</script>

<template>
  <ion-page>
    <AppHeader left="Galerie" right="Template" />

    <ion-content>
      <div class="galerie-grid">
        <ion-card v-for="item in items" :key="item.id">
          <!-- Zone image : remplacer par <img :src="..." /> -->
          <div class="placeholder">{{ item.id }}</div>
          <ion-card-header>
            <ion-card-title>{{ item.titre }}</ion-card-title>
            <ion-card-subtitle>{{ item.description }}</ion-card-subtitle>
          </ion-card-header>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<!-- Styles : src/styles/page-galerie.css -->
<style scoped src="@/styles/page-galerie.css"></style>
