task statement
- Assess whether sticker residue/marks can be removed naturally from all photos in the local fabric photo set before attempting any batch edit.

desired outcome
- A grounded feasibility judgment with recommended approach, risks, and go/no-go criteria for bulk cleanup.

known facts/evidence
- Workspace contains a fabric photo directory at `./원단`.
- Current inventory shows 154 image files total.
- Breakdown so far: 44-inch set has 76 HEIC files; 58-inch set has 78 HEIC files.
- User states all photos are fabric photos and the visible problem is sticker marks left after moving/removing number labels before shooting.

constraints
- Start with feasibility only; do not begin destructive or bulk editing yet.
- Need judgment grounded in actual local samples, not only generic assumptions.
- Original images are HEIC and should remain untouched during evaluation.

unknowns/open questions
- How large and visually complex the sticker marks are across different fabrics.
- Whether marks sit on plain weave areas or on dense patterns/stripes/checks where inpainting will be harder.
- Whether lighting, folds, or texture distortion make batch cleanup unreliable.

likely codebase touchpoints
- `./원단/44인치`
- `./원단/58인치`
- Temporary preview outputs in `/tmp` for visual inspection only
