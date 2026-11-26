<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonLoading,
  IonModal,
  IonPage,
  IonToast,
} from '@ionic/vue'
import { closeOutline, cloudUploadOutline } from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import GithubLink from '@/components/GithubLink.vue'
import ListPhoto from '@/components/photo/ListPhoto.vue'
import PhotoForm from '@/components/photo/PhotoForm.vue'
import { useConnexion } from '@/composables/useConnexion'
import { usePhotos } from '@/composables/usePhotos'
import type { ChampTri, NouvellePhoto, Tri } from '@/type/photo'

const { photos, chargement, erreur, encore, charger, chargerPlus, trierPar, ajouter } = usePhotos()
const { enLigne } = useConnexion()

// Champs proposés pour le tri, dans l'ordre d'affichage
const champs: ChampTri[] = [
  { cle: 'nom', label: 'Nom' },
  { cle: 'createdAt', label: 'Création' },
  { cle: 'updatedAt', label: 'Modification' },
]

// Premier lot de 8 à l'ouverture de la galerie
onMounted(charger)

// Les plus récentes d'abord ; changer de tri retrie les photos déjà chargées, sans recharger
const tri = ref<Tri>({ champ: 'createdAt', croissant: false })
watch(tri, trierPar)

async function lotSuivant(fini: () => void) {
  await chargerPlus()
  fini()
}

// Fenêtre d'ajout ouverte par le bouton Upload du header
const formulaireOuvert = ref(false)
const envoiEnCours = ref(false)
const erreurEnvoi = ref<string | null>(null)

async function enregistrer(photo: NouvellePhoto) {
  envoiEnCours.value = true
  erreurEnvoi.value = await ajouter(photo)
  envoiEnCours.value = false
  if (!erreurEnvoi.value) formulaireOuvert.value = false // en cas d'erreur, on garde le formulaire rempli
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
      <ListPhoto
        v-model:tri="tri"
        :photos="photos"
        :champs="champs"
        :encore="encore"
        :chargement="chargement"
        :erreur="erreur"
        @plus="lotSuivant"
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
      :is-open="!!erreurEnvoi"
      :message="erreurEnvoi ?? ''"
      color="danger"
      :duration="5000"
      @did-dismiss="erreurEnvoi = null"
    />
  </ion-page>
</template>
