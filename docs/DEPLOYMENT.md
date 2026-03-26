# Deployment Checklist

## Required Path

Deploy from `/Users/leesungjun/Desktop/yjtexlab.com` with Vercel.
If a temporary migration copy exists at `/Users/leesungjun/Desktop/yjtexlab.com-clean-20260326`, cut back to the canonical root before production deploys.

## Before Deploy

1. `npm run clean:artifacts`
2. `npm run verify`
3. `npm run build`
4. `npm run verify:deploy`
5. Confirm `/product` still redirects to `/products`
6. Confirm homepage shell still matches the production baseline contract
7. Confirm `/privacy` and `/terms` resolve with the temporary legal holding pages

## Deploy

```bash
vercel deploy --prod
```

## After Deploy

- Check `yjtexlab.com`
- Check `yjtexlab.vercel.app`
- Smoke test `/`, `/about`, `/contact`, `/milestones`, `/product`, `/products`, `/privacy`, `/terms`
- If deploy input verification fails, do not deploy until the forbidden root artifacts are removed
