# Deployment Checklist

## Required Path

Use the independent clone at `$HOME/Projects/YJTEXLAB/yjtexlab.com` with origin `ss3172473-ctrl/YJtexlab`. The link subdomain has a separate repository. Do not deploy from a synced archive, temporary clone, or feature worktree.

Run `bash scripts/deploy-production.sh --check-only` to check the physical root, clean main branch, fetch and push destinations, and any local Vercel project link without pushing.

The full local check uses the installed `ego-browser` CLI against a loopback-only production build. Both the desktop and mobile screenshots must pass; no Google Chrome profile is opened.

## Before Deploy

1. `npm run clean:artifacts`
2. `npm run verify`
3. `npm run verify:parallel`
4. `npm run build`
5. `npm run verify:seo`
6. `npm run verify:deploy`
7. Confirm the approved deploy candidate has been promoted from the integration thread onto `main`
8. Confirm the current worktree is the canonical root on a clean `main` branch, not a feature-thread worktree
9. If the canonical root was recently dirty, run `npm run workstream:audit` and confirm only approved changes remain
10. Confirm `/product` still redirects to `/products`
11. Confirm homepage shell still matches the production baseline contract
12. Confirm `/privacy` and `/terms` resolve with the temporary legal holding pages
13. Confirm `robots.txt`, `sitemap.xml`, canonical tags, and JSON-LD respond correctly
14. If parallel workstreams are active, confirm `.omx/workstreams/active.json` matches the current active threads

## Deploy

```bash
npm run deploy:production
```

`vercel.json` must keep `"framework": "nextjs"` so production deploys do not fall back to the generic `Other` preset.
Feature threads must not run production deploys directly. The integration thread prepares the candidate, then `main` is pushed to GitHub to let Vercel create the production deployment from the tracked branch.

## After Deploy

- Check `yjtexlab.com`
- Check `yjtexlab.vercel.app`
- Smoke test `/`, `/about`, `/contact`, `/milestones`, `/product`, `/products`, `/privacy`, `/terms`
- If deploy input verification fails, do not deploy until the forbidden root artifacts are removed

## CRM 단계적 전환

CRM 코드 배포와 실제 데이터 원본 전환은 분리합니다. `CRM_BACKEND=supabase`는 회사 계정 확인, 백업·이관, 실접속·가격·폐기 검증이 모두 끝난 뒤 설정합니다. 변수 미설정 상태는 기존 Sheets 경로를 유지하며 Supabase 선택 이후 장애 시 Sheets로 자동 fallback하지 않습니다. 상세: [CRM_BACKEND.md](CRM_BACKEND.md).
