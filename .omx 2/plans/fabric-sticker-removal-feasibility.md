# Fabric Sticker Removal Feasibility

## Requirements Summary
- Goal: judge whether sticker residue and sticker-mark artifacts can be removed naturally across the full local fabric photo set before any bulk execution.
- Scope: `./원단` contains 154 HEIC photos total.
- Breakdown: 44-inch set 76 photos, 58-inch set 78 photos.
- Evidence basis: local visual sampling from `IMG_7951`, `IMG_7998`, `IMG_7980`, `IMG_8034`, and `IMG_8018`.
- User asked for feasibility first, not implementation.

## RALPLAN-DR Summary

### Principles
1. Preserve fabric pattern continuity over raw throughput.
2. Avoid irreversible bulk edits until a pilot proves realism.
3. Separate easy localized blemishes from texture-distortion cases.
4. Keep originals untouched and judge success visually at 100% zoom.

### Decision Drivers
1. Naturalness risk on repetitive patterns like stripes and checks.
2. Whether the mark is a tiny spot or an area with altered brightness/texture.
3. Cost of manual QA across 154 photos versus expected salvage rate.
4. Required delivery quality: full-resolution review versus downscaled web/catalog use.

### Viable Options
#### Option A: Full-batch automatic cleanup first
- Pros: fastest initial throughput, low operator time.
- Cons: highest risk of fake-looking pattern breaks; weak fit for stripe/check alignment and pressure-band artifacts.

#### Option B: Pilot-first segmented workflow
- Pros: lets us prove quality on representative hard cases before touching the full set; supports different handling for easy vs hard marks.
- Cons: slower upfront; requires manual acceptance review and case triage.

#### Option C: Manual retouch only for all files
- Pros: best quality ceiling on difficult fabrics.
- Cons: too expensive and slow for 154 images unless the hard-case share is very small.

## Recommendation
- Verdict: `CONDITIONAL GO`
- Meaning: it is realistic to improve many photos, but not credible to promise a natural full-batch automatic cleanup for all 154 files without a pilot and category split.
- Current no-go boundary: do not commit to one-pass bulk automation for the entire folder.

## Why This Verdict
- `IMG_8034` shows a bright residue spot on diagonal weave, which is still feasible but requires texture-aware repair.
- `IMG_8018` shows a broader lightened band plus a brighter point, which indicates some marks may have changed local texture or reflectance, not just color.
- `IMG_7951` and `IMG_7998` are structured stripe/check fabrics where cloning or inpainting errors will be visible if alignment drifts even slightly.
- `IMG_7980` suggests some low-complexity cases exist and are more likely to survive semi-automated cleanup.

## Task Flow
1. Build a pilot set of 12 images:
   Acceptance criteria: includes at least 3 easy, 5 medium, and 4 hard cases across dotted, stripe, oxford, and check fabrics.
2. Rate each pilot image into `spot`, `small patch`, or `band/texture distortion`:
   Acceptance criteria: every pilot image has one class and a proposed handling path.
3. Test a semi-automated removal workflow on the pilot only:
   Acceptance criteria: each result keeps weave/pattern continuity at 100% zoom with no obvious repeated clone seams.
4. Measure pass rate before scaling:
   Acceptance criteria: proceed only if at least 10 of 12 pilot images pass visual review, at least 3 of 4 hard cases pass, and average touch-up time stays at or under 6 minutes per image.
5. Decide execution scope:
   Acceptance criteria: either `expand to batchable subsets` or `keep difficult subsets manual-only`, with each source folder labeled accordingly.

## Risks And Mitigations
- Risk: stripe/check misalignment looks synthetic.
  Mitigation: keep these as hard-case pilot samples and require per-image approval before batching.
- Risk: residue changed brightness/texture over an area, not just a point.
  Mitigation: classify band-distortion cases separately and exclude them from blind automation.
- Risk: QA load erases automation savings.
  Mitigation: gate scale-up on measured pilot pass rate and average touch-up time.

## Verification Steps
1. Review pilot before/after pairs at full resolution.
2. Review the same pilot at intended delivery size if these images are for web/catalog use, and record whether artifacts disappear only after downscaling.
3. Check at least one stripe, one check, one oxford, and one low-complexity fabric.
4. Reject any workflow that introduces repeated texture stamps, broken lines, or obvious blur halos.
5. Require at least two human review passes on the four hard samples before expanding beyond the pilot.
6. Only expand if the pilot demonstrates natural results on both easy and hard representatives and meets the numeric pass thresholds above.

## ADR
- Decision: do not approve full-folder automatic cleanup yet; approve a pilot-first segmented feasibility run.
- Drivers: pattern continuity risk, texture-distortion severity, QA cost across 154 images.
- Alternatives considered:
  - Full-batch automatic cleanup.
  - Pilot-first segmented workflow.
  - Manual retouch for all files.
- Why chosen: it is the only option that balances realism, throughput, and risk containment with the evidence seen in local samples.
- Consequences:
  - Some subset will likely be batchable.
  - Hard stripe/check and band-distortion images may still require manual work.
  - A pilot is mandatory before promising folder-wide cleanup quality.
- Follow-ups:
  - Select 12 representative images.
  - Define pass/fail review criteria.
  - Estimate how many images fall into manual-only territory after the pilot.

## Changelog
- Initial consensus draft created from local folder inventory and sampled fabric images.
- Tightened pilot gates with numeric thresholds so the decision is executable and critic-ready.
