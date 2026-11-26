<script setup lang="ts">
import { ref, watch } from 'vue'
import { IonBackButton, IonButtons, IonContent, IonPage, IonSpinner, IonText } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import { usePhotos } from '@/composables/usePhotos'
import { errorMessage } from '@/service/errors'
import { lireImage, toSrc } from '@/service/images'
import { lirePhoto } from '@/service/photos'
import type { Photo } from '@/type/photo'

// Page "photo en grand", ouverte par la route /template/photo/:id
// id vient de l'URL (props: true dans le router)
const props = defineProps<{ id: string }>()

const { trouver } = usePhotos()

const photo = ref<Photo | null>() // undefined = en cours, null = n'existe pas
const image = ref<string>() // src de l'image affichée (miniature, puis grande image)
const erreur = ref<string | null>(null)

async function charger(id: string) {
  erreur.value = null
  image.value = undefined
  try {
    // Déjà chargée par la galerie ? Sinon (lien ouvert directement) : 1 lecture Firestore
    photo.value = trouver(id) ?? (await lirePhoto(id))
    if (!photo.value) return
    // La miniature s'affiche tout de suite, la grande image la remplace dès qu'elle arrive
    if (photo.value.thumb) image.value = toSrc(photo.value.thumb)
    if (photo.value.imageId) {
      const b64 = await lireImage(photo.value.imageId)
      if (b64 && props.id === id) image.value = toSrc(b64)
    }
  } catch (e) {
    erreur.value = errorMessage(e)
    console.error(e)
  }
}

watch(() => props.id, charger, { immediate: true })
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
      <ion-text v-if="erreur" color="danger">
        <p class="ion-padding ion-text-center">{{ erreur }}</p>
      </ion-text>

      <!-- ion-padding (classe Ionic) : marge tout autour, la photo ne touche plus les bords de l'écran -->
      <div v-else-if="photo" class="ion-padding">
        <img v-if="image" class="photo-grand" :src="image" :alt="photo.nom" />
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

      <div v-else-if="photo === undefined" class="ion-padding ion-text-center">
        <ion-spinner />
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
