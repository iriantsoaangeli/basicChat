# Q&A — Questions fréquentes

## Sommaire

1. [Faut-il écrire l'API à la main ?](#1-faut-il-écrire-lapi-à-la-main-)
2. [Option A : Firebase génère une API à partir de mes tables ?](#2-option-a--firebase-génère-une-api-à-partir-de-mes-tables-)
3. [Option B : c'est quoi la différence avec A ?](#3-option-b--cest-quoi-la-différence-avec-a-)
4. [Option C : c'est un générateur ?](#4-option-c--cest-un-générateur-)
5. [Option D : c'est « la version Python » ?](#5-option-d--cest-la-version-python-)
6. [Laquelle je choisis ?](#6-laquelle-je-choisis-)
7. [Firestore, c'est quoi exactement ?](#7-firestore-cest-quoi-exactement-)
8. [NoSQL, ça veut dire quoi ?](#8-nosql-ça-veut-dire-quoi-)
9. [Comment je « crée la base de données » ?](#9-comment-je-crée-la-base-de-données-)
10. [Sans serveur, où se fait la validation des données ?](#10-sans-serveur-où-se-fait-la-validation-des-données-)
11. [C'est quoi un index composite ?](#11-cest-quoi-un-index-composite-)
12. [Pourquoi une carte bancaire si c'est gratuit ?](#12-pourquoi-une-carte-bancaire-si-cest-gratuit-)
13. [Je peux quand même recevoir une facture ?](#13-je-peux-quand-même-recevoir-une-facture-)
14. [La clé `apiKey` dans le code de l'app, c'est grave ?](#14-la-clé-apikey-dans-le-code-de-lapp-cest-grave-)
15. [Pourquoi Storage aux États-Unis et Firestore en Belgique ?](#15-pourquoi-storage-aux-états-unis-et-firestore-en-belgique-)
16. [Quel doc lire selon l'option ?](#16-quel-doc-lire-selon-loption-)

---

## 1. Faut-il écrire l'API à la main ?

Non. Il y a 4 façons de faire :

| Option | Ce que tu écris | Coût | Doc |
|---|---|---|---|
| **A** | Code app (SDK) + règles de sécurité | Gratuit | `04c-option-a.md` |
| **B** | A + 2-3 petites fonctions serveur | Gratuit | `04d-option-b.md` |
| **C** | Un schéma + des requêtes, le code de l'app est généré (SQL Connect) | Payant après 3 mois (~9 $/mois) | non couvert |
| **D** | Toute l'API à la main + `fetch` dans l'app | Gratuit dans les quotas | `04a` (TS) / `04b` (Python) |

## 2. Option A : Firebase génère une API à partir de mes tables ?

Non, rien n'est généré, et il n'y a pas de tables.

- Google fait déjà tourner un service Firestore qui sait **lire, créer, modifier, supprimer, filtrer et trier** dans n'importe quelle collection. Tu ne vois pas son code, tu ne le modifies pas.
- Le **SDK** (`firebase/firestore`) remplace ton `fetch` : `addDoc(...)` envoie la requête à ce service.
- Les **règles** (`firestore.rules`) remplacent ton code de contrôle : c'est le seul endroit où tu décides qui a le droit de faire quoi.

```
Option A :   App ──SDK──► Firestore (Google) ← firestore.rules
Option D :   App ──fetch──► TON API ──► Firestore
```

## 3. Option B : c'est quoi la différence avec A ?

**B = A + les notifs push + la tâche de nuit.**

- Les données : exactement comme A (SDK + règles).
- En plus : 2 ou 3 fonctions serveur pour ce que l'app ne peut pas faire seule :
  - envoyer une notif à **quelqu'un d'autre** (l'app n'a pas accès aux tokens des autres) ;
  - exécuter une tâche quand personne n'a l'app ouverte (la nuit) ;
  - utiliser une clé secrète (paiement, IA…).

## 4. Option C : c'est un générateur ?

Oui. Tu écris tes tables et tes requêtes dans des fichiers, l'outil génère des fonctions pour l'app (`listAnnonces()`, etc.). La base derrière est un vrai Postgres (SQL). Écarté ici car **payant après l'essai de 3 mois**.

## 5. Option D : c'est « la version Python » ?

Non. D = **l'API complète écrite à la main** (docs 04a et 04b). Le langage est un choix séparé, qui ne concerne que le code serveur :

| Option | Code serveur | Choix TS / Python |
|---|---|---|
| A | Aucun | Non concerné |
| B | 2-3 fonctions | Oui |
| C | Aucun (généré) | Non concerné |
| D | Toute l'API | Oui |

## 6. Laquelle je choisis ?

Pour ton app (photos, notifs push, tâche planifiée, gratuit) : **B**.

- A ne fait ni notifs automatiques ni tâches planifiées.
- C est payant.
- D marche, mais tu écris et maintiens beaucoup plus de code, et chaque requête consomme un appel de fonction.

## 7. Firestore, c'est quoi exactement ?

Une **base de données hébergée par Google** :

- **Pas de serveur à gérer** : rien à installer, elle grandit toute seule.
- **NoSQL orientée documents** : tu stockes des objets JSON (question 8).
- **Accessible directement depuis l'app** via le SDK, protégée par les règles.
- **Temps réel en option** : `onSnapshot` prévient l'app dès qu'une donnée change.
- **Facturée à l'opération** : chaque document lu / écrit / supprimé compte, quelle que soit sa taille. Gratuit : 50 000 lectures, 20 000 écritures, 20 000 suppressions par jour, 1 Gio stocké.

## 8. NoSQL, ça veut dire quoi ?

Les mêmes données dans les deux mondes : des utilisateurs qui publient des annonces.

**SQL** — tables à colonnes fixes, reliées par des id :

```
users                      annonces
id | nom                   id | titre | prix | user_id
1  | Rado                  10 | Vélo  | 50   | 1
2  | Hery                  11 | Table | 30   | 1
```

Pour afficher « Vélo, 50, par Rado » : `JOIN` entre les deux tables.

**Firestore** — collections de documents JSON :

```
users/1        → { nom: "Rado" }
annonces/10    → { titre: "Vélo",  prix: 50, userId: "1", userNom: "Rado" }
annonces/11    → { titre: "Table", prix: 30, userId: "1", userNom: "Rado", photos: ["url1", "url2"] }
```

| | SQL | Firestore |
|---|---|---|
| Structure | Fixe, déclarée avant | Libre : chaque document peut avoir ses propres champs (`photos` n'est que sur l'annonce 11) |
| Relations | `JOIN` | **Pas de JOIN** : on recopie l'info utile (`userNom`) ou on fait 2 lectures |
| Recopier des données | À éviter | Normal : 1 lecture suffit pour afficher l'annonce |
| Revers | — | Si Rado change de nom, il faut mettre à jour ses annonces |
| Listes | Table séparée | Dans le document (`photos: [...]`) ou sous-collection (`annonces/10/commentaires/...`) |
| Requêtes | Tout (`LIKE`, `GROUP BY`, JOIN multiples) | Égalité, comparaisons, tri, limite. Pas de recherche plein texte, pas de JOIN |
| Façon de concevoir | « Quelles entités j'ai ? » | « **Chaque écran lit quoi ?** » |

La question à se poser en Firestore : **« l'écran X affiche quoi, et comment le lire avec le moins de documents possible ? »**

Le SQL est préférable pour : beaucoup de relations croisées, des statistiques complexes, de la comptabilité. Pour une app mobile classique (profils, annonces, messages, photos), Firestore convient et reste gratuit.

## 9. Comment je « crée la base de données » ?

1. Une seule fois dans la console : doc 02, étape 3 (région `europe-west1`, **définitive**).
2. Il n'y a **pas de tables à créer**. Une collection apparaît au premier document écrit dedans : le premier `createItem(...)` crée `items`.
3. La « structure » est définie par ton code et par `validItem` dans `firestore.rules`. Comment la concevoir : `02b-modeliser-ses-donnees.md`.

## 10. Sans serveur, où se fait la validation des données ?

Dans `firestore.rules`. Exemple (doc 04c) :

```
function validItem(d) {
  return d.keys().hasOnly(['title', 'owner', 'createdAt', 'photoUrl'])
      && d.title is string && d.title.size() <= 200;
}
```

Une écriture qui ne respecte pas la règle est refusée par Google avant d'arriver en base. Valider aussi dans l'app reste utile pour afficher un message clair à l'utilisateur, mais **seules les règles protègent vraiment** : quelqu'un peut appeler Firestore sans passer par ton app.

## 11. C'est quoi un index composite ?

Firestore indexe chaque champ tout seul automatiquement. Une requête qui **filtre sur un champ et trie sur un autre** (`owner == moi` trié par `createdAt`) a besoin d'un index qui combine les deux. Tu le déclares dans `firestore.indexes.json` (doc 04c). Si tu l'oublies, l'erreur contient un lien qui le crée en un clic.

## 12. Pourquoi une carte bancaire si c'est gratuit ?

Cloud Functions et Cloud Storage n'existent que sur le plan Blaze. Blaze inclut les quotas gratuits, et tu ne paies que ce qui les dépasse. La carte sert à facturer un éventuel dépassement.

## 13. Je peux quand même recevoir une facture ?

Oui, si tu dépasses les quotas. Les garde-fous (doc 08) :

| Garde-fou | Effet |
|---|---|
| Alerte budget | Mail. **N'arrête rien.** |
| Spend cap Functions | Met Functions en pause au montant choisi (pas instantané, quelques minutes de retard). |
| `maxInstances: 2` | Limite la vitesse de consommation en cas de spam. |
| Nettoyage des images Docker | Évite les petits frais de stockage après chaque déploiement. |
| Règles + `limit()` | Firestore et Storage n'ont **pas** de spend cap : ce sont les règles et ton code qui les protègent. |

## 14. La clé `apiKey` dans le code de l'app, c'est grave ?

Non. Elle identifie ton projet, ce n'est pas un mot de passe. N'importe qui peut la lire dans l'APK. **La sécurité vient des règles**, d'où leur importance en option A/B. Les vraies clés secrètes (paiement, IA) vont uniquement côté serveur (fonctions de l'option B).

## 15. Pourquoi Storage aux États-Unis et Firestore en Belgique ?

- **Storage** : le quota gratuit des nouveaux buckets n'existe qu'en `us-central1`, `us-east1`, `us-west1`.
- **Firestore + Functions** : `europe-west1`, la région la plus proche de Madagascar parmi les moins chères. Les fonctions doivent être dans la même région que Firestore (obligatoire pour les déclencheurs).

Conséquence : les photos sont un peu plus lentes à charger. Acceptable pour du perso/test.

## 16. Quel doc lire selon l'option ?

| Étape | Option B (recommandée) | Option D (API complète) |
|---|---|---|
| Comprendre | 00, 01, Q&A | 00, 01, 03 |
| Créer le projet | 02 | 02 |
| Modéliser les données | **02b** | 02b |
| Données | **04c** | 04a ou 04b |
| Fonctions serveur | **04d** | (incluses dans 04a/04b) |
| Fichiers | 05 (règles **Storage** seulement) | 05 |
| Push | 06 partie A étapes 1-2 + 04d | 06 |
| App | 04c + 04d | 07 |
| Anti-facture | 08 | 08 |
