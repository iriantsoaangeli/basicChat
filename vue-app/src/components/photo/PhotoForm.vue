<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { IonButton, IonIcon, IonInput, IonItem, IonList, IonText, IonTextarea } from '@ionic/vue'
import { imageOutline } from 'ionicons/icons'
import PhotoCard from '@/components/photo/PhotoCard.vue'
import { DESCRIPTION_MAX, NOM_MAX, type NouvellePhoto } from '@/type/photo'

// Formulaire d'ajout d'une photo : nom et image obligatoires, description facultative
// valider → renvoie les données remplies ; le parent décide quoi en faire
// desactive : bloque l'envoi (ex. pas d'internet, envoi déjà en cours)
defineProps<{ desactive?: boolean }>()
const emit = defineEmits<{ valider: [photo: NouvellePhoto] }>()

const nom = ref('')
const description = ref('')
const fichier = ref<File>()
const apercu = ref('') // URL locale (blob:...) du fichier, seulement pour l'aperçu
const champFichier = ref<HTMLInputElement>()

const valide = computed(() => nom.value.trim() !== '' && fichier.value !== undefined)

function choisirImage(event: Event) {
  const choisi = (event.target as HTMLInputElement).files?.[0]
  if (!choisi) return
  if (apercu.value) URL.revokeObjectURL(apercu.value) // libère l'aperçu précédent
  fichier.value = choisi
  apercu.value = URL.createObjectURL(choisi)
}

// Le fichier lui-même est envoyé : la compression en base64 se fait à l'enregistrement
function valider() {
  if (!valide.value || !fichier.value) return
  emit('valider', {
    nom: nom.value.trim(),
    description: description.value.trim() || undefined,
    fichier: fichier.value,
  })
}

// L'aperçu ne sert plus une fois le formulaire fermé
onBeforeUnmount(() => {
  if (apercu.value) URL.revokeObjectURL(apercu.value)
})
</script>

<template>
  <form @submit.prevent="valider">
    <!-- Aperçu : la carte telle qu'elle apparaîtra dans la galerie -->
    <PhotoCard :nom="nom || 'Nom de la photo'" :description="description" :image="apercu" />

    <!-- maxlength : mêmes limites que firestore.rules, bloquées avant l'envoi -->
    <ion-list>
      <ion-item>
        <ion-input
          v-model="nom"
          label="Nom"
          label-placement="stacked"
          placeholder="Ex. Tsingy"
          :maxlength="NOM_MAX"
          required
        />
      </ion-item>
      <ion-item>
        <ion-textarea
          v-model="description"
          label="Description"
          label-placement="stacked"
          placeholder="Facultative"
          :maxlength="DESCRIPTION_MAX"
          auto-grow
        />
      </ion-item>
    </ion-list>

    <!-- Le vrai champ fichier est caché (attribut hidden) ; le bouton Ionic l'ouvre -->
    <input ref="champFichier" type="file" accept="image/*" hidden @change="choisirImage" />

    <div class="ion-padding">
      <ion-button expand="block" fill="outline" @click="champFichier?.click()">
        <ion-icon slot="start" :icon="imageOutline" />
        {{ fichier ? "Changer l'image" : 'Choisir une image' }}
      </ion-button>
      <!-- Indique ce qui manque tant qu'Enregistrer est grisé -->
      <ion-text v-if="!valide" color="medium">
        <p class="ion-text-center">Le nom et l'image sont obligatoires.</p>
      </ion-text>
      <ion-button expand="block" type="submit" :disabled="!valide || desactive">Enregistrer</ion-button>
    </div>
  </form>
</template>
