# Autopilot Spec

## Goal
- Remove confirmed deployment blockers and obvious runtime asset failures for the current Next.js homepage.

## Confirmed Issues
- Lint command is interactive/failing because no ESLint config exists.
- Two category images return 404 from the configured remote asset host.
- Favicon is missing.
- Local ignore rules were removed, increasing the chance of polluted deployment inputs.

## Acceptance Criteria
- `npm run lint` completes successfully without prompts.
- `npm run build` completes successfully.
- Home page loads locally with no broken category images and no favicon 404.
- Changes stay scoped to deployment reliability and visible asset correctness.

## Non-Goals
- Full content redesign.
- Replacing all remote imagery on the site.
- Changing unrelated user-authored content.
