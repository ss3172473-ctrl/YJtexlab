# AI Handoff

- production baseline: 2026-03-26
- canonical root: `$HOME/Projects/YJTEXLAB/yjtexlab.com` (independent GitHub clone, not a synced archive)
- homepage media-art owner: `src/components/home/FabricMotionLab.tsx`
- homepage categories freeze: `src/components/home/Categories.tsx` and `src/components/home/FabricMotionLab.tsx` must not change unless the user explicitly requests a Categories change
- route authority: `src/lib/route-matrix.ts`
- seo authority: `src/lib/seo.ts`
- route preload assets authority: `src/lib/preload-assets.ts`
- shared preload gate: `src/components/site/PagePreloadGate.tsx`
- new-thread startup guide: `docs/THREAD_START.md`
- parallel workflow guide: `docs/PARALLEL_WORKFLOW.md`
- parallel workstream registry: `.omx/workstreams/active.json`
- preferred feature start helper: `./scripts/start-workstream.sh`
- preferred handoff helper: `./scripts/handoff-workstream.sh`
- preferred cleanup/audit helper: `npm run workstream:audit`
- visible home shell: `/products`, `/about`, `/contact`, `/milestones`, `/privacy`, `/terms`
- parallel verify command: `npm run verify:parallel`
- required verify commands: `npm run verify`, `npm run verify:corridor`, `npm run verify:seo`, `npm run verify:deploy`
- deployment target: Vercel only
- production deploy authority: integration thread prepares the candidate, then `main` is pushed for the final Vercel production deployment
- restored production deployment reference: `dpl_HM33mRdpChYmjXejeVtfvxkVDqMS`
- default operator model: canonical integration/deploy root plus one feature worktree per mutating thread

## Operator Notes

- Do not reintroduce flat homepage components under `src/components`.
- Do not import from `src/components/products/**` anywhere in the homepage graph.
- Do not touch `Categories.tsx` or `FabricMotionLab.tsx` unless the user explicitly asks for a Categories change.
- Do not let multiple Codex threads share the same physical working tree.
- When parallel work is active, feature threads must stay inside their declared owned paths and must not edit guarded shared files by default.
- Guarded shared files are `src/app/layout.tsx`, `src/app/globals.css`, `src/components/site/**`, `src/lib/route-matrix.ts`, `src/lib/seo.ts`, `package.json`, `vercel.json`, `README.md`, `AGENTS.md`, and `docs/**`.
- If a new thread starts in this repo, it should read `docs/THREAD_START.md` first, then `docs/PARALLEL_WORKFLOW.md`.
- Keep `data-home-media-art="fabric-motion-lab"` and the FabricMotionLab debug signature stable unless the baseline is intentionally changed.
- If shell links change, update `route-matrix.ts`, regenerate `docs/baselines/home/20260326/route-matrix.json`, and update the baseline docs together.
- If metadata or canonical URLs change, update `src/lib/seo.ts`, `public/robots.txt`, `public/sitemap.xml`, and `public/site.webmanifest` together.
- If you touch the homepage structure, create a new `.omx/context/*.md` snapshot first.

## CRM 인계 우선순위

[CRM_BACKEND.md](CRM_BACKEND.md)와 영업봇 저장소 `handoff/START_HERE.md`, `handoff/CRM_CUTOVER.md`를 먼저 확인하세요. 코드 발급=접속 가능이며 발송 허가·가격 공개를 뜻하지 않습니다. 실데이터 원본은 완료 증거가 있는 cutover 기록을 기준으로 판단하고, 코드 구현만으로 Supabase 운영 전환이 끝났다고 해석하지 마세요. 기존 시트 쓰기와 DB 쓰기를 동시에 운영하지 않습니다.
