<script setup lang="ts">
import { IonBadge } from '@ionic/vue'
import { useConnexion } from '@/composables/useConnexion'

// Badge "Pas d'internet", visible seulement hors ligne ; rien n'est affiché quand tout va bien
const { enLigne } = useConnexion()
</script>

<template>
  <!-- role="status" : un lecteur d'écran annonce l'apparition du badge -->
  <ion-badge v-if="!enLigne" role="status" color="danger">Pas d'internet</ion-badge>
</template>
