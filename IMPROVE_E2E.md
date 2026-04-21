# Improve E2E Reliability

## Why This Exists

The current end-to-end matrix is good at catching real regressions, but a few tests are still vulnerable to timing gaps between:

1. `ref sync` finishing its filesystem work
2. the dev server serving the new generated outputs
3. the browser applying the rebuilt CSS

When that gap opens, the page can be fully mounted and visible while computed styles are still at browser defaults.

That produces failures that look severe:

- text falls back to `rgb(0, 0, 0)`
- backgrounds fall back to `rgba(0, 0, 0, 0)`
- token-driven styles appear to have failed completely

The odd part is that these failures do not behave like stable product regressions. They show up intermittently, and the shape of the failure is consistent with "DOM ready, styles not ready yet" rather than with incorrect token generation.

## Progress So Far

One minimal hardening pass has already landed.

The most timing-sensitive style assertions now poll computed styles instead of reading them immediately after a visibility check:

- token style assertions in the core e2e suite
- extend-library style assertions that were seeing default browser colors on flake

That is intentionally a small step, not the full solution.

It reduces false negatives in the most obviously affected tests, but it does not yet provide a shared browser-side style readiness contract for the whole suite.

The larger recommendation in this document still stands:

- add a dedicated style sentinel
- add a shared helper for waiting on browser-visible generated styles
- make watch-test cleanup wait for restored styles, not just ref-sync readiness

## The Working Hypothesis

The most plausible problem is that some tests are using the wrong readiness signal.

Today, several flows effectively treat one of these as "good enough":

- the page is visible
- `.reference-ui/session.json` says `buildState: "ready"`

Those checks are necessary, but they are not sufficient for style-sensitive assertions.

They prove that sync completed and the component tree mounted. They do not prove that:

- the rebuilt `@reference-ui/react/styles.css` has been picked up by the dev server
- the browser has reloaded the stylesheet or applied the new classes and variables
- a watch-test cleanup has fully restored the sandbox before the next test starts reading styles

## Evidence Behind The Hypothesis

### 1. The failure values are browser defaults

The failing token assertions are seeing:

- `rgb(0, 0, 0)` for color
- `rgba(0, 0, 0, 0)` for background

That is exactly what we would expect if the element exists but generated styling has not landed yet.

### 2. The affected tests are style-sensitive, not mount-sensitive

The failures we saw are in areas like:

- token resolution
- `css()` output
- fixture-owned token styling from an extended library

Those paths all depend on generated CSS being present and applied.

### 3. The app shell imports the generated stylesheet, but the tests mostly wait for visibility

The environment entry imports:

```ts
import '@reference-ui/react/styles.css'
```

That is correct, but several assertions still do this pattern:

1. `page.goto(...)`
2. `expect(element).toBeVisible()`
3. immediately read `getComputedStyle(...)`

That is a mount check, not a style readiness check.

### 4. Watch tests mutate styling mid-suite and only wait for sync readiness

The watch-oriented tests intentionally change token fragments and CSS-producing sources, then restore them in cleanup.

Their cleanup currently waits for the ref-sync ready marker. That reduces the race window, but it still does not guarantee that the browser has consumed and applied the restored styles before the next test begins.

### 5. The React 18 Vite failures look isolated and intermittent

That pattern fits a timing issue better than a deterministic packaging or token-generation bug.

If token generation were wrong at the source, we would expect a more repeatable failure shape across projects.

## What This Probably Is Not

This does not currently look like a primary `reference-icons` regression.

That packaging work has its own consumer-path follow-up, but the CI failures discussed here are about missing applied styles in the browser, not icon import resolution.

It also does not look like the older styletrace warning is the direct cause.

The styletrace warning is real and worth fixing, but it is a different class of issue: degraded analysis of generated files, not "the page mounted with default browser styles instead of generated styles".

## The Core Improvement

We should stop using mount readiness as a proxy for style readiness in style-sensitive tests.

The better contract is:

1. wait for the page to mount
2. wait for a known style sentinel to resolve to the expected computed styles
3. only then read the actual target assertion

## Recommended Changes

### 1. Add a shared browser-side style readiness helper

Recommended first step.

Add a small helper for Playwright tests that waits until a known tokenized element resolves to expected computed styles.

The helper should probably:

- accept a `Page`
- locate a dedicated sentinel element
- poll `getComputedStyle(...)`
- return only after the expected values are present

This gives the suite a real signal that generated CSS has reached the browser.

### 2. Add a dedicated style sentinel to the test environment

The cleanest way to do this is to add a single hidden or unobtrusive element in the shared test app with stable token-based styles, for example:

- token color
- token background
- maybe one spacing or radius token if useful

Then every style-sensitive test can wait on that sentinel instead of inventing its own timing logic.

Benefits:

- one readiness mechanism for the whole suite
- easier debugging when styles are missing
- fewer ad hoc waits scattered across tests

### 3. Harden watch-test cleanup so it waits for restored styles to be applied

This is likely the most important follow-up after the helper exists.

Today the watch tests restore files and wait for ref-sync readiness. That is not enough if the browser is still one beat behind.

Instead, cleanup should wait until:

1. the sandbox is back to a ready ref-sync state
2. the browser-visible style sentinel reflects the restored baseline styles again

That reduces the chance that a later test starts against a half-restored styling state.

### 4. Use style readiness checks in token-sensitive tests

The immediate candidates are the tests that assert on tokens and extended-library styling.

Those tests should not rely on visibility alone before reading computed styles.

### 5. Consider isolating watch tests from the rest of the matrix

This is a structural improvement, not necessarily the first fix.

Because the watch tests intentionally mutate generated styling inputs, they are stateful by design. Running them in a separate phase or separate project would reduce cross-test contamination.

This may not be necessary if style-readiness checks are added in the right places, but it is still a sound direction if flake remains.

## Practical Implementation Shape

### A. Add a sentinel element in the shared test app

Example idea:

- `data-testid="style-ready-sentinel"`
- `color="test.primary"`
- `bg="test.muted"`

The sentinel can be visually hidden in a stable way without removing it from layout and style calculation.

### B. Add a helper such as `waitForReferenceStyles(page)`

That helper should:

1. wait for the sentinel to exist
2. poll computed style values
3. return only when the expected token values are present

### C. Call it in the right places

Use it:

- before token/style assertions
- after watch-test cleanup restores source files
- anywhere a test depends on freshly generated CSS rather than simple DOM presence

## Suggested Rollout Order

### Phase 1

Add the sentinel and helper.

### Phase 2

Adopt the helper in:

- token tests
- extend-library style tests
- any other test that directly reads computed token-derived styles

### Phase 3

Update watch-test cleanup so it waits for restored browser-visible baseline styles.

### Phase 4

If flake still remains, split watch tests into an isolated phase in CI.

## Why This Is Worth Doing

This is not just about making CI quieter.

The current failure mode is expensive because it looks like a deep styling regression:

- tokens appear broken
- extended styles appear missing
- the browser shows raw defaults

That pulls attention toward the wrong layers unless the race is already in your head.

Better readiness checks would make the suite more honest:

- real style regressions would still fail
- timing gaps between sync completion and browser style application would stop masquerading as product bugs

## Bottom Line

The current e2e flake most likely comes from a mismatch between filesystem readiness and browser style readiness.

The best next step is not to add arbitrary delays.

The best next step is to introduce a shared style-readiness contract for the browser, use it in style-sensitive assertions, and make watch-test cleanup wait for restored styles to be visible before the suite moves on.