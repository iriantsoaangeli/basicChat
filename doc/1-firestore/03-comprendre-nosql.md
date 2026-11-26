# 03 — Comprendre Firestore et NoSQL

## Firestore en 5 points

1. C'est une **base de données hébergée par Google** : rien à installer.
2. Elle range des **documents** (des objets JSON) dans des **collections**.
3. L'app y accède **directement** avec le SDK Firebase : **pas d'API à écrire**.
4. Les **règles de sécurité** décident qui peut lire/écrire quoi (doc 06).
5. Elle compte **à l'opération** : 1 document lu = 1 lecture, quelle que soit sa taille.

```
App Vue ──SDK Firebase──► Firestore (serveurs Google)
                             ▲
                             └── firestore.rules : « qui peut lire / écrire quoi »
```

## Le vocabulaire

| Mot | Équivalent SQL | Exemple |
|---|---|---|
| **Collection** | Table | `notes` |
| **Document** | Ligne | la note `notes/aB3xK9` |
| **Id du document** | Clé primaire | `aB3xK9` (généré automatiquement ou choisi) |
| **Champ** | Colonne | `title` |
| **Chemin** | — | `notes/aB3xK9` = collection/id |
| **Sous-collection** | Table liée | `notes/aB3xK9/commentaires/...` (pas utilisé dans l'exemple) |

## SQL vs NoSQL sur le même exemple

**SQL** : des tables à colonnes fixes, reliées par des id.

```
users                  notes
id  | nom              id | titre    | user_id
abc | Rado             1  | Courses  | abc
```

Pour afficher « Courses, par Rado » → `JOIN users`.

**Firestore** : des documents JSON indépendants.

```
notes/aB3xK9  →  { owner: "abc", title: "Courses", text: "pain, lait", createdAt: <date> }
```

| | SQL | Firestore |
|---|---|---|
| Structure | Fixe, déclarée avant (`CREATE TABLE`) | Libre : rien à déclarer, chaque document a ses champs |
| Création d'une table | `CREATE TABLE` | **Rien** : la collection apparaît au premier document écrit |
| Relations | `JOIN` | **Pas de JOIN** : on recopie l'info utile dans le document, ou on fait 2 lectures |
| Recopier une info | À éviter | Normal (moins de lectures) |
| Requêtes | Tout (`LIKE`, `GROUP BY`…) | Égalité, comparaisons, tri, limite. Pas de recherche « contient » |
| Façon de concevoir | « Quelles entités ? » | « **Chaque écran lit quoi ?** » (doc 04) |

## Qui garantit la structure, alors ?

Puisque Firestore accepte n'importe quel JSON, la structure est garantie à **deux endroits** :

| Où | Rôle | Fichier |
|---|---|---|
| Le code TypeScript | Empêche **ton code** d'envoyer un champ mal nommé ou du mauvais type | `src/models/note.ts` (zip 2, doc 03) |
| Les règles de sécurité | Empêchent **n'importe qui** (même hors de ton app) d'écrire des données invalides | `firestore.rules` (doc 06) |

Les deux doivent décrire **les mêmes champs**.

➡️ Suite : `04-modeliser-ses-donnees.md`
