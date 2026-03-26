# YJ TexLab Website

YJ TexLab marketing site and product archive built with Next.js and deployed through Vercel.

## Project Purpose

- Preserve the production homepage baseline from March 26, 2026 while keeping the repo safe for future work.
- Keep the homepage focused on brand, export capability, and contact flow.
- Keep product-specific motion isolated from the homepage except for the single allowed preview seam.
- Preserve one deployable root so Vercel always builds the intended project.

## Folder Map

- `src/app`: App Router routes.
- `src/components/site`: shared site shell like header and footer.
- `src/components/home`: homepage-only sections and the single `Categories` seam.
- `src/components/products`: product archive UI and product-owned motion treatments used only on `/products` or the approved homepage preview seam.
- `src/components/about`, `contact`, `milestones`, `stories`: page-specific UI.
- `src/lib`: shared logic, preload utilities, and hero media constants.
- `public`: fonts, hero assets, homepage preview assets, product imagery, and deploy-safe SEO assets like `robots.txt`, `sitemap.xml`, and `site.webmanifest`.
- `docs`: repo rules, design intent, deployment and research notes.
- `docs/baselines/home/20260326`: production baseline screenshots and route snapshot.
- `docs/AI_HANDOFF.md`: next-agent operator and verification handoff.
- `.omx/context`: task snapshots for higher-risk changes.
- `src/lib/seo.ts`: shared SEO contract for metadata, canonical URLs, JSON-LD, and site identity.

## Core Rules

- Deploy only from this root with Vercel.
- Do not put product-only copy, archive manifests, or experimental motion systems directly on `/`.
- Keep the live shell links on `/` aligned with production: `/products`, `/about`, `/contact`, `/milestones`, `/privacy`, `/terms`.
- Keep `/product` redirecting to `/products`.
- Run `npm run clean:artifacts`, `npm run build`, `npm run verify`, `npm run verify:seo`, and `npm run verify:deploy` before production deploys.

## Commands

```bash
npm run dev
npm run clean:artifacts
npm run verify
npm run verify:corridor
npm run verify:seo
npm run verify:deploy
npm run build
vercel deploy --prod
```

## Documentation

- [`AGENTS.md`](./AGENTS.md)
- [`DESIGN.md`](./DESIGN.md)
- [`docs/PROJECT_STRUCTURE.md`](./docs/PROJECT_STRUCTURE.md)
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
- [`docs/RESEARCH_NOTES.md`](./docs/RESEARCH_NOTES.md)
- [`docs/AI_HANDOFF.md`](./docs/AI_HANDOFF.md)
