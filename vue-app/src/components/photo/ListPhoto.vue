<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IonButton,
  IonButtons,
  IonIcon,
  IonLabel,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonToolbar,
} from '@ionic/vue'
import { arrowDown, arrowUp } from 'ionicons/icons'
import { Timestamp } from 'firebase/firestore'
import PhotoCard from '@/components/photo/PhotoCard.vue'
import type { ChampTri, Photo } from '@/type/photo'

// photos : la liste à afficher
// champs : les champs proposés pour le tri (le premier est choisi par défaut)
const props = withDefaults(
  defineProps<{
    photos: Photo[]
    champs?: ChampTri[]
  }>(),
  { champs: () => [] },
)

const recherche = ref('')
const champActif = ref<keyof Photo | undefined>(props.champs[0]?.cle)
const croissant = ref(true)

// Minuscules + sans accents : "Éléphant" est trouvé en tapant "elep"
const normaliser = (texte: string) =>
  texte.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

// Compare deux valeurs d'un champ : dates Firestore, nombres ou textes
function comparer(a: Photo[keyof Photo], b: Photo[keyof Photo]): number {
  if (a === undefined || a === '') return 1 // les valeurs vides vont à la fin
  if (b === undefined || b === '') return -1
  if (a instanceof Timestamp && b instanceof Timestamp) return a.toMillis() - b.toMillis()
  return String(a).localeCompare(String(b), 'fr', { numeric: true })
}

// Photos visibles : d'abord filtrées par la recherche, puis triées
const photosAffichees = computed(() => {
  const terme = normaliser(recherche.value.trim())
  const filtrees = props.photos.filter((p) =>
    normaliser(`${p.nom} ${p.description ?? ''}`).includes(terme),
  )

  const cle = champActif.value
  if (!cle) return filtrees
  const sens = croissant.value ? 1 : -1
  // [...] : copie, pour ne jamais modifier le tableau reçu en prop
  return [...filtrees].sort((a, b) => sens * comparer(a[cle], b[cle]))
})
</script>

<template>
  <div>
    <ion-toolbar>
      <ion-searchbar v-model="recherche" placeholder="Rechercher une photo" />
    </ion-toolbar>

    <!-- Barre de tri : seulement si des champs sont fournis -->
    <ion-toolbar v-if="champs.length">
      <ion-segment v-model="champActif" scrollable>
        <ion-segment-button v-for="champ in champs" :key="champ.cle" :value="champ.cle">
          <ion-label>{{ champ.label }}</ion-label>
        </ion-segment-button>
      </ion-segment>

      <ion-buttons slot="end">
        <ion-button
          :aria-label="croissant ? 'Tri croissant' : 'Tri décroissant'"
          @click="croissant = !croissant"
        >
          <ion-icon slot="icon-only" :icon="croissant ? arrowUp : arrowDown" />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <div v-if="photosAffichees.length" class="liste-grille">
      <PhotoCard
        v-for="photo in photosAffichees"
        :key="photo.id"
        :nom="photo.nom"
        :description="photo.description"
        :image="photo.image"
        :lien="`/template/photo/${photo.id}`"
      />
    </div>

    <ion-text v-else color="medium">
      <p class="ion-padding ion-text-center">Aucune photo ne correspond à la recherche.</p>
    </ion-text>
  </div>
</template>

<!-- Styles : src/styles/composant-list-photo.css -->
<style scoped src="@/styles/composant-list-photo.css"></style>
