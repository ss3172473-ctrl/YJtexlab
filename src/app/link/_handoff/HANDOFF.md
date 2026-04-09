# /link Handoff

## What This Route Is
`/link` is a standalone route inside the `yjtexlab.com` Next.js project that serves the Youngjin Fabric mobile-first link landing page. It exists so the team can use `https://yjtexlab.com/link` without repointing the main apex domain away from the primary YJ TexLab homepage.

## Why It Was Moved Here
Earlier iterations depended on a separate Vercel deployment and proxy behavior. That was fragile for handoff because the page source lived in another project. `/link` is now owned directly by the `yjtexlab.com` project so future maintenance happens in one codebase.

## File Inventory
- `src/app/link/page.tsx`
  Route content, business text, promo scheduling, and link data.
- `src/app/link/page.module.css`
  All route-specific styling. White background, sharp corners, minimal black border system.
- `src/app/link/AGENTS.md`
  Rules future agents should follow when editing `/link`.
- `src/app/link/_handoff/README.md`
  Quick orientation file.
- `src/app/link/_handoff/HANDOFF.md`
  This document.
- `src/app/link/_handoff/proxy-route.backup.20260325.ts`
  Backup of the older proxy-based implementation for reference only.
- `public/link/*`
  Local assets used by the route.

## Route Behavior
- `https://yjtexlab.com/` remains the main homepage.
- `https://yjtexlab.com/link` serves the Youngjin Fabric link page.
- Promo cards are defined in code and hidden automatically when `expiresAt` passes.
- Expired entries should stay in code as templates unless explicitly removed.

## Content Update Checklist
When opening a new drop such as 4차 or 5차:
1. Edit `PROMO_ITEMS` in `src/app/link/page.tsx`.
2. Update `title`.
3. Update `href`.
4. Update `expiresAt` using Korea time with offset, for example `2026-04-10T17:00:00+09:00`.
5. If logos or icons change, replace files in `public/link/`.
6. Hand off or deploy through the `yjtexlab.com` integration thread when requested.

## Deploy Steps
From `/Users/leesungjun/Desktop/yjtexlab.com` on the canonical integration branch:
1. `npm run build`
2. `npm run verify`
3. `npm run verify:parallel`
4. `npm run verify:deploy`
5. `vercel deploy --prod`
6. Verify `https://yjtexlab.com/link`
7. Verify `https://yjtexlab.com/` still shows the main homepage

## Domain Notes
- `/link` is implemented as an app route inside the apex project.
- This avoids stealing `yjtexlab.com` away from the main site.
- If a fully separate project is ever desired, use a subdomain such as `link.yjtexlab.com`, not a path-only alias.

## Design Notes
- White-only background
- Sharp rectangular borders
- Minimal editorial hierarchy
- No homepage entry link unless explicitly requested
- Promo modules preserved in code for reuse

## Operational Warning
Do not move `/link` back to an external proxy or separate apex alias unless the owner explicitly asks for that architecture change.
