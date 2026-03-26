# Design Notes

## Brand Direction

- Korean text uses SUIT as the primary typeface.
- The site should feel editorial, clean, and export-oriented rather than overly experimental.
- Motion should support the brand story, not overpower it.
- Production baseline date: 2026-03-26.

## Homepage Composition

1. Header
2. Original hero video
3. Categories preview
4. Partners
5. Global Presence
6. Locations
7. Footer

## Separation Rule

- Product archive treatments can be richer and more experimental.
- Homepage sections must stay restrained and must not inherit product-only hero copy or stray route shells.
- The only allowed homepage preview seam is `src/components/home/Categories.tsx -> src/components/products/home-preview/ProductsCorridorPreview.tsx`.

## Map Section

- The world map should remain legible.
- Airline path effects can be animated, but labels and country names must stay readable.
