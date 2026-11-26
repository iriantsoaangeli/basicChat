<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { IonButton, IonContent, IonFooter, IonPage, IonToolbar, toastController } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import ChatBox from '@/components/ChatBox.vue'
import ChatInput from '@/components/ChatInput.vue'
import { answerMessage, fetchMessage, sendQuestion } from '@/service/messageService'
import type { Message } from '@/type/message'


const PAR_PAGE = 50
const messages = ref<Message[]>([])
// input block et le loading gemini
const enAttente = ref(false)
// pagination : reste-t-il des messages plus anciens ? un chargement est-il en cours ?
const ilEnReste = ref(false)
const chargement = ref(false)
// acces aux elements du DOM pour le scroll
const content = ref<InstanceType<typeof IonContent>>()

async function scroll() {
    await nextTick()
    content.value?.$el.scrollToBottom(300)
}

async function showErrorToast(e: unknown) {
    const toast = await toastController.create({
        message: e instanceof Error ? e.message : 'Une erreur est survenue',
        duration: 3000,
        color: 'danger',
        position: 'top',
    })
    await toast.present()
}

onMounted(async () => {
    try {
        messages.value = await fetchMessage(PAR_PAGE)
        // une page pleine = il y en a peut-être d'autres avant
        ilEnReste.value = messages.value.length === PAR_PAGE
        await scroll()
    } catch (e) {
        showErrorToast(e)
    }
})

// Charge la page de messages juste avant le plus vieux affiché
async function chargerPlus() {
    const plusVieux = messages.value[0]
    if (!plusVieux || chargement.value) return
    chargement.value = true
    try {
        const anciens = await fetchMessage(PAR_PAGE, plusVieux.createdAt)
        // unshift = ajouter au DÉBUT (les anciens vont en haut)
        messages.value.unshift(...anciens)
        ilEnReste.value = anciens.length === PAR_PAGE
    } catch (e) {
        showErrorToast(e)
    } finally {
        chargement.value = false
    }
}

async function send(texte: string) {
    enAttente.value = true
    try {
        // copie de l'historique AVANT d'ajouter la question (Gemini reçoit la question à part)
        const historique = [...messages.value]

        // 1. la question s'affiche tout de suite...
        const question = await sendQuestion(texte)
        messages.value.push(question)
        await scroll()

        // 2. ...puis la réponse quand Gemini a fini (les 3 points tournent entre les deux)
        const reponse = await answerMessage(texte, historique)
        messages.value.push(reponse)
        await scroll()
    } catch (e) {
        showErrorToast(e)
    } finally {
        enAttente.value = false
    }
}

</script>

<template>
  <ion-page>
    <AppHeader>
      <!-- En-tête de conversation : avatar + nom + statut (comme Messenger) -->
      <template #left>
        <div class="entete">
          <span class="entete-avatar" aria-hidden="true">G</span>
          <div class="entete-texte">
            <span class="entete-nom">TchangGPT</span>
            <span class="entete-statut" :class="{ actif: enAttente }">
              {{ enAttente ? 'écrit…' : 'TchangGPT Assistant' }}
            </span>
          </div>
        </div>
      </template>
      <template #right>
        <ion-button router-link="/template/galerie" fill="clear">Galerie</ion-button>
      </template>
    </AppHeader>

    <ion-content ref="content">
      <ion-button v-if="ilEnReste" fill="clear" size="small" expand="block" :disabled="chargement" @click="chargerPlus">
        {{ chargement ? 'Chargement…' : 'Voir les messages précédents' }}
      </ion-button>
      <ChatBox :messages="messages" :en-attente="enAttente" />
    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ChatInput :disabled="enAttente" @send="send" />
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<!-- Styles : src/styles/page-chat.css -->
<style scoped src="@/styles/page-chat.css"></style>