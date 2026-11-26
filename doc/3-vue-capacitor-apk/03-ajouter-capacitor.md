# 03 — Ajouter Capacitor et créer le projet Android

## ✅ Checklist

- [ ] 1. Installer Capacitor
- [ ] 2. Initialiser (nom + identifiant de l'app)
- [ ] 3. Construire le site une première fois
- [ ] 4. Ajouter la plateforme Android

Toutes les commandes se lancent **à la racine du projet** (`mes-notes/`).

---

## 1. Installer Capacitor

```bash
$ npm install @capacitor/core
$ npm install -D @capacitor/cli
$ npm install @capacitor/android
```

| Paquet | Rôle |
|---|---|
| `@capacitor/core` | Code embarqué dans l'app (pont entre le JavaScript et Android) |
| `@capacitor/cli` | La commande `npx cap` (outil de développement, d'où `-D`) |
| `@capacitor/android` | Le modèle de projet Android |

## 2. Initialiser

```bash
$ npx cap init "Mes Notes" com.monnom.mesnotes --web-dir dist
```

| Argument | Rôle | Règle |
|---|---|---|
| `"Mes Notes"` | Nom affiché sous l'icône | Libre |
| `com.monnom.mesnotes` | **Identifiant unique** de l'app Android | Minuscules, points, pas de tiret. ⚠️ Ne le change plus après publication |
| `--web-dir dist` | Dossier produit par `npm run build` | Pour Vite : `dist` |

Ça crée `capacitor.config.ts` :

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.monnom.mesnotes',
  appName: 'Mes Notes',
  webDir: 'dist'
};

export default config;
```

## 3. Construire le site

```bash
$ npm run build
```

**Pourquoi maintenant :** Capacitor copie `dist/` dans le projet Android. Si `dist/` n'existe pas, l'étape suivante échoue.

Si `npm run build` affiche une erreur TypeScript, corrige-la d'abord : la commande échoue tant qu'il reste une erreur de type.

## 4. Ajouter Android

```bash
$ npx cap add android
```

Résultat attendu : `[success] android platform added!` et un nouveau dossier `android/`.

| Dossier / fichier | Rôle |
|---|---|
| `android/` | Un vrai projet Android (Gradle). **À garder dans Git** : tu pourras y modifier l'icône, le nom, les permissions |
| `android/app/src/main/assets/public/` | La copie de ton `dist/` (régénérée à chaque `npx cap sync`, ne la modifie pas) |
| `android/app/src/main/AndroidManifest.xml` | Permissions ; `INTERNET` y est déjà (nécessaire pour Firestore) |
| `android/variables.gradle` | Versions Android : minimum Android 7 (API 24), cible Android 16 (API 36) |

➡️ Suite : `04-lancer-sur-telephone.md` (après les zips 1 et 2 si tu veux voir les notes)
