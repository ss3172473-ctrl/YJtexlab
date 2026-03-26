# Project Structure

## Root

- `package.json`: commands and verification entrypoints.
- `vercel.json`: Vercel project behavior.
- `README.md`: project overview and operator entrypoint.
- `AGENTS.md`: repository rules for humans and coding agents.
- `DESIGN.md`: visual and content guardrails.
- `.vercelignore`: allowlist that limits Vercel uploads to the real app inputs.

## Source Layout

- `src/app`: route files only.
- `src/components/site`: layout shell and shared route preload gate reused across routes.
- `src/components/home`: components intended for `/` only, including `FabricMotionLab.tsx` for the categories media-art.
- `src/components/products`: product archive and product-specific motion for `/products`.
- `src/components/about`, `contact`, `milestones`, `stories`: page-specific components grouped by route family.
- `src/content`: static content payloads.
- `src/lib`: shared helpers that are safe across route families, including hero media constants and `route-matrix.ts`.

## Asset Layout

- `public/fonts`: local fonts.
- `public/hero`: homepage hero assets.
- `public/homepage-fabrics`: homepage preview still frames used by the motion lab.
- `public/new-stage-fabrics`: product archive imagery and manifests.

## Operational Layout

- `docs`: long-lived repo documentation.
- `docs/baselines/home/20260326`: committed production baseline screenshots and route snapshot.
- `docs/AI_HANDOFF.md`: agent/operator handoff contract.
- `.omx/context`: task snapshots for risky changes.
- `.omx/state`: OMX runtime state.

## Folder Rules

- One responsibility per top-level component folder.
- No duplicate sibling trees such as `public 2`, `scripts 2`, `.next 2`.
- Experimental or legacy product work must not remain in the deployable tree unless it is actively used by `/products`.
- Homepage media-art must remain home-owned and must not be swapped with a product preview component.
- `src/components/home/Categories.tsx` and `src/components/home/FabricMotionLab.tsx` are protected baseline files unless the user explicitly requests a Categories change.
