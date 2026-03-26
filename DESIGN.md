# Design Notes

## Brand Direction

- Korean and English text both use SUIT as the default typeface.
- The site should feel editorial, clean, and export-oriented rather than overly experimental.
- Motion should support the brand story, not overpower it.
- Production baseline date: 2026-03-26.
- Typography changes away from SUIT require explicit design approval.

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
- Homepage categories media-art is owned by `src/components/home/FabricMotionLab.tsx`.
- `src/components/home/Categories.tsx` and `src/components/home/FabricMotionLab.tsx` are a default no-touch area unless the user explicitly requests a Categories change.
- Do not import homepage media-art from `src/components/products/**`.

## Map Section

- The world map should remain legible.
- Airline path effects can be animated, but labels and country names must stay readable.
