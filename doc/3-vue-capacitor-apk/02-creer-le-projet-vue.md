# 02 — Créer le projet Vue (TypeScript)

## ✅ Checklist

- [ ] 1. Créer le projet
- [ ] 2. Installer les dépendances
- [ ] 3. Lancer dans le navigateur
- [ ] 4. Comprendre les fichiers créés

---

## 1. Créer le projet

```bash
$ cd ~                              # ou le dossier où tu ranges tes projets
$ npm create vue@latest mes-notes -- --ts --bare
```

| Partie | Signification |
|---|---|
| `npm create vue@latest` | Lance l'assistant officiel de Vue (dernière version) |
| `mes-notes` | Nom du dossier créé |
| `--` | Tout ce qui suit est passé à l'assistant |
| `--ts` | Avec TypeScript |
| `--bare` | Sans le code de démonstration (projet minimal) |

Avec ces options, l'assistant **ne pose aucune question**. Il affiche « Done ».

## 2. Installer les dépendances

```bash
$ cd mes-notes
$ npm install
```

## 3. Lancer dans le navigateur

```bash
$ npm run dev
```

Ouvre l'adresse affichée (http://localhost:5173). Tu dois voir « You did it! ». **Ctrl+C** pour arrêter.

## 4. Les fichiers créés

```
mes-notes/
├── index.html           ← la page HTML ; Vue s'affiche dans <div id="app">
├── package.json         ← dépendances et commandes (dev, build…)
├── vite.config.ts       ← config de Vite ; définit l'alias @ = src/
├── tsconfig*.json       ← config TypeScript
├── env.d.ts             ← types pour Vite (modifié au zip 2, doc 01)
├── public/              ← fichiers copiés tels quels (favicon)
└── src/
    ├── main.ts          ← point d'entrée : monte App.vue
    └── App.vue          ← le composant racine (remplacé au zip 2, doc 07)
```

Les commandes de `package.json` :

```json
"scripts": {
    "dev": "vite",
    "build": "run-p type-check \"build-only {@}\" --",
    "preview": "vite preview",
    "build-only": "vite build",
    "type-check": "vue-tsc --build"
  },
```

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur de développement, rechargement automatique |
| `npm run build` | Vérifie les types **et** produit le dossier `dist/` (les deux en parallèle). `dist/` est ce que Capacitor met dans l'APK. Une erreur de type fait échouer la commande : corrige-la avant d'aller plus loin. |
| `npm run type-check` | Vérifie seulement les types TypeScript |

## Maintenant

Le projet existe. Va au **zip 1** (projet Firebase), puis au **zip 2** (code Firestore), puis reviens au doc 03.

Tu peux aussi faire le doc 03 tout de suite : Capacitor s'ajoute indépendamment du code.

➡️ Suite : `03-ajouter-capacitor.md`
