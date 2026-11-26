<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  IonAlert,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonLoading,
  IonPage,
  IonSpinner,
  IonText,
  IonToast,
  useIonRouter,
} from '@ionic/vue'
import { trashOutline } from 'ionicons/icons'
import AppHeader from '@/components/AppHeader.vue'
import { useConnexion } from '@/composables/useConnexion'
import { usePhotos } from '@/composables/usePhotos'
import { errorMessage } from '@/service/errors'
import { lireImage, toSrc } from '@/service/images'
import { lirePhoto } from '@/service/photos'
import type { Photo } from '@/type/photo'

// Page "photo en grand", ouverte par la route /template/photo/:id
// id vient de l'URL (props: true dans le router)
const props = defineProps<{ id: string }>()

const { trouver, supprimer } = usePhotos()
const { enLigne } = useConnexion()
const ionRouter = useIonRouter()

const photo = ref<Photo | null>() // undefined = en cours, null = n'existe pas
const image = ref<string>() // src de l'image affichée (miniature, puis grande image)
const erreur = ref<string | null>(null)

// Après chaque attente, on vérifie qu'on regarde toujours la même photo :
// sinon la réponse est périmée (on est passé à une autre photo entre-temps) et on l'ignore
async function charger(id: string) {
  const toujoursLaMeme = () => props.id === id
  erreur.value = null
  photo.value = undefined
  image.value = undefined
  try {
    // Déjà chargée par la galerie ? Sinon (lien ouvert directement) : 1 lecture Firestore
    const trouvee = trouver(id) ?? (await lirePhoto(id))
    if (!toujoursLaMeme()) return
    photo.value = trouvee
    if (!trouvee) return
    // La miniature s'affiche tout de suite, la grande image la remplace dès qu'elle arrive
    if (trouvee.thumb) image.value = toSrc(trouvee.thumb)
    if (trouvee.imageId) {
      const b64 = await lireImage(trouvee.imageId)
      if (b64 && toujoursLaMeme()) image.value = toSrc(b64)
    }
  } catch (e) {
    if (!toujoursLaMeme()) return
    erreur.value = errorMessage(e)
    console.error(e)
  }
}

watch(() => props.id, charger, { immediate: true })

// ---------- Suppression ----------
const confirmationOuverte = ref(false)
const suppressionEnCours = ref(false)
const erreurSuppression = ref<string | null>(null)

// Boutons de la fenêtre de confirmation ; role 'destructive' = affiché en rouge
const boutonsConfirmation = [
  { text: 'Annuler', role: 'cancel' },
  { text: 'Supprimer', role: 'destructive', handler: () => void confirmerSuppression() },
]

async function confirmerSuppression() {
  if (!photo.value) return
  suppressionEnCours.value = true
  erreurSuppression.value = await supprimer(photo.value)
  suppressionEnCours.value = false
  if (erreurSuppression.value) return
  // Retour à la galerie : page précédente si elle existe, sinon on y va directement
  if (ionRouter.canGoBack()) ionRouter.back()
  else ionRouter.navigate('/template/galerie', 'back', 'replace')
}
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

        <!-- Hors ligne, la suppression attendrait le retour du réseau : on bloque le bouton -->
        <ion-button
          expand="block"
          color="danger"
          fill="outline"
          :disabled="!enLigne"
          @click="confirmationOuverte = true"
        >
          <ion-icon slot="start" :icon="trashOutline" />
          Supprimer
        </ion-button>
      </div>

      <div v-else-if="photo === undefined" class="ion-padding ion-text-center">
        <ion-spinner />
      </div>

      <ion-text v-else color="medium">
        <p class="ion-padding ion-text-center">Cette photo n'existe pas.</p>
      </ion-text>
    </ion-content>

    <!-- Confirmation avant de supprimer : l'action est définitive -->
    <ion-alert
      :is-open="confirmationOuverte"
      header="Supprimer cette photo ?"
      :message="`« ${photo?.nom} » sera supprimée définitivement.`"
      :buttons="boutonsConfirmation"
      @did-dismiss="confirmationOuverte = false"
    />
    <ion-loading :is-open="suppressionEnCours" message="Suppression…" />
    <ion-toast
      :is-open="!!erreurSuppression"
      :message="erreurSuppression ?? ''"
      color="danger"
      :duration="5000"
      @did-dismiss="erreurSuppression = null"
    />
  </ion-page>
</template>

<!-- Styles :
     src/styles/composant-photo-card.css  → .photo et .photo-vide, réutilisés tels quels
     src/styles/composant-photo-grand.css → .photo-grand, l'image en grand -->
<style scoped src="@/styles/composant-photo-card.css"></style>
<style scoped src="@/styles/composant-photo-grand.css"></style>
