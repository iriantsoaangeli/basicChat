# 05 — Construire le fichier APK

Deux types d'APK :

| Type | Pour quoi | Signature |
|---|---|---|
| **Debug** | Toi, tes testeurs, installation à la main | Automatique (clé de test) |
| **Release** | Distribution durable, Play Store (qui demande plutôt un `.aab`) | Ta propre clé (à créer une fois, à ne jamais perdre) |

Pour du perso/test : **debug suffit**.

---

## A. APK debug

```bash
$ npm run build
$ npx cap sync android
$ cd android
$ ./gradlew assembleDebug
$ cd ..
```

| Commande | Rôle |
|---|---|
| `npm run build` | Code web à jour dans `dist/` |
| `npx cap sync android` | Copie `dist/` dans `android/` |
| `./gradlew assembleDebug` | Compile l'APK de test |

Le fichier : **`android/app/build/outputs/apk/debug/app-debug.apk`**

Installer :
- par câble : `adb install -r android/app/build/outputs/apk/debug/app-debug.apk` (`-r` = remplace la version installée en gardant les données) ;
- ou envoie le fichier sur le téléphone (Telegram, Drive, câble…) et ouvre-le. Android demande d'autoriser « Installer des applications inconnues » pour l'app qui l'ouvre.

## B. APK release (signé avec ta clé)

### 1. Créer ta clé (une seule fois)

```bash
$ mkdir -p ~/cles-android
$ keytool -genkeypair -v -keystore ~/cles-android/mes-notes.jks \
    -alias mes-notes -keyalg RSA -keysize 2048 -validity 10000
```

- Il demande un mot de passe et quelques infos (nom, ville…).
- ⚠️ **Garde ce fichier `.jks` et son mot de passe en lieu sûr, hors du projet, hors de Git.** Si tu les perds, tu ne pourras plus publier de mise à jour de la même app.

### 2. Construire et signer

```bash
$ npm run build
$ npx cap sync android
$ npx cap build android \
    --keystorepath ~/cles-android/mes-notes.jks \
    --keystorepass 'TON_MOT_DE_PASSE' \
    --keystorealias mes-notes \
    --keystorealiaspass 'TON_MOT_DE_PASSE' \
    --androidreleasetype APK \
    --signing-type apksigner
```

| Option | Rôle |
|---|---|
| `--keystorepath` / `--keystorepass` | Fichier de clé et son mot de passe |
| `--keystorealias` / `--keystorealiaspass` | Nom de la clé dans le fichier (`-alias` de keytool) et son mot de passe |
| `--androidreleasetype APK` | Produit un `.apk` (`AAB` pour le Play Store) |
| `--signing-type apksigner` | Signature moderne exigée par les Android récents. L'option par défaut (`jarsigner`) produit une signature ancienne qui peut être refusée à l'installation. Nécessite `apksigner` dans le PATH (doc 01, étape 4). |

Le fichier : **`android/app/build/outputs/apk/release/app-release-signed.apk`**

Le mot de passe tapé en clair reste dans l'historique du terminal. Pour l'effacer : `history -c` ; ou ajoute une espace devant la commande (si `HISTCONTROL=ignorespace`, c'est le cas par défaut sur Ubuntu).

➡️ Suite : `06-cycle-de-travail.md`
