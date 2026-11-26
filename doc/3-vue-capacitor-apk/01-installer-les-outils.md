# 01 — Installer les outils (Linux)

## ✅ Checklist

- [ ] 1. Node.js 22 (via nvm)
- [ ] 2. Android Studio dans `/usr/local/android-studio`
- [ ] 3. Premier lancement d'Android Studio (installe le SDK et Java)
- [ ] 4. Variables d'environnement
- [ ] 5. Vérifier

---

## 1. Node.js

**À quoi ça sert :** fait tourner Vue, Vite et Capacitor. Vue demande Node **22.18 ou plus**, Capacitor 8 Node 22 ou plus.

**Pourquoi nvm :** installe Node dans ton dossier personnel → pas besoin de `sudo` pour `npm install -g`.

```bash
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
$ source ~/.bashrc
$ nvm install 22
$ node --version        # doit afficher v22.18 ou plus
```

## 2. Android Studio

**À quoi ça sert :** installe le SDK Android (les outils pour construire un APK) et Java. Capacitor 8 demande Android Studio **2025.2.1 ou plus récent**.

**Pourquoi `/usr/local/android-studio` :** c'est là que Capacitor le cherche sur Linux. Ailleurs, `npx cap open android` ne le trouve pas (sauf variable `CAPACITOR_ANDROID_STUDIO_PATH`).

1. Télécharge la version Linux (`.tar.gz`) : https://developer.android.com/studio
2. Installe :
   ```bash
   $ cd ~/Téléchargements          # ou ~/Downloads
   $ sudo tar -xzf android-studio-*-linux.tar.gz -C /usr/local/
   $ ls /usr/local/android-studio/bin/studio.sh     # doit exister
   ```

## 3. Premier lancement

```bash
$ /usr/local/android-studio/bin/studio.sh
```

1. « Import settings » : **Do not import** → OK
2. Assistant **Setup Wizard** : 🖱️ **Next**
3. Install type : **Standard** → 🖱️ **Next**
4. Thème : au choix → 🖱️ **Next**
5. Licences : sélectionne chaque licence à gauche → **Accept** → 🖱️ **Finish**
6. Attends la fin des téléchargements (plusieurs Go) → 🖱️ **Finish**

Ça installe : le SDK dans `~/Android/Sdk`, et Java dans `/usr/local/android-studio/jbr`.

Vérifier que le SDK Android 16 (API 36) est installé — c'est la version utilisée par Capacitor 8 :
- Écran d'accueil → **More Actions** → **SDK Manager**
- Onglet **SDK Platforms** : **Android 16** coché (sinon coche-le → **Apply**)
- Onglet **SDK Tools** : **Android SDK Build-Tools** et **Android SDK Platform-Tools** cochés

## 4. Variables d'environnement

**À quoi ça sert :** permettre aux commandes `npx cap run android` et `./gradlew` de trouver le SDK, Java et `adb` depuis n'importe quel terminal.

Ajoute à la fin de `~/.bashrc` :

```bash
# --- Android / Capacitor ---
export ANDROID_HOME="$HOME/Android/Sdk"
export JAVA_HOME="/usr/local/android-studio/jbr"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
# build-tools (contient apksigner, utilisé au doc 05) : prend la version la plus récente installée
export PATH="$(ls -d $ANDROID_HOME/build-tools/* 2>/dev/null | sort -V | tail -1):$PATH"
```

Puis :

```bash
$ source ~/.bashrc
```

## 5. Vérifier

```bash
$ node --version          # v22.18+
$ java -version           # 21 (le Java fourni par Android Studio)
$ adb --version           # Android Debug Bridge ...
$ apksigner --version     # un numéro de version
```

Si une commande est « introuvable » : refais l'étape 4 et ouvre un **nouveau** terminal.

➡️ Suite : `02-creer-le-projet-vue.md`
