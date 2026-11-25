# 02 — Créer le projet et installer les outils

## ✅ Checklist

- [ ] 1. Créer le projet Firebase
- [ ] 2. Passer en Blaze
- [ ] 3. Créer Firestore (région **définitive**, réfléchis 10 s)
- [ ] 4. Créer le bucket Storage (région US obligatoire pour le gratuit)
- [ ] 5. Activer l'auth anonyme (pour sécuriser les uploads sans écran de login)
- [ ] 6. Installer Node, Java, Firebase CLI sur Linux
- [ ] 7. Lier le dossier local au projet

---

## 1. Créer le projet

🔗 https://console.firebase.google.com

1. 🖱️ **Create a project** (ou **Add project**)
2. Nom : ce que tu veux. Note l'**ID** affiché en dessous (ex : `mon-app-4f2a1`) → c'est ton `PROJECT_ID`.
3. Google Analytics : 🖱️ **désactive** (inutile pour une API, un réglage de moins).
4. 🖱️ **Create project** → attends → 🖱️ **Continue**.

## 2. Passer en Blaze

🔗 `https://console.firebase.google.com/project/PROJECT_ID/usage/details`

1. 🖱️ **Modify plan** (ou le badge **Spark** en bas à gauche → **Upgrade**)
2. Choisis **Blaze** → 🖱️ **Select plan**
3. Crée ou sélectionne un compte de facturation Google Cloud, ajoute la carte.
4. Si on te propose un **budget** pendant l'upgrade : mets **5** (USD ou ta devise). C'est une alerte mail, pas un plafond. Le vrai plafond est dans le doc 08.

## 3. Créer Firestore

🔗 `https://console.firebase.google.com/project/PROJECT_ID/firestore`

1. 🖱️ **Create database**
2. Si on te demande l'édition : **Standard edition**.
3. Database ID : laisse **(default)** — le quota gratuit s'applique à cette base.
4. Location : **`europe-west1` (Belgique)**.
   - Pourquoi : c'est la région Google la plus proche de Madagascar avec la tarification la moins chère (« Tier 1 »). Tes fonctions seront dans la même région → pas de latence entre API et base.
   - ⚠️ **Non modifiable après création.**
5. Mode : 🖱️ **Start in production mode** (tout est fermé par défaut, ton API passe quand même car elle utilise le SDK Admin qui ignore les règles).
6. 🖱️ **Create**

## 4. Créer le bucket Storage

🔗 `https://console.firebase.google.com/project/PROJECT_ID/storage`

1. 🖱️ **Get started**
2. Location : **`us-central1`** (ou `us-east1` / `us-west1`).
   - Pourquoi : **le quota gratuit des nouveaux buckets n'existe que dans ces 3 régions US**. En Europe tu paies dès le 1er octet.
   - Conséquence : uploads/téléchargements un peu plus lents depuis Madagascar. Acceptable pour du perso/test.
3. Mode : **production mode** → 🖱️ **Create**. Les vraies règles sont dans le doc 05.

## 5. Activer l'auth anonyme

🔗 `https://console.firebase.google.com/project/PROJECT_ID/authentication/providers`

1. Si c'est la première fois : 🖱️ **Get started**
2. Dans la liste des fournisseurs : 🖱️ **Anonymous** → bascule **Enable** → 🖱️ **Save**

Pourquoi : chaque installation de l'app reçoit un identifiant unique (`uid`) sans écran de login. Ça permet d'écrire des règles du type « tu ne peux écrire que dans ton dossier ». Sans ça, ton bucket est ouvert à n'importe qui qui trouve son nom. Plus tard tu pourras transformer un compte anonyme en vrai compte (email, Google) sans perdre ses données.

## 6. Installer les outils (Linux)

```bash
# Node.js 22 (via nvm, évite les soucis de droits avec npm -g)
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
$ source ~/.bashrc
$ nvm install 22

# Java 21+ : obligatoire pour les émulateurs locaux (Firestore, Storage)
$ sudo apt install openjdk-21-jdk     # Debian/Ubuntu ; Fedora : sudo dnf install java-21-openjdk

# Firebase CLI
$ npm install -g firebase-tools
$ firebase --version
$ firebase login                      # ouvre le navigateur
```

Si tu choisis **Python** (doc 03), il te faut aussi :

```bash
$ python3 --version                    # doit afficher 3.10 à 3.13
$ sudo apt install python3-venv        # Debian/Ubuntu
```

Pourquoi les émulateurs : tu testes ton API + Firestore + Storage **en local, sans rien consommer** de tes quotas, et sans même avoir besoin du plan Blaze.

## 7. Lier ton dossier au projet

```bash
$ mkdir mon-backend && cd mon-backend
$ firebase use --add                  # choisis ton projet, alias : default
```

➡️ Suite : `03-choix-node-ou-python.md`
