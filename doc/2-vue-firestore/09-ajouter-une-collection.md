# 09 — Gabarit : ajouter ta propre collection

Exemple : tu veux une collection `taches` (`titre`, `faite`).

## Checklist (dans cet ordre)

| # | Où | Quoi faire | Copier depuis |
|---|---|---|---|
| 1 | Zip 1, doc 04 | Remplir la grille : champs, types, limites, qui lit/écrit | — |
| 2 | `firestore.rules` | Ajouter `validTache(d)` et `match /taches/{tacheId} { ... }` | bloc `notes` |
| 3 | `firestore.indexes.json` | Ajouter un index si tu filtres **et** tries sur deux champs différents | index `notes` |
| 4 | Terminal | `firebase deploy --only firestore` | — |
| 5 | `src/models/tache.ts` | `TacheDb`, `Tache`, `TacheCreate`, `TacheUpdate`, `tacheConverter`, `tachesRead`, `tachesWrite`, `tacheDoc` | `src/models/note.ts` |
| 6 | `src/services/taches.ts` | `createTache`, `listMyTaches`, `updateTache`, `deleteTache` | `src/services/notes.ts` |
| 7 | `src/composables/useTaches.ts` | État réactif | `src/composables/useNotes.ts` |
| 8 | Composants | Formulaire + affichage | `NoteForm.vue`, `NoteCard.vue` |
| 9 | Émulateur | Tester (doc 08) | — |

## Ce qui change d'une collection à l'autre

| Élément | À adapter |
|---|---|
| Nom de collection | `'notes'` → `'taches'` dans `collection(db, ...)` et `doc(db, ...)` **et** dans `match /taches/{tacheId}` |
| Champs | Dans les 4 interfaces **et** dans `hasAll` / `hasOnly` des règles |
| Types | `string` ↔ `is string`, `number` ↔ `is number`, `boolean` ↔ `is bool`, `string[]` ↔ `is list` |
| Champs non modifiables | Absents de `TacheUpdate` **et** de `affectedKeys().hasOnly([...])` |

## Correspondance des types TypeScript ↔ règles

| TypeScript (`...Db`) | Envoi (`...Create`) | Règle |
|---|---|---|
| `string` | `string` | `d.x is string && d.x.size() <= N` |
| `number` | `number` | `d.x is number && d.x >= 0` |
| `boolean` | `boolean` | `d.x is bool` |
| `string[]` | `string[]` | `d.x is list && d.x.size() <= N` |
| `Timestamp` | `FieldValue` (`serverTimestamp()`) | `d.x == request.time` |
| champ facultatif `x?` | `x?` | `(!('x' in d) \|\| ...)` |
