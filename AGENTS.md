# Project AGENTS

This file applies to the entire `yjtexlab.com` repository.

## Deployment

- Production deployment is Vercel only.
- Always deploy from the repository root: `/Users/leesungjun/Desktop/yjtexlab.com`.
- Temporary migration work may happen in `/Users/leesungjun/Desktop/yjtexlab.com-clean-20260326`, but the canonical long-term local root is `/Users/leesungjun/Desktop/yjtexlab.com`.
- Before production deploys, run `npm run build` and `npm run verify`.
- Before production deploys, run `npm run verify:parallel`.
- Before production deploys, run `npm run verify:deploy`.
- Production deploys are integration-thread only. Feature threads must not deploy production directly.

## Parallel Workstreams

- New Codex threads started in this repo must read `docs/THREAD_START.md` and `docs/PARALLEL_WORKFLOW.md` before editing files.
- Do not let multiple threads share the same physical working tree.
- Default model is `1 thread = 1 worktree = 1 scope owner`.
- When parallel mode is active, declare active workstreams in `.omx/workstreams/active.json`.
- Route-local threads must stay inside their declared owned paths unless the user explicitly approves a shared-file change.
- Guarded shared files include `src/app/layout.tsx`, `src/app/globals.css`, `src/components/site/**`, `src/lib/route-matrix.ts`, `src/lib/seo.ts`, `package.json`, `vercel.json`, `README.md`, `AGENTS.md`, and `docs/**`.
- Only the integration thread may merge multi-scope work, edit guarded shared files by default, and run production deployment commands.

## Homepage Boundary

- `/` is a brand homepage, not a product experiment playground.
- Do not place product-only copy such as `Runway Kinetic` or `Motion becomes framing.` on the homepage.
- Keep product archive and product-owned preview logic under `src/components/products`.
- Do not import `src/components/products/**` anywhere in the homepage graph unless the user explicitly approves a new home-to-products seam.
- `src/components/home/Categories.tsx` and `src/components/home/FabricMotionLab.tsx` are protected homepage baseline files. Do not modify, replace, or redesign them unless the user explicitly requests a Categories change.
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
