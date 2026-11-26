<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import { IonButton, IonContent, IonFooter, IonPage, IonToolbar, toastController } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import ChatBox from '@/components/ChatBox.vue'
import ChatInput from '@/components/ChatInput.vue'
import { fetchMessage, sendMessage } from '@/service/messageService'
import type { Message } from '@/type/message'


const messages = ref<Message[]>([])
// input block et le loading gemini
const enAttente = ref(false)
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
        messages.value = await fetchMessage()
        await scroll()
    } catch (e) {
        showErrorToast(e)
    }
})

async function send(texte: string) {
    enAttente.value = true
    try {
        const m = await sendMessage(texte, messages.value)
        messages.value.push(...m)
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
    <AppHeader left="Chat Gemini">
      <template #right>
        <ion-button router-link="/template/galerie" fill="clear">Galerie</ion-button>
      </template>
    </AppHeader>

    <ion-content ref="content">
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