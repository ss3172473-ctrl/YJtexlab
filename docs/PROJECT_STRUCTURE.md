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
- `src/components/site`: layout shell reused across routes.
- `src/components/home`: components intended for `/` only.
- `src/components/products`: product archive, preload, and product-specific motion.
- `src/components/about`, `contact`, `milestones`, `stories`: page-specific components grouped by route family.
- `src/content`: static content payloads.
- `src/lib`: shared helpers that are safe across route families, including hero media constants.

## Asset Layout

- `public/fonts`: local fonts.
- `public/hero`: homepage hero assets.
- `public/categories`: category visuals used on home.
- `public/new-stage-fabrics`: product archive imagery and manifests.

## Operational Layout

- `docs`: long-lived repo documentation.
- `.omx/context`: task snapshots for risky changes.
- `.omx/state`: OMX runtime state.

## Folder Rules

- One responsibility per top-level component folder.
- No duplicate sibling trees such as `public 2`, `scripts 2`, `.next 2`.
- Experimental or legacy product work must not remain in the deployable tree unless it is actively used by `/products`.
