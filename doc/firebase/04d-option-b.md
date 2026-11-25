# 04d — Option B : Option A + notifs push + tâche planifiée

## En une phrase

**B = A + 3 petites fonctions.** Les données passent par Firestore en direct (comme `04c-option-a.md`). Seul ce que l'app ne peut pas faire elle-même passe par des Cloud Functions.

```
App Vue ──SDK──► Firestore ◄── firestore.rules
   │                │
   │                └─(nouvelle annonce)──► onItemCreated ──► notif push à l'auteur
   │
   └─httpsCallable──► pingOwner ──► notif push au propriétaire

Cloud Scheduler ─(3h chaque nuit)─► nightlyCleanup ──► supprime les vieilles annonces
```

| Fonction | Déclenchée par | Pourquoi elle doit être côté serveur |
|---|---|---|
| `onItemCreated` | Automatiquement, à chaque nouveau document dans `items` | L'app n'a pas le droit de lire les tokens push des autres |
| `pingOwner` | L'app, via `httpsCallable` (pas de `fetch`, pas d'URL) | Idem : envoyer une notif à **quelqu'un d'autre** |
| `nightlyCleanup` | Cloud Scheduler, chaque nuit | Personne n'a l'app ouverte à 3h du matin |

Remplace ces exemples par tes vrais besoins : le modèle reste le même.

## Coûts

| Élément | Gratuit jusqu'à |
|---|---|
| Appels des 3 fonctions | 2 M/mois (toutes fonctions confondues) |
| Déclencheur Firestore (Eventarc) | Les événements venant de sources Google ne sont pas facturés par Eventarc ; le reste est dans le gratuit à cette échelle |
| Tâche planifiée | 3 gratuites par compte de facturation |
| Envoi FCM | Illimité |

## ✅ Checklist

- [ ] 1. Faire tout le `04c-option-a.md` d'abord
- [ ] 2. Ajouter la règle `devices` dans `firestore.rules`
- [ ] 3. `firebase init functions` (TypeScript **ou** Python)
- [ ] 4. Coller le code serveur
- [ ] 5. Doc 08 (anti-facture) **avant** de déployer
- [ ] 6. Déployer
- [ ] 7. Côté app : `src/functions.ts` + `src/push.ts`
- [ ] 8. Partie A du doc 06 : `google-services.json` + plugin Capacitor (étapes 1 et 2 seulement)

---

## 2. `firestore.rules` complet

Même fichier que 04c + le bloc `devices` :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function signedIn() { return request.auth != null; }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }

    // Une annonce valide : seulement ces champs, avec ces types
    function validItem(d) {
      return d.keys().hasAll(['title', 'owner', 'createdAt'])
          && d.keys().hasOnly(['title', 'owner', 'createdAt', 'photoUrl'])
          && d.title is string && d.title.size() > 0 && d.title.size() <= 200
          && (!('photoUrl' in d) || d.photoUrl is string);
    }

    match /items/{id} {
      allow read:   if signedIn();
      allow create: if isOwner(request.resource.data.owner)
                    && validItem(request.resource.data)
                    && request.resource.data.createdAt == request.time;
      allow update: if isOwner(resource.data.owner)
                    && validItem(request.resource.data)
                    && request.resource.data.owner == resource.data.owner
                    && request.resource.data.createdAt == resource.data.createdAt;
      allow delete: if isOwner(resource.data.owner);
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

Pourquoi l'app écrit son token elle-même : plus besoin d'une route `/devices`. Les règles garantissent que chacun n'écrit que le sien et que personne ne peut lire celui des autres. Le serveur, lui, ignore les règles et peut lire tous les tokens.

```bash
$ firebase deploy --only firestore
```

## 3. Initialiser les fonctions

```bash
$ cd mon-backend
$ firebase init functions
```

| Question | Réponse |
|---|---|
| Language | **TypeScript** ou **Python** (comparatif : doc 03) |
| ESLint (TS) | No |
| Install dependencies | Yes |

Pas besoin d'Express ni de Flask ici : il n'y a pas de routes.

## 4a. Code serveur — TypeScript (`functions/src/index.ts`)

```ts
// functions/src/index.ts — version B : seulement ce que l'app ne peut pas faire seule
import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/https";
import { onDocumentCreated } from "firebase-functions/firestore";
import { onSchedule } from "firebase-functions/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

setGlobalOptions({
  region: "europe-west1", // DOIT être la région de Firestore (sinon le trigger ne se déploie pas)
  maxInstances: 2,        // plafond anti-facture
  memory: "256MiB",
});

initializeApp();
const db = getFirestore();

// Utilitaire (PAS exporté) : envoie une notif à un utilisateur
async function sendToUser(uid: string, title: string, body: string) {
  const ref = db.collection("devices").doc(uid);
  const token = (await ref.get()).get("token") as string | undefined;
  if (!token) return;
  try {
    await getMessaging().send({ token, notification: { title, body } });
  } catch (e: any) {
    // token périmé (app désinstallée) → on le supprime
    if (e?.code === "messaging/registration-token-not-registered") await ref.delete();
  }
}

// 1. AUTOMATIQUE : une annonce est créée → notif à son auteur
export const onItemCreated = onDocumentCreated("items/{itemId}", async (event) => {
  const item = event.data?.data();
  if (!item?.owner) return;
  await sendToUser(item.owner, "Annonce en ligne", `« ${item.title} » est publiée`);
});

// 2. APPELÉE PAR L'APP : « je suis intéressé » → notif au propriétaire de l'annonce
export const pingOwner = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "Connexion requise");
  const itemId = req.data?.itemId;
  if (typeof itemId !== "string") throw new HttpsError("invalid-argument", "itemId requis");

  const item = await db.collection("items").doc(itemId).get();
  if (!item.exists) throw new HttpsError("not-found", "Annonce introuvable");

  const owner = item.get("owner") as string;
  if (owner === req.auth.uid) return { sent: false }; // pas de notif à soi-même
  await sendToUser(owner, "Quelqu'un est intéressé", `par « ${item.get("title")} »`);
  return { sent: true };
});

// 3. PLANIFIÉE : chaque nuit à 3h (Madagascar), supprime les annonces de plus de 30 jours
export const nightlyCleanup = onSchedule(
  { schedule: "0 3 * * *", timeZone: "Indian/Antananarivo" },
  async () => {
    const limit = Timestamp.fromMillis(Date.now() - 30 * 24 * 3600 * 1000);
    const old = await db.collection("items").where("createdAt", "<", limit).limit(400).get();
    const batch = db.batch();
    old.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
);
```

## 4b. Code serveur — Python (`functions/main.py`)

`functions/requirements.txt` :

```text
firebase-functions
firebase-admin
```

```python
# functions/main.py — version B : seulement ce que l'app ne peut pas faire seule
from datetime import datetime, timedelta, timezone

from firebase_admin import initialize_app, firestore, messaging
from firebase_functions import https_fn, firestore_fn, scheduler_fn, options

options.set_global_options(
    region="europe-west1",              # DOIT être la région de Firestore
    max_instances=2,                    # plafond anti-facture
    memory=options.MemoryOption.MB_256,
)

initialize_app()


def db():
    return firestore.client()


def send_to_user(uid: str, title: str, body: str) -> None:
    """Utilitaire : envoie une notif à un utilisateur (supprime le token s'il est périmé)."""
    ref = db().collection("devices").document(uid)
    snap = ref.get()
    token = snap.get("token") if snap.exists else None
    if not token:
        return
    try:
        messaging.send(messaging.Message(token=token, notification=messaging.Notification(title=title, body=body)))
    except messaging.UnregisteredError:
        ref.delete()


# 1. AUTOMATIQUE : une annonce est créée → notif à son auteur
@firestore_fn.on_document_created(document="items/{itemId}")
def on_item_created(event: firestore_fn.Event[firestore_fn.DocumentSnapshot | None]) -> None:
    if event.data is None:
        return
    item = event.data.to_dict() or {}
    if item.get("owner"):
        send_to_user(item["owner"], "Annonce en ligne", f"« {item.get('title')} » est publiée")


# 2. APPELÉE PAR L'APP : « je suis intéressé » → notif au propriétaire
@https_fn.on_call()
def ping_owner(req: https_fn.CallableRequest) -> dict:
    if req.auth is None:
        raise https_fn.HttpsError(https_fn.FunctionsErrorCode.UNAUTHENTICATED, "Connexion requise")
    item_id = (req.data or {}).get("itemId")
    if not isinstance(item_id, str):
        raise https_fn.HttpsError(https_fn.FunctionsErrorCode.INVALID_ARGUMENT, "itemId requis")

    item = db().collection("items").document(item_id).get()
    if not item.exists:
        raise https_fn.HttpsError(https_fn.FunctionsErrorCode.NOT_FOUND, "Annonce introuvable")

    owner = item.get("owner")
    if owner == req.auth.uid:
        return {"sent": False}
    send_to_user(owner, "Quelqu'un est intéressé", f"par « {item.get('title')} »")
    return {"sent": True}


# 3. PLANIFIÉE : chaque nuit à 3h (Madagascar)
@scheduler_fn.on_schedule(schedule="0 3 * * *", timezone=scheduler_fn.Timezone("Indian/Antananarivo"))
def nightly_cleanup(event: scheduler_fn.ScheduledEvent) -> None:
    limit = datetime.now(timezone.utc) - timedelta(days=30)
    old = db().collection("items").where(filter=firestore.FieldFilter("createdAt", "<", limit)).limit(400).get()
    batch = db().batch()
    for d in old:
        batch.delete(d.reference)
    batch.commit()
```

⚠️ En Python, les fonctions s'appellent `on_item_created`, `ping_owner`, `nightly_cleanup`. Côté app, utilise `"ping_owner"` dans `httpsCallable`.

### Ce qu'il faut retenir

| Élément | Pourquoi |
|---|---|
| `region: "europe-west1"` | Un déclencheur Firestore doit être dans la région de la base. |
| `onCall` / `on_call` | Fonction « callable » : le SDK envoie le token de l'utilisateur tout seul → `req.auth.uid` est fiable. CORS géré automatiquement. |
| `HttpsError("unauthenticated")` | L'app reçoit une erreur propre (`err.code === "functions/unauthenticated"`). |
| `sendToUser` non exporté | Les fonctions déployées sont celles qui sont **exportées**. N'exporte que les fonctions Firebase (`onCall`, `onDocumentCreated`, `onSchedule`…), garde les utilitaires internes. |
| `if (owner === req.auth.uid)` | Pas de notif à soi-même. |
| ⚠️ Spam | Un utilisateur peut appeler `pingOwner` en boucle. Pour du perso/test c'est acceptable ; plus tard : garder la date du dernier ping dans Firestore et refuser s'il date de moins d'une minute. |

## 5. ⚠️ Doc 08 maintenant (budget, spend cap, nettoyage des images)

## 6. Déployer

```bash
# TypeScript : compile d'abord (le deploy le fait aussi, mais tu vois les erreurs plus tôt)
$ cd functions && npm run build && cd ..
$ firebase deploy --only functions
```

Premier déploiement : la CLI active plusieurs APIs Google (Eventarc, Cloud Scheduler, Cloud Run…). Si une erreur parle de permissions Eventarc juste après l'activation, attends 2-3 minutes et relance : c'est le délai de propagation chez Google.

## 7. Côté app

```bash
$ cd ton-app-vue
$ npm install @capacitor/push-notifications
$ npx cap sync android
```

### `src/functions.ts`

```ts
// src/functions.ts — appeler les fonctions serveur (version B)
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

const functions = getFunctions(app, "europe-west1"); // même région que le serveur

// Nom = nom exporté côté serveur : "pingOwner" (TypeScript) ou "ping_owner" (Python)
const pingOwnerFn = httpsCallable<{ itemId: string }, { sent: boolean }>(functions, "pingOwner");

export async function pingOwner(itemId: string): Promise<boolean> {
  const res = await pingOwnerFn({ itemId });
  return res.data.sent;
}
```

### `src/push.ts` (remplace celui du doc 06)

```ts
// src/push.ts — version B : le token est enregistré directement dans Firestore
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, ensureUser } from "./firebase";

export async function initPush() {
  if (!Capacitor.isNativePlatform()) return; // pas de push dans le navigateur

  const perm = await PushNotifications.requestPermissions(); // popup Android 13+
  if (perm.receive !== "granted") return;

  await PushNotifications.addListener("registration", async (t) => {
    const user = await ensureUser();
    await setDoc(doc(db, "devices", user.uid), { token: t.value, updatedAt: serverTimestamp() });
  });
  await PushNotifications.addListener("registrationError", (e) => console.error("push error", e));
  await PushNotifications.addListener("pushNotificationReceived", (n) => console.log("push", n));

  await PushNotifications.register();
}
```

### Utilisation

```vue
<script setup lang="ts">
import { onMounted } from "vue";
import { initPush } from "@/push";
import { pingOwner } from "@/functions";

onMounted(initPush);

async function interesse(itemId: string) {
  try {
    const sent = await pingOwner(itemId);
    alert(sent ? "Le vendeur est prévenu" : "C'est ton annonce");
  } catch (e: any) {
    alert("Erreur : " + e.code); // ex : functions/unauthenticated
  }
}
</script>
```

## 8. Tester

1. `npx cap run android` sur un téléphone (ou émulateur **avec Google Play**).
2. Publie une annonce → **mets l'app en arrière-plan** → la notif « Annonce en ligne » arrive.
3. Logs des fonctions : `$ firebase functions:log` ou 🔗 `https://console.firebase.google.com/project/PROJECT_ID/functions/logs`
4. Tâche de nuit : 🔗 `https://console.cloud.google.com/cloudscheduler?project=PROJECT_ID` → **⋮** → **Force run**.

En local, l'émulateur Functions exécute les déclencheurs Firestore et les callables (`firebase emulators:start`), mais il n'existe pas d'émulateur pour FCM : la partie push se teste après déploiement.
