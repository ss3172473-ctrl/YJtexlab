# Fabric Sticker Pilot Review

## Scope
- Pilot size: 12 images
- Defect cases: 10
- Controls: 2 (`IMG_7951`, `IMG_8033`)
- Processing basis: 3024x4032 PNG previews exported from the original HEIC files via Quick Look
- Workflow: small local defects used feathered patch clone; broad bands used tone-matching experiments

## Pilot Set
- Easy: `IMG_7980`, `IMG_7981`, `IMG_7982`
- Medium: `IMG_7997`, `IMG_7999`, `IMG_8021`, `IMG_8034`
- Hard: `IMG_7978`, `IMG_7998`, `IMG_8018`
- Controls: `IMG_7951`, `IMG_8033`

## Result Summary
- Pass:
  - `IMG_7982`: small localized red sticker mark was removed cleanly enough for preview-level review.
  - `IMG_8034`: bright local residue spot on oxford weave was removed cleanly enough for preview-level review.
- Partial:
  - `IMG_7980`: low-complexity subtle discoloration is likely workable, but the gain from the current patch is modest.
  - `IMG_7981`: faint haze-type variation is a candidate for manual tonal cleanup, but this run is not strong enough to call a clean pass.
- Fail:
  - `IMG_7978`: broad stripe-band artifact remained visible or introduced seam risk.
  - `IMG_7997`: broad light band on structured check created obvious rectangular artifact under semi-automated correction.
  - `IMG_7998`: wide washed region on check created blocky tonal replacement and failed naturalness.
  - `IMG_7999`: edge-to-edge tonal mismatch on check is not safe for semi-automatic cleanup with this approach.
  - `IMG_8021`: stripe band and local blemish combination caused visible seam artifacts.
  - `IMG_8018`: broad lightened band on check remains a hard manual-retouch case.
- Controls:
  - `IMG_7951`, `IMG_8033` remained untouched and serve as baseline references.

## Interpretation
- Safe-to-scale candidate class:
  - small, isolated sticker spots on relatively uniform weave or low-complexity pattern
- Unsafe-to-scale class:
  - broad brightness bands
  - pressure/adhesive distortion spanning multiple repeats
  - stripe/check fabrics where alignment errors become visible immediately

## Decision
- `CONDITIONAL GO` remains correct.
- Recommended next step:
  - batch only the small isolated spot cases after tighter per-file masking
  - keep broad stripe/check band cases manual-only
- Not recommended:
  - one-pass automation across the whole `원단` folder

## Output Paths
- Manifest: `.omx/fabric_pilot/manifest.json`
- Runner: `scripts/fabric_pilot_retouch.py`
- Per-image outputs: `.omx/fabric_pilot/outputs/`
- Per-image comparisons: `.omx/fabric_pilot/comparisons/`
