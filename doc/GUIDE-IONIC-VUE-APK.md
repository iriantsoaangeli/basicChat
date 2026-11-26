# Vue 3 + Ionic (librairie) + Capacitor → APK

> Ionic est utilisé **uniquement comme librairie de composants** (`@ionic/vue`), sans CLI `ionic`. Le projet est un projet Vite standard créé avec `create-vue`, et Capacitor sert à produire l'APK.
> Testé le 26/11/2026 (Linux, Node 22.23, npm 10.9) : `create-vue` 3.24, `@ionic/vue` 9.0.14, `vue-router` 5.5, `vite` 8, Capacitor 8.6.3.
> Vérifié : build et lint en TS et en JS, `cap init`, `cap add android`, `cap sync`, options de `cap build`.
> **Non exécuté** (SDK Android et Gradle inaccessibles depuis l'environnement de test) : `gradlew assembleDebug/Release`, la signature, `adb install`.
> Snippets en **TS** et en **JS**. Les blocs sans mention valent pour les deux.

---

## 0. Environnement Linux (une seule fois)

1. **Node** ≥ 22.18 : `node -v` (sinon `nvm install --lts`).
2. **Android Studio** ≥ 2025.2.1 (minimum pour Capacitor 8) : télécharge le `.tar.gz` sur https://developer.android.com/studio.
   ```bash
   sudo tar -xzf android-studio-*-linux.tar.gz -C /opt
   /opt/android-studio/bin/studio.sh
   ```
   Laisse l'assistant installer le SDK. Puis, dans SDK Manager :
   - **SDK Platforms** : Android 16 (**API 36**)
   - **SDK Tools** : Build-Tools, Platform-Tools, Command-line Tools (latest)
3. **JDK 21** : il est embarqué dans Android Studio (`/opt/android-studio/jbr`), inutile d'en installer un autre.
4. **Variables d'environnement** (`~/.bashrc`) :
   ```bash
   export ANDROID_HOME="$HOME/Android/Sdk"
   export ANDROID_SDK_ROOT="$ANDROID_HOME"
   export JAVA_HOME="/opt/android-studio/jbr"
   export CAPACITOR_ANDROID_STUDIO_PATH="/opt/android-studio/bin/studio.sh"
   # build-tools : nécessaire pour apksigner / zipalign (prend la version la plus récente installée)
   BT="$(ls -d "$ANDROID_HOME"/build-tools/* 2>/dev/null | sort -V | tail -1)"
   export PATH="$PATH:$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$BT"
   ```
   ```bash
   source ~/.bashrc
   java -version        # 21
   adb --version
   apksigner --version
   ```
5. **Téléphone** : active les Options développeur, puis le Débogage USB.
   ```bash
   sudo apt install android-sdk-platform-tools-common   # règles udev (Debian/Ubuntu)
   sudo usermod -aG plugdev $USER                       # puis se reconnecter
   adb devices                                          # → "device"
   ```

---

## 1. Créer le projet Vue

**TS**
```bash
npm create vue@latest mon-app -- --ts --router --eslint --prettier
```
**JS**
```bash
npm create vue@latest mon-app -- --router --eslint --prettier
```
```bash
cd mon-app && npm install
```

---

## 2. Ajouter Ionic comme librairie

```bash
npm i @ionic/vue @ionic/vue-router ionicons
```

### 2.1 Nettoyer le code de démo de create-vue
```bash
rm -rf src/components src/views src/assets
mkdir -p src/views src/theme
```
> Le CSS de démo (`assets/main.css`) impose une largeur maximale et une grille à `#app`, ce qui casse la mise en page Ionic. Il faut le supprimer.

### 2.2 `src/main.ts` | `src/main.js` (identique en TS et en JS)
```js
import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import App from './App.vue'
import router from './router'

/* CSS Ionic obligatoires */
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Utilitaires optionnels */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'
// aussi dispo : float-elements.css, text-alignment.css, text-transformation.css

/* Dark mode : UNE seule ligne */
import '@ionic/vue/css/palettes/dark.system.css'      // suit le système
// import '@ionic/vue/css/palettes/dark.always.css'
// import '@ionic/vue/css/palettes/dark.class.css'    // via class "ion-palette-dark" sur <html>

import './theme/variables.css'

const app = createApp(App).use(IonicVue /* , { mode: 'md' } */).use(router)

router.isReady().then(() => {
  app.mount('#app')
})
```

### 2.3 `src/theme/variables.css`
```css
:root {
  --ion-color-primary: #3880ff;
  /* palette complète : https://ionicframework.com/docs/theming/color-generator */
}
```

### 2.4 `src/App.vue`
```vue
<!-- JS : remplacer par <script setup> -->
<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
</script>

<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>
```

### 2.5 Router : `createRouter` vient de **`@ionic/vue-router`**

**`src/router/index.ts`**
```ts
import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import HomePage from '@/views/HomePage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'home', component: HomePage },
  { path: '/detail/:id', name: 'detail', component: () => import('@/views/DetailPage.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
```

**`src/router/index.js`**
```js
import { createRouter, createWebHistory } from '@ionic/vue-router'
import HomePage from '@/views/HomePage.vue'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'home', component: HomePage },
  { path: '/detail/:id', name: 'detail', component: () => import('@/views/DetailPage.vue') },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
```

### 2.6 Pages

Règles :
- chaque page routée a **`<ion-page>`** comme élément racine ;
- chaque composant Ionic utilisé est **importé** depuis `@ionic/vue` ;
- pour recharger les données à chaque affichage, utilise `onIonViewWillEnter` plutôt que `onMounted` : les pages visitées restent montées.

**`src/views/HomePage.vue`**
```vue
<!-- JS : remplacer par <script setup> -->
<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel } from '@ionic/vue'
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Accueil</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list>
        <ion-item router-link="/detail/42" router-direction="forward">
          <ion-label>Ouvrir le détail 42</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>
```

**`src/views/DetailPage.vue`**
```vue
<!-- JS : remplacer par <script setup> -->
<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton,
  onIonViewWillEnter, useIonRouter,
} from '@ionic/vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const ionRouter = useIonRouter()
const id = route.params.id as string   // JS : const id = route.params.id

onIonViewWillEnter(() => {
  // recharger les données ici
})

const goHome = () => ionRouter.navigate('/home', 'back', 'pop')
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" />
        </ion-buttons>
        <ion-title>Détail {{ id }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-button @click="goHome">Accueil</ion-button>
    </ion-content>
  </ion-page>
</template>
```

Icônes :
```js
import { IonIcon } from '@ionic/vue'
import { star, homeOutline } from 'ionicons/icons'
// <ion-icon :icon="star" />
```

### 2.7 ESLint : règle OBLIGATOIRE pour Ionic

> ⚠️ `npm run lint` lance `eslint --fix`. Sans ce réglage, il **réécrit** `slot="start"` en `<template v-slot:start>`. Or Ionic utilise les slots natifs des web components, donc cette réécriture casse l'affichage (boutons de toolbar qui disparaissent…).

Dans `eslint.config.ts` (TS) ou `eslint.config.js` (JS), ajoute ce bloc **juste avant** `skipFormatting` :
```js
  {
    name: 'app/ionic',
    rules: {
      // Ionic utilise les slots natifs des web components : NE PAS convertir en v-slot
      'vue/no-deprecated-slot-attribute': 'off',
    },
  },

  skipFormatting,
```

```bash
npm run dev       # navigateur, http://localhost:5173
npm run lint
npm run format
```

---

## 3. Ajouter Capacitor + Android

```bash
npm i @capacitor/core @capacitor/android
npm i -D @capacitor/cli
npx cap init "Mon App" com.societe.monapp --web-dir dist
npm run build                 # crée dist/
npx cap add android           # crée android/
```

**`capacitor.config.ts`** (lu par la CLI Capacitor, aussi dans un projet JS ; `capacitor.config.json` fonctionne aussi)
```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.societe.monapp',   // = applicationId Android, à ne plus changer après distribution
  appName: 'Mon App',
  webDir: 'dist',
};

export default config;
```

### Fichiers Android à modifier

| Besoin | Fichier |
|---|---|
| Nom affiché | `android/app/src/main/res/values/strings.xml` → `app_name`, `title_activity_main` |
| Version | `android/app/build.gradle` → `versionCode` (entier, **+1 à chaque APK distribué**), `versionName` (`"1.0.1"`) |
| SDK | `android/variables.gradle` → `minSdkVersion 24`, `compileSdkVersion 36`, `targetSdkVersion 36` (fixés par Capacitor 8, ne pas modifier) |
| Permissions | `android/app/src/main/AndroidManifest.xml` → `<uses-permission android:name="android.permission.CAMERA" />` |
| Icônes / splash | `npm i -D @capacitor/assets`, place `assets/logo.png`, puis `npx capacitor-assets generate --android --iconBackgroundColor '#ffffff' --splashBackgroundColor '#ffffff'` |
| API en HTTP (non HTTPS) | `capacitor.config.ts` → `server: { cleartext: true }` |

---

## 4. APK debug (tests)

Signé automatiquement avec la clé debug (`~/.android/debug.keystore`). Non distribuable sur le Play Store, mais installable directement.

**Terminal**
```bash
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug && cd ..
# → android/app/build/outputs/apk/debug/app-debug.apk
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

**Raccourci build + install + lancement**
```bash
npx cap run android --list
npx cap run android --target <ID>
```

**Android Studio** : `npx cap open android`, puis **Build > Build App Bundle(s) / APK(s) > Build APK(s)**.

---

## 5. APK release signé (distribution)

### 5.1 Créer la clé (une seule fois)
```bash
mkdir -p ~/keys
keytool -genkeypair -v -keystore ~/keys/monapp.keystore -alias monapp \
  -keyalg RSA -keysize 2048 -validity 10000
```
> ⚠️ Sauvegarde le keystore et ses mots de passe. Si tu les perds, tu ne pourras plus publier de mise à jour de cette appli. Ne le versionne jamais dans git.

### 5.2 Option A : signature par Gradle (recommandée)

**`android/keystore.properties`** (à ajouter à `.gitignore`)
```properties
storeFile=/home/<user>/keys/monapp.keystore
storePassword=********
keyAlias=monapp
keyPassword=********
```

**`android/app/build.gradle`** : ajoute ce qui suit (le reste ne change pas)
```groovy
apply plugin: 'com.android.application'

def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    // ... namespace, compileSdk, defaultConfig existants ...

    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

```bash
echo "keystore.properties" >> android/.gitignore
npm run build && npx cap sync android
cd android && ./gradlew assembleRelease && cd ..
# → android/app/build/outputs/apk/release/app-release.apk
```

### 5.3 Option B : `npx cap build` (sans toucher à Gradle)

> ⚠️ Par défaut, `cap build` produit un **AAB** et signe avec **jarsigner** (signature v1 seule). Un APK qui cible le SDK 36 doit avoir au moins une signature v2. Passe donc **toujours** `--androidreleasetype APK --signing-type apksigner`. `apksigner` doit être dans le PATH (§0).

```bash
npm run build && npx cap sync android
npx cap build android \
  --androidreleasetype APK \
  --signing-type apksigner \
  --keystorepath "$HOME/keys/monapp.keystore" \
  --keystorealias monapp \
  --keystorepass '********' \
  --keystorealiaspass '********'
# → android/app/build/outputs/apk/release/app-release-signed.apk
```
> Utilise un **chemin absolu** pour le keystore : la signature s'exécute depuis le dossier `android/`.

Ou bien en config, pour ne pas retaper les options (les mots de passe restent hors du fichier) :
```ts
// capacitor.config.ts
android: {
  buildOptions: {
    keystorePath: '/home/<user>/keys/monapp.keystore',
    keystoreAlias: 'monapp',
    releaseType: 'APK',
    signingType: 'apksigner',
  },
},
```
```bash
npx cap build android --keystorepass '***' --keystorealiaspass '***'
```

### 5.4 Option C : Android Studio
`npx cap open android`, puis **Build > Generate Signed App Bundle or APK > APK**. Choisis le keystore, puis la variante `release`. Par défaut, l'APK sort dans `android/app/release/`.

### 5.5 Vérifier et installer
```bash
apksigner verify --verbose --print-certs android/app/build/outputs/apk/release/app-release.apk
# doit afficher : Verified using v2 scheme (APK Signature Scheme v2): true
adb install -r android/app/build/outputs/apk/release/app-release.apk
```
> Un APK release ne s'installe pas par-dessus un APK debug (clés différentes) : `adb uninstall com.societe.monapp` d'abord.

---

## 6. Scripts npm pratiques (`package.json`)

```json
"scripts": {
  "apk:debug": "npm run build && cap sync android && cd android && ./gradlew assembleDebug",
  "apk:release": "npm run build && cap sync android && cd android && ./gradlew assembleRelease",
  "apk:install": "adb install -r android/app/build/outputs/apk/debug/app-debug.apk"
}
```
```bash
npm run apk:debug
npm run apk:release     # nécessite l'option A (§5.2)
```

---

## 7. Problèmes fréquents

| Symptôme | Correctif |
|---|---|
| Écran blanc dans l'APK | `npm run build` oublié avant `cap sync`, ou `webDir` ≠ `dist` |
| Mise en page cassée (contenu centré ou étroit) | CSS de démo create-vue encore importé → supprimer `assets/main.css` et son import |
| Boutons de toolbar disparus après `npm run lint` | `--fix` a converti `slot="…"` en `v-slot` → règle du §2.7, puis remettre `slot="start"` |
| Composant Ionic absent | non importé depuis `@ionic/vue` dans `<script setup>` |
| `invalid source release: 21` | Gradle utilise un JDK < 21 → `JAVA_HOME=/opt/android-studio/jbr` ; dans Studio : Settings > Build Tools > Gradle > Gradle JDK = 21 |
| `SDK location not found` | `ANDROID_HOME` absent, ou créer `android/local.properties` : `sdk.dir=/home/<user>/Android/Sdk` |
| `gradlew: Permission denied` | `chmod +x android/gradlew` |
| `apksigner: command not found` | `build-tools/<version>` absent du PATH (§0) |
| `INSTALL_PARSE_FAILED_NO_CERTIFICATES` | APK signé en v1 seul (jarsigner) → `--signing-type apksigner` ou option A |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | autre clé déjà installée → `adb uninstall com.societe.monapp` |
| `adb devices` → `unauthorized` | accepter la clé RSA sur le téléphone ; `adb kill-server && adb start-server` |
| Debug de la WebView | Chrome desktop → `chrome://inspect` (appareil branché, APK debug) |
