# Matrix Test Coverage

This document is the coverage companion to `TEST_MIGRATION.md`.

Its job is to answer three questions:

1. What coverage already existed in `packages/reference-unit` and `packages/reference-e2e` for the suites that have now been migrated into matrix packages?
2. For each migrated category, what additional coverage should still be added before we call it settled?
3. Looking at `@reference-ui/core` as a whole, do we need additional single-consumer coverage categories beyond the migrated styling/runtime suites?

## Scope

- This document is about **single-consumer** coverage.
- It deliberately **excludes `extends` x `layers` and chained design-system permutations** for now.
- It is concerned with **consumer-facing contracts**: generated outputs, runtime behaviour, CSS application, types, watch/rebuild behaviour, config loading, and public tooling surfaces.
- Some older `reference-unit` files touched `extends` or `layers`; when they do, they are useful as historical input but they do **not** define the scope of this document.

## Coverage bar

To call a category effectively bomb-proof, we usually need coverage for as many of these as the category actually owns:

1. **Generated artifact shape** — files, manifests, emitted CSS, declarations, package entrypoints.
2. **Real runtime behaviour** — browser assertions when CSS, layout, cascade, or paint matters.
3. **Rebuild behaviour** — watch mode, stale output invalidation, config/source edits, cleanup after removals.
4. **Type/public API surface** — consumer TypeScript contracts and exported functions.
5. **Failure behaviour** — invalid config, stale state, interrupted runs, contested sessions, missing artifacts.

## Short answer

Yes, the migrated suites are necessary but not sufficient.

For single-consumer coverage, the migrated runtime/style categories should remain the backbone, but `@reference-ui/core` also needs explicit ownership for:

- `distro`
- `config`
- `bundler plugins`
- `reference`
- `mcp`

Those are real product surfaces, not just implementation details.

## Migrated categories

### watch

**Existing in `reference-unit`**

- `tests/watch/watch.test.ts`
- `tests/watch/session.test.ts`
- `tests/ref-sync.test.ts`

**Existing in `reference-e2e`**

- `src/tests/core/sync-watch.spec.ts`
- `src/tests/core/token-sync-watch.spec.ts`

**Additional coverage still needed**

- Ready should only report after the latest generated runtime artifacts are fresh, not while `react.mjs`, `system.mjs`, CSS, or declarations are stale.
- Multiple source edits in one watch window should coalesce correctly without skipping a rebuild edge.
- Direct `ui.config` edits should still be covered explicitly in watch mode for a single consumer.
- [DONE] `matrix/watch` asserts that token fragment add/update/remove refreshes `panda.config.ts`, not only generated CSS and live browser consumption.
- [DONE] `matrix/watch` edits an imported `ui.config` dependency during `ref sync --watch` and asserts token output refreshes in generated CSS and the running app.
- Interrupted watch/sync recovery and fatal failure cleanup should be locked in, including no orphan process state.

### primitives

**Existing in `reference-unit`**

- `tests/primitives/div.test.tsx`
- `tests/primitives/customProps.test.tsx`
- `tests/primitives/fontComputedStyle.test.tsx`

**Existing in `reference-e2e`**

- `src/tests/core/style-props.spec.ts`
- `src/tests/core/jsx-elements.spec.ts`
- parts of `src/tests/core/core-system.spec.ts`

**Additional coverage still needed**

- [DONE] `matrix/primitives` ports the old happy-dom custom-props coverage into a browser contract, proving `font`, `weight`, `size`, and `r` can coexist on one primitive without losing the responsive branch.
- [DONE] `matrix/primitives` broadens primitive browser and generated-output coverage beyond spacing and design-token colors with inline hex colors, shorthand border parsing, mixed token-plus-inline styling, and layout prop families.
- [DONE] `matrix/primitives` mutates a source-only rebuild marker, reruns `ref sync`, and proves primitive + `css` prop class composition plus computed positioning stay stable after rebuilds while the generated stylesheet stays stable and the mirrored virtual source updates.
- [DONE] `matrix/primitives` keeps JSX element integration focused on one local consumer alias, asserting `ui.config.jsxElements` applies primitive style props in the browser.

### css

**Existing in `reference-unit`**

- container output tests under `tests/system/container*-output.test.ts`
- output/style utility assertions such as `tests/system/size-output.test.ts`
- source-backed CSS fixtures under `src/system/*`

**Existing in `reference-e2e`**

- style-path/runtime coverage folded into `src/tests/core/core-system.spec.ts`

**Additional coverage still needed**

- [DONE] `matrix/css` asserts viewport media-query branches in a real browser by keeping a `css()` probe on its base branch below the viewport threshold and activating it above the breakpoint.
- [DONE] `matrix/css` asserts that `&:hover` pseudo selectors apply in a real browser.
- [DONE] `matrix/css` asserts that nested descendant selectors apply in a real browser.
- [DONE] `matrix/css` parses generated `react/styles.css` with PostCSS so emitted stylesheet syntax has to be valid.
- [DONE] `matrix/css` rejects suspicious placeholder/control fragments and empty standard declarations in generated `react/styles.css`.
- [DONE] Investigated same-element `&[data-component="card"]:hover` and the docs-shaped `&[data-component=card]:hover`; Vitest/PostCSS now confirms the runtime class token is computed but no matching selector branch is emitted into `react/styles.css`, so this remains a `reference-core` / Panda selector-emission gap rather than a Playwright-only issue.
- [DONE] Investigated self attribute selectors like `&[data-state="open"]` on `css()` classes, plus same-element nested `&:hover` under that branch; current emitted CSS did not include those branches, so this remains a `reference-core` / Panda selector-emission gap rather than a supported single-consumer expectation.
- [DONE] Investigated ancestor-attribute + descendant-hover selector composition on one emitted rule; the current selector-key contract does not support text on both sides of `&`, so that specific parent/child composition remains a `reference-core` selector-composition gap rather than a single-consumer matrix expectation.
- [DONE] `matrix/css` mutates a `css()` card declaration, reruns `ref sync`, reloads the app in the browser, and asserts the rebuilt stylesheet keeps one mounted style tag, preserves the layer-order declaration, drops the stale `border-radius: 12px` rule, and mounts the replacement rule exactly once.
- [DONE] `matrix/css` reruns `ref sync` after removing a `css()` hover selector branch from `src/styles.ts`, confirms the stale rule disappears from generated `react/styles.css`, then restores the branch and confirms the selector returns.

### system

**Existing in `reference-unit`**

- `tests/system/globalCss.test.tsx`
- `tests/system/keyframes.test.tsx`
- `tests/system/tokens.test.tsx`
- related font/custom-prop system tests under `tests/system/`

**Existing in `reference-e2e`**

- token-driven and stylesheet/runtime coverage in `src/tests/core/core-system.spec.ts`
- token consumption coverage in `src/tests/core/tokens.spec.ts`

**Additional coverage still needed**

- [DONE] `matrix/system` asserts that `tokens()` applies a custom spacing token to a primitive in a real browser.
- [DONE] `matrix/system` asserts that `tokens()` applies a custom radius token to a primitive in a real browser.
- [DONE] `matrix/system` asserts that a color-mode token from `tokens()` applies the light value by default and the dark value inside a `data-panda-theme="dark"` scope in a real browser.
- [DONE] `matrix/system` asserts that `colorMode="light"` creates an explicit light preview for a `tokens()` color-mode token inside a dark host in a real browser.
- [DONE] `matrix/system` asserts that descendants follow the nearest explicit light scope for a `tokens()` color-mode token inside a dark host in a real browser.
- [DONE] `matrix/system` asserts that `css()` consumes custom token color, background, spacing, and radius families from `tokens()` in a real browser.
- [DONE] `matrix/system` asserts that `css()` respects explicit light previews and nearest light scopes for color-mode token backgrounds while preserving custom spacing and radius token resolution in a real browser.
- [DONE] `matrix/system` asserts that `font()` applies the named family to a primitive in a real browser.
- [DONE] `matrix/system` asserts that `font()` maps the named weight onto a primitive in a real browser.
- [DONE] `matrix/system` asserts that the mounted stylesheet contains the authored `@font-face` rule.
- [DONE] `matrix/system` asserts that the mounted stylesheet contains the CSS contributed by `font()`.
- [DONE] `matrix/system` asserts that `globalCss()`, a recipe class, and primitive utilities compose on the same element with the expected cascade-layer order.
- [DONE] `matrix/system` asserts that `keyframes()` exposes the authored animation name on an actual animated element.
- [DONE] `matrix/system` asserts that the mounted stylesheet contains the authored `@keyframes` name.

### font

**Existing in `reference-unit`**

- `tests/primitives/fontComputedStyle.test.tsx`
- `tests/system/fontProp-output.test.ts`
- `tests/system/fontSystem.test.tsx`
- `tests/types/core-types-smoke.test.ts`

**Existing in `reference-e2e`**

- no dedicated old font-only browser surface; font runtime coverage was folded into broader core-system routes

**Additional coverage still needed**

- [DONE] `matrix/font` mirrors the `reference-lib` multi-font registration shape with local `sans`, `serif`, and `mono` definitions collected through repeated `font()` calls.
- [DONE] `matrix/font` parses generated `react/styles.css` with PostCSS so basic `font()` output has to remain valid CSS.
- [DONE] `matrix/font` asserts generated CSS emits `@font-face` rules, authored font utilities, and advanced font-face fields such as `size-adjust` and `descent-override`.
- [DONE] `matrix/font` covers multi-rule `fontFace: []` registration and asserts one emitted `@font-face` rule exists for each authored source entry.
- [DONE] `matrix/font` asserts generated `@reference-ui/react` font types expose `FontProps`, `FontRegistry`, `FontName`, and `FontWeightName` for the authored registry.
- [DONE] `matrix/font` asserts named font families, font-level CSS contributions, and named or compound weight mappings apply to primitives in a real browser.
- Plain `ref sync` after renaming a local font definition and local consumer usage still leaves the removed font utility selector and old `FontRegistry` entry beside the replacement one; rebuild cleanup remains a confirmed `reference-core` gap.

### recipe

**Existing in `reference-unit`**

- indirect recipe coverage via virtual/system fixtures such as `src/virtual/recipes.tsx`
- no large old dedicated recipe-only unit surface

**Existing in `reference-e2e`**

- mostly indirect coverage via broader core style/runtime routes rather than a dedicated legacy `recipe.spec.ts`

**Additional coverage still needed**

- [DONE] `matrix/recipe` asserts that the default recipe branch applies the default small-size font.
- [DONE] `matrix/recipe` asserts that the `outline` + `pink` compound variant overrides border color as well as background and text.
- [DONE] `matrix/recipe` parses generated `react/styles.css` with PostCSS so emitted stylesheet syntax has to be valid.
- [DONE] `matrix/recipe` rejects suspicious placeholder/control fragments and empty standard declarations in generated `react/styles.css`.
- [DONE] `matrix/recipe` expands the variant matrix beyond the representative cases with a boolean-style `capsule` branch and an `outline` + `pink` + `lg` + `capsule` cross-axis combination in the browser.
- [DONE] `matrix/recipe` broadens compound variant precedence by asserting the `outline` + `pink` compound branch overrides the outline branch font weight, and that the override survives the `lg` + `capsule` cross-axis combination in the browser.
- [DONE] `matrix/recipe` now verifies responsive recipe branches across more than one branch shape by asserting a variant-scoped viewport media-query branch, a base-level container-query branch, and their coexistence on the same recipe class.
- [DONE] `matrix/recipe` asserts class stability across rebuilds by keeping recipe class tokens stable through an unrelated source-only rebuild, then proving only the affected outline font-weight token regenerates after a recipe contract change while compound and responsive recipe classes stay stable.

### spacing

**Existing in `reference-unit`**

- `tests/system/rhythm.test.tsx`
- `tests/system/rhythm-border-radius.test.tsx`
- `tests/system/size.test.tsx`
- transform/output tests such as `tests/system/rhythm-size-transforms.test.ts` and `tests/system/size-output.test.ts`

**Existing in `reference-e2e`**

- mostly indirect coverage through broader style-prop/runtime scenarios rather than a dedicated spacing spec

**Additional coverage still needed**

- [DONE] `matrix/spacing` asserts that explicit `paddingBottom` overrides the shorthand rhythm bottom value in the browser.
- [DONE] `matrix/spacing` asserts that explicit `marginLeft` overrides the shorthand rhythm left value in the browser.
- [DONE] `matrix/spacing` asserts that explicit `width` overrides the width side of `size` while the height side still comes from rhythm.
- [DONE] `matrix/spacing` asserts that explicit `height` overrides the height side of `size` while the width side still comes from rhythm.
- [DONE] `matrix/spacing` asserts the generated styled declaration surface keeps `size` on both the `box` pattern types and the emitted `style-props` utility types.
- [DONE] `matrix/spacing` asserts that `borderRadius="2r"` resolves to the rhythm radius in a real browser.
- [DONE] `matrix/spacing` asserts that literal `borderRadius="12px"` survives the runtime path unchanged in a real browser.
- [DONE] `matrix/spacing` asserts that built-in radii tokens like `borderRadius="lg"` resolve in a real browser.
- [DONE] `matrix/spacing` asserts that physical and logical border-radius pair shorthands apply both addressed corners in the browser.
- Port the remaining rhythm transform edge cases from the old unit suite.
- [DONE] `matrix/spacing` broadens shorthand override coverage with four-value `paddingRight` and `marginTop` precedence cases, while checking the untouched opposite side still keeps the shorthand value.
- Cover rebuild cleanup when `size` is removed, plus any remaining multi-dimension interaction cases beyond the current width/height overrides.
- Decide deliberately whether responsive rhythm values belong here or remain concentrated under `responsive`.

### responsive

**Existing in `reference-unit`**

- `tests/system/containerAnonymous-output.test.ts`
- `tests/system/containerNamed-output.test.ts`
- `tests/system/containerNamedNested-output.test.ts`
- `tests/system/containerNested-output.test.ts`

**Existing in `reference-e2e`**

- `src/tests/core/container-responsive.spec.ts`

**Additional coverage still needed**

- [DONE] `matrix/responsive` asserts that `css()` keeps the base branch below the viewport-width threshold.
- [DONE] `matrix/responsive` asserts that `css()` matches the viewport-width media-query branch above the threshold.
- [DONE] `matrix/responsive` asserts that `recipe()` keeps the base branch below the viewport-height threshold.
- [DONE] `matrix/responsive` asserts that `recipe()` matches the viewport-height media-query branch above the threshold.
- [DONE] `matrix/responsive` asserts that one `css()` class applies container-query and viewport media-query branches together on the same element.
- [DONE] `matrix/responsive` asserts base-to-breakpoint ordering so fallback branches do not accidentally win.
- [DONE] `matrix/responsive` covers responsive behaviour across `css()`, `recipe()`, and primitive `r` props in the same scenario.
- [DONE] `matrix/responsive` asserts emitted `react/styles.css` covers anonymous, named, nested, shared, and mixed responsive rules without malformed `@container true` output.

### color-mode

**Existing in `reference-unit`**

- `tests/color-mode/data-prop.test.tsx`
- related color-mode fixtures and demos used in the old unit package

**Existing in `reference-e2e`**

- `src/tests/core/color-mode.spec.ts`

**Additional coverage still needed**

- [DONE] `matrix/color-mode` asserts that no explicit override resolves light-mode tokens by default.
- [DONE] `matrix/color-mode` asserts that a live root `data-panda-theme` toggle updates descendant token resolution in the browser.
- [DONE] `matrix/color-mode` asserts that a live nested `colorMode` toggle updates the nearest nested scope without changing the light host.
- [DONE] `matrix/color-mode` asserts that multiple live theme islands can update in the same session while each descendant still follows its nearest explicit scope.
- Keep this focused on single-consumer theme scopes, not layered theme composition.

### session

**Existing in `reference-unit`**

- `tests/session/session-manifest.test.ts`

**Existing in `reference-e2e`**

- no large dedicated legacy session e2e surface; most lifecycle overlap lived inside watch/sync tests

**Additional coverage still needed**

- [DONE] `matrix/session` asserts malformed `session.json` recovery before a valid ready manifest appears.
- [DONE] `matrix/session` asserts a late-start ready manifest still triggers a refresh.
- [DONE] `matrix/session` asserts multiple observers receive the same ready transition.
- [DONE] `matrix/session` asserts unsubscribe isolation without muting remaining observers.
- Stale/contested `session.lock` recovery should still be covered at the package level.
- [DONE] `matrix/session` asserts `dispose()` is idempotent and suppresses later ready-manifest refreshes after cleanup.
- Watch-session race edges should stay tightly scoped to a single consumer workspace.

### tokens

**Existing in `reference-unit`**

- `tests/tokens/fragment-sync.test.ts`
- older token-related output tests in `tests/system/`
- type-regression token tests in `tests/types/` are relevant, but fit better under `distro`

**Existing in `reference-e2e`**

- `src/tests/core/tokens.spec.ts`
- `src/tests/core/token-sync-watch.spec.ts`

**Additional coverage still needed**

- [DONE] `matrix/tokens` asserts that clean sync artifacts do not keep stale watch-only token names in `panda.config.ts`.
- [DONE] `matrix/tokens` asserts that clean sync artifacts do not keep stale watch-only CSS variables in generated `styles.css`.
- [DONE] `matrix/tokens` reruns `ref sync` after a temporary token fragment rename/delete and asserts the stale token name and CSS variable disappear from generated artifacts.
- [DONE] `matrix/tokens` reruns `ref sync` after renaming the fixture's source tokens and asserts both generated output and live DOM consumption move to the replacement values without leaving the removed token names behind.
- [DONE] `matrix/watch` covers config-import changes that affect tokens by editing an imported `ui.config` dependency and asserting the token update reaches generated CSS and the running app.
- [DONE] `matrix/distro` keeps generated token types aligned with runtime token output by syncing a temporary token fragment and typechecking a consumer probe against the emitted CSS.

### virtual

**Existing in `reference-unit`**

- `tests/virtual/baseline.test.ts`
- `tests/virtual/mirror.test.ts`
- `tests/virtual/transform.test.ts`

**Existing in `reference-e2e`**

- no large dedicated legacy virtual e2e suite

**Additional coverage still needed**

- Rename/delete/move cleanup should be asserted under repeated sync/watch cycles.
- Transform rewrites should cover more import syntaxes and mixed source forms.
- MDX materialization should keep a few edge fixtures so regressions are obvious.
- Exclusion rules should be rechecked in containerized runs where path behaviour can differ.

## Additional single-consumer categories needed

The migrated suites mostly cover styling/runtime behaviour. That is not the whole `@reference-ui/core` product.

These categories should also be treated as first-class coverage areas.

### distro

**Why this is needed**

`distro` is the single-consumer install surface: cold `ref sync`, emitted packages under `.reference-ui/`, generated entrypoints, and generated declarations. If this breaks, the consumer is broken before browser-level styling tests even start.

**Current evidence**

- `packages/reference-unit/tests/ref-sync.test.ts`
- `packages/reference-unit/tests/packager-ts.test.ts`
- `packages/reference-unit/tests/types/*`
- `matrix/distro/tests/unit/distro.test.tsx`

**Coverage to add**

- [DONE] `matrix/distro` asserts the generated React package advertises `react.d.mts` as its `types` entry.
- [DONE] `matrix/distro` asserts the generated system package advertises `system.d.mts` as its `types` entry.
- [DONE] `matrix/distro` asserts the generated React package exports `./styles.css` as a public subpath.
- [DONE] `matrix/distro` asserts the generated system package exports `./baseSystem` with import and types entries.
- [DONE] `matrix/distro` asserts the generated React declaration barrel re-exports the generated entry module.
- [DONE] `matrix/distro` asserts the generated system declaration barrel re-exports the generated entry module.
- [DONE] `matrix/distro` parses generated `react/styles.css` with PostCSS so emitted stylesheet syntax has to be valid.
- [DONE] `matrix/distro` rejects suspicious placeholder/control fragments like `[object Object]`, `undefined`, `NaN`, null bytes, and replacement characters in generated `react/styles.css`.
- [DONE] `matrix/distro` broadens generated package surface checks beyond `Div`, `css`, `tokens`, and `keyframes`.
- [DONE] `matrix/distro` covers idempotent reruns after source deletions/renames, not only a second happy-path sync.
- [DONE] `matrix/distro` folds `ref clean` into this ownership so clean -> sync -> import works predictably.
- [DONE] `matrix/distro` keeps `.reference-ui/virtual/src` in exact sync with the included consumer source tree, so distro now owns the old virtual mirror invariant instead of leaving it behind in `reference-unit`.
- [DONE] `matrix/distro` asserts generated `system/baseSystem` remains portable for downstream consumers by checking emitted layer CSS and merged JSX element metadata.
- [DONE] `matrix/distro` asserts emitted `system/jsx-elements.json` preserves primitive, upstream, and merged JSX element inventories for downstream tooling.
- [DONE] `matrix/distro` asserts the generated styled package keeps its public package metadata and `./patterns` export when Panda output is present.
- [DONE] `matrix/distro` asserts generated `styled/styles.css` preserves a top-level layer prelude and the consumer-namespaced layer block.
- [DONE] `matrix/distro` seeds stale generated runtime artifacts and asserts a cold `ref sync` rewrites them before downstream imports reuse the generated packages.
- [DONE] `matrix/distro` kills a fresh cold `ref sync` after `panda.config.ts` appears and asserts the next cold sync recovers to valid runtime artifacts.
- [DONE] `matrix/distro` syncs a temporary token fragment and typechecks a consumer probe so generated token unions stay aligned with emitted runtime token CSS.
- Watch-mode stale-output readiness is still tracked as explicit future work in a skipped distro test until a single-consumer ready sentinel exists.

### config

**Why this is needed**

`defineConfig` and config loading are public consumer entry points. A consumer can fail before any style code runs if `ui.config` discovery, bundling, evaluation, or validation breaks.

**Current evidence**

- `packages/reference-core/src/config/bundle.test.ts`
- `packages/reference-core/src/config/evaluate.test.ts`
- `packages/reference-core/src/config/validate.test.ts`
- `packages/reference-core/src/lib/paths/ref-config.test.ts`

**Coverage to add**

- Real consumer resolution for `ui.config.ts`, `ui.config.js`, and `ui.config.mjs`.
- Config files that import helper modules or bare packages.
- Invalid single-consumer config shapes with readable diagnostics for `include`, `outDir`, `jsxElements`, and similar top-level fields.
- Config changes in watch mode should trigger a full rebuild and a fresh ready state.

### bundler plugins

**Why this is needed**

`referenceVite` and `referenceWebpack` are public exported APIs. `watch` overlaps with them, but plugin API correctness is still its own consumer contract.

**Current evidence**

- `packages/reference-core/src/vite/plugin.test.ts`
- `packages/reference-core/src/vite/hot-update-policy.test.ts`
- `packages/reference-core/src/webpack/plugin.test.ts`
- overlap from the migrated `watch` matrix package

**Coverage to add**

- One real consumer smoke path per bundler using the public plugin export.
- Assert managed-output invalidation, deferred HMR, and ready-state coordination from the plugin point of view.
- Keep plugin config merge behaviour covered so consumer `optimizeDeps` and watch settings are not clobbered.
- Verify the same generated-output policy works after rebuilds, not only on initial dev-server boot.

### reference

**Why this is needed**

Reference docs generation and the browser `Reference` surface are part of `@reference-ui/core`. They are single-consumer features and currently sit outside the migrated styling/runtime buckets.

**Current evidence**

- `packages/reference-unit/tests/reference/output.test.ts`
- `packages/reference-unit/tests/reference/component.test.tsx`
- `matrix/reference/tests/unit/reference-output.test.ts`
- `matrix/reference/tests/e2e/reference-contract.spec.ts`

**Coverage to add**

- [DONE] `matrix/reference` asserts that a real consumer sync emits `.reference-ui/types/tasty/manifest.js`, the generated `@reference-ui/types` package surface, and queryable symbols such as `ReferenceApiFixture`, `StyleProps`, and composed alias fixtures.
- [DONE] `matrix/reference` keeps indexed-access aliases, StyleProps-extending fixtures, interface-from-type flattening, and direct alias projection readable through the raw Tasty API.
- [DONE] `matrix/reference` renders `ReferenceApiFixture`, `StyleProps`, StyleProps-extending fixtures, `DocsReferenceButtonProps`, `DocsReferenceComposedButtonProps`, `DocsReferencePinnedTargetAlias`, standalone and derived literal-union aliases, mapped/object-like aliases, discriminated unions, inherited-origin interface pages, and generic interface headers through the browser `Reference` surface so manifest-backed interface and alias behaviour stays locked beyond raw manifest checks.
- [DONE] `matrix/reference` keeps the rich `DocsReferenceButtonProps` page locked with defaults, callback signatures, JSDoc tags, derived alias surfaces, and placeholder filtering in a real browser.
- [DONE] `matrix/reference` keeps tuple alias labels, concrete conditional alias resolution, object-like `typeof` alias projection, and a JSDoc-tagged local interface page locked in the browser.
- [DONE] `matrix/reference` reruns `ref sync` after renaming a local source symbol fixture and confirms the new symbol appears while the old symbol drops out of generated reference artifacts.
- [DONE] `matrix/reference` shows a readable browser failure state for missing symbols requested through `Reference`.
- Stale-artifact failure behaviour should still be made explicit.

### mcp

**Why this is needed**

MCP is a product surface of `@reference-ui/core`, not just internal tooling.

**Current evidence**

- `matrix/mcp/tests/unit/get-component.test.ts`
- `matrix/mcp/tests/unit/get-component-props.test.ts`
- `matrix/mcp/tests/unit/get-component-examples.test.ts`
- `matrix/mcp/tests/unit/get-style-props.test.ts`
- `matrix/mcp/tests/unit/get-tokens.test.ts`
- `matrix/mcp/tests/unit/list-components.test.ts`
- `matrix/mcp/tests/unit/resources.test.ts`
- `matrix/mcp/tests/unit/server.test.ts`

**Coverage to add**

- Startup and query coverage against freshly generated artifacts, not only stable preconditions.
- Missing/stale artifact behaviour should be explicit and readable.
- Refresh behaviour after a consumer sync should be covered where the protocol depends on the latest outputs.
- Keep this focused on a single consumer workspace; multi-workspace/MCP orchestration can wait.

## Cross-cutting scenarios that still matter

Even when they are owned by another category, these are worth keeping visible because they recur across `watch`, `distro`, `config`, and `bundler plugins`:

- stale output readiness
- interrupted sync recovery
- fatal failure exit and cleanup
- deterministic reruns after partial generated state already exists
- clean removal of generated outputs and managed package links

## Categories that do not need promotion right now

### extends x layers

Out of scope for this document. That work is real, but it should not block the single-consumer coverage plan.

### playwright harness

`matrix/playwright` is valuable as matrix infrastructure smoke, but it is not a separate product category for `@reference-ui/core`.

### internal utilities as standalone matrix categories

The event bus, FS helpers, thread-pool utilities, and profiler should keep their direct `reference-core` unit tests. They do not each need their own matrix package unless a consumer-facing regression proves they deserve promotion.

## Recommended single-consumer coverage set

If the goal is to make `reference-core` hard to break for a normal consumer, the target set is:

- `watch`
- `primitives`
- `css`
- `system`
- `recipe`
- `spacing`
- `responsive`
- `color-mode`
- `session`
- `tokens`
- `virtual`
- `distro`
- `config`
- `bundler plugins`
- `reference`
- `mcp`

That is the set that gets closest to “bomb-proof” without pulling `extends` x `layers` back into scope.
