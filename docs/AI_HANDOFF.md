# AI Handoff

- production baseline: 2026-03-26
- canonical root: `/Users/leesungjun/Desktop/yjtexlab.com`
- temporary migration workspace: `/Users/leesungjun/Desktop/yjtexlab.com-clean-20260326`
- homepage media-art owner: `src/components/home/FabricMotionLab.tsx`
- homepage categories freeze: `src/components/home/Categories.tsx` and `src/components/home/FabricMotionLab.tsx` must not change unless the user explicitly requests a Categories change
- route authority: `src/lib/route-matrix.ts`
- seo authority: `src/lib/seo.ts`
- route preload assets authority: `src/lib/preload-assets.ts`
- shared preload gate: `src/components/site/PagePreloadGate.tsx`
- visible home shell: `/products`, `/about`, `/contact`, `/milestones`, `/privacy`, `/terms`
- required verify commands: `npm run verify`, `npm run verify:corridor`, `npm run verify:seo`, `npm run verify:deploy`
- deployment target: Vercel only
- restored production deployment reference: `dpl_HM33mRdpChYmjXejeVtfvxkVDqMS`

## Operator Notes

- Do not reintroduce flat homepage components under `src/components`.
- Do not import from `src/components/products/**` anywhere in the homepage graph.
- Do not touch `Categories.tsx` or `FabricMotionLab.tsx` unless the user explicitly asks for a Categories change.
- Keep `data-home-media-art="fabric-motion-lab"` and the FabricMotionLab debug signature stable unless the baseline is intentionally changed.
- If shell links change, update `route-matrix.ts`, regenerate `docs/baselines/home/20260326/route-matrix.json`, and update the baseline docs together.
- If metadata or canonical URLs change, update `src/lib/seo.ts`, `public/robots.txt`, `public/sitemap.xml`, and `public/site.webmanifest` together.
- If you touch the homepage structure, create a new `.omx/context/*.md` snapshot first.
