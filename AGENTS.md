# Project AGENTS

This file applies to the entire `yjtexlab.com` repository.

## Deployment

- Production deployment is Vercel only.
- Always deploy from the repository root: `/Users/leesungjun/Desktop/yjtexlab.com`.
- Before production deploys, run `npm run build` and `npm run verify`.

## Homepage Boundary

- `/` is a brand homepage, not a product experiment playground.
- Do not place product-only copy such as `Runway Kinetic` or `Motion becomes framing.` on the homepage.
- Keep product archive and experimental corridor logic under `src/components/products`.
- If homepage needs product content, add a dedicated home wrapper inside `src/components/home` and verify the home boundary script still passes.

## Route Guardrails

- `/product` must redirect to `/products`.
- Keep home sections and product sections in separate folders.
- Prefer explicit folder moves over duplicate files like `foo 2` or `.next-*` style local artifacts.

## Documentation Discipline

- Update `README.md`, `DESIGN.md`, and `docs/PROJECT_STRUCTURE.md` when folder responsibilities change.
- Add a fresh `.omx/context/*.md` snapshot before risky structural changes.
