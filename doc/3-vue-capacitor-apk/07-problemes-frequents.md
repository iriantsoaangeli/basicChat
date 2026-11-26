# 07 — Problèmes fréquents

| Symptôme | Cause | Solution |
|---|---|---|
| `npm create vue` : erreur de version de Node | Node trop ancien | `nvm install 22 && nvm use 22` |
| `npx cap add android` : « Could not find the web assets directory » | `dist/` n'existe pas | `npm run build` d'abord |
| `npx cap open android` : Android Studio introuvable | Pas installé dans `/usr/local/android-studio` | Déplace-le là, ou `export CAPACITOR_ANDROID_STUDIO_PATH=/chemin/vers/android-studio/bin/studio.sh` |
| Gradle : « SDK location not found » | `ANDROID_HOME` non défini | Doc 01, étape 4, puis nouveau terminal. Ou crée `android/local.properties` avec `sdk.dir=/home/TON_NOM/Android/Sdk` |
| Gradle : erreur de version Java | Mauvais Java utilisé | `export JAVA_HOME=/usr/local/android-studio/jbr` |
| `adb devices` vide | Câble « charge seulement », ou débogage USB désactivé | Autre câble, mode USB « Transfert de fichiers », doc 04 |
| `adb devices` : `unauthorized` | Popup non acceptée | Déverrouille le téléphone, accepte |
| App installée : écran blanc | `dist/` vide ou ancien | `npm run build && npx cap sync android` |
| App installée : « Action refusée par les règles » | Règles non déployées | `firebase deploy --only firestore` (zip 1, doc 07) |
| App installée : rien ne charge, erreur réseau | `VITE_USE_EMULATORS=1` gravé dans l'APK | Mets `0` dans `.env.local`, rebuild |
| App installée : notes perdues à chaque lancement | Nouvel utilisateur anonyme à chaque fois | Vérifie `indexedDBLocalPersistence` (zip 2, doc 02) |
| Installation de l'APK refusée | APK release signé avec `jarsigner` | Rebuild avec `--signing-type apksigner` (doc 05) |
| Installation refusée : « conflit avec un package existant » | Version debug installée, tu installes la release (clés différentes) | Désinstalle l'app du téléphone, réinstalle |
| Le bouton photo n'ouvre rien | — | Vérifie `accept="image/*"` sur l'`<input type="file">` |

Voir les erreurs JavaScript de l'app installée : Chrome sur le PC → `chrome://inspect` (doc 04).
