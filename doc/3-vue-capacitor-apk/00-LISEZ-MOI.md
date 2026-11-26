# Zip 3 — Vue + Capacitor → APK Android (de zéro, sous Linux)

## Ce que couvre ce zip

Créer le projet Vue, l'emballer dans une app Android avec Capacitor, l'installer sur un téléphone et produire un fichier `.apk`.

| Zip | Contenu |
|---|---|
| 1. firestore | Projet Firebase, base, règles |
| 2. vue-firestore | Le code qui parle à Firestore |
| **3. vue-capacitor-apk** (celui-ci) | Le projet Vue et l'APK |

**Ordre conseillé :** ce zip docs 01-03 → zip 1 → zip 2 → ce zip docs 04-06.

## Comment ça marche

```
Code Vue (src/)  ──npm run build──►  dist/ (HTML + JS)  ──npx cap sync──►  android/ (projet Android)
                                                                               │
                                                                     Gradle (build Android)
                                                                               ▼
                                                                         app-debug.apk
```

Capacitor crée une vraie app Android qui contient un navigateur intégré (WebView) et affiche ton `dist/` dedans.

## Checklist

| # | Doc | Résultat | Temps |
|---|-----|----------|-------|
| 1 | `01-installer-les-outils.md` | Node, Android Studio, SDK, variables d'environnement | 30-60 min (téléchargements) |
| 2 | `02-creer-le-projet-vue.md` | Projet Vue + TypeScript qui tourne dans le navigateur | 5 min |
| 3 | `03-ajouter-capacitor.md` | Dossier `android/` créé | 5 min |
| 4 | `04-lancer-sur-telephone.md` | L'app tourne sur ton téléphone | 15 min |
| 5 | `05-construire-l-apk.md` | Fichier `.apk` à partager | 10 min |
| 6 | `06-cycle-de-travail.md` | Quelle commande après chaque modification | — |
| 7 | `07-problemes-frequents.md` | Solutions aux erreurs courantes | — |

Versions utilisées pour écrire et vérifier ce guide (nov. 2026) : create-vue 3.24, Vue 3.5, Vite 8, TypeScript 6, Capacitor 8.6. J'ai exécuté pour de vrai les docs 02 et 03 (projet créé, Capacitor ajouté, dossier `android/` généré). Je n'ai **pas** pu exécuter la compilation Android (docs 04-05) : elle demande le SDK Android, que je n'ai pas dans mon environnement.
