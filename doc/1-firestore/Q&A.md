# Q&A

## Faut-il écrire une API ?

Non. Firestore est déjà un service en ligne qui sait lire, créer, modifier, supprimer, filtrer et trier. L'app l'appelle avec le SDK Firebase (`addDoc`, `getDocs`…). Les **règles** remplacent le code de contrôle qu'aurait eu une API. En Spark, tu ne pourrais d'ailleurs pas héberger d'API.

## Comment je crée les collections / tables ?

Tu ne les crées pas. La collection `notes` apparaît quand l'app écrit la première note. La forme des documents est définie dans le code (`src/models/note.ts`, zip 2) et imposée par les règles (`validNote`, doc 06).

## Le schéma du doc 04, c'est du code ?

Non, c'est une **représentation** lisible. Le vrai code :
- la forme exacte → `src/models/note.ts` (zip 2, doc 03) ;
- l'envoi à Firestore → `src/services/notes.ts` (zip 2, doc 05).

## Pourquoi les photos en base64 ?

Le stockage de fichiers (Cloud Storage) n'existe pas en Spark. Limites et choix : doc 05.

## La clé `apiKey` dans l'APK, c'est grave ?

Non, elle identifie le projet, ce n'est pas un mot de passe. La sécurité vient des règles (doc 06).

## Je peux recevoir une facture ?

Non, tant que tu ne passes pas en Blaze (aucune carte enregistrée).

## Que se passe-t-il au dépassement d'un quota ?

Les opérations échouent (`resource-exhausted`) jusqu'à la remise à zéro, vers 10h-11h à Madagascar. Le zip 2 (doc 06) affiche un message clair dans ce cas.

## L'émulateur et la vraie base, c'est pareil ?

Mêmes règles, même comportement, mais données locales effacées à l'arrêt et aucun quota consommé. Teste toujours sur l'émulateur avant de déployer.

## Je veux ajouter une collection

Doc 04 (grille) → doc 06 (bloc de règles) → zip 2 doc 09 (modèle TypeScript + service).
