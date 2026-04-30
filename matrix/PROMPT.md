# Matrix Coverage Agent Prompt

Use this prompt for one agent working on one assigned matrix coverage section.

## Prompt

Continue working on the `<SECTION>` section in `matrix/TEST_COVERAGE.md`.

Your assigned matrix package is `matrix/<PACKAGE>`.

Scope and ownership:

- Do not mutate things outside your designated matrix test environment.
- Assume your writable scope is the assigned `matrix/<PACKAGE>` package plus the relevant section in `matrix/TEST_COVERAGE.md`.
- Do not edit other matrix packages, repo-wide pipeline code, shared fixtures, or unrelated docs just because they are nearby.
- If a tiny supporting change outside `matrix/<PACKAGE>` is truly required to land or validate the test, keep it minimal and directly justified by the assigned coverage slice.
- Stay inside this assigned section and package unless a small nearby change is required to complete the coverage slice.
- Other agents will be working on other matrix packages and sections in parallel, so do not widen into unrelated modules.
- Treat `matrix/TEST_COVERAGE.md` as the source of truth for what is already done, what still needs coverage, and what gaps are already known.

Coverage goal:

- Push this section toward good-as or better coverage than the relevant old suites in `packages/reference-unit` and `packages/reference-e2e`.
- Use the old suites as historical input, not as a reason to preserve overly broad or fragile test shapes.
- You may add additional coverage beyond the listed bullets if you find an obvious contract gap while working in this section.

Execution rules:

- Do not run `pnpm pipeline test`.
- Do not run repo-root `pnpm test` or any other standard test entrypoint that fans back into the pipeline runner.
- Do not run `pnpm test` inside a matrix package, because that package script routes through the pipeline-managed test command.
- Work locally inside `matrix/<PACKAGE>` and invoke the underlying test runners directly from there.
- Use the package's actual runner surface:
	- `pnpm exec vitest run` for unit, filesystem, lifecycle, transform, or public API coverage under `tests/unit`
	- `pnpm exec playwright test` for browser, CSS, layout, cascade, or runtime behaviour under `tests/e2e`
- Preferred local command patterns:
	- `cd matrix/<PACKAGE> && pnpm exec vitest run`
	- `cd matrix/<PACKAGE> && pnpm exec vitest run tests/unit/<file>.test.ts`
	- `cd matrix/<PACKAGE> && pnpm exec vitest run -t "<test name>"`
	- `cd matrix/<PACKAGE> && pnpm exec playwright test`
	- `cd matrix/<PACKAGE> && pnpm exec playwright test tests/e2e/<file>.spec.ts`
	- `cd matrix/<PACKAGE> && pnpm exec playwright test --project=<project from local playwright.config.ts>`
- Use `--project` only when needed and only for projects declared in that package's `playwright.config.ts`.
- In most matrix packages today, Playwright points at `tests/e2e` and commonly exposes a `vite7` project; some packages may also define other projects.
- Prefer file-level or grep-filtered runs whenever possible so validation stays fast.
- If generated artifacts are stale, refresh only what this package needs before continuing.

Test design rules:

- Keep tests small, narrow, and explicit about the contract they own.
- Name each test so the failure tells us exactly what broke.
- Prefer one contract per test over kitchen-sink scenarios.
- Add brief documentation in the test only when the contract or fixture setup would otherwise be hard to parse.
- Keep the package's existing split intact: Vitest for fast non-browser contracts, Playwright for real browser assertions.

Regression handling:

- If you hit a real regression and cannot fix it cleanly within this slice, you may use `test.skip` or `it.skip` temporarily.
- Only do that after confirming the failure is a genuine product gap rather than a broken test.
- Any skip must be tightly scoped, clearly named, and explained in the test.
- Record the confirmed regression or unsupported behavior back in `matrix/TEST_COVERAGE.md` so the doc stays accurate.

Required workflow:

1. Read the assigned section in `matrix/TEST_COVERAGE.md`.
2. Inspect the assigned matrix package README, current tests, and the relevant old coverage in `packages/reference-unit` and `packages/reference-e2e`.
3. Add the smallest useful missing tests for this section.
4. Run focused local Vitest and/or Playwright commands in `matrix/<PACKAGE>` until the touched coverage is validated.
5. Update `matrix/TEST_COVERAGE.md` before finishing:
	- mark completed bullets as `[DONE]` when you actually landed the coverage
	- add concise notes for confirmed regressions, unsupported behavior, or remaining gaps discovered during the work
6. Return a short summary with:
	- files changed
	- commands run
	- coverage added
	- skips added and why
	- remaining follow-up work for this section only

Quality bar:

- Prefer root-cause coverage over snapshot noise.
- Avoid broad refactors unless they are required to land the test.
- Keep the final diff easy for another agent to understand and continue.

## Example placeholders

- `<SECTION>`: `responsive`
- `<PACKAGE>`: `responsive`

## Example first line

Continue working on the `responsive` section in `matrix/TEST_COVERAGE.md`. Your assigned matrix package is `matrix/responsive`.
