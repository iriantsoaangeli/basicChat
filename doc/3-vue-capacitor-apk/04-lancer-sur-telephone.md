# 04 — Lancer l'app sur ton téléphone

## ✅ Checklist

- [ ] 1. Préparer `.env.local` pour la vraie base
- [ ] 2. Activer le débogage USB sur le téléphone
- [ ] 3. Brancher et vérifier
- [ ] 4. Lancer

---

## 1. `.env.local`

Dans `.env.local` (zip 2, doc 01) : **`VITE_USE_EMULATORS=0`**.

Pourquoi : sur le téléphone, `127.0.0.1` désigne le téléphone lui-même, pas ton PC → l'app ne trouverait pas les émulateurs. Et les valeurs de `.env.local` sont **gravées dans l'app au moment du `npm run build`** : il faut les avoir correctes avant de construire.

## 2. Débogage USB (sur le téléphone, une seule fois)

1. **Paramètres** → **À propos du téléphone** → appuie **7 fois** sur **Numéro de build** → « Vous êtes maintenant développeur »
2. **Paramètres** → **Système** → **Options pour les développeurs** → active **Débogage USB**

(Les noms exacts varient selon la marque ; cherche « numéro de build » et « débogage USB » dans la recherche des paramètres.)

## 3. Brancher et vérifier

1. Branche le téléphone en USB
2. Sur le téléphone : popup « Autoriser le débogage USB ? » → coche **Toujours autoriser** → **Autoriser**
3. Sur le PC :
   ```bash
   $ adb devices
   ```
   Tu dois voir une ligne `XXXXXXXX    device`. Si c'est `unauthorized` : regarde le téléphone, accepte la popup.

## 4. Lancer

```bash
$ npm run build
$ npx cap run android
```

| Commande | Ce qu'elle fait |
|---|---|
| `npm run build` | Produit `dist/` avec ton code à jour |
| `npx cap run android` | Copie `dist/` dans `android/`, compile l'app, l'installe et la lance. Te demande sur quel appareil (flèches + Entrée) |

La **première** compilation télécharge Gradle et des dépendances : plusieurs minutes. Les suivantes sont rapides.

### Alternative : depuis Android Studio

```bash
$ npx cap sync android
$ npx cap open android
```

Dans Android Studio : attends la fin de la barre « Gradle sync » en bas → choisis ton téléphone dans la liste en haut → bouton ▶ **Run**.

### Voir les erreurs JavaScript de l'app

Sur le PC, ouvre Chrome → `chrome://inspect` → sous ton téléphone, clique **inspect** sous « Mes Notes ». Tu as la console comme dans le navigateur.

➡️ Suite : `05-construire-l-apk.md`
