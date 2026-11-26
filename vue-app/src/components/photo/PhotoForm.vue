<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { IonButton, IonIcon, IonInput, IonList, IonTextarea, IonItem } from '@ionic/vue'
import { imageOutline } from 'ionicons/icons'
import PhotoCard from '@/components/photo/PhotoCard.vue'
import type { NouvellePhoto } from '@/type/photo'

// Formulaire d'ajout d'une photo : nom (obligatoire), description, image
// valider → renvoie les données remplies ; le parent décide quoi en faire
const emit = defineEmits<{ valider: [photo: NouvellePhoto] }>()

const nom = ref('')
const description = ref('')
const image = ref('') // URL locale de l'image choisie (aperçu)
const champFichier = ref<HTMLInputElement>()

const valide = computed(() => nom.value.trim() !== '')

// Le fichier choisi est montré via une URL locale (blob:...),
// valable tant que la page est ouverte : pas encore d'envoi vers un serveur
function choisirImage(event: Event) {
  const fichier = (event.target as HTMLInputElement).files?.[0]
  if (!fichier) return
  if (image.value) URL.revokeObjectURL(image.value) // libère l'image précédente
  image.value = URL.createObjectURL(fichier)
}

let envoye = false
function valider() {
  if (!valide.value) return
  envoye = true
  emit('valider', {
    nom: nom.value.trim(),
    description: description.value.trim() || undefined,
    image: image.value || undefined,
  })
}

// Formulaire fermé sans valider : l'image choisie ne sert plus, on la libère
onBeforeUnmount(() => {
  if (!envoye && image.value) URL.revokeObjectURL(image.value)
})
</script>

<template>
  <form @submit.prevent="valider">
    <!-- Aperçu : la carte telle qu'elle apparaîtra dans la galerie -->
    <PhotoCard :nom="nom || 'Nom de la photo'" :description="description" :image="image" />

    <ion-list>
      <ion-item>
        <ion-input v-model="nom" label="Nom" label-placement="stacked" placeholder="Ex. Tsingy" required />
      </ion-item>
      <ion-item>
        <ion-textarea
          v-model="description"
          label="Description"
          label-placement="stacked"
          placeholder="Facultative"
          auto-grow
        />
      </ion-item>
    </ion-list>

    <!-- Le vrai champ fichier est caché (attribut hidden) ; le bouton Ionic l'ouvre -->
    <input ref="champFichier" type="file" accept="image/*" hidden @change="choisirImage" />

    <div class="ion-padding">
      <ion-button expand="block" fill="outline" @click="champFichier?.click()">
        <ion-icon slot="start" :icon="imageOutline" />
        {{ image ? "Changer l'image" : 'Choisir une image' }}
      </ion-button>
      <ion-button expand="block" type="submit" :disabled="!valide">Enregistrer</ion-button>
    </div>
  </form>
</template>
