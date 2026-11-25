# 04b — API en Python (Flask)

## ✅ Checklist

- [ ] 1. Initialiser le dossier `functions/`
- [ ] 2. Ajouter Flask aux dépendances
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

| Question | Réponse |
|---|---|
| Use an existing project | ton projet |
| Language | **Python** |
| Install dependencies now | **Yes** (crée `functions/venv/`) |

## 2. Dépendances — `functions/requirements.txt`

```text
firebase-functions
firebase-admin
flask
```

```bash
$ cd functions
$ source venv/bin/activate
$ pip install -r requirements.txt
```

Pourquoi le venv : la CLI lit **ce venv** au déploiement pour savoir quelles fonctions existent. Si tu installes une lib hors du venv, le déploiement échoue.

## 3. Le code — `functions/main.py`

Remplace tout le contenu du fichier :

```python
from datetime import datetime, timedelta, timezone

from firebase_admin import initialize_app, firestore, auth, messaging
from firebase_functions import https_fn, scheduler_fn, options
from flask import Flask, jsonify, request

# Réglages appliqués à TOUTES les fonctions de ce fichier
options.set_global_options(
    region="europe-west1",              # même région que Firestore
    max_instances=2,                    # plafond anti-facture
    memory=options.MemoryOption.MB_256, # minimum raisonnable
)

initialize_app()
app = Flask(__name__)


def db():
    # client créé à la demande (évite un appel réseau au déploiement)
    return firestore.client()


def current_uid():
    """Auth optionnelle : renvoie l'uid si un token valide est fourni, sinon None."""
    h = request.headers.get("Authorization", "")
    if h.startswith("Bearer "):
        try:
            return auth.verify_id_token(h[7:])["uid"]
        except Exception:
            return None
    return None


@app.get("/health")
def health():
    return jsonify(ok=True)


@app.get("/items")
def list_items():
    q = db().collection("items").order_by("createdAt", direction=firestore.Query.DESCENDING).limit(20)
    return jsonify([{"id": d.id, **d.to_dict()} for d in q.stream()])


@app.post("/items")
def create_item():
    title = (request.get_json(silent=True) or {}).get("title")
    if not isinstance(title, str) or not 0 < len(title) <= 200:
        return jsonify(error="title requis (1-200 caractères)"), 400
    _, ref = db().collection("items").add(
        {"title": title, "owner": current_uid(), "createdAt": firestore.SERVER_TIMESTAMP}
    )
    return jsonify(id=ref.id), 201


@app.post("/notify")
def notify():
    data = request.get_json(silent=True) or {}
    if not data.get("token") or not data.get("title"):
        return jsonify(error="token et title requis"), 400
    msg = messaging.Message(
        token=data["token"],
        notification=messaging.Notification(title=data["title"], body=data.get("body")),
    )
    return jsonify(id=messaging.send(msg))


# Une seule fonction "api" qui sert toutes les routes Flask
@https_fn.on_request(
    cors=options.CorsOptions(cors_origins=["https://localhost", "http://localhost:5173"],
                             cors_methods=["get", "post"])
)
def api(req: https_fn.Request) -> https_fn.Response:
    with app.request_context(req.environ):
        return app.full_dispatch_request()


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

### Ce qu'il faut retenir (et modifier)

| Ligne | Pourquoi |
|---|---|
| `region="europe-west1"` | Même région que Firestore (doc 02). |
| `max_instances=2` | Si quelqu'un spamme ton URL, jamais plus de 2 conteneurs → conso plafonnée. Monte à 5-10 avec de vrais utilisateurs. |
| `MB_256` | Coût proportionnel à la mémoire. Si tu importes pandas/numpy, il faudra plus (`MB_512`). |
| Pas de `min_instances` | `min_instances=1` = conteneur allumé 24h/24 = **facturé en continu**. Laisse à 0. |
| `cors_origins` | `https://localhost` = APK Capacitor Android. `http://localhost:5173` = Vite en dev. |
| `.limit(20)` | Chaque document lu = 1 lecture sur 50 000/jour gratuites. **Jamais sans limit.** |
| `with app.request_context(...)` | Fait tourner une app Flask complète (plusieurs routes) dans **une seule** fonction. |
| `current_uid()` | Auth optionnelle : renvoie l'uid si l'app envoie `Authorization: Bearer <token>`, sinon `None`. Pour une route privée : `if not current_uid(): return jsonify(error="login"), 401` |
| `/notify` | ⚠️ Ouvert à tous tel quel. Protège-la (vérifie l'uid) ou supprime-la (doc 06). |
| `nightly_cleanup` | 1 des 3 tâches Cloud Scheduler gratuites (doc 06). |

## 4. Tester en local

```bash
$ cd mon-backend
$ firebase init emulators     # coche : Functions, Firestore, Storage, Authentication
$ firebase emulators:start
```

Dans un autre terminal :

```bash
$ curl http://127.0.0.1:5001/PROJECT_ID/europe-west1/api/health
# → {"ok":true}

$ curl -X POST http://127.0.0.1:5001/PROJECT_ID/europe-west1/api/items \
    -H "Content-Type: application/json" -d '{"title":"test"}'

$ curl http://127.0.0.1:5001/PROJECT_ID/europe-west1/api/items
```

Interface des émulateurs : http://127.0.0.1:4000

## 5. ⚠️ Fais le doc 08 maintenant

## 6. Déployer

```bash
$ firebase deploy --only functions
```

Au premier déploiement, la CLI active plusieurs APIs Google : quelques minutes, normal. Si erreur « API not enabled », relance une fois.

URL finale :

```
https://europe-west1-PROJECT_ID.cloudfunctions.net/api
```

Logs : 🔗 `https://console.firebase.google.com/project/PROJECT_ID/functions/logs` ou `$ firebase functions:log`

➡️ Suite : `05-fichiers-et-securite.md`
