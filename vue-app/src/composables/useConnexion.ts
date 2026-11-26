// src/composables/useConnexion.ts
// RÔLE : savoir si l'app a accès à Internet, sans jamais bloquer l'interface.
// L'état est partagé : tous les composants qui l'utilisent voient la même valeur.
import { readonly, ref } from 'vue'

const enLigne = ref(navigator.onLine)
let ecouteDemarree = false

// Vraie vérification : un petit appel réseau, abandonné après 3 s.
// navigator.onLine seul dit juste "connecté à un réseau" (un Wi-Fi sans Internet renvoie true).
// On n'utilise pas un fichier du site : dans l'APK il est sur le téléphone et répondrait toujours.
async function verifier() {
  if (!navigator.onLine) {
    enLigne.value = false
    return
  }
  try {
    await fetch('https://www.gstatic.com/generate_204', {
      mode: 'no-cors', // on veut seulement savoir si ça répond
      cache: 'no-store', // jamais une réponse du cache
      signal: AbortSignal.timeout(3000),
    })
    enLigne.value = navigator.onLine // le réseau a pu tomber pendant l'attente
  } catch {
    enLigne.value = false
  }
}

export function useConnexion() {
  // Les écouteurs ne sont posés qu'une fois, même si plusieurs composants appellent useConnexion()
  if (!ecouteDemarree) {
    ecouteDemarree = true
    window.addEventListener('offline', () => (enLigne.value = false)) // coupure : immédiat
    window.addEventListener('online', verifier) // retour du réseau : on vérifie vraiment
    verifier() // au démarrage ; pas d'await, l'app continue sans attendre
  }
  // readonly : les composants lisent l'état, seul ce fichier le modifie
  return { enLigne: readonly(enLigne), verifier }
}
