<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue'
import { logoGithub } from 'ionicons/icons'

// Lien vers un dépôt GitHub, avec le logo GitHub (icône Ionicons)
withDefaults(
  defineProps<{
    url: string
    label?: string
  }>(),
  { label: 'GitHub' },
)
</script>

<template>
  <!-- fill="clear" : bouton sans fond, l'icône et le texte gardent le style Ionic -->
  <ion-button fill="clear" size="small" :href="url" target="_blank" rel="noopener">
    <ion-icon slot="start" :icon="logoGithub" />
    {{ label }}
  </ion-button>
</template>
