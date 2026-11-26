# Zip 2 — Brancher Firestore dans Vue 3 + TypeScript

## Avant de commencer

| Il te faut | Où |
|---|---|
| Un projet Vue 3 + Vite + TypeScript | Zip 3, docs 01-02 (création de zéro) |
| Le projet Firebase, la base, la connexion anonyme, les 4 valeurs de config | Zip 1, doc 02 |
| `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `.firebaserc` déployés | Zip 1, docs 06-07 |

## Ce que tu vas construire

L'app « Mes notes » : créer une note (titre, texte, photo), voir la liste, ouvrir la photo en grand, supprimer.

## Les fichiers, et le rôle de chacun

```
mes-notes/
├── .env.local                    ← doc 01 : tes identifiants Firebase (jamais commité)
├── env.d.ts                      ← doc 01 : dit à TypeScript que ces variables existent
└── src/
    ├── firebase/
    │   └── index.ts              ← doc 02 : connexion à Firebase (1 seule fois)
    ├── models/
    │   ├── note.ts               ← doc 03 : forme EXACTE d'une note (types + références)
    │   └── photo.ts              ← doc 03 : forme EXACTE d'une photo
    ├── services/
    │   ├── photos.ts             ← doc 04 : image → base64, enregistrer, relire, supprimer
    │   ├── notes.ts              ← doc 05 : créer, lister, lire, modifier, supprimer une note
    │   └── errors.ts             ← doc 06 : erreurs Firebase → messages lisibles
    ├── composables/
    │   └── useNotes.ts           ← doc 06 : état réactif (liste, chargement, erreur)
    ├── components/
    │   ├── NoteForm.vue          ← doc 07 : formulaire
    │   └── NoteCard.vue          ← doc 07 : affichage d'une note
    └── App.vue                   ← doc 07 : l'écran qui assemble tout
```

**Qui appelle qui :**

```
App.vue ──► useNotes.ts ──► services/notes.ts ──► models/note.ts ──► Firestore
   │                              │
   ├─ NoteForm.vue                └──► services/photos.ts ──► models/photo.ts ──► Firestore
   └─ NoteCard.vue ──► services/photos.ts (ouvrir la grande photo)
```

Règle : **les composants n'importent jamais `firebase/firestore`**. Ils passent par `useNotes` ou les services. Avantage : tout le code Firestore est dans `services/` et `models/`.

## Checklist

| # | Doc | Résultat |
|---|-----|----------|
| 1 | `01-installer-et-configurer.md` | SDK installé, identifiants en place |
| 2 | `02-connexion-firebase.md` | L'app sait se connecter |
| 3 | `03-modeles-typescript.md` | Les « gabarits » TypeScript des documents |
| 4 | `04-photos.md` | Gestion des photos base64 |
| 5 | `05-operations-crud.md` | Toutes les opérations sur les notes |
| 6 | `06-erreurs-et-etat.md` | Messages d'erreur + état réactif |
| 7 | `07-composants.md` | L'interface |
| 8 | `08-tester.md` | Tester sur l'émulateur puis sur la vraie base |
| 9 | `09-ajouter-une-collection.md` | Gabarit pour tes propres collections |

Le dossier `exemple-complet/` contient **tous les fichiers finaux**, tels que je les ai compilés (`npm run build` sans erreur, Vue 3.5 / firebase 13.4 / TypeScript 6). Tu peux les copier tels quels dans ton projet.
