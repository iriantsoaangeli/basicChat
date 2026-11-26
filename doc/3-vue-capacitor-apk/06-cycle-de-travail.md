# 06 — Quelle commande après quelle modification

| Tu as modifié… | Commandes |
|---|---|
| Du code dans `src/` — test rapide | `npm run dev` (navigateur, pas besoin du téléphone) |
| Du code dans `src/` — voir sur le téléphone | `npm run build` puis `npx cap run android` |
| `.env.local` | `npm run build` puis `npx cap run android` (les valeurs sont gravées au build) |
| `capacitor.config.ts` | `npx cap sync android` puis `npx cap run android` |
| Ajouté un plugin Capacitor (`npm install @capacitor/...`) | `npx cap sync android` |
| `firestore.rules` ou `firestore.indexes.json` | `firebase deploy --only firestore` (rien à recompiler dans l'app) |
| Tu veux un APK à partager | Doc 05 |

## Pourquoi `sync` et pas seulement `build`

`npm run build` met à jour `dist/`. Mais l'APK contient **une copie** de `dist/` dans `android/`. `npx cap sync` (ou `npx cap run`, qui le fait tout seul) refait cette copie.

## Routine conseillée

1. Développer dans le navigateur avec `npm run dev` + émulateurs Firebase (zip 2, doc 08).
2. Quand ça marche : `VITE_USE_EMULATORS=0`, `npm run build`, `npx cap run android`, tester sur le téléphone.
3. Pour partager : APK debug (doc 05).
