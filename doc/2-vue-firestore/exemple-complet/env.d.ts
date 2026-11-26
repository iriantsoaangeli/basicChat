/// <reference types="vite/client" />

// Déclare les variables de .env.local pour que TypeScript les connaisse
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_USE_EMULATORS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
