

## Unified suites (reference-unit + reference-e2e)

`packages/reference-unit` and `packages/reference-e2e` are converging into **one matrix-oriented suite** per concern area. The same scenarios can be exercised with **Vitest** or **Playwright** depending on what you are proving:

| Use Vitest when | Use Playwright when |
|-----------------|---------------------|
| Pure logic, virtual FS, transform output, generated files, TypeScript types, fast DOM with happy-dom | Real browser CSS cascade, computed styles, layout, visible styling, full pipeline + bundler behaviour |
| Sync/ref-sync mechanics without a browser | Anything where **generated CSS** and **real application of styles** must be trusted |
| Token/manifest/data assertions that do not need paint | Responsive behaviour at viewport width, color-mode with real media/`data-*` behaviour, cross-environment matrix (React × bundler) |

**Default bias:** prefer **Playwright** whenever the test is about **correct styles**, **CSS generation**, **recipes**, **primitives mounting with real sheets**, or **watch + HMR-style** verification in a running app. Use Vitest for speed and for layers that are intentionally non-browser (virtual system, packager output, type regressions).

---

## Suite map (this package and peers)

The headings below are the **planned matrix packages / concern areas** (each runnable in its own containerised matrix environment). Descriptions say what the suite proves; migration notes point back to today’s `reference-unit` / `reference-e2e` coverage.

### watch [DONE]

End-to-end **watch mode**: `--watch` with ref sync, updating tokens and primitive styles, `css()` and `recipe()` invalidation, and session/watch coordination.
- **Bundler parity:** same assertions under Vite and webpack for style injection and HMR/watch (matrix axis already in e2e).
- **From reference-unit:** `tests/watch/`, `tests/watch/session.test.ts`, ref-sync watch behaviour.
- **From reference-e2e:** `sync-watch.spec.ts`, `token-sync-watch.spec.ts`, core sync lifecycle.
- **Gaps / stretch:** assert ordering between token writes and style regen; multi-file edits in one watch tick; optional **ready-sentinel** alignment with packager completion (see `packages/reference-e2e/plan.md` Phase 3).

### primitives [DONE]

Style props on generated primitives, mount behaviour, and interaction with emitted design-system CSS.

- **Matrix package:** `matrix/primitives`.
- **From reference-unit:** `tests/primitives/` (Div, custom props, computed style hooks where happy-dom allows).
- **From reference-e2e:** `style-props.spec.ts`, `jsx-elements.spec.ts`, parts of `core-system.spec.ts`.
- **Playwright-first:** real computed styles and cascade; extend with **visual regression** (screenshots) for high-value primitives if flakes are controlled.
- **Initial contract:** fixture app plus browser assertions for primitive mount, style-prop computed styles, and `css` prop class composition across Vite and webpack.
- **Next gaps:** port font/custom-prop cases that still rely on happy-dom flattening, then add screenshots only after the browser assertions stay stable.

### css [DONE]

The raw `css()` API: valid CSS output, correct selectors/conditions, and application in a real document.

- **Matrix package:** `matrix/css`.
- **From reference-unit:** container output tests, size/css utility coverage, and source-backed `css()` fixtures.
- **From reference-e2e:** layers/style paths via core tests.
- **Initial contract:** fixture app plus browser assertions for raw `css()` class application, pseudo selectors, nested selectors, attribute selectors, named container-query behavior, and generated stylesheet mount/layer order across Vite and webpack.
- **Gaps / stretch:** exhaustive conditional branches (pseudo, nesting edge cases); verify **stylesheet presence and order** in the browser, not only string snapshots on disk.
- **snapshots:** visual regression baselines, a11y spot checks on key routes, or perf budgets—only if the team wants guardrails beyond correctness.

### system [DONE]

The `@reference-ui/system` authoring APIs: `tokens()`, `globalCss()`, `keyframes()`, and their generated runtime effects.

- **Matrix package:** `matrix/system`.
- **From reference-unit:** `tests/system/globalCss.test.tsx`, `tests/system/keyframes.test.tsx`, `tests/system/tokens.test.tsx`.
- **From reference-e2e:** token-driven runtime coverage and stylesheet/layer presence via core tests.
- **Initial contract:** fixture app plus browser assertions for token-backed primitive styling, document-level `globalCss()` custom properties, `body` resets, `keyframes()` animation naming, and generated stylesheet mount/layer order across Vite and webpack.

### recipe

The `recipe()` API: variants, compound styles, and stable class/application behaviour.

- **From reference-unit:** virtual recipes / system fixtures where present.
- **Playwright-first:** “fairly exhaustive” variant matrix in the browser; optional screenshot matrix per variant.
- **snapshots:** visual regression baselines, a11y spot checks on key routes, or perf budgets—only if the team wants guardrails beyond correctness.

### spacing

Rhythm props (`4r`, etc.) and the **size** custom prop—behaviour that is easy to mistype in unit mocks.

- **From reference-unit:** `tests/system/rhythm*.test.*`, `tests/system/size*.test.*`, container output helpers.
- **Playwright-first:** harden with real layout/computed spacing; responsive spacing if product-critical.

### responsive

Responsive design across `css()`, `recipe()`, and the **`r` prop** on primitives—full-system behaviour, not just token resolution.

- **From reference-e2e:** `container-responsive.spec.ts`, responsive container tests in base fixtures.
- **Gaps / stretch:** viewport matrix (width/height); verify **media query** branches actually apply in the browser.

### color-mode

Light/dark (and any extended modes): tokens and primitives resolve correctly with theme switches.

- **From reference-unit:** `tests/color-mode/`, extends/layers colour demos with `data-panda-theme` / `colorMode`.
- **From reference-e2e:** `color-mode.spec.ts`, `ColorModeTest` routes.
- **Playwright-first:** real theme toggling without stripping `@layer` (unit tests sometimes flatten layers for happy-dom).

### session

Session API: manifest, lifecycle, and isolation—keep tests **self-contained** and aligned with `session` implementation.

- **From reference-unit:** `tests/session/session-manifest.test.ts`.
- **Gaps / stretch:** read `session` source for additional edge cases (errors, idempotency, multi-consumer assumptions).

### tokens

Token generation, sync, and fragment behaviour—mostly **file and pipeline** concerns.

- **From reference-unit:** `tests/tokens/fragment-sync.test.ts`, `tests/layers/tokens.test.tsx`, extends tokens.
- **From reference-e2e:** `tokens.spec.ts`, token sync watch.
- **Vitest is often enough**; add Playwright only when proving tokens **through the full dev server + CSS variables in DOM**.

### virtual

Virtual file system and mirroring: transforms, baseline, and integration with the reference pipeline.

- **From reference-unit:** `tests/virtual/*` (transform, mirror, baseline).

---

## Design system chaining (`extends` × `layers`)

Real products do not stop at “I installed one library.” They **stack** design systems: inherit tokens and components, then add layers for theme or brand. Matrix tests should model that with **small fixtures that depend on each other**, not only flat one-shot apps.

### Building blocks

- **`extends`** — the consumer’s `ui.config` pulls in an upstream package’s system (tokens, recipes, components). One upstream, merge semantics, single inheritance chain in config.
- **`layers`** — the consumer (or a package) registers theme/style **layers** (e.g. a reference theme in its own `@layer`) so cascade order and token emission stay explicit.

The **basics** are one library in one role:

| Shape | Idea |
|-------|------|
| **extend** | Consumer `extends: [oneLibrary]` — adopt that system as the base. |
| **layer** | Consumer `layers: [oneTheme]` — pull in a layered library without replacing the whole config story. |

### Chaining permutations to cover

1. **Extend on extend** — upstream B extends A; consumer extends B (or extends A then B, depending on product rules). Proves **transitive merge**: tokens and components from the whole chain resolve in the app, and sync/watch invalidates when any link changes.

2. **Extend + layered upstream** — consumer extends a package that **internally** uses `layers` (e.g. a design-system package that ships its own layered theme). Proves **extends does not flatten layer semantics**: emitted CSS and variable order still match expectations in the browser.

3. **Layers on top of extends** — consumer both `extends` a base system and adds `layers` for a theme or skin. Proves **interaction** between merged upstream output and layered overrides (cascade, specificity, token visibility).

4. **Multiple fixed chains as fixtures** — separate fixture packages (`fixture-base`, `fixture-extends-base`, `fixture-layered-theme`, …) published only for tests, composed in **named permutations** so each test file maps to a clear graph (who extends whom, who adds layers).

### How tests should use this

- Prefer **real package boundaries** in the matrix (like today’s extend/layer libraries in reference-unit), but with **edges** between fixtures: `fixture-b` depends on `fixture-a` in `package.json` and config, not inlined copies.
- For each permutation, run the **same thin assertions** where possible (token resolution, one Div, one recipe) so failures point to **merge or layer order**, not app code.
- **Playwright** for chain cases that care about **final CSS**; **Vitest** for merge rules and generated config when the scenario is still fully representable in Node.

This section is the **proper design-system chaining** story: single-hop extends/layers are the tutorial; **chained fixtures** are the contract the matrix must lock in.

---

## CLI and sync lifecycle (cross-cutting)

These scenarios are called out in **reference-e2e** planning as intended e2e/matrix coverage when the harness is ready:

1. **Stale output readiness** — ready signal only after runtime packages (e.g. `.reference-ui/react/*.mjs`, `system.mjs`) match the latest sync; no “ready” while outputs are stale.
2. **Interrupted sync recovery** — cold sync after a killed partial run recovers to valid artifacts.
3. **Failure exit and cleanup** — fatal sync exits non-zero and does not leave orphan processes.

Wire these into the **watch** (or dedicated **cli**/pipeline matrix package) when sentinel and sandbox tooling land.

---
