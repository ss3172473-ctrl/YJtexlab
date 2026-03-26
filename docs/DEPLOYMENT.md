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
7. Confirm the current worktree is the integration worktree, not a feature-thread worktree
8. Confirm `/product` still redirects to `/products`
9. Confirm homepage shell still matches the production baseline contract
10. Confirm `/privacy` and `/terms` resolve with the temporary legal holding pages
11. Confirm `robots.txt`, `sitemap.xml`, canonical tags, and JSON-LD respond correctly
12. If parallel workstreams are active, confirm `.omx/workstreams/active.json` matches the current integration thread

## Deploy

```bash
vercel deploy --prod
```

`vercel.json` must keep `"framework": "nextjs"` so production deploys do not fall back to the generic `Other` preset.
Feature threads must not run production deploys directly. Production deploy authority belongs to the integration thread only.

## After Deploy

- Check `yjtexlab.com`
- Check `yjtexlab.vercel.app`
- Smoke test `/`, `/about`, `/contact`, `/milestones`, `/product`, `/products`, `/privacy`, `/terms`
- If deploy input verification fails, do not deploy until the forbidden root artifacts are removed
