# AI Handoff

- production baseline: 2026-03-26
- canonical root: `/Users/leesungjun/Desktop/yjtexlab.com`
- temporary migration workspace: `/Users/leesungjun/Desktop/yjtexlab.com-clean-20260326`
- homepage media-art owner: `src/components/home/FabricMotionLab.tsx`
- route authority: `src/lib/route-matrix.ts`
- seo authority: `src/lib/seo.ts`
- visible home shell: `/products`, `/about`, `/contact`, `/milestones`, `/privacy`, `/terms`
- required verify commands: `npm run verify`, `npm run verify:corridor`, `npm run verify:seo`, `npm run verify:deploy`
- deployment target: Vercel only
- restored production deployment reference: `dpl_HM33mRdpChYmjXejeVtfvxkVDqMS`

## Operator Notes

- Do not reintroduce flat homepage components under `src/components`.
- Do not import from `src/components/products/**` anywhere in the homepage graph.
- Keep `data-home-media-art="fabric-motion-lab"` and the FabricMotionLab debug signature stable unless the baseline is intentionally changed.
- If shell links change, update `route-matrix.ts`, regenerate `docs/baselines/home/20260326/route-matrix.json`, and update the baseline docs together.
- If metadata or canonical URLs change, update `src/lib/seo.ts`, `public/robots.txt`, `public/sitemap.xml`, and `public/site.webmanifest` together.
- If you touch the homepage structure, create a new `.omx/context/*.md` snapshot first.
