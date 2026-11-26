<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import GithubLink from '@/components/GithubLink.vue'
import ListPhoto from '@/components/photo/ListPhoto.vue'
import { photosExemple as photos } from '@/data/photos-exemple'
import type { ChampTri } from '@/type/photo'

// Champs proposés pour le tri, dans l'ordre d'affichage
const champs: ChampTri[] = [
  { cle: 'nom', label: 'Nom' },
  { cle: 'createdAt', label: 'Création' },
  { cle: 'updatedAt', label: 'Modification' },
]
</script>

<template>
  <ion-page>
    <AppHeader left="Galerie" right="Template" />

    <ion-content>
      <ListPhoto :photos="photos" :champs="champs" />
    </ion-content>

    <AppFooter left="ETU003964 · ETU004101">
      <template #right>
        <GithubLink url="https://github.com/iriantsoaangeli/basicChat" label="basicChat" />
      </template>
    </AppFooter>
  </ion-page>
</template>

