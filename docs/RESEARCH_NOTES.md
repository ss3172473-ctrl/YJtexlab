# Research Notes

This structure was chosen after cross-checking official guidance from Next.js, Vercel, GitHub, and OpenAI Codex documentation.

## Cross-validated Principles

- Next.js App Router encourages project structure by route family and supports colocation and private folders to keep non-route code organized.
- Vercel recommends keeping one clear project root so builds resolve the intended app instead of an accidental sibling or duplicate folder.
- GitHub treats `README.md` as the main project entrypoint for usage, setup, and contributor context.
- OpenAI Codex documents `AGENTS.md` as the place for repository-specific instructions and local operating rules.

## Why This Repo Was Reorganized

- Homepage, product archive, and page-specific code were previously mixed inside one flat `src/components` layer.
- That made it too easy for product-only copy and experiments to leak into the homepage.
- Grouping by route or domain makes the import boundary visible and easier to review before deployment.

## Source URLs

- https://nextjs.org/docs/app/getting-started/project-structure
- https://vercel.com/docs/monorepos
- https://docs.github.com/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
- https://developers.openai.com/codex/guides/agents-md
