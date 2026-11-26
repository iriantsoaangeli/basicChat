<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonLoading,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonToast,
  type RefresherCustomEvent,
} from '@ionic/vue'
import { closeOutline, cloudUploadOutline } from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import GithubLink from '@/components/GithubLink.vue'
import ListPhoto from '@/components/photo/ListPhoto.vue'
import PhotoForm from '@/components/photo/PhotoForm.vue'
import { useConnexion } from '@/composables/useConnexion'
import { usePhotos } from '@/composables/usePhotos'
import type { ChampTri, NouvellePhoto } from '@/type/photo'

const { photos, chargement, erreur, encore, tri, charger, chargerPlus, ajouter } = usePhotos()
const { enLigne } = useConnexion()

// Champs proposés pour le tri, dans l'ordre d'affichage
const champs: ChampTri[] = [
  { cle: 'nom', label: 'Nom' },
  { cle: 'createdAt', label: 'Création' },
  { cle: 'updatedAt', label: 'Modification' },
]

// Premier lot de 8 à l'ouverture de la galerie
onMounted(charger)

// Tirer la liste vers le bas : recharge le premier lot depuis Firestore, puis arrête l'indicateur
async function actualiser(event: RefresherCustomEvent) {
  await charger()
  event.target.complete()
}

// Fenêtre d'ajout ouverte par le bouton Upload du header
const formulaireOuvert = ref(false)
const envoiEnCours = ref(false)

// Résultat de l'upload : message vert (enregistrée) ou rouge (erreur)
const resultat = ref<{ message: string; couleur: 'success' | 'danger' } | null>(null)

async function enregistrer(photo: NouvellePhoto) {
  envoiEnCours.value = true
  const erreurEnvoi = await ajouter(photo)
  envoiEnCours.value = false
  if (erreurEnvoi) {
    resultat.value = { message: erreurEnvoi, couleur: 'danger' } // on garde le formulaire rempli
  } else {
    resultat.value = { message: 'Photo enregistrée', couleur: 'success' }
    formulaireOuvert.value = false
  }
}
</script>

<template>
  <ion-page>
    <AppHeader left="Galerie">
      <template #right>
        <ion-buttons>
          <!-- Hors ligne, l'envoi attendrait le retour du réseau : on bloque le bouton -->
          <ion-button :disabled="!enLigne" @click="formulaireOuvert = true">
            <ion-icon slot="start" :icon="cloudUploadOutline" />
            Upload
          </ion-button>
        </ion-buttons>
      </template>
    </AppHeader>

    <ion-content>
      <!-- slot="fixed" : l'indicateur reste en haut, au-dessus de la liste -->
      <ion-refresher slot="fixed" @ion-refresh="actualiser">
        <ion-refresher-content />
      </ion-refresher>

      <ListPhoto
        v-model:tri="tri"
        :photos="photos"
        :champs="champs"
        :encore="encore"
        :chargement="chargement"
        :erreur="erreur"
        @plus="chargerPlus"
      />
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
        <PhotoForm :desactive="!enLigne || envoiEnCours" @valider="enregistrer" />
      </ion-content>
    </ion-modal>

    <!-- Compression + envoi : peut prendre quelques secondes -->
    <ion-loading :is-open="envoiEnCours" message="Envoi de la photo…" />
    <ion-toast
      :is-open="!!resultat"
      :message="resultat?.message"
      :color="resultat?.couleur"
      :duration="resultat?.couleur === 'danger' ? 5000 : 2000"
      @did-dismiss="resultat = null"
    />
  </ion-page>
</template>
