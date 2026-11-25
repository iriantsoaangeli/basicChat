# 03 — TypeScript ou Python ?

## Comparatif

| Critère | Node.js / TypeScript | Python |
|---|---|---|
| Statut chez Firebase | Langage historique, tout est documenté en premier ici | Supporté (2nd gen), moins d'exemples |
| Versions supportées | Node 20, 22 | Python 3.10 → 3.13 |
| Framework pour les routes | Express | Flask |
| Même langage que ton app Vue | ✅ oui (tu partages types et habitudes) | ❌ |
| Démarrage à froid (cold start) | Dépend surtout du poids des libs importées | Idem — les grosses libs (pandas, numpy) l'allongent nettement |
| Émulateur local | ✅ | ✅ (nécessite un venv) |
| Libs data/IA (pandas, numpy…) | Limité | ✅ point fort |
| Extensions Firebase, exemples, réponses StackOverflow | Beaucoup | Peu |

## Le « gratuit max » en tient compte

- Le coût dépend du **temps d'exécution × mémoire**. Les deux langages tiennent dans 256 Mio pour une API CRUD simple.
- Python + grosses libs (pandas…) = plus de mémoire et un démarrage plus lent → consomme plus vite les Go-s gratuits.

## Recommandation

- **Tu fais du Vue → prends TypeScript.** Un seul langage, plus de doc, moins de surprises.
- **Prends Python** seulement si tu le maîtrises nettement mieux, ou si ton API fera du traitement de données / IA.

Les deux docs suivants contiennent **exactement la même API** (mêmes routes, mêmes réglages anti-facture) → tu peux comparer le code côte à côte avant de choisir.

➡️ `04a-api-typescript.md` ou `04b-api-python.md`
