# Autopilot Implementation Plan

1. Add a root ESLint configuration compatible with the current Next.js and TypeScript setup.
2. Replace the two broken category image URLs with local assets so the home page no longer renders 404s there.
3. Add a project favicon and wire it through metadata.
4. Restore `.gitignore` with the original entries and ignore `.omx` artifacts created by the workflow.
5. Run QA:
   - `npm run lint`
   - `npm run build`
   - local browser verification for console and network errors
6. If new lint/build issues appear, fix them and rerun QA.
