<script setup lang="ts">
import { computed } from 'vue'
import { IonBackButton, IonButtons, IonContent, IonPage, IonText } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import { trouverPhoto } from '@/data/photos-exemple'

// Page "photo en grand", ouverte par la route /template/photo/:id
// id vient de l'URL (props: true dans le router)
const props = defineProps<{ id: string }>()

const photo = computed(() => trouverPhoto(props.id))
</script>

<template>
  <ion-page>
    <AppHeader :right="photo?.nom">
      <template #left>
        <!-- Retour à la page précédente ; si on arrive directement par l'URL, retour à la galerie -->
        <ion-buttons>
          <ion-back-button default-href="/template/galerie" text="Galerie" />
        </ion-buttons>
      </template>
    </AppHeader>

    <ion-content>
      <!-- ion-padding (classe Ionic) : marge tout autour, la photo ne touche plus les bords de l'écran -->
      <div v-if="photo" class="ion-padding">
        <img v-if="photo.image" class="photo-grand" :src="photo.image" :alt="photo.nom" />
        <div v-else class="photo photo-vide"></div>

        <div>
          <h1>{{ photo.nom }}</h1>
          <ion-text v-if="photo.description" color="medium">
            <p>{{ photo.description }}</p>
          </ion-text>
          <ion-text color="medium">
            <p>Ajoutée le {{ photo.createdAt.toDate().toLocaleDateString('fr-FR') }}</p>
          </ion-text>
        </div>
      </div>

      <ion-text v-else color="medium">
        <p class="ion-padding ion-text-center">Cette photo n'existe pas.</p>
      </ion-text>
    </ion-content>
  </ion-page>
</template>

<!-- Styles :
     src/styles/composant-photo-card.css  → .photo et .photo-vide, réutilisés tels quels
     src/styles/composant-photo-grand.css → .photo-grand, l'image en grand -->
<style scoped src="@/styles/composant-photo-card.css"></style>
<style scoped src="@/styles/composant-photo-grand.css"></style>
