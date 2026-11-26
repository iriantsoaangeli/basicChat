# 05 — Photos en base64 dans Firestore

## Le principe

Pas de stockage de fichiers en Spark → l'app **transforme la photo en texte** (base64) et la range dans un champ d'un document. Pour l'afficher : `<img src="data:image/jpeg;base64,...">`.

## Les contraintes

| Contrainte | Valeur | Conséquence |
|---|---|---|
| Taille max d'un document | 1 Mio | La photo doit être compressée |
| Le base64 grossit le fichier | +33 % | 510 Ko de JPEG ≈ 700 000 caractères |
| Stockage gratuit total | 1 Gio | ≈ 3 000 photos de 300 Ko |
| Téléchargement gratuit | 10 Gio/mois | Chaque affichage pleine taille consomme sa taille |
| Coût en lecture | 1 lecture par document, quelle que soit la taille | — |

## Les 3 choix de ce projet

| Choix | Pourquoi |
|---|---|
| **2 tailles** : miniature 240 px (≤ 30 000 caractères) **dans** la note, grande photo 1 280 px (≤ 700 000) **à part** dans `photos/` | La liste reste légère ; la grande photo n'est lue que si on l'ouvre |
| **Compression automatique** : la qualité JPEG baisse puis les dimensions diminuent jusqu'à passer sous la limite | Fonctionne avec n'importe quelle photo de téléphone |
| **Cache d'abord** : une photo déjà vue est relue depuis le téléphone | 0 lecture, 0 téléchargement |

Le code qui fait tout ça : zip 2, doc 04 (`src/services/photos.ts`).

## Pourquoi ne pas indexer les champs base64

Firestore indexe tous les champs par défaut. Indexer un texte base64 ne sert à rien (on ne cherche jamais « la photo qui vaut /9j/4AAQ... ») et prend de la place sur ton 1 Gio. Le fichier d'index (doc 07) désactive l'index de `photos.b64` et `notes.thumb`.

## Si tu veux plus de photos dans 1 Gio

Baisse la limite à **trois endroits**, toujours ensemble :
1. `PHOTO_MAX_CHARS` dans `src/models/photo.ts` (zip 2)
2. la dimension `1280` dans `src/services/photos.ts` (zip 2)
3. `b64.size() <= 700000` dans `firestore.rules` (doc 06)

➡️ Suite : `06-regles-de-securite.md`
