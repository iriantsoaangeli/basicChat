# Messagerie avec gemini 

Objectif : une page de chat où l'utilisateur écrit un message, Gemini répond,
et l'historique est sauvegardé dans Firestore (collection `messages`).

## Front 
- [ ] Component 
  - [ ] Bulle de texte (`ChatBubble.vue`)
    - [ ] props : `texte`, `auteur` (`user` | `gemini`), `date`
    - [ ] alignée à droite si `user`, à gauche si `gemini` (couleurs différentes)
    - [ ] heure affichée sous le texte
  - [ ] Zone de texte (`ChatInput.vue`)
    - [ ] champ texte + `Entrée` pour envoyer
    - [ ] bloquée si vide ou pendant que Gemini répond
    - [ ] émet un event `send(texte)` puis se vide
  - [ ] bloc de discu (`ChatBox.vue`)
    - [ ] liste des `ChatBubble` triée par date
    - [ ] scroll auto vers le dernier message
    - [ ] indicateur "Gemini écrit..." pendant l'attente
    - [ ] message d'erreur (toast) si l'envoi échoue
  - [ ] reuse header
    - [ ] même `Header` que le sprint 1, ajouter un lien vers la page chat
- [ ] Page chat (`ChatView.vue`)
  - [ ] Header + ChatBox + ChatInput + Footer
  - [ ] route `/chat` dans `router/index.ts`
  - [ ] au chargement : récupérer les anciens messages

## Back
- [ ] Typage (`models/message.ts`)
  - [ ] `Message { id, texte, auteur: 'user' | 'gemini', createdAt }`
  - [ ] utiliser l'interface généralisée (Create / Update / fromFirestore / toFirestore)
- [ ] service message (`service/messageService.ts`)
  - [ ] prendre message : `fetchMessages()` → derniers messages triés par `createdAt`
    - [ ] limiter le nombre (ex. 50) pour les quotas
  - [ ] envoyer message : `sendMessage(texte)`
    - [ ] enregistrer le message `user` dans Firestore
    - [ ] appeler le service API
    - [ ] enregistrer la réponse `gemini` dans Firestore
    - [ ] renvoyer les 2 messages au front
- [ ] service Api (`service/gemini.ts`)
  - [x] clé API dans `.env.local` (`VITE_GEMINI_API_KEY`), ignorée par git (`*.local`)
  - [x] envoyer message : `askGemini(historique, texte)`
    - [x] envoyer aussi les derniers messages pour garder le contexte
      - [ ] limiter l'historique (ex. `history.slice(-20)`) pour les quotas
    - [x] retourner le texte de la réponse
  - [ ] gestion d'erreurs : pas d'internet (CheckInternet du sprint 1), quota dépassé (429), modèle surchargé (503), réponse vide

## Fini quand
- [ ] on peut écrire, Gemini répond, la réponse s'affiche
- [ ] en rechargeant la page, l'historique est toujours là
- [ ] une erreur (offline / quota) affiche un toast au lieu de planter
