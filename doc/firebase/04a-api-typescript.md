# 04a — API en TypeScript (Express)

## ✅ Checklist

- [ ] 1. Initialiser le dossier `functions/`
- [ ] 2. Installer Express
- [ ] 3. Coller le code
- [ ] 4. Tester en local (émulateur, 0 quota consommé)
- [ ] 5. Faire le doc 08 (anti-facture) **avant** le premier déploiement
- [ ] 6. Déployer

---

## 1. Initialiser

```bash
$ cd mon-backend
$ firebase init functions
```

Réponses à donner :

| Question | Réponse |
|---|---|
| Use an existing project | ton projet |
| Language | **TypeScript** |
| Use ESLint | **No** (un truc de moins qui bloque le déploiement ; mets-le plus tard si tu veux) |
| Install dependencies now | **Yes** |

## 2. Installer Express

```bash
$ cd functions
$ npm install express
$ npm install -D @types/express
```

## 3. Le code — `functions/src/index.ts`

Remplace tout le contenu du fichier :

```ts
import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import { onSchedule } from "firebase-functions/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";
import express, { Request, Response, NextFunction } from "express";

// Réglages appliqués à TOUTES les fonctions de ce fichier
setGlobalOptions({
  region: "europe-west1", // même région que Firestore
  maxInstances: 2,        // plafond anti-facture : jamais plus de 2 conteneurs
  memory: "256MiB",       // le minimum raisonnable = moins de GB-secondes consommées
});

initializeApp();
const db = getFirestore();
const app = express();
app.use(express.json());

// --- Auth optionnelle : si le header Authorization est présent, on vérifie le token ---
type AuthedRequest = Request & { uid?: string };
async function optionalAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (h?.startsWith("Bearer ")) {
    try {
      req.uid = (await getAuth().verifyIdToken(h.slice(7))).uid;
    } catch {
      /* token invalide → on continue sans uid */
    }
  }
  next();
}
app.use(optionalAuth);

// --- Routes ---
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/items", async (_req, res) => {
  const snap = await db.collection("items").orderBy("createdAt", "desc").limit(20).get();
  res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
});

app.post("/items", async (req: AuthedRequest, res) => {
  const { title } = req.body ?? {};
  if (typeof title !== "string" || title.length === 0 || title.length > 200) {
    res.status(400).json({ error: "title requis (1-200 caractères)" });
    return;
  }
  const ref = await db.collection("items").add({
    title,
    owner: req.uid ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
  res.status(201).json({ id: ref.id });
});

// Envoi d'une notif push à un appareil (token FCM fourni par l'app)
app.post("/notify", async (req, res) => {
  const { token, title, body } = req.body ?? {};
  if (!token || !title) {
    res.status(400).json({ error: "token et title requis" });
    return;
  }
  const id = await getMessaging().send({ token, notification: { title, body } });
  res.json({ id });
});

// Une seule fonction "api" qui sert toutes les routes
export const api = onRequest(
  { cors: ["https://localhost", "http://localhost:5173"] },
  app
);

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

### Ce qu'il faut retenir (et modifier)

| Ligne | Pourquoi |
|---|---|
| `region: "europe-west1"` | Même région que Firestore (doc 02). Doit correspondre, sinon chaque requête traverse l'Atlantique. |
| `maxInstances: 2` | Si quelqu'un spamme ton URL, Google ne lance jamais plus de 2 conteneurs → la conso CPU/mémoire est plafonnée. Monte à 5-10 quand tu as de vrais utilisateurs. |
| `memory: "256MiB"` | Le coût est proportionnel à la mémoire. 256 Mio suffit pour du CRUD. |
| Pas de `minInstances` | `minInstances: 1` = un conteneur allumé 24h/24 = **facturé en continu**. Laisse à 0 (défaut) : tu acceptes ~1-3 s de démarrage à froid sur la première requête. |
| `cors: [...]` | Origines autorisées. `https://localhost` = ton APK Capacitor Android. `http://localhost:5173` = `npm run dev` de Vite. Ajoute ton domaine web si tu en as un. |
| `.limit(20)` | Chaque document lu = 1 lecture sur les 50 000/jour gratuites. **Jamais de requête sans limit.** |
| Auth optionnelle | Si l'app envoie `Authorization: Bearer <token>`, `req.uid` est rempli. Sinon la route marche quand même. Pour rendre une route privée : `if (!req.uid) return res.status(401)...` |
| `/notify` | ⚠️ Ouvert à tous tel quel : n'importe qui peut envoyer une notif. Protège-la (vérifie `req.uid`, ou supprime-la et envoie les notifs depuis le serveur uniquement, cf. doc 06). |
| `nightlyCleanup` | Tâche planifiée = 1 des 3 tâches Cloud Scheduler gratuites. Détails doc 06. |

## 4. Tester en local

```bash
$ cd mon-backend
$ firebase init emulators     # coche : Functions, Firestore, Storage, Authentication
$ cd functions && npm run build && cd ..
$ firebase emulators:start
```

Dans un autre terminal :

```bash
$ curl http://127.0.0.1:5001/PROJECT_ID/europe-west1/api/health
# → {"ok":true}

$ curl -X POST http://127.0.0.1:5001/PROJECT_ID/europe-west1/api/items \
    -H "Content-Type: application/json" -d '{"title":"test"}'
# → {"id":"..."}

$ curl http://127.0.0.1:5001/PROJECT_ID/europe-west1/api/items
```

Interface web des émulateurs (voir les données Firestore) : http://127.0.0.1:4000

## 5. ⚠️ Fais le doc 08 maintenant

## 6. Déployer

```bash
$ firebase deploy --only functions
```

Au premier déploiement, la CLI active des APIs Google (Cloud Build, Artifact Registry, Cloud Run, Cloud Scheduler…). C'est normal, ça peut prendre quelques minutes. Si ça échoue sur une API « not enabled », relance la commande une fois.

L'URL s'affiche à la fin. Format :

```
https://europe-west1-PROJECT_ID.cloudfunctions.net/api
```

Test :

```bash
$ curl https://europe-west1-PROJECT_ID.cloudfunctions.net/api/health
```

Voir les logs : 🔗 `https://console.firebase.google.com/project/PROJECT_ID/functions/logs` ou `$ firebase functions:log`

➡️ Suite : `05-fichiers-et-securite.md`
