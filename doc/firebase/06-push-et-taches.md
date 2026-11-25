# 06 — Notifications push et tâches planifiées

## Coûts

| Service | Coût |
|---|---|
| FCM (envoi des notifs) | Gratuit, sans quota |
| Appel de fonction qui envoie la notif | Compte dans les 2 M appels/mois gratuits |
| Tâche planifiée (Cloud Scheduler) | **3 gratuites par compte de facturation** (tous projets confondus), puis 0,10 $/tâche/mois |

👉 **Regroupe tes travaux de nuit dans une seule tâche** plutôt que d'en créer 5.

---

## A. Notifications push

### ✅ Checklist

- [ ] 1. Ajouter l'app Android dans Firebase et récupérer `google-services.json`
- [ ] 2. Installer le plugin Capacitor
- [ ] 3. Remplacer la route `/notify` ouverte par des routes sécurisées
- [ ] 4. Appeler `initPush()` dans l'app
- [ ] 5. Tester

### 1. Ajouter l'app Android

🔗 `https://console.firebase.google.com/project/PROJECT_ID/settings/general`

1. Descends jusqu'à **Your apps** → 🖱️ l'icône **Android** (robot vert)
2. **Android package name** : exactement le `appId` de ton `capacitor.config.ts` (ex : `com.monnom.monapp`)
3. 🖱️ **Register app** → 🖱️ **Download google-services.json**
4. Mets le fichier ici : `ton-app-vue/android/app/google-services.json`
5. Les étapes suivantes de l'assistant (modifs Gradle) : 🖱️ **Next** → **Next** → **Continue to console**. Capacitor les fait déjà pour toi (il applique le plugin google-services si le fichier existe).

### 2. Plugin Capacitor

```bash
$ cd ton-app-vue
$ npm install @capacitor/push-notifications
$ npx cap sync android
```

### 3. Côté API : routes sécurisées

**Supprime la route `/notify`** du doc 04 (n'importe qui pouvait envoyer une notif à n'importe quel token). Remplace-la par :

**TypeScript** (`functions/src/index.ts`, avant `export const api`) :

```ts
app.post("/devices", async (req: AuthedRequest, res) => {
  if (!req.uid) { res.status(401).json({ error: "login requis" }); return; }
  const { token } = req.body ?? {};
  if (typeof token !== "string") { res.status(400).json({ error: "token requis" }); return; }
  await db.collection("devices").doc(req.uid).set({ token, updatedAt: FieldValue.serverTimestamp() });
  res.json({ ok: true });
});

// Utilitaire (PAS exporté) : envoie une notif à un utilisateur
async function sendToUser(uid: string, title: string, body: string) {
  const doc = await db.collection("devices").doc(uid).get();
  const token = doc.get("token") as string | undefined;
  if (!token) return;
  try {
    await getMessaging().send({ token, notification: { title, body } });
  } catch (e: any) {
    // token périmé (app désinstallée) → on le supprime
    if (e?.code === "messaging/registration-token-not-registered") await doc.ref.delete();
  }
}

// Exemple d'usage : notifier le propriétaire quand un item est créé
app.post("/items/:id/ping", async (req: AuthedRequest, res) => {
  const item = await db.collection("items").doc(req.params.id as string).get();
  const owner = item.get("owner") as string | null;
  if (owner) await sendToUser(owner, "Nouveau !", `Quelqu'un a regardé ${item.get("title")}`);
  res.json({ ok: true });
});
```

**Python** (`functions/main.py`, avant `@https_fn.on_request`) :

```python
@app.post("/devices")
def register_device():
    uid = current_uid()
    if not uid:
        return jsonify(error="login requis"), 401
    token = (request.get_json(silent=True) or {}).get("token")
    if not isinstance(token, str):
        return jsonify(error="token requis"), 400
    db().collection("devices").document(uid).set({"token": token, "updatedAt": firestore.SERVER_TIMESTAMP})
    return jsonify(ok=True)


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


@app.post("/items/<item_id>/ping")
def ping_item(item_id: str):
    item = db().collection("items").document(item_id).get()
    owner = item.get("owner") if item.exists else None
    if owner:
        send_to_user(owner, "Nouveau !", f"Quelqu'un a regardé {item.get('title')}")
    return jsonify(ok=True)
```

Pourquoi stocker le token dans `devices/{uid}` : ton serveur décide qui reçoit quoi. L'app ne fait qu'enregistrer son token, elle ne peut jamais envoyer.

### 4. Côté app : `src/push.ts`

```ts
// src/push.ts — à appeler une fois au démarrage de l'app (ex : dans App.vue onMounted)
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { api, ensureUser } from "./firebase";

export async function initPush() {
  if (!Capacitor.isNativePlatform()) return; // pas de push dans le navigateur (npm run dev)

  const perm = await PushNotifications.requestPermissions(); // popup Android 13+
  if (perm.receive !== "granted") return;

  await PushNotifications.addListener("registration", async (t) => {
    console.log("FCM token:", t.value); // visible dans Logcat d'Android Studio
    await ensureUser();
    await api("/devices", { method: "POST", body: JSON.stringify({ token: t.value }) });
  });

  await PushNotifications.addListener("registrationError", (e) => console.error("push error", e));

  // Notif reçue quand l'app est ouverte (sinon Android l'affiche tout seul)
  await PushNotifications.addListener("pushNotificationReceived", (n) => console.log("push", n));

  await PushNotifications.register();
}
```

### 5. Tester

1. Build + lance sur un vrai téléphone ou un émulateur Android **avec Google Play** : `npx cap run android`
2. Android Studio → **Logcat** → filtre `FCM token` → copie le token.
3. Test sans code, depuis la console : 🔗 `https://console.firebase.google.com/project/PROJECT_ID/messaging` → 🖱️ **Create your first campaign** → **Firebase Notification messages** → titre + texte → 🖱️ **Send test message** → colle le token → 🖱️ **Test**.
4. ⚠️ App au premier plan = Android n'affiche pas la notif dans la barre, elle arrive dans `pushNotificationReceived`. Mets l'app en arrière-plan pour voir la bannière.

---

## B. Tâche planifiée

Déjà dans le code du doc 04. Rappel :

**TypeScript**

```ts
// Tâche planifiée : chaque nuit à 3h (heure de Madagascar), supprime les items de +30 jours
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

**Python**

```python
# Tâche planifiée : chaque nuit à 3h (heure de Madagascar)
@scheduler_fn.on_schedule(schedule="0 3 * * *", timezone=scheduler_fn.Timezone("Indian/Antananarivo"))
def nightly_cleanup(event: scheduler_fn.ScheduledEvent) -> None:
    limit = datetime.now(timezone.utc) - timedelta(days=30)
    old = db().collection("items").where(filter=firestore.FieldFilter("createdAt", "<", limit)).limit(400).get()
    batch = db().batch()
    for d in old:
        batch.delete(d.reference)
    batch.commit()

```

| Élément | Pourquoi |
|---|---|
| `"0 3 * * *"` | Format cron : minute heure jour mois jour-semaine → tous les jours à 3h00. Générateur : https://crontab.guru |
| `timeZone` | Sans ça, l'heure est en UTC (3h UTC = 6h à Madagascar). |
| `.limit(400)` | Un batch Firestore accepte 500 opérations max. 400 = marge. Chaque suppression compte dans les 20 000/jour gratuites. |
| Région | Hérite de `setGlobalOptions` / `set_global_options` → `europe-west1`. |

Le déploiement (`firebase deploy --only functions`) crée la tâche Cloud Scheduler tout seul.

Vérifier / lancer à la main :
🔗 `https://console.cloud.google.com/cloudscheduler?project=PROJECT_ID` → ligne de ta tâche → 🖱️ menu **⋮** → **Force run**

Ne plus en vouloir : supprime la fonction du code puis `firebase deploy --only functions` (la CLI demande de confirmer la suppression → `y`). La tâche Scheduler est supprimée avec.

➡️ Suite : `07-app-vue-capacitor.md`
