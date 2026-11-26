# 07 — Index, déploiement des règles, émulateur local

## ✅ Checklist

- [ ] 1. Installer Firebase CLI et Java
- [ ] 2. Créer 3 fichiers à la racine du projet Vue
- [ ] 3. Déployer règles + index
- [ ] 4. Lancer l'émulateur pour tester sans consommer de quota

Tous ces fichiers vont **à la racine du projet Vue** (à côté de `package.json`) :

```
mes-notes/
├── package.json
├── firebase.json            ← étape 2
├── .firebaserc              ← étape 2
├── firestore.rules          ← doc 06
├── firestore.indexes.json   ← étape 2
└── src/ ...
```

---

## 1. Installer les outils

```bash
# Firebase CLI : déploie les règles et lance l'émulateur (gratuit en Spark)
$ npm install -g firebase-tools
$ firebase login          # ouvre le navigateur, connecte-toi avec le compte du projet

# Java 21 ou plus : nécessaire UNIQUEMENT pour l'émulateur
$ sudo apt install openjdk-21-jdk
$ java -version
```

## 2. Les 3 fichiers

### `.firebaserc`

**À quoi ça sert :** dit à la CLI quel projet utiliser. Remplace `PROJECT_ID`.

```json
{
  "projects": {
    "default": "PROJECT_ID"
  }
}
```

### `firebase.json`

**À quoi ça sert :** dit à la CLI où sont les règles et les index, et sur quels ports lancer l'émulateur.

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "auth": { "port": 9099 },
    "firestore": { "port": 8080 },
    "ui": { "enabled": true, "port": 4000 },
    "singleProjectMode": true
  }
}
```

### `firestore.indexes.json`

**À quoi ça sert :**
- `indexes` : la requête « mes notes triées par date » filtre sur `owner` **et** trie sur `createdAt` → Firestore exige un **index composite** pour ça. Sans lui, l'app reçoit une erreur `failed-precondition`.
- `fieldOverrides` : désactive l'indexation des champs base64 (doc 05).

```json
{
  "indexes": [
    {
      "collectionGroup": "notes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "owner", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": [
    { "collectionGroup": "photos", "fieldPath": "b64", "indexes": [] },
    { "collectionGroup": "notes", "fieldPath": "thumb", "indexes": [] }
  ]
}
```

## 3. Déployer

```bash
$ cd mes-notes
$ firebase deploy --only firestore
```

Ce que ça fait : envoie `firestore.rules` et `firestore.indexes.json` au projet. À refaire **chaque fois que tu modifies l'un des deux**.

Vérifier :
- Règles : 🔗 `https://console.firebase.google.com/project/PROJECT_ID/firestore/rules`
- Index (statut **Enabled** après quelques minutes) : 🔗 `https://console.firebase.google.com/project/PROJECT_ID/firestore/indexes`

## 4. L'émulateur (tests en local)

**À quoi ça sert :** une copie de Firestore et de l'Auth qui tourne sur ton PC. Elle applique **exactement** ton `firestore.rules`, et ne consomme **aucun quota**.

```bash
$ cd mes-notes
$ firebase emulators:start
```

- La 1re fois, il télécharge l'émulateur (quelques dizaines de Mo).
- Interface : http://127.0.0.1:4000 → onglet **Firestore** (voir les documents créés) et **Authentication** (voir les utilisateurs anonymes).
- Les données sont effacées à l'arrêt (Ctrl+C).
- Pour que l'app Vue s'y connecte : zip 2, doc 08.

## Voir les vraies données en ligne

🔗 `https://console.firebase.google.com/project/PROJECT_ID/firestore/databases/-default-/data`

Colonne de gauche = collections (`notes`, `photos`), milieu = documents, droite = champs. Tu peux modifier ou supprimer à la main ; ça compte dans les quotas comme une opération de l'app.

➡️ Suite : `08-quotas.md`
