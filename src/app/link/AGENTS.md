# /link Route Instructions

This AGENTS.md applies to `src/app/link` and all child files under this folder.

## Purpose
- `https://yjtexlab.com/link` is a standalone route for the Youngjin Fabric link landing page.
- The main homepage at `https://yjtexlab.com/` must remain independent.
- Do not add homepage navigation to `/link` unless explicitly requested.

## Ownership
- Keep `/link` self-contained inside the `yjtexlab.com` project.
- Do not reintroduce proxy fetching from another Vercel project unless explicitly requested.
- Route assets must live in `public/link/`.
- Route code and handoff docs must live in `src/app/link/`.

## Promo Rules
- Keep promo entries in code as reusable templates, even after they expire.
- To open a new drop, update the title, href, and `expiresAt` values in `page.tsx`.
- Expired promo entries may remain in code and be hidden by date logic.

## Docs Discipline
- If file structure, deploy steps, or route behavior changes, update `_handoff/HANDOFF.md`.
- If editing rules change, update this file too.

## Deploy
- Deploy from `/Users/leesungjun/Desktop/yjtexlab.com`.
- `/link` is a hidden standalone route, but production deploy authority still belongs to the canonical-root integration thread only.
- Before production deploys that affect `/link`, run `npm run build`, `npm run verify`, `npm run verify:parallel`, and `npm run verify:deploy`.
