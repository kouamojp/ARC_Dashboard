# Arcréances — front-end

Tableau de bord Angular de l'application de recouvrement **Arcréances**. Il consomme
l'API du projet Laravel `recouvrement-app` et donne à chaque profil métier — débiteur,
partenaire, agent de recouvrement — un espace où consulter son propre dossier.

Construit sur le template [ArchitectUI Angular](https://dashboardpack.com) (MIT).

---

## Ce que fait l'application

Trois profils se connectent avec la même page, en choisissant leur qualité. Chacun
n'accède qu'à son périmètre, garanti côté serveur par le token et non par l'interface.

| Profil | Ce qu'il consulte |
|---|---|
| **Débiteur** | Sa fiche entreprise, ses dettes avec échéances et avancement des versements, ses partenaires, son agent de recouvrement |
| **Partenaire** | Son portefeuille de débiteurs avec encours et taux de recouvrement, l'ensemble de ses créances, son rapport d'activité |
| **Agent** | Les débiteurs qui lui sont assignés, les dettes priorisées par ancienneté du retard, ses indicateurs de suivi |

Une dette est **soldée** quand son solde est nul, **en retard** quand son échéance est
dépassée, **en cours** sinon. Une échéance absente ou non interprétable ne bascule jamais
en retard : le champ est une chaîne libre côté MongoDB.

---

## Architecture

Le produit tient en deux dépôts distincts :

```
arc_dsahboard/       ce dépôt — front-end Angular 22
recouvrement-app/    API Laravel 7 + Backpack, stockage MongoDB
```

Le front n'a aucun accès direct à la base : tout passe par l'API REST.

---

## Prérequis

| Composant | Version |
|---|---|
| Node.js | 22.x (voir `.nvmrc`) |
| npm | 10+ |
| API `recouvrement-app` | démarrée, avec MongoDB accessible |

---

## Démarrage

### 1. L'API

```bash
cd ../recouvrement-app
php artisan serve --port=8000
```

Elle doit écouter sur l'URL configurée dans `src/environments/environment.ts`, et
autoriser l'origine du front dans son `FRONTEND_URLS` (voir son propre README).

### 2. Le front

```bash
npm install
npm start
```

Puis ouvrir <http://localhost:4200>. La racine redirige vers la connexion, ou vers
l'espace du profil déjà connecté.

---

## Configuration

L'adresse de l'API se règle par environnement :

```ts
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

> **Avant tout déploiement**, `environment.prod.ts` doit être renseigné : il contient
> aujourd'hui `/api`, une valeur relative de remplacement.

---

## Comptes

Les comptes sont créés par un administrateur depuis l'interface Backpack de
`recouvrement-app` — il n'y a pas d'auto-inscription, ni de récupération de mot de passe.
Les pages correspondantes du template existent encore mais ne sont pas routées, faute
d'endpoint qui les prenne en charge.

Un débiteur ou un agent sans mot de passe enregistré ne peut pas se connecter.

---

## Structure

```
src/app/
├── core/                  socle applicatif
│   ├── models/            types calqués sur les ressources de l'API
│   ├── services/          auth + un service par profil
│   ├── guards/            accueil, authentification, profil
│   ├── interceptors/      injection du token, traitement des 401
│   └── utils/             exploitation des corps d'erreur
├── Profils/
│   ├── shared/            tableaux, graphiques, statuts, consolidation
│   ├── debiteur/          espace débiteur
│   ├── partenaire/        espace partenaire
│   └── agent/             espace agent
├── Layout/                bandeau, barre latérale, pied de page
└── DemoPages/             vitrine du template (voir « Limites connues »)
```

### Session

`AuthService` porte l'état en **signals**. Seuls le token et le profil sont conservés en
`localStorage` ; l'utilisateur est rechargé depuis `/auth/me` au démarrage, de sorte
qu'un compte modifié ou révoqué ne soit jamais affiché à partir d'un cache périmé.

L'intercepteur ferme la session sur un 401, **sauf sur `/auth/login`** où un 401 signifie
« identifiants incorrects » et doit rester dans le formulaire.

`profilGuard` renvoie un utilisateur arrivé sur l'espace d'un autre profil vers **le
sien**, et non vers la page de connexion : il est authentifié, simplement au mauvais
endroit.

---

## Contrat d'API

```http
POST /api/auth/login     { profil, email, password }  →  { token, type, expires_in, profil, utilisateur }
GET  /api/auth/me        Authorization: Bearer <token>
POST /api/auth/refresh   Authorization: Bearer <token>
POST /api/auth/logout    Authorization: Bearer <token>
```

`profil` vaut `debiteur`, `partenaire` ou `agent`.

| Profil | Endpoints |
|---|---|
| Débiteur | `/api/debiteur/me` · `/me/dettes` · `/me/partenaires` · `/me/agent` · `/me/synthese` · `/me/paiements` · `/me/recus` |
| Partenaire | `/api/partenaire/me` · `/me/dettes` · `/me/debiteurs` · `/me/rapport` · `/me/synthese` |
| Agent | `/api/agent/me` · `/me/debiteurs` · `/me/dettes` · `/me/synthese` |

Aucun endpoint n'accepte d'identifiant en paramètre : le périmètre est déduit du token.

### Conventions de réponse

- Les collections sont des tableaux JSON nus, sans enveloppe `data`
- `_id` est exposé sous la clé `id`, en chaîne
- Les montants, stockés en chaînes côté base, sont normalisés en entiers (FCFA)
- Une relation optionnelle absente — agent non assigné, rapport non produit — répond
  **204 sans corps**, que `HttpClient` restitue en `null`
- Les réponses 401 et 403 portent un champ `code` (`token_expire`, `token_invalide`,
  `profil_non_autorise`, `compte_introuvable`) permettant de distinguer une session
  expirée d'un accès refusé

### Paiement en ligne d'une dette

Implémenté des deux côtés : `PaiementService` et l'onglet « Payer une dette » ici,
`PaiementController` et `App\Services\Paiement` dans `recouvrement-app`.

```http
GET    /api/debiteur/me/paiements              → Paiement[]  (du plus récent au plus ancien)
POST   /api/debiteur/me/paiements              → Paiement
GET    /api/debiteur/me/paiements/{id}         → Paiement
POST   /api/debiteur/me/paiements/{id}/annuler → Paiement
```

Corps du `POST` :

```json
{
  "dette_id": "…",
  "montant": 250000,
  "moyen": "carte | orange_money | mtn_momo | paypal",
  "telephone": "+237…",
  "url_retour": "https://…/debiteur/paiements"
}
```

`telephone` n'est envoyé que pour `orange_money` et `mtn_momo`. `url_retour` est l'adresse
sur laquelle le prestataire doit renvoyer le débiteur, complétée par l'API d'un
paramètre `?paiement={id}` : le front y reprend le suivi du statut.

Ressource `Paiement` :

```json
{
  "id": "…", "reference": "ARC-20260819-K7M2QP",
  "dette_id": "…", "partenaire_id": "…",
  "montant": 250000, "devise": "FCFA",
  "moyen": "orange_money",
  "statut": "initie | en_attente | reussi | echoue | annule",
  "url_redirection": "https://psp…/pay/…",
  "instruction": "Composez #150*50# pour valider",
  "message_echec": null,
  "notifications": [
    {"destinataire": "admin", "canal": "email", "nom": null, "envoyee": true},
    {"destinataire": "partenaire", "canal": "email", "nom": "Ets Nkolo", "envoyee": true}
  ],
  "cree_le": "…", "confirme_le": "…"
}
```

Comportement côté serveur :

- `url_redirection` est renseignée pour `carte` et `paypal`, nulle pour le mobile money,
  qui renvoie à la place une `instruction` et le statut `en_attente`
- Sur `initie` et `en_attente`, le front relit `GET /paiements/{id}` toutes les 4 s,
  pendant 3 minutes au plus. Chaque lecture interroge le prestataire ; le webhook
  `POST /api/paiements/webhook/{passerelle}` fait la même chose sans navigateur ouvert
- Le passage à `reussi` est le **seul** moment où `montant_verse`, `solde` et
  `dernier_versement` de la dette sont recalculés, et l'opération est idempotente :
  un webhook arrivant après la relecture du front ne crédite pas deux fois. Le front
  ne décrémente rien localement, il relit `/me/dettes` et `/me/synthese`
- Une confirmation émet un `Recu` au format déjà connu du back-office, puis notifie par
  courriel l'administration, le partenaire créancier et l'agent en charge. Le tableau
  `notifications` dit au débiteur qui a été prévenu ; un tableau vide affiche un
  message générique
- Un montant supérieur au solde, ou une dette déjà soldée, sont refusés en 422

### Reçus de versement

```http
GET /api/debiteur/me/recus  → Recu[]  (du plus récent au plus ancien)
```

Alimente l'onglet « Mes reçus ». La liste mêle les règlements encaissés en ligne et
ceux saisis à la main dans le back-office (chèque, espèces, virement) : seul un
`paiement_id` non nul distingue les premiers, ce que l'onglet signale par un badge.

Passerelles : **CinetPay** couvre la carte et les deux mobile money en zone CEMAC,
**PayPal** l'API Orders v2. Sans identifiants marchands, une passerelle **factice**
prend le relais hors production et déroule tout le tunnel sans prestataire réel —
c'est ce qui rend l'onglet utilisable en développement.

---

## Commandes

| Commande | Effet |
|---|---|
| `npm start` | Serveur de développement sur <http://localhost:4200> |
| `npm run build` | Build de production (`ng build` compile en production par défaut) |
| `npm test` | Tests unitaires (Karma) |
| `npm run lint` | Analyse ESLint |

Pour une exécution non interactive des tests :

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

Les tests couvrent la session, les guards, l'intercepteur, le calcul des statuts de dette
et la consolidation par débiteur.

---

## Déploiement

```bash
npm run build
```

Les fichiers sont produits dans `dist/architectui-angular-free/browser/` — un chemin
hérité du template. C'est ce dossier qu'il faut servir, en réécrivant toutes les routes
vers `index.html`, sans quoi un accès direct à `/debiteur/dettes` renverra un 404. Un
`.htaccess` est fourni à la racine pour Apache. Pour Nginx :

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## Limites connues

Aucune n'empêche l'application de fonctionner, mais toutes méritent d'être traitées avant
une mise en production.

| Sujet | État |
|---|---|
| `environment.prod.ts` | `apiUrl` vaut `/api`, une valeur de remplacement |
| `npm run build:prod` | Conserve le `--base-href /architectui-angular-free/` du template |
| Nom du paquet | `package.json` s'appelle encore `architectui-angular-free` |
| Vitrine du template | Les pages de démonstration restent routées et accessibles sans authentification |
| Avatars | Les pages de démonstration référencent des images supprimées |
| `.widget-heading` | Une règle globale de `_header-dropdowns.scss` impose une couleur sombre à tous les widgets ; contournée là où c'était visible, pas corrigée à la source |
| Rattachement des agents | Le champ `agent_id` n'est renseigné sur aucun débiteur en base : l'espace agent reste vide tant que ce lien n'est pas saisi dans Backpack |
| Reçus | La collection existe côté API mais aucun écran ne l'expose |

Le découpage du chantier et son avancement sont consignés dans
[PLAN-RECOUVREMENT.md](PLAN-RECOUVREMENT.md).

---

## Licence

MIT — voir [LICENSE](LICENSE). Le template ArchitectUI dont ce projet dérive est
distribué par [DashboardPack](https://dashboardpack.com) sous la même licence.
