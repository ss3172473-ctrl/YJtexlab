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

## CRM 결정 · 2026-11-26

사용자 승인: GitHub 기존 계정 유지, Supabase 회사 계정 사용, 발급 즉시 사용 가능한 입장 코드, 관리자 화면, Dots 인계. 시트의 별도 활성 칸 때문에 발급된 코드가 접속 불가한 상태를 제거합니다. 서버에서 업체 ID와 가격 권한을 확인하며 상품·재고 원본 이전은 이번 범위에 포함하지 않습니다.
