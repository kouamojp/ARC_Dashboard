# Plan de match — Front-end Angular pour `recouvrement-app`

> **Objectif de la phase 1** : permettre aux **débiteurs**, **partenaires** et **agents** de se connecter
> depuis le dashboard Angular et de consulter leurs propres informations.

| | |
|---|---|
| **Front-end** | `C:\wamp64\www\arc_dsahboard` — ArchitectUI, Angular 22 zoneless, Bootstrap 5, NgModules |
| **Back-end** | `C:\wamp64\www\recouvrement-app` — Laravel 7, MongoDB (`arc`), Backpack CRUD 4.1 |
| **API** | `http://localhost:8000/api` · **Front** `http://localhost:4200` |

---

## Avancement

| Lot | Portée | État |
|---|---|---|
| **0** | Sécuriser les credentials | ✅ Fait |
| **1** | Authentification API multi-profils (JWT) | ✅ Fait |
| **2** | Endpoints métier cloisonnés | ✅ Fait |
| **3** | Fondations Angular (core, guards, interceptor) | ✅ Fait |
| **4** | Connexion et routage par profil | ✅ Fait |
| **5** | Écrans métier par profil | ⬜ À faire |

---

## 1. État des lieux

### 1.1 Modèle de données (MongoDB, base `arc`)

| Collection | Champs | Peut se connecter ? |
|---|---|---|
| `debiteurs` | `societe_debitrice`, `gerant`, `ville`, `localisation`, `email`, `password`, `telephone`, `partenaires[]` (tableau d'IDs), `agent_id` | ✅ email + password |
| `partenaires` | `nom`, `adresse`, `ville`, `telephone`, `email`, `password`, `secteur` | ✅ email + password |
| `agents` | `nom`, `prenom`, `email`, `telephone` | ⚠️ password ajouté au lot 0 |
| `dettes` | `intitule`, `montant_reclame`, `montant_reconnu`, `montant_verse`, `solde` (auto), `script`, `dernier_versement`, `date_echeance_mensuelle`, `debiteur_id`, `partenaire_id` | — |
| `recus` | rattachés aux dettes | — |
| `rapports` | rattachés aux partenaires | — |

**Particularité MongoDB** : les relations Eloquent classiques sont partiellement inutilisables.
`debiteurs.partenaires` est un **tableau d'ObjectIds**, pas une relation — il faut requêter
`Partenaire::whereIn('_id', $debiteur->partenaires)`. Les relations concernées sont
commentées dans les modèles (`Debiteur.php:59`, `Partenaire.php:47`).

### 1.2 API existante

`routes/api.php` — 4 routes, **toutes publiques**, uniquement pour les débiteurs :

```
GET /api/debiteurs                  → tous les débiteurs de la base
GET /api/debiteur/{id}              → un débiteur par ID
GET /api/debiteur/{id}/dettes       → ses dettes
GET /api/debiteur/{id}/partenaires  → cassé (relation commentée)
```

### 1.3 Front-end existant

Le template ArchitectUI est intact : deux layouts (`BaseLayoutComponent` avec sidebar,
`PagesLayoutComponent` pour l'auth), et les trois pages d'authentification déjà maquettées.
Rien n'est câblé : `LoginBoxedComponent.onSubmit()` est vide, `environment.ts` ne contient
pas d'`apiUrl`, et il n'existe ni service HTTP, ni modèle TypeScript, ni guard, ni interceptor.

---

## 2. Points bloquants identifiés

| # | Problème | Emplacement | Lot |
|---|---|---|---|
| 1 | Aucune authentification API pour les 3 profils métier — le guard `auth:api` pointe sur `App\User` (admins Backpack) | `config/auth.php:44` | 1 |
| 2 | Mots de passe stockés en clair, aucun hachage nulle part | modèles `Debiteur`, `Partenaire` | **0** |
| 3 | Les agents n'ont ni mot de passe ni moyen de se connecter | `AgentCrudController.php` | **0** |
| 4 | `$rules['email'][] = ...` sur une chaîne → erreur fatale PHP à la création | les 3 `*Request.php` | **0** |
| 5 | `showPartenaires()` utilise une relation commentée | `Api/DebiteurController.php:44` | 2 ✅ |
| 6 | Aucun cloisonnement : l'API renvoie toute la base sans vérifier qui demande | `routes/api.php` | 2 ✅ |
| 7 | CORS ouvert à `*` | `config/cors.php:22` | 1 ✅ |
| 8 | Débiteurs sans `agent_id` ni `partenaires` en base — donnée à saisir dans Backpack | données | — |

---

## 3. Décision d'architecture : JWT multi-guard

**`tymon/jwt-auth`**, et non Sanctum ni Passport.

Sanctum stocke ses jetons dans une table relationnelle `personal_access_tokens` — mauvais
fit avec MongoDB. JWT est *stateless* : aucune collection supplémentaire, support natif de
plusieurs providers, et `tymon/jwt-auth ^1.0` est compatible Laravel 7.

Le token porte le `sub` (ObjectId) et un claim **`profil`** (`debiteur` | `partenaire` | `agent`)
qui pilote à la fois le middleware côté Laravel et le routage côté Angular.

---

## 4. Les lots

### Lot 0 — Sécuriser les credentials ✅ *(fait)*

- Mutateur `setPasswordAttribute()` → bcrypt sur `Debiteur`, `Partenaire`, `Agent`.
  Une valeur vide est ignorée (la modification sans saisie conserve le mot de passe),
  une valeur déjà hachée est réenregistrée telle quelle (pas de double hachage).
- `protected $hidden = ['password']` sur les 3 modèles
- Champ `password` ajouté au CRUD Backpack des agents, avec un `hint` expliquant que
  laisser vide conserve l'existant ; même `hint` ajouté aux débiteurs et partenaires
- Commande `php artisan passwords:hash [--dry-run]`, idempotente
- Correction du bug fatal `$rules['email'][]` dans les trois FormRequest
- Règle `password` : `required|min:8` à la création, `nullable|min:8` à la modification

**Résultat de la migration** : 2 mots de passe hachés (1 débiteur, 1 partenaire).
Format vérifié `$2y$`, 60 caractères, `Hash::check()` opérationnel, champ absent du JSON.

**Restes à traiter** :
- 2 comptes sans mot de passe (1 débiteur, 1 agent) — à renseigner via Backpack avant
  qu'ils puissent se connecter
- `CRUD::setValidation(DebiteurRequest::class)` est toujours commenté dans
  `DebiteurCrudController.php:65` — les règles ne s'appliquent donc pas encore aux
  débiteurs. Le bug fatal qui motivait probablement ce contournement est corrigé :
  la ligne peut être décommentée et testée.
- Les identifiants déjà communiqués sont à considérer comme compromis et à renouveler.

### Lot 1 — Authentification API multi-profils ✅ *(fait)*

- `tymon/jwt-auth 1.0.2` installé, config publiée, `JWT_SECRET` généré
- Les 3 modèles héritent de `Jenssegers\Mongodb\Auth\User` et implémentent `JWTSubject`.
  Le comportement commun (hachage + claims) est factorisé dans le trait
  `App\Models\Traits\AuthentifiableParJwt` ; chaque modèle déclare une constante `PROFIL`
- `config/auth.php` : 3 providers (`debiteurs`, `partenaires`, `agents`) + 3 guards JWT
  dont le nom est identique à celui du profil
- Middleware `jwt.profil` — lit le claim `profil`, active le guard correspondant, et
  restreint optionnellement l'accès (`jwt.profil:debiteur`, `jwt.profil:partenaire,agent`)
- Middleware `ForceReponseJson` appliqué au groupe `api`
- `config/cors.php` restreint à `FRONTEND_URLS` (défaut `http://localhost:4200`)

#### Contrat d'API

```http
POST /api/auth/login     { profil, email, password }  →  { token, type, expires_in, profil, utilisateur }
GET  /api/auth/me        Authorization: Bearer <token> →  { profil, utilisateur }
POST /api/auth/refresh   Authorization: Bearer <token> →  { token, ... }
POST /api/auth/logout    Authorization: Bearer <token> →  { message }
```

`profil` vaut `debiteur`, `partenaire` ou `agent`. Codes d'erreur : `422` (validation,
avec un objet `errors` indexé par champ), `401` (identifiants, token absent/invalide/expiré,
compte supprimé), `403` (profil non autorisé sur la route). Les réponses 401/403 portent un
champ `code` (`token_expire`, `token_invalide`, `profil_inconnu`, `profil_non_autorise`,
`compte_introuvable`) pour permettre au front de distinguer les cas.

#### Validation

30 tests d'acceptation passés sur l'API réelle : connexion des 3 profils, rejet des mauvais
identifiants, **cloisonnement inter-profils** (les identifiants d'un débiteur ne permettent
pas de se connecter en tant qu'agent), résolution du bon compte sur `/me`, renouvellement,
révocation du token après déconnexion, et CORS. Absence de `password` vérifiée dans toutes
les réponses. Les comptes de test ont été supprimés après coup.

#### Détail notable

Sans le middleware `ForceReponseJson`, Laravel répondait **302 au lieu de 422** aux erreurs
de validation : le framework ne bascule en JSON que si le client envoie
`Accept: application/json`, ce que le `HttpClient` d'Angular ne fait pas spontanément.

### Lot 2 — Endpoints métier cloisonnés ✅ *(fait)*

Aucun endpoint n'accepte d'identifiant en paramètre : tout est dérivé du token.

| Profil | Endpoints |
|---|---|
| Débiteur | `/api/debiteur/me`, `/me/dettes`, `/me/partenaires`, `/me/agent`, `/me/synthese` |
| Partenaire | `/api/partenaire/me`, `/me/dettes`, `/me/debiteurs`, `/me/rapport`, `/me/synthese` |
| Agent | `/api/agent/me`, `/me/debiteurs`, `/me/dettes`, `/me/synthese` |

Les 4 anciennes routes publiques (`/api/debiteurs`, `/api/debiteur/{id}`, …) sont supprimées.

#### Conventions de réponse

- Collections : tableau JSON nu, sans enveloppe `data` (`JsonResource::withoutWrapping()`)
- Objets : l'objet directement
- Relation optionnelle absente (agent non assigné, rapport non produit) : **204 sans corps**,
  qu'`HttpClient` restitue en `null`
- `_id` devient `id`, en chaîne ; les montants, stockés en base sous forme de chaînes,
  sont normalisés en entiers ; `password` n'est exposé nulle part

`/me/synthese` agrège les dettes du périmètre : `nombre_dettes`, `montant_reclame`,
`montant_reconnu`, `montant_verse`, `solde`, `taux_recouvrement`, `devise`
(plus `nombre_debiteurs` pour les partenaires et les agents).

#### Validation

52 tests d'acceptation sur l'API réelle, avec une fixture de deux univers complets (A et B)
qui ne doivent jamais se croiser : périmètre correct pour chaque profil, **aucune fuite d'un
univers vers l'autre**, 403 sur un endpoint d'un autre profil, 401 sans token, 404 sur les
anciennes routes, montants correctement normalisés (y compris `"500 000"` → `500000`),
et cas des relations absentes. Fixture supprimée ensuite, base revenue à son état initial.

#### Ce que le schéma réel a révélé

- Les **montants sont stockés en chaînes** (`montant_reclame` et consorts), seul `solde` est
  un entier. D'où la normalisation systématique dans les ressources.
- **Aucun débiteur en base n'a de `agent_id` ni de tableau `partenaires`.** Le rattachement
  existe dans le formulaire Backpack mais n'a jamais été renseigné. Conséquence :
  `/debiteur/me/agent` répond 204 et `/agent/me/debiteurs` renvoie une liste vide sur les
  données actuelles. Le code est correct, c'est la donnée qui manque.
- Pour contourner partiellement ce manque, `/debiteur/me/partenaires` et
  `/partenaire/me/debiteurs` croisent **deux sources** : le rattachement explicite et les
  liens portés par les dettes (`dettes.partenaire_id` / `dettes.debiteur_id`).
  Le lien débiteur ↔ agent, lui, n'a pas de source de secours.
- `recus` et `rapports` sont des collections vides.

### Lot 3 — Fondations Angular ✅ *(fait)*

```
src/app/core/
├── models/        profil · metier · auth (+ barrel)
├── services/      auth · debiteur · partenaire · agent
├── guards/        auth.guard · profil.guard
├── interceptors/  auth.interceptor
└── utils/         erreur-api
```

- `environment.ts` : `apiUrl = http://localhost:8000/api` ; `environment.prod.ts` : `/api`,
  **à faire pointer vers l'API de production avant tout déploiement**
- `AuthService` — état en signals (`token`, `profil`, `utilisateur`, `estConnecte`,
  `nomAffiche`). Seuls le token et le profil sont persistés en `localStorage` ;
  l'utilisateur est rechargé depuis `/auth/me` au démarrage pour ne jamais afficher de
  données périmées
- `provideAppInitializer` rejoue la session avant le premier rendu ; un token révoqué se
  solde par une session vidée, sans erreur visible
- `authInterceptor` — n'agit que sur les URLs de `environment.apiUrl`, ajoute le `Bearer`
  et `Accept: application/json`. Sur 401 il ferme la session et redirige, **sauf sur
  `/auth/login`** où un 401 signifie « mauvais mot de passe », pas « session expirée »
- `authGuard` conserve l'URL demandée dans `?retour=` ; `profilGuard` renvoie un
  utilisateur connecté au mauvais endroit vers **son propre espace**, pas vers la connexion
- `HttpClientModule` (déprécié) remplacé par `provideHttpClient(withInterceptors([...]))`
- `messageErreur()` / `erreursValidation()` pour exploiter les corps d'erreur de l'API

#### Validation

`ng build`, `ng lint` et `tsc --noEmit` passent. **26 tests unitaires au vert** (22 nouveaux) :
ouverture et fermeture de session, persistance, déconnexion locale même si le serveur
refuse le logout, restauration d'une session valide, purge d'un token périmé, rejet d'un
profil persisté invalide, `nomAffiche` pour les trois profils, redirections des deux guards,
et les cinq comportements de l'intercepteur.

Le va-et-vient réel avec le navigateur (CORS compris) sera exercé au lot 4, faute d'écran
qui consomme ces fondations aujourd'hui.

### Lot 4 — Connexion et routage par profil ✅ *(fait)*

- `LoginBoxedComponent` câblé : formulaire réactif, sélecteur de profil en trois onglets,
  états `enCours` / `erreur` / `erreursChamps` en signals, redirection vers
  `?retour=` s'il existe, sinon vers `/{profil}/dashboard`
- Routage restructuré : la racine passe par `accueilGuard` (espace du profil connecté ou
  connexion), puis trois branches **lazy-loadées** `/debiteur`, `/partenaire`, `/agent`
  sous `BaseLayoutComponent`, protégées par `authGuard` + `profilGuard`
- La vitrine du template ArchitectUI reste routée telle quelle, en accès libre
- **`register-boxed` et `forgot-password-boxed` ne sont plus routées** : aucun endpoint
  API ne les prend en charge. Les composants restent en place, prêts à être rebranchés
- Sidebar : navigation métier quand on est connecté, vitrine du template sinon
- `UserBoxComponent` : nom réel, libellé du profil, email et bouton de déconnexion

#### Espaces créés

```
src/app/Profils/
├── shared/      MontantPipe · SyntheseCartesComponent (bandeau d'indicateurs commun)
├── debiteur/    dashboard — identité, agent assigné, partenaires
├── partenaire/  dashboard — portefeuille de débiteurs, rapport d'activité
└── agent/       dashboard — débiteurs assignés, dettes au solde positif
```

#### Validation en navigateur réel

Parcours complet joué sur `localhost:4200` contre l'API : redirection de la racine,
**mauvais mot de passe** (message du back-end affiché, aucune redirection parasite),
connexion des trois profils, données conformes aux montants attendus, sidebar et user-box
qui suivent le profil, **tentative d'accès croisé** (`/partenaire/dashboard` en tant que
débiteur → renvoi vers `/debiteur/dashboard`), session survivant à un rechargement complet,
déconnexion. Aucune erreur console. `ng build`, `ng lint` et 26 tests unitaires au vert.

#### Deux défauts d'affichage corrigés

- `.widget-heading { color: #495057 }` est déclaré **globalement** dans
  `_header-dropdowns.scss` alors qu'il s'agit d'un style de header. Cette règle directe
  bat le `text-white` hérité, rendant les libellés des cartes illisibles sur fond sombre.
  Contourné en appliquant `text-white` directement sur les éléments concernés —
  la règle globale elle-même reste à assainir.
- `btn-actions-pane-right` n'a aucune règle de base dans ce build (elle n'existe qu'en
  responsive) : les badges de comptage passaient à la ligne. Remplacée par les utilitaires
  Bootstrap `d-flex justify-content-between`.

### Lot 5 — Écrans métier

- **Débiteur** — synthèse des dettes (réclamé / reconnu / versé / solde), tableau avec
  échéances, fiche partenaires, contact agent
- **Partenaire** — portefeuille de débiteurs, encours, taux de recouvrement (Chart.js), rapport
- **Agent** — débiteurs assignés, dettes en retard, indicateurs de performance

---

## 5. Ordre d'exécution

```
Lot 0 ──► Lot 1 ──► Lot 2          (backend, séquentiel)
                      │
                      ▼
          Lot 3 ──► Lot 4 ──► Lot 5   (frontend)
```

Les lots 3 et 4 peuvent démarrer en parallèle du lot 2 sur données mockées, mais terminer
le backend d'abord est préférable : c'est lui qui fixe le contrat d'API.

---

## 6. Réserves

**Laravel 7 est en fin de vie** — plus de correctifs de sécurité depuis 2021 — et
`jenssegers/mongodb` 3.6 appartient à la lignée pré-renommage (`mongodb/laravel-mongodb`).
L'ensemble fonctionne, mais on construit sur une base non maintenue. Migration à planifier
**après** la mise en place de l'authentification, pas pendant.

**Les mots de passe actuellement en base sont en clair.** Le lot 0 les hache, mais tout
identifiant déjà communiqué à un débiteur ou un partenaire doit être considéré comme
compromis et renouvelé.

---

## 7. Questions ouvertes

1. **Inscription** — comptes créés uniquement par l'admin via Backpack, ou auto-inscription
   attendue ? En l'absence de réponse, le lot 4 a **retiré `register-boxed` du routage**
   plutôt que d'exposer une page sans effet. Le composant est intact.
2. **Mot de passe oublié** — même traitement, pour la même raison. `MAIL_MAILER=smtp` est
   configuré mais les credentials SMTP n'ont pas été validés.
3. **Vitrine du template** — les pages de démonstration ArchitectUI (Elements, Components,
   Charts, Widgets…) restent routées et accessibles sans authentification. À supprimer
   pour une mise en production, mais c'est une décision de nettoyage, pas un blocage.
4. ~~**Données de test**~~ — MongoDB tourne, la base `arc` contient 2 débiteurs,
   1 partenaire, 1 agent et 1 dette.
