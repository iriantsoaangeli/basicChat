<script setup lang="ts">
import { ref } from 'vue'
import { IonButton, IonButtons, IonContent, IonIcon, IonModal, IonPage } from '@ionic/vue'
import { closeOutline, cloudUploadOutline } from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import GithubLink from '@/components/GithubLink.vue'
import ListPhoto from '@/components/photo/ListPhoto.vue'
import PhotoForm from '@/components/photo/PhotoForm.vue'
import { ajouterPhoto, photosExemple as photos } from '@/data/photos-exemple'
import type { ChampTri, NouvellePhoto } from '@/type/photo'

// Champs proposés pour le tri, dans l'ordre d'affichage
const champs: ChampTri[] = [
  { cle: 'nom', label: 'Nom' },
  { cle: 'createdAt', label: 'Création' },
  { cle: 'updatedAt', label: 'Modification' },
]

// Fenêtre d'ajout ouverte par le bouton Upload du header
const formulaireOuvert = ref(false)

function enregistrer(photo: NouvellePhoto) {
  ajouterPhoto(photo)
  formulaireOuvert.value = false
}
</script>

<template>
  <ion-page>
    <AppHeader left="Galerie">
      <template #right>
        <ion-buttons>
          <ion-button @click="formulaireOuvert = true">
            <ion-icon slot="start" :icon="cloudUploadOutline" />
            Upload
          </ion-button>
        </ion-buttons>
      </template>
    </AppHeader>

    <ion-content>
      <ListPhoto :photos="photos" :champs="champs" />
    </ion-content>

    <AppFooter left="ETU003964 · ETU004101">
      <template #right>
        <GithubLink url="https://github.com/iriantsoaangeli/basicChat" label="basicChat" />
      </template>
    </AppFooter>

    <!-- @did-dismiss : remet l'état à jour si on ferme en glissant ou par la touche Échap -->
    <ion-modal :is-open="formulaireOuvert" @did-dismiss="formulaireOuvert = false">
      <AppHeader left="Nouvelle photo">
        <template #right>
          <ion-buttons>
            <ion-button aria-label="Fermer" @click="formulaireOuvert = false">
              <ion-icon slot="icon-only" :icon="closeOutline" />
            </ion-button>
          </ion-buttons>
        </template>
      </AppHeader>
      <ion-content>
        <PhotoForm @valider="enregistrer" />
      </ion-content>
    </ion-modal>
  </ion-page>
</template>
