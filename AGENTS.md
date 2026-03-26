# Project AGENTS

This file applies to the entire `yjtexlab.com` repository.

## Deployment

- Production deployment is Vercel only.
- Always deploy from the repository root: `/Users/leesungjun/Desktop/yjtexlab.com`.
- Temporary migration work may happen in `/Users/leesungjun/Desktop/yjtexlab.com-clean-20260326`, but the canonical long-term local root is `/Users/leesungjun/Desktop/yjtexlab.com`.
- Before production deploys, run `npm run build` and `npm run verify`.
- Before production deploys, run `npm run verify:deploy`.

## Homepage Boundary

- `/` is a brand homepage, not a product experiment playground.
- Do not place product-only copy such as `Runway Kinetic` or `Motion becomes framing.` on the homepage.
- Keep product archive and product-owned preview logic under `src/components/products`.
- The only allowed home-to-products seam is `src/components/home/Categories.tsx` importing `src/components/products/home-preview/ProductsCorridorPreview.tsx`.
- Keep homepage sections under `src/components/home` and shared shell under `src/components/site`.
- The visible homepage shell must match the March 26, 2026 production baseline.

## Route Guardrails

- `/product` must redirect to `/products`.
- Keep home sections and product sections in separate folders.
- Phase-1 visible home shell routes are `/products`, `/about`, `/contact`, `/milestones`, `/privacy`, and `/terms`.
- Prefer explicit folder moves over duplicate files like `foo 2` or `.next-*` style local artifacts.

## Documentation Discipline

- Update `README.md`, `DESIGN.md`, and `docs/PROJECT_STRUCTURE.md` when folder responsibilities change.
- Update `docs/DEPLOYMENT.md`, `docs/RESEARCH_NOTES.md`, `docs/AI_HANDOFF.md`, and `docs/baselines/home/20260326/route-matrix.json` when the route or baseline contract changes.
- Add a fresh `.omx/context/*.md` snapshot before risky structural changes.
