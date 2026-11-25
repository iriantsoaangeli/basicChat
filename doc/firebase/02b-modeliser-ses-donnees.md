# 02b — Modéliser ses données (NoSQL avec Firestore)

**Quand :** après le doc 02 (base créée), **avant** le 04c. Tout ce que tu écris dans le 04c (collections, champs de `db.ts`, `firestore.rules`, index) découle de cette étape.

## Le principe

En SQL, tu pars des données : « j'ai des utilisateurs, des annonces → 2 tables ».
En Firestore, tu pars **des écrans** : « l'écran X affiche quoi → je range les données pour qu'il se charge en lisant le moins de documents possible ».

Pourquoi : Firestore facture **chaque document lu** (50 000 gratuits/jour) et ne fait **pas de JOIN**.

## ✅ Checklist

- [ ] 1. Lister tes écrans
- [ ] 2. Pour chaque écran : ce qu'il affiche → la requête
- [ ] 3. Dessiner les documents (recopier ce qui est affiché ensemble)
- [ ] 4. Compter les lectures par écran (objectif : ≤ 20-30)
- [ ] 5. Écrire les règles de sécurité correspondantes
- [ ] 6. Lister les index composites (filtre + tri sur des champs différents)
- [ ] 7. Lister ce que le serveur doit maintenir (compteurs, copies) → fonctions option B

---

## Exemple complet : app d'annonces

### Étapes 1-2 : écrans → requêtes

| Écran | Affiche | Requête |
|---|---|---|
| Accueil | 20 dernières annonces : photo, titre, prix, **nom du vendeur** | `items` trié par `createdAt` desc, limit 20 |
| Détail | 1 annonce + ses commentaires | 1 doc `items/{id}` + `items/{id}/comments` limit 20 |
| Mes annonces | Mes annonces | `items` où `owner == moi`, trié par date |
| Mes favoris | Annonces mises en favori : photo, titre, prix | `users/{moi}/favorites` |
| Profil | Nom, photo, **nombre d'annonces** | 1 doc `users/{uid}` |

### Étape 3 : documents

```
users/{uid}                                     ← id = uid de l'utilisateur
  { name: "Rado", photoUrl: "...", itemCount: 3 }

users/{uid}/favorites/{itemId}                  ← sous-collection, id = id de l'annonce
  { title: "Vélo", price: 50, photoUrl: "..." }   ← RECOPIÉ depuis l'annonce

items/{itemId}
  { title: "Vélo", price: 50, photoUrl: "...", tags: ["vélo", "sport"],
    owner: "abc", ownerName: "Rado",              ← RECOPIÉ depuis le profil
    createdAt: <date> }

items/{itemId}/comments/{commentId}             ← sous-collection
  { text: "Toujours dispo ?", owner: "xyz", ownerName: "Hery", createdAt: <date> }
```

### Étape 4 : lectures par écran

| Écran | Lectures | Sans recopie (façon SQL) |
|---|---|---|
| Accueil | 20 | 20 + 20 profils = 40 |
| Détail | 1 + 20 | 1 + 20 + 20 profils = 41 |
| Favoris | 1 par favori | 1 par favori + 1 annonce par favori |
| Profil | 1 | 1 + compter toutes ses annonces |

## Les patterns

| Besoin | SQL | Firestore | Dans l'exemple |
|---|---|---|---|
| Afficher une info d'un autre document | `JOIN` | **Recopier** le champ | `ownerName` |
| Liste courte et bornée | Table | **Tableau** dans le document | `tags` (max 10) |
| Liste longue / sans limite | Table | **Sous-collection** | `comments` |
| Plusieurs-à-plusieurs | Table de liaison | Sous-collection chez l'un des deux | `favorites` |
| Compter | `COUNT(*)` | **Champ stocké**, tenu à jour par le serveur | `itemCount` |
| 1 document par utilisateur | `WHERE user_id=?` | **id = uid** → lecture directe | `users/{uid}` |
| Éviter les doublons | Contrainte UNIQUE | **id choisi** au lieu d'un id auto | `favorites/{itemId}` |
| Filtrer sur un tag | `JOIN tags` | `array-contains` | `itemsWithTag()` |

## Les limites

| Limite | Conséquence |
|---|---|
| 1 Mio max par document | Rien qui grossit sans fin dans un document → sous-collection. |
| ~1 écriture/seconde soutenue sur **un même** document | OK pour du perso/test. Un compteur de likes très actif devra être réparti sur plusieurs documents. |
| Supprimer un document **ne supprime pas** ses sous-collections | Les commentaires restent → `onItemDeleted` les supprime (plus bas). |
| Recopier = mettre à jour les copies | Changement de nom → `onUserRenamed` met à jour `ownerName` dans les annonces. **Ne recopie que ce qui change rarement.** |
| Pas de recherche plein texte | « contient vél » impossible. Solution simple : tableau de mots-clés + `array-contains`. |
| Filtre + tri sur deux champs différents | Index composite obligatoire. |

---

## Étape 5 : règles de sécurité de l'exemple

Version complète de l'exemple. **Remplace** les règles du 04c/04d si tu adoptes ce modèle (elles incluent déjà le bloc `devices` du 04d).

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }
    function str(v, max) { return v is string && v.size() > 0 && v.size() <= max; }
    // Nom actuel de l'utilisateur connecté (1 lecture facturée à chaque appel)
    function myName() { return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.name; }

    // ---------- Profils ----------
    match /users/{uid} {
      allow read:   if signedIn();
      allow create: if isOwner(uid)
                    && request.resource.data.keys().hasOnly(['name', 'photoUrl', 'itemCount'])
                    && str(request.resource.data.name, 50)
                    && request.resource.data.itemCount == 0;      // le compteur démarre à 0
      allow update: if isOwner(uid)
                    && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['name', 'photoUrl'])
                    && str(request.resource.data.name, 50);       // itemCount : serveur uniquement

      // Favoris : privés
      match /favorites/{itemId} {
        allow read, delete:   if isOwner(uid);
        allow create, update: if isOwner(uid)
                              && request.resource.data.keys().hasOnly(['title', 'price', 'photoUrl']);
      }
    }

    // ---------- Annonces ----------
    function validItem(d) {
      return d.keys().hasAll(['title', 'price', 'owner', 'ownerName', 'createdAt'])
          && d.keys().hasOnly(['title', 'price', 'owner', 'ownerName', 'createdAt', 'photoUrl', 'tags'])
          && str(d.title, 200)
          && d.price is number && d.price >= 0
          && (!('photoUrl' in d) || d.photoUrl is string)
          && (!('tags' in d) || (d.tags is list && d.tags.size() <= 10));
    }

    match /items/{itemId} {
      allow read:   if signedIn();
      allow create: if isOwner(request.resource.data.owner)
                    && validItem(request.resource.data)
                    && request.resource.data.createdAt == request.time
                    && request.resource.data.ownerName == myName();   // la copie doit être exacte
      allow update: if isOwner(resource.data.owner)
                    && validItem(request.resource.data)
                    && request.resource.data.diff(resource.data).affectedKeys()
                         .hasOnly(['title', 'price', 'photoUrl', 'tags']);
      allow delete: if isOwner(resource.data.owner);

      // Commentaires : sous-collection
      match /comments/{commentId} {
        allow read:   if signedIn();
        allow create: if isOwner(request.resource.data.owner)
                      && request.resource.data.keys().hasOnly(['text', 'owner', 'ownerName', 'createdAt'])
                      && str(request.resource.data.text, 500)
                      && request.resource.data.createdAt == request.time
                      && request.resource.data.ownerName == myName();
        allow delete: if isOwner(resource.data.owner);
        // pas de update : un commentaire ne se modifie pas
      }
    }

    // Token push : chacun n'écrit QUE le sien, personne ne le lit (seul le serveur le lit)
    match /devices/{uid} {
      allow create, update: if isOwner(uid)
                            && request.resource.data.keys().hasOnly(['token', 'updatedAt'])
                            && request.resource.data.token is string;
      allow delete: if isOwner(uid);
      allow read:   if false;
    }
  }
}
```

| Point clé | Pourquoi |
|---|---|
| `ownerName == myName()` | Empêche d'écrire un faux nom de vendeur dans la copie. Coût : 1 lecture en plus par création. |
| `itemCount` absent de `update` | L'app ne peut pas trafiquer son compteur ; seul le serveur le modifie (étape 7). |
| `diff(...).affectedKeys().hasOnly(...)` | Liste exacte des champs modifiables. `owner`, `ownerName`, `createdAt` sont figés. |
| Profil obligatoire avant la 1re annonce | `myName()` lit `users/{uid}` : s'il n'existe pas, la création d'annonce est refusée. Appelle `createProfile()` au premier lancement. |
| `match /comments` **dans** `match /items` | Les règles d'une sous-collection s'écrivent à l'intérieur du parent. |

⚠️ Je n'ai pas pu exécuter ces règles (l'émulateur ne se télécharge pas dans mon environnement). Teste-les sur les émulateurs (04c, étape 8) avant la prod : création sans profil → refusée ; modifier l'annonce d'un autre → refusée ; changer son `itemCount` → refusé.

## Étape 6 : index

| Requête | Index |
|---|---|
| `items` trié par `createdAt` | automatique |
| `items` où `owner == moi` trié par `createdAt` | **composite** — déjà dans `firestore.indexes.json` du 04c |
| `comments` trié par `createdAt` | automatique |
| `items` où `tags array-contains` | automatique (tant qu'il n'y a pas de tri en plus) |

## Code côté app — `src/model.ts`

Utilise `src/firebase.ts` du 04c.

```ts
// src/model.ts — les opérations de l'exemple complet (users, items, comments, favorites)
import {
  doc, getDoc, setDoc, addDoc, deleteDoc, collection, query, where, orderBy, limit,
  getDocs, serverTimestamp,
} from "firebase/firestore";
import { db, ensureUser } from "./firebase";

/** Profil : créé une fois, id du document = uid (lecture directe, sans requête) */
export async function createProfile(name: string) {
  const user = await ensureUser();
  await setDoc(doc(db, "users", user.uid), { name, itemCount: 0 });
}

/** Annonce : on RECOPIE le nom du vendeur pour ne pas lire son profil à l'affichage */
export async function createItem(title: string, price: number, photoUrl?: string) {
  const user = await ensureUser();
  const profile = await getDoc(doc(db, "users", user.uid));
  await addDoc(collection(db, "items"), {
    title, price,
    owner: user.uid,
    ownerName: profile.get("name"),
    createdAt: serverTimestamp(),
    ...(photoUrl ? { photoUrl } : {}),
  });
}

/** Commentaire : sous-collection de l'annonce (liste qui peut grossir sans limite) */
export async function addComment(itemId: string, text: string) {
  const user = await ensureUser();
  const profile = await getDoc(doc(db, "users", user.uid));
  await addDoc(collection(db, "items", itemId, "comments"), {
    text, owner: user.uid, ownerName: profile.get("name"), createdAt: serverTimestamp(),
  });
}

export async function listComments(itemId: string) {
  const q = query(collection(db, "items", itemId, "comments"), orderBy("createdAt", "desc"), limit(20));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Favori : id du document = id de l'annonce → impossible d'avoir un doublon */
export async function addFavorite(itemId: string, item: { title: string; price: number; photoUrl?: string }) {
  const user = await ensureUser();
  await setDoc(doc(db, "users", user.uid, "favorites", itemId), {
    title: item.title, price: item.price, ...(item.photoUrl ? { photoUrl: item.photoUrl } : {}),
  });
}

export async function removeFavorite(itemId: string) {
  const user = await ensureUser();
  await deleteDoc(doc(db, "users", user.uid, "favorites", itemId));
}

export async function listFavorites() {
  const user = await ensureUser();
  const snap = await getDocs(query(collection(db, "users", user.uid, "favorites"), limit(50)));
  return snap.docs.map((d) => ({ itemId: d.id, ...d.data() }));
}

/** Filtre sur un tableau (si tu ajoutes un champ tags: string[] aux annonces) */
export async function itemsWithTag(tag: string) {
  const q = query(collection(db, "items"), where("tags", "array-contains", tag), limit(20));
  return (await getDocs(q)).docs.map((d) => ({ id: d.id, ...d.data() }));
}
```

## Étape 7 : ce que le serveur maintient (option B)

Le compteur et les copies ne peuvent pas être confiés à l'app (elle pourrait tricher ou oublier). Ajoute ces fonctions au code du 04d.

**TypeScript**

```ts
// À AJOUTER dans functions/src/index.ts (version 04d), à côté de onItemCreated
import { onDocumentDeleted, onDocumentUpdated } from "firebase-functions/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
const db = getFirestore();

// Compteur : +1 à la création d'une annonce
// (fusionne ces 2 lignes dans ton onItemCreated existant)
//   await db.collection("users").doc(item.owner).update({ itemCount: FieldValue.increment(1) });

// Suppression d'une annonce : compteur -1 + suppression des commentaires
// (supprimer un document NE supprime PAS ses sous-collections)
export const onItemDeleted = onDocumentDeleted("items/{itemId}", async (event) => {
  const item = event.data?.data();
  if (item?.owner) {
    await db.collection("users").doc(item.owner).update({ itemCount: FieldValue.increment(-1) });
  }
  const comments = await db.collection("items").doc(event.params.itemId).collection("comments").limit(400).get();
  const batch = db.batch();
  comments.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
});

// Recopie : quand un utilisateur change de nom, on met à jour ses annonces
export const onUserRenamed = onDocumentUpdated("users/{uid}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after || before.name === after.name) return; // rien à faire (évite aussi les boucles)
  const items = await db.collection("items").where("owner", "==", event.params.uid).limit(400).get();
  const batch = db.batch();
  items.docs.forEach((d) => batch.update(d.ref, { ownerName: after.name }));
  await batch.commit();
});
```

**Python**

```python
# À AJOUTER dans functions/main.py (version 04d), à côté de on_item_created
from firebase_admin import initialize_app, firestore
from firebase_functions import firestore_fn

initialize_app()  # (déjà présent dans ton main.py : ne le duplique pas)


def db():
    return firestore.client()


# Compteur : +1 à la création d'une annonce
# (fusionne cette ligne dans ton on_item_created existant)
#   db().collection("users").document(item["owner"]).update({"itemCount": firestore.Increment(1)})


# Suppression d'une annonce : compteur -1 + suppression des commentaires
@firestore_fn.on_document_deleted(document="items/{itemId}")
def on_item_deleted(event: firestore_fn.Event[firestore_fn.DocumentSnapshot | None]) -> None:
    item = event.data.to_dict() if event.data else {}
    if item and item.get("owner"):
        db().collection("users").document(item["owner"]).update({"itemCount": firestore.Increment(-1)})
    comments = db().collection("items").document(event.params["itemId"]).collection("comments").limit(400).get()
    batch = db().batch()
    for d in comments:
        batch.delete(d.reference)
    batch.commit()


# Recopie : quand un utilisateur change de nom, on met à jour ses annonces
@firestore_fn.on_document_updated(document="users/{uid}")
def on_user_renamed(event: firestore_fn.Event[firestore_fn.Change[firestore_fn.DocumentSnapshot | None]]) -> None:
    before = event.data.before.to_dict() if event.data.before else None
    after = event.data.after.to_dict() if event.data.after else None
    if not before or not after or before.get("name") == after.get("name"):
        return
    items = db().collection("items").where(filter=firestore.FieldFilter("owner", "==", event.params["uid"])).limit(400).get()
    batch = db().batch()
    for d in items:
        batch.update(d.reference, {"ownerName": after["name"]})
    batch.commit()
```

Limites de ces fonctions :
- `.limit(400)` : au-delà de 400 annonces ou commentaires, il faut boucler. C'est suffisant pour du perso/test.
- `ownerName` des **commentaires** n'est pas mis à jour au renommage. Ajoute la même logique avec `collectionGroup("comments")` si tu en as besoin (ça demande un index de groupe de collections).

---

## Grille vierge pour TON app

Remplis-la, puis envoie-la-moi : j'en tire les règles, `db.ts` et les fonctions.

**Écrans**

| Écran | Affiche (champs) | Filtre / tri | Nb max d'éléments |
|---|---|---|---|
| | | | |
| | | | |

**Documents**

| Chemin | Champs | Champs recopiés (depuis où) | Qui peut lire | Qui peut écrire |
|---|---|---|---|---|
| | | | | |

**Ce que le serveur maintient**

| Quoi | Déclencheur |
|---|---|
| ex : compteur | création / suppression de … |

➡️ Suite : `03-choix-node-ou-python.md`, puis `04c-option-a.md`
