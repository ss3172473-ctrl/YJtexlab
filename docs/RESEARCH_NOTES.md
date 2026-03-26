# Research Notes

This structure was chosen after cross-validating the production baseline and official platform guidance.

## Cross-validated Principles

- The production baseline from 2026-03-26 is the authority for homepage shell visibility and section order.
- Next.js App Router supports grouping non-route code outside `app` and does not require route groups for a clean feature split.
- W3C landmark guidance supports one top-level `main`, top-level footer/contentinfo, and intentionally labeled navigation regions.
- Vercel recommends a single intended project root so builds and deploys resolve the correct app.
- Next.js metadata routes support `robots.txt`, `sitemap.xml`, and social preview images from the App Router, but this repo currently serves those SEO assets from `public/` because that path proved more stable with the default `.next` production build plus repo cleanup gates.
- `route-matrix.ts` must be the single route contract for shell visibility, smoke routes, and verification.

## Why This Repo Was Reorganized

- The earlier clean branch drifted away from the live production homepage shell.
- Homepage and product logic had multiple competing owners, which made agent handoff and review unreliable.
- Re-centering the repo on the production baseline reduces future ambiguity and keeps the next AI agent on one clear contract.

## Source URLs

- https://nextjs.org/docs/app/getting-started/project-structure
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
- https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/
- https://vercel.com/docs/monorepos
