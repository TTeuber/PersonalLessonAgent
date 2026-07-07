# Portfolio Polish — Remaining Items

Things that still need a human (or a decision) before this repo is fully portfolio-ready.
Everything else from the July 2026 portfolio review has been fixed — see the git history.

## High impact

### 1. Add screenshots and a demo GIF to the README
This is the single most valuable remaining item. Nobody evaluating a portfolio will
install an Electron app and supply an OpenRouter key — the README is the demo.

- Record a short GIF (15–30s) of the core flow: interview → generated course → module
  browser with the AI tutor. macOS screen recording + [gifski](https://gif.ski) or
  Kap work well.
- Take 2–3 stills: the dashboard, the course creation interview, and the 3-panel
  module browser (dark mode shows best).
- Put them in `Docs/screenshots/` and uncomment the prepared `## Demo` block near the
  top of `README.md` (it has placeholder paths ready).

### 2. Set the GitHub repo homepage URL
Point it at your portfolio site once it has a page for this project:
`gh repo edit TTeuber/PersonalLessonAgent --homepage <url>`
(Topics were already added during the review.)

### 3. Push and confirm CI is green
A CI workflow now lives at `.github/workflows/ci.yml` (lint → test → build) and the
README badge references it. After pushing, check the Actions tab once — the badge
shows "failing" red on the README if anything breaks, which is worse than no badge.

## Nice to have

### 4. Tighten the `any` types (31 eslint warnings)
`@typescript-eslint/no-explicit-any` was downgraded to a warning in `eslint.config.mjs`
because the hierarchical context types intentionally use `[key: string]: any` for
AI-generated fields. Changing those index signatures to `unknown` (and fixing the
fallout at usage sites) would let the rule go back to `error`. Mostly in
`src/types/context.ts`, `SubjectView.tsx`, `ContentTools.ts`, and the electron mocks.

### 5. Fix the react-hooks/exhaustive-deps warnings (~12)
Each view component calls its `load*` function from a `useEffect` with an incomplete
dependency array. Wrapping the loaders in `useCallback` (or moving them inside the
effect) resolves these cleanly.

### 6. Broaden test coverage
Only Dashboard, ContextManager, and the OpenRouter client are tested (51 tests).
The agents (`InterviewAgent`, `CourseDesignerAgent`, `ContentGeneratorAgent`) are the
most interesting code in the repo and the best thing to show tested — the MSW
infrastructure for mocking OpenRouter is already in place.

### 7. Consider a packaged release
`npm run electron:build` produces installers in `release/`. Attaching a macOS build to
a GitHub Release makes the project feel shippable, even if nobody downloads it.

### 8. Pin or feature the repo
Add it to your GitHub profile's pinned repos and your portfolio site's project list
once the screenshots are in.
