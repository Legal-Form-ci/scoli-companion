# Checklist Accessibilité — Scoly

Tests automatisés : `bunx vitest run src/test/a11y/`

## Carousel Kits École (`KitsHeroCarousel`)
- [x] `role="region"` + `aria-roledescription="carousel"` + `aria-label` explicite
- [x] Chaque slide en `role="group"` + `aria-roledescription="slide"` + `aria-label` "N sur T — Nom"
- [x] `aria-current="true"` sur la slide active
- [x] Navigation clavier : ← / → / Home / End
- [x] Bouton play/pause avec `aria-label` dynamique + `aria-pressed`
- [x] Boutons Précédent/Suivant avec `aria-label` + `aria-controls`
- [x] Indicateurs de page en `role="tablist"` + `aria-selected`
- [x] Autoplay pause sur hover / focus / touch
- [x] Focus visible (focus-visible:ring-2)
- [x] **Swipe tactile** gauche/droite avec préservation du focus
- [x] `touch-action: pan-y` : bloque le scroll page lors du swipe horizontal
- [x] Images `alt` descriptifs (nom du kit + niveau + école)
- [x] Aucun violation axe-core (WCAG 2.1 AA)

## Tuiles catégories (`JumiaCategoryTiles`)
- [x] `<nav aria-label="Catégories du catalogue">`
- [x] Liste sémantique `<ul>` / `<li>`
- [x] Chaque tuile : `aria-label="Voir la catégorie X"`
- [x] Icônes décoratives `aria-hidden="true"`
- [x] Texte alternatif (`sr-only`) avec initiales
- [x] Focus ring visible (`focus-visible:ring-2 ring-primary ring-offset-2`)
- [x] Navigation tab cohérente (ordre DOM = ordre visuel)
- [x] Contraste texte ≥ 4.5:1 (tokens `text-foreground` sur `bg-background`)
- [x] Cible tactile ≥ 44×44 px sur mobile
- [x] Aucun violation axe-core

## Formulaires d'authentification (`Auth`)
- [x] `<label>` associé (via `htmlFor` ou wrapping) sur chaque `<input>`
- [x] `autoComplete` renseigné (`email`, `current-password`, `new-password`)
- [x] `aria-required` / `required` sur les champs obligatoires
- [x] `aria-invalid` + message d'erreur associé via `aria-describedby`
- [x] Bouton submit avec libellé explicite
- [x] Portails distincts (`/auth`, `/me`, `/team`) avec `<h1>` unique par page
- [x] MathCaptcha : label lisible, `aria-live` pour le résultat
- [x] Aucun violation axe-core

## Global
- [x] Un seul `<main>` par route
- [x] `lang="fr"` sur `<html>`
- [x] `h-dvh` au lieu de `h-screen` sur mobile
- [x] Pas de `tabIndex > 0`
- [x] Tokens sémantiques (jamais `text-white`/`bg-black` en dur)
