// src/service/errors.ts
// RÔLE : transformer les erreurs Firebase en messages compréhensibles pour l'utilisateur.
// Repris de doc/2-vue-firestore/exemple-complet/src/services/errors.ts
import { FirebaseError } from 'firebase/app'

export function errorMessage(e: unknown): string {
  if (e instanceof FirebaseError) {
    switch (e.code) {
      case 'permission-denied':
        return 'Action refusée par les règles de sécurité.'
      case 'resource-exhausted':
        return 'Limite gratuite du jour atteinte. Réessaie demain vers 11h.'
      case 'unavailable':
        return 'Pas de connexion au serveur. Vérifie internet.'
      case 'failed-precondition':
        return 'Index manquant : déploie firestore.indexes.json (voir la console du navigateur).'
      case 'auth/admin-restricted-operation':
        return 'Connexion anonyme désactivée : active-la dans la console Firebase (Authentication).'
    }
    return `Erreur Firebase : ${e.code}`
  }
  return e instanceof Error ? e.message : String(e)
}
