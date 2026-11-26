<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import GithubLink from '@/components/GithubLink.vue'
import PhotoCard from '@/components/PhotoCard.vue'

// Éléments d'exemple pour la galerie (à remplacer par les vraies données)
// image : URL de la photo (laisser vide pour afficher le dégradé)
const items = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  nom: `Élément ${i + 1}`,
  description: 'Description courte',
  image: '',
}))
</script>

<template>
  <ion-page>
    <AppHeader left="Galerie" right="Template" />

    <ion-content>
      <div class="galerie-grid">
        <PhotoCard
          v-for="item in items"
          :key="item.id"
          :nom="item.nom"
          :description="item.description"
          :image="item.image"
        />
      </div>
    </ion-content>

    <AppFooter left="ETU003964 · ETU004101">
      <template #right>
        <GithubLink url="https://github.com/iriantsoaangeli/basicChat" label="basicChat" />
      </template>
    </AppFooter>
  </ion-page>
</template>

<!-- Styles : src/styles/page-galerie.css -->
<style scoped src="@/styles/page-galerie.css"></style>
