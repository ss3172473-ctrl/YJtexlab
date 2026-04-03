# Deployment Checklist

## Required Path

Deploy from `/Users/leesungjun/Desktop/yjtexlab.com` with Vercel.
If a temporary migration copy exists at `/Users/leesungjun/Desktop/yjtexlab.com-clean-20260326`, cut back to the canonical root before production deploys.

## Before Deploy

1. `npm run clean:artifacts`
2. `npm run verify`
3. `npm run verify:parallel`
4. `npm run build`
5. `npm run verify:seo`
6. `npm run verify:deploy`
7. Confirm the approved deploy candidate has been promoted from the integration thread onto `main`
8. Confirm the current worktree is the canonical root on a clean `main` branch, not a feature-thread worktree
9. Confirm `/product` still redirects to `/products`
10. Confirm homepage shell still matches the production baseline contract
11. Confirm `/privacy` and `/terms` resolve with the temporary legal holding pages
12. Confirm `robots.txt`, `sitemap.xml`, canonical tags, and JSON-LD respond correctly
13. If parallel workstreams are active, confirm `.omx/workstreams/active.json` matches the current active threads

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
