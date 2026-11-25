# 08 — Anti-facture : les garde-fous à poser AVANT de déployer

## ✅ Checklist (15 min, une seule fois)

- [ ] 1. Alerte budget par mail (1 $)
- [ ] 2. Spend cap sur Cloud Functions
- [ ] 3. `maxInstances` bas dans le code (déjà fait si tu as copié le doc 04)
- [ ] 4. Nettoyage auto des images Docker
- [ ] 5. Protéger Firestore et Storage (ils n'ont pas de plafond)
- [ ] 6. Savoir où regarder sa conso
- [ ] 7. Connaître le bouton d'urgence

---

## 1. Alerte budget

🔗 https://console.cloud.google.com/billing → clique ton compte de facturation → menu gauche **Budgets & alerts**

1. 🖱️ **Create budget**
2. **Name** : `alerte-firebase` · **Projects** : ton projet → 🖱️ **Next**
3. **Budget type** : *Specified amount* · **Target amount** : **1** → 🖱️ **Next**
4. Seuils : laisse 50 %, 90 %, 100 % → coche **Email alerts to billing admins and users** → 🖱️ **Finish**

⚠️ **Un budget n'arrête rien.** Il envoie un mail. C'est ton détecteur, pas ton disjoncteur.

## 2. Spend cap sur Cloud Functions (le disjoncteur)

🔗 `https://console.firebase.google.com/project/PROJECT_ID/usage/details`

1. Carte **Service-level spend caps**
2. Ligne **Cloud Functions** → montant mensuel : **1** → 🖱️ **Configure**

Ce que ça fait :
- Mails à 50 % et 80 %.
- À 100 % : **Functions est mis en pause** jusqu'à la fin du mois → ton API répond en erreur.
- Pour relancer : même carte → 🖱️ **Lift** (jusqu'à 1 h pour repartir).

Limites à connaître :
- Fonction en **Preview** (peut changer).
- **Pas instantané** : quelques minutes de retard, ce qui est consommé pendant ce temps est facturé → mets un montant un peu sous ta vraie limite.
- Couvre seulement Functions (et App Hosting, Extensions, AI Logic). **Pas Firestore, pas Storage** → point 5.
- Tu dois être **Owner** du projet ou admin du compte de facturation.

Côté app : gère l'erreur proprement (`try/catch` autour de `api()`) pour afficher « service indisponible » plutôt qu'un écran blanc.

## 3. `maxInstances`

Déjà dans le code (`maxInstances: 2` / `max_instances=2`). Ça limite le nombre de conteneurs en parallèle, donc la vitesse à laquelle un spam peut consommer ton quota CPU/mémoire. Ça ne limite **pas** le nombre total d'appels → c'est le spend cap qui fait ça.

À ne jamais faire en mode gratuit : `minInstances` ≥ 1 (conteneur facturé 24h/24).

## 4. Nettoyage des images Docker

Chaque `firebase deploy` construit une image stockée dans Artifact Registry. Gratuit jusqu'à 500 Mo, ensuite facturé **même si personne n'utilise ton API**. C'est la cause n°1 des « 0,03 € » mystères.

```bash
$ firebase functions:artifacts:setpolicy --location europe-west1
```

Par défaut, supprime les images de plus d'**1 jour** (seule la version en cours est utilisée). Tu peux mettre `--days 7` si tu veux garder de quoi revenir en arrière. La CLI peut aussi te le proposer pendant un `deploy` : réponds **oui**.

## 5. Firestore et Storage : pas de plafond → protège-les

| Risque | Protection |
|---|---|
| Lecture massive de Firestore | Règles « tout fermé » (doc 05) + `.limit()` partout dans l'API |
| Quelqu'un remplit ton bucket | Règles Storage : dossier par uid + 10 Mo max + types limités (doc 05) |
| Création infinie de comptes anonymes pour contourner | Plus tard : **App Check** (vérifie que la requête vient de ton APK). Optionnel pour du perso/test. |
| Boucle infinie dans ton code (ex : fonction qui écrit dans Firestore et se redéclenche) | Teste sur les **émulateurs** avant chaque déploiement |

## 6. Où regarder sa conso

| Quoi | Lien |
|---|---|
| Vue globale Firebase (lectures Firestore, appels Functions, Storage) | 🔗 `https://console.firebase.google.com/project/PROJECT_ID/usage` |
| Le vrai montant en € / $ | 🔗 https://console.cloud.google.com/billing → ton compte → **Reports** |

Réflexe : un coup d'œil chaque semaine les premiers mois.

## 7. Bouton d'urgence

Si une facture s'emballe (mail du budget à 100 %, spend cap insuffisant) :

🔗 `https://console.cloud.google.com/billing/projects` → ligne de ton projet → **⋮** → **Disable billing**

Effet : tous les services payants du projet s'arrêtent (Functions, Storage…). Le projet repasse de fait aux seules fonctionnalités Spark. **Ne laisse pas la facturation coupée longtemps** si tu tiens à tes fichiers Storage : Google peut supprimer les ressources d'un projet sans facturation. Corrige le problème, puis réactive.

---

## Récap : coût attendu pour un usage perso/test

| Poste | Coût attendu |
|---|---|
| Functions (< 2 M appels/mois) | 0 |
| Firestore (< 50 k lectures/jour) | 0 |
| Storage (< 5 Go, bucket US) | 0 |
| Images Docker (avec politique de nettoyage) | 0 |
| 1 tâche planifiée (sur 3 gratuites) | 0 |
| Push FCM | 0 |
