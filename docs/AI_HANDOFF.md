# AI Handoff

- production baseline: 2026-03-26
- canonical root: `/Users/leesungjun/Desktop/yjtexlab.com`
- temporary migration workspace: `/Users/leesungjun/Desktop/yjtexlab.com-clean-20260326`
- single allowed seam: `src/components/home/Categories.tsx` -> `src/components/products/home-preview/ProductsCorridorPreview.tsx`
- route authority: `src/lib/route-matrix.ts`
- visible home shell: `/products`, `/about`, `/contact`, `/milestones`, `/privacy`, `/terms`
- required verify commands: `npm run verify`, `npm run verify:corridor`, `npm run verify:deploy`
- deployment target: Vercel only

## Operator Notes

- Do not reintroduce flat homepage components under `src/components`.
- Do not import from `src/components/products/**` anywhere in the homepage graph except the single allowed seam.
- If shell links change, update `route-matrix.ts`, regenerate `docs/baselines/home/20260326/route-matrix.json`, and update the baseline docs together.
- If you touch the homepage structure, create a new `.omx/context/*.md` snapshot first.
