<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue'
import { Timestamp } from 'firebase/firestore'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import GithubLink from '@/components/GithubLink.vue'
import ListPhoto from '@/components/photo/ListPhoto.vue'
import type { ChampTri, Photo } from '@/type/photo'

// Photos d'exemple (à remplacer par les vraies données Firestore)
// image vide = PhotoCard affiche le dégradé
const date = (jour: number) => Timestamp.fromDate(new Date(2026, 10, jour))
const photos: Photo[] = [
  { id: '1', nom: 'Tsingy', description: 'Parc national', image: '', createdAt: date(3), updatedAt: date(20) },
  { id: '2', nom: 'Allée des Baobabs', description: 'Morondava', image: '', createdAt: date(12), updatedAt: date(12) },
  { id: '3', nom: 'Isalo', description: 'Canyons et piscines naturelles', image: '', createdAt: date(1), updatedAt: date(25) },
  { id: '4', nom: 'Nosy Be', description: 'Plage', image: '', createdAt: date(18), updatedAt: date(19) },
  { id: '5', nom: 'Andasibe', description: 'Forêt et lémuriens', image: '', createdAt: date(7), updatedAt: date(8) },
  { id: '6', nom: 'Écureuil', description: 'Photo sans lieu', image: '', createdAt: date(22), updatedAt: date(22) },
]

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

