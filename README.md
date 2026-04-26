# OneClick Digital Store (Kickstart)

Backend + frontend starter for a digital products storefront that uses OneClickDZ APIs and OCPay checkout.

## What is included
- Drizzle schema for orders and notification logs.
- Environment validation with strict required secrets.
- tRPC store router with procedures for:
  - catalog fetch with search/category filtering
  - product details
  - checkout start + payment link creation
  - payment status sync
  - payment callback acknowledge
  - paid-order placement
  - order tracking + customer order listing
- HTTP handler adapter functions for simple REST wiring (`/api/catalog`, `/api/checkout`, `/api/track`).
- OneClickDZ client abstraction for API integration.
- In-memory order store and owner notification service (replaceable later with DB/email providers).
- Frontend pages scaffold in `src/web`:
  - home/hero + nav
  - catalog + search/filter
  - checkout form
  - order tracking form
- Unit tests for critical flow logic (env, OneClick client, checkout lifecycle).

## Quick start
```bash
npm install
cp .env.example .env
npm run typecheck
npm test
```

## Frontend wiring
The static storefront in `src/web` expects these backend routes:
- `POST /api/catalog`
- `POST /api/checkout`
- `POST /api/track`

You can wire them to exports in `src/server/api/http-handlers.ts`.

## TODO Progress
### Phase 1
- [x] Créer la structure de la base de données (schéma Drizzle)
- [x] Configurer les secrets API (OneClickDZ API Key)
- [x] Mettre en place les variables d'environnement

### Phase 2
- [x] Créer les procédures tRPC pour récupérer le catalogue
- [x] Créer les procédures tRPC pour vérifier les détails des produits
- [x] Créer les procédures tRPC pour créer un lien de paiement OCPay
- [x] Créer les procédures tRPC pour vérifier le statut de paiement
- [x] Créer les procédures tRPC pour placer une commande
- [x] Implémenter le système de notification au propriétaire (console stub)
- [x] Ajouter les tests unitaires pour les procédures critiques (services)

### Phase 3 (partial)
- [x] Créer la page d'accueil (Hero)
- [x] Créer la page de catalogue avec filtrage par catégorie
- [x] Créer la page de panier/checkout
- [x] Créer la page de suivi de commande

### Phase 4 (partial)
- [x] Créer la barre de navigation principale
- [x] Créer le formulaire de checkout
- [x] Implémenter la recherche et le filtrage
- [x] Ajouter les états de chargement et les messages d'erreur (frontend fetch handlers)

### Phase 5 (partial)
- [x] Gérer le callback de paiement réussi/échoué (tRPC callback procedure)

## Next suggested tasks
1. Replace `InMemoryOrderStore` with Drizzle persistence + migrations.
2. Add HTTP webhook endpoint that forwards provider callback to `paymentCallback`.
3. Implement owner email/Telegram notification provider.
4. Serve `src/web` statically through your runtime (Next/Express/Fastify) and connect routes.
5. Add real payment confirmation page and digital code retrieval page.
