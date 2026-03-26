# Deployment Checklist

## Required Path

Deploy from `/Users/leesungjun/Desktop/yjtexlab.com` with Vercel.

## Before Deploy

1. `npm run clean:artifacts`
2. `npm run verify`
3. `npm run build`
4. Confirm `/product` still redirects to `/products`
5. Confirm homepage does not contain forbidden product-only copy or archive-driven fabric lists

## Deploy

```bash
vercel deploy --prod
```

## After Deploy

- Check `yjtexlab.com`
- Check `yjtexlab.vercel.app`
- Smoke test `/`, `/about`, `/product`, `/products`, `/contact`
- If deploy input verification fails, do not deploy until the forbidden root artifacts are removed
