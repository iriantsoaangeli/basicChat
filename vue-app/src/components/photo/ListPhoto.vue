<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IonButton,
  IonButtons,
  IonIcon,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonLabel,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonToolbar,
  type InfiniteScrollCustomEvent,
} from '@ionic/vue'
import { arrowDown, arrowUp } from 'ionicons/icons'
import PhotoCard from '@/components/photo/PhotoCard.vue'
import { toSrc } from '@/service/images'
import type { ChampTri, ChampTriable, Photo, Tri } from '@/type/photo'

// photos     : les photos déjà chargées (le parent les charge par lots)
// champs     : les champs proposés pour le tri
// encore     : reste-t-il un lot à charger ? (sinon le défilement infini s'arrête)
// chargement / erreur : état du chargement en cours
const props = withDefaults(
  defineProps<{
    photos: readonly Photo[]
    champs?: ChampTri[]
    encore?: boolean
    chargement?: boolean
    erreur?: string | null
  }>(),
  { champs: () => [], encore: false, chargement: false, erreur: null },
)

// v-model:tri : le tri choisi (usePhotos retrie les photos chargées quand il change)
const tri = defineModel<Tri>('tri', { required: true })

// plus : le parent charge le lot suivant, puis appelle fini()
const emit = defineEmits<{ plus: [fini: () => void] }>()

const champActif = computed({
  get: () => tri.value.champ,
  set: (champ: ChampTriable) => (tri.value = { ...tri.value, champ }),
})
const inverserSens = () => (tri.value = { ...tri.value, croissant: !tri.value.croissant })

const recherche = ref('')

// Minuscules + sans accents : "Éléphant" est trouvé en tapant "elep"
const normaliser = (texte: string) =>
  texte.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

// La recherche filtre les photos DÉJÀ chargées : Firestore ne sait pas chercher "contient"
const photosAffichees = computed(() => {
  const terme = normaliser(recherche.value.trim())
  if (!terme) return props.photos
  return props.photos.filter((p) => normaliser(`${p.nom} ${p.description ?? ''}`).includes(terme))
})

function lotSuivant(event: InfiniteScrollCustomEvent) {
  emit('plus', () => event.target.complete())
}
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
          :aria-label="tri.croissant ? 'Tri croissant' : 'Tri décroissant'"
          @click="inverserSens"
        >
          <ion-icon slot="icon-only" :icon="tri.croissant ? arrowUp : arrowDown" />
        </ion-button>
      </ion-buttons>
    </ion-toolbar>

    <ion-text v-if="erreur" color="danger">
      <p class="ion-padding ion-text-center">{{ erreur }}</p>
    </ion-text>

    <div v-if="photosAffichees.length" class="liste-grille">
      <PhotoCard
        v-for="photo in photosAffichees"
        :key="photo.id"
        :nom="photo.nom"
        :description="photo.description"
        :image="photo.thumb ? toSrc(photo.thumb) : undefined"
        :lien="`/template/photo/${photo.id}`"
      />
    </div>

    <div v-else-if="chargement" class="ion-padding ion-text-center">
      <ion-spinner />
    </div>

    <ion-text v-else-if="!erreur" color="medium">
      <p class="ion-padding ion-text-center">
        {{ recherche ? 'Aucune photo ne correspond à la recherche.' : 'Aucune photo pour le moment.' }}
      </p>
    </ion-text>

    <!-- Défilement infini : arrivé en bas, on demande le lot suivant au parent -->
    <ion-infinite-scroll :disabled="!encore" @ion-infinite="lotSuivant">
      <ion-infinite-scroll-content loading-text="Chargement des photos suivantes…" />
    </ion-infinite-scroll>
  </div>
</template>

<!-- Styles : src/styles/composant-list-photo.css -->
<style scoped src="@/styles/composant-list-photo.css"></style>
