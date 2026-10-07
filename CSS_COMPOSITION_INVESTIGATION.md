# Library CSS Does Not Compose Transitively

**Status:** Open — investigation brief, not yet a fix
**Severity:** High — undermines the core "compose packages" value proposition
**Owner:** unassigned (needs a focused investigation + matrix proof)
**Date:** 2026-10-07
**Scope:** the build-time styling pipeline (`ref sync` / StyleTrace), `baseSystem`
composition, package build scripts, and the matrix
**First seen:** `packages/reference-docs` consuming `@reference-ui/icons` (via
`@reference-ui/lib`), 2026-10-06

> This file is a working investigation brief. It separates **Observed** facts
> (reproducible evidence) from **Hypothesized** causes (to be falsified). Do not
> treat hypotheses as conclusions.

---

## TL;DR

Reference UI styling is compiled at build time per *system*. A package that is
built as its own system (different `name` → different class prefix) does not
contribute its compiled CSS to a consumer, and there is no automatic transitive
closure. The consumer inherits only the utility classes that travel inside an
`extends`-ed `baseSystem`.

We found a live, reproducible instance: `@reference-ui/icons` emits
`reference-icons__*` classes that exist in **no** stylesheet anywhere. The
consumer's runtime logs `css(): no compiled class …` six times and the icon
shell silently falls back to relying on inline styles. This is the canary; the
underlying bug is general and will bite any composed package whose style
call-sites are not visible to the consumer's compilation.

**The fix is not "add an import".** Even importing the icons' own stylesheet
does not help, because that stylesheet is itself empty of those utilities
(second, independent failure). Both need to be understood and covered by the
matrix.

---

## 1. Symptom

### 1.1 Reproduction (current, minimal)

From the repo root:

```bash
# docs use @reference-ui/icons (re-exported by @reference-ui/lib)
pnpm dev:docs            # serve :5174
```

Open any docs page. DevTools console shows six warnings, all from the icon
runtime:

```
[reference-ui] css(): no compiled class for `display: "inline-flex"` … miss class emitted but unbacked, paints nothing.
[reference-ui] css(): no compiled class for `alignItems: "center"` …
[reference-ui] css(): no compiled class for `justifyContent: "center"` …
[reference-ui] css(): no compiled class for `lineHeight: "0"` …
[reference-ui] css(): no compiled class for `flexShrink: "0"` …
[reference-ui] css(): no compiled class for `color: "inherit"` …
   @ packages/reference-icons/dist/runtime/reference-ui/react/react.mjs
```

An icon wrapper renders with classes that have **no matching CSS rule**:

```html
<div data-slot="icon"
     class="ref-div
            reference-icons__d_inline-flex
            reference-icons__ai_center
            reference-icons__jc_center
            reference-icons__leading_0
            reference-icons__shrink_0
            reference-icons__c_inherit">
  <svg width="100%" height="100%" …/>
</div>
```

Computed styles confirm the miss: `display: block`, `align-items: normal`
(not `inline-flex` / `center`). Icons still *look* right only because
`createIcon` also sets `width`/`height`/`minWidth`/`minHeight` inline, so the
box is sized correctly and the missing shell layout is mostly invisible.

### 1.2 Why it looks fine but is not

The inline sizing hides the failure. Any property that is *not* inline — shell
alignment, `flex-shrink`, `line-height`, `color` inheritance — is silently
dropped. In flex rows this can cause icons to shrink or misalign under pressure.
This is exactly the class of bug the build-time model is supposed to make
impossible.

---

## 2. Observed evidence

All commands run from the repo root on 2026-10-07.

### 2.1 System names (class prefixes)

| Package | System `name` | Emitted class prefix |
| --- | --- | --- |
| `packages/reference-lib` | `reference-ui` | `reference-ui__*` |
| `packages/reference-docs` | `reference-docs` | `reference-docs__*` (+ inherits `reference-ui__*`) |
| `packages/reference-icons` | `reference-icons` | `reference-icons__*` |

```bash
rg -o '"name": "[^"]+"' \
  packages/reference-lib/.reference-ui/system/baseSystem.mjs \
  packages/reference-icons/.reference-ui/system/baseSystem.mjs \
  packages/reference-docs/.reference-ui/system/baseSystem.mjs
```

### 2.2 Which classes are actually shipped

```bash
# class-prefix census per shipped stylesheet
rg -o "\.[a-z][a-z0-9-]*__…" <file> | sed 's/__.*//' | sort | uniq -c
```

| Stylesheet | `reference-ui__` | `reference-icons__` | `reference-docs__` |
| --- | ---: | ---: | ---: |
| `reference-lib/dist/.../react/styles.css` | 2496 | 0 | 0 |
| `reference-docs/.reference-ui/react/styles.css` | 2496 | **0** | 288 |
| `reference-icons/dist/.../react/styles.css` | 0 | **0** | 0 |

The icons stylesheet is ~12 KB and only populates `reset`, `root`, and `tokens`
layers — its `utilities`/`recipes` layers are declared but **empty**:

```bash
rg -o "@layer [a-z-]+" packages/reference-icons/dist/runtime/reference-ui/react/styles.css | sort -u
# @layer reference-icons
# @layer reset
# @layer root
# @layer tokens
```

**Conclusion (observed):** the `reference-icons__*` classes the runtime emits do
not exist in the icons' own stylesheet, nor in the docs stylesheet, nor in lib's.
There is no stylesheet anywhere that backs them.

### 2.3 The icons build *does* see the call-site

`packages/reference-icons/ui.config.ts`:

```ts
export default defineConfig({
  name: 'reference-icons',
  include: ['src/**/*.{ts,tsx}'],   // ← includes src/createIcon.tsx
  jsxElements: [...ICON_JSX_NAMES], // ← the 3800 generated icon tags
  extends: [],
  debug: false,
})
```

`src/createIcon.tsx` renders the shell with the exact missing style props — but
on an **aliased** host:

```tsx
const IconShell = Div as unknown as React.ForwardRefExoticComponent<…>

<IconShell
  data-slot="icon"
  display="inline-flex"
  alignItems="center"
  justifyContent="center"
  lineHeight="0"
  flexShrink="0"
  color={color}
  style={{ width: resolvedSize, height: resolvedSize, … }}
/>
```

`IconShell` is not `Div` as far as the tracer's identifier matching is
concerned, and it is not in `jsxElements` (that list holds the *generated* icon
tags, not the internal shell). So the extraction sees the file but does not
attribute the style props to a known host.

**Important deprecation note:** `jsxElements` is a **legacy escape hatch, not
the intended fix.** StyleTrace has since implemented JSX host detection itself,
so this override is meant to disappear from `@reference-ui/icons` (and
everywhere else). Its continued presence in the icons config is a deprecated
crutch, not a supported resolution — see §4.6. The real bug is that StyleTrace's
host detection does not recognize the aliased `IconShell` (H1).

### 2.4 Composition today is `extends` only, and manual

From `matrix/CHAIN.md`:

- `extends` pulls an upstream `fragment` into config generation (tokens,
  keyframes, fonts, global CSS, JSX elements, types, **and compiled `css`**).
- `layers` pulls only upstream `css` into final assembly. Tokens do not enter.
- Assembly order: upstream `extends` first, then `layers`, then the local layer.

Docs extends lib's `baseSystem`; that is why docs inherits the 2496
`reference-ui__*` utilities (lib's compiled CSS travels through
`baseSystem`). Docs does **not** extend the icons' `baseSystem`, so nothing
pulls `reference-icons` — and even if it did, that baseSystem's `utilities` are
empty (2.2). Lib's `baseSystem` contains no reference to icons:

```bash
rg -c "reference-icons|@reference-ui/icons" packages/reference-lib/.reference-ui/system/baseSystem.mjs  # → 0
```

---

## 3. How the pipeline works (model)

1. `ui.config.ts` declares `name`, `include`, `extends[]`, `jsxElements[]`
   (deprecated, §4.6), `staticCss`, optionally `layers[]`.
2. `ref sync` statically extracts style call-sites from files matched by
   `include`, under the system `name`. Each system namespaces its atomic classes
   with its name (`<system>__…`). Deciding which JSX identifiers count as
   style-bearing hosts is **StyleTrace's** responsibility; `jsxElements` is a
   legacy, deprecated override that is being retired (see §4.6).
3. Compiled output is a stylesheet plus a `baseSystem` artifact (fragment +
   tokens + types + css) under `.reference-ui/system/`.
4. A consumer composes another system by `extends`-ing its `baseSystem` (adopts
   fragment/tokens/types/css) or `layers`-ing its css only.
5. At runtime, `css()` resolves a StyleProp to a precompiled class name; if the
   class was never compiled, it logs `no compiled class …` and emits an unbacked
   class (dev aid; not a prod mechanism).

**The transitive gap:** step 2 only sees call-sites reachable from the
consumer's `include` globs. Style call-sites that live inside a dependency
package's *compiled output* (node_modules / dist) are never scanned by the
consumer, and a dependency built under a different system name produces class
names the consumer's system never emits. Composition therefore depends on the
dependency having shipped a **complete** stylesheet *and* the consumer importing
it (or `extends`-ing a baseSystem that already embeds it).

---

## 4. Root-cause analysis

Two independent failures were observed. They compound.

### 4.1 Confirmed — cross-system CSS is not composed transitively

A separately-built system's compiled CSS reaches a consumer **only** if the
consumer `extends` (or `layers`) that system's artifact. There is no automatic
closure across package boundaries. Docs extends lib but not icons ⇒
`reference-icons__*` is never present. This matches the observed 0 classes.

### 4.2 Confirmed — the icons system's own CSS omits its shell utilities

`reference-icons` compiled to a stylesheet with empty utility layers, despite
`include` covering `src/createIcon.tsx`. Whatever the extractor's reason, the
authoritative icons stylesheet does not back the classes its runtime emits.
→ It is not enough to import the icons CSS; it does not contain the rules.

### 4.3 Hypothesized — extraction misses aliased / wrapper hosts

The shell props are applied to `IconShell` (an `as`-cast alias of `Div`), not to
`Div` directly and not to any registered host name. Hypothesis: the tracer
attributes style props only to recognized host identifiers (literal tags or known
primitives; the deprecated `jsxElements` list was the old way to register extras,
§4.6), so aliased hosts are silently dropped. **To falsify:** temporarily replace
`IconShell` with the literal `Div` in `createIcon.tsx`, re-run `ref sync`, and
diff the icons stylesheet for the six shell utilities. If they appear, the
hypothesis holds.

### 4.4 Confirmed — the safety net is dev-only and non-fatal

The `no compiled class` warning fires at runtime in dev and paints nothing. In
production it is silent and the element is simply unstyled. There is no build
step that asserts "every emitted class has a backing rule".

### 4.5 Contributing — no declarative dependency graph for CSS

`ui.config.ts` has `extends` but no notion of "this package's output is consumed
by X, so ship/attach my styles." `staticCss` exists as a manual escape hatch
(see `packages/reference-neo/src/config/validate.ts`) but is per-prop and opt-in.

### 4.6 Deprecated: `jsxElements` (superseded by StyleTrace host detection)

`jsxElements` predates StyleTrace's own JSX host detection. Once StyleTrace could
infer which tags are style-bearing hosts, the manual `jsxElements` list was
deprecated and was expected to disappear from `@reference-ui/icons` in
particular.

Consequences for this investigation:

- **H2 is not a fix.** Adding `IconShell` to `jsxElements` would be relying on a
  deprecated mechanism; even if it worked, it is the wrong direction.
- **The icons config still carries the debt:**
  `jsxElements: [...ICON_JSX_NAMES]` in
  `packages/reference-icons/ui.config.ts` is legacy that should be removed once
  StyleTrace covers the generated icon tags on its own.
- **The real question is host detection.** If StyleTrace is supposed to make
  `jsxElements` obsolete, then it must also recognize aliased/wrapped hosts like
  `IconShell` — otherwise delegating to StyleTrace is *less* capable than the
  escape hatch it replaces. That is precisely failure 4.3 / H1.
- **Action:** confirm whether `jsxElements` is fully retired across the repo and
  whether removing it from icons is a no-op or a regression; fold the answer
  into the H1/H2 findings.

---

## 5. Impact / blast radius

- **Any composed package whose style call-sites are not statically recognizable**
  (aliases, `as`-casts, higher-order wrappers, runtime-generated components,
  re-exported components) risks silently dropping styles.
- **Any package built under its own system name** does not contribute CSS to
  consumers unless explicitly wired.
- **Production is the worst case:** dev warns; prod is silent and wrong.
- **Trust:** an "atomic CSS, build-time, zero-runtime" system that silently
  drops styles is worse than one that errs loudly. The core pitch is
  "StyleProps are always compiled" — this violates it across package boundaries.
- **Known surface today:** `@reference-ui/icons` (confirmed). Suspect: any lib
  component that wraps/aliases host elements, matrix `extend-library` /
  `layer-library` consumers, and future published packages.

---

## 6. Hypotheses to falsify (ranked)

| # | Hypothesis | Falsification test |
| --- | --- | --- |
| H1 | Aliased host (`IconShell`) is not traced | Swap to literal `Div`; diff icons CSS |
| H2 | `jsxElements` (deprecated) would mask the miss | Add `IconShell` to `jsxElements`; re-sync; diff. **Diagnostic only — not a proposed fix** (§4.6) |
| H3 | Cross-system CSS never flows without `extends`/`layers` | `extends` icons baseSystem in a fixture; assert classes appear |
| H4 | Icons baseSystem utility layers are genuinely empty | Inspect `.reference-ui/system/evaluated-system.json` for the shell props |
| H5 | Same failure exists inside lib for wrapped hosts | Grep lib for `as unknown as` host casts; build a probe component |
| H6 | A consumer can never compile a dependency's call-sites | Try `include: ['node_modules/@reference-ui/icons/dist/**']`; observe |

Record each result in this file (append a "Findings log" section) as it is run.

---

## 7. Fix options

### Option A — Ship complete CSS per package; consumers import it
- Make each package's `ref sync` emit a **self-contained** stylesheet by fixing
  StyleTrace host detection (4.3 / H1) so no call-site is dropped — **not** by
  leaning on the deprecated `jsxElements` (§4.6).
- Publish a stable `styles.css` export; consumers import dependency stylesheets.
- **Pros:** simple mental model; works with any bundler; no runtime scanning.
- **Cons:** every consumer must remember to import each dependency's CSS;
  duplicate rules across packages; ordering/layers management; doesn't fix 4.1
  by itself.

### Option B — Transitive `extends` closure (auto-compose baseSystems)
- A package declares its Reference UI dependencies (e.g. via `extends`), and
  `baseSystem` composition is transitive: consuming lib brings lib's deps'
  CSS too.
- **Pros:** matches user expectation ("I imported the component, styles came").
- **Cons:** needs a real dependency graph; risk of pulling unrelated CSS;
  requires fixing 4.2 so the composed CSS is complete.

### Option C — Package-declared `staticCss` / utility manifest
- Each published package exports the exact utilities/recipes it needs
  (`staticCss`-style manifest); consumers merge manifests instead of scanning
  node_modules.
- **Pros:** no source scanning; deterministic; composes cleanly; works for
  aliased/dynamic hosts because the manifest is authored/generated at build.
- **Cons:** new artifact + merge semantics; generation must be correct (build
  the manifest from the package's own synced output).
- **Recommendation:** combine **A + C**. Fix the icons build so its own
  stylesheet is complete (A, addresses 4.2/H1), and add a manifest so consumers
  deterministically adopt dependency CSS (C, addresses 4.1). Keep B as a later
  ergonomics layer.

### Option D — Runtime CSS generation fallback
- Generate missing utilities at runtime when a class is unbacked.
- **Rejected:** violates the zero-runtime/build-time contract and hides bugs.

---

## 8. Matrix coverage plan

The matrix already proves `extends` (T1) and `layers` (T2) composition between
fixtures (`matrix/fixtures/extend-library`, `layer-library`,
`meta-extend-library*`; tiers `matrix/tests/chain/T1..T13`). The gap is
**composing a *prebuilt, separately-packaged* library from node_modules whose
call-sites include non-trivial hosts** (aliases/wrappers) — exactly the icons
shape.

### 8.1 New chain tier — "compose a prebuilt package" (suggest T14)
Fixture pair:
- `library-aliased-host`: a package whose component renders style props on an
  **aliased** host (`const Shell = Div as …`) and/or a wrapper HOC.
- `consumer-of-aliased-host`: extends/layers the fixture, renders it, asserts.

### 8.2 Assertions (the contract)
1. **No unbacked classes.** For every element under the test root, collect its
   classes and assert each has a matching CSS rule in the loaded stylesheets.
   This is the single most valuable assertion — it would have caught this bug.
2. **Zero `no compiled class` console warnings** during render (dev build).
3. **Computed-style checks** on the specific shell properties
   (`display: inline-flex`, `align-items: center`, `flex-shrink: 0`,
   `line-height: 0`) — not just visual snapshots.
4. **Icons specifically:** render `CheckIcon`/`ContentCopyIcon` and assert
   wrapper computed styles.

### 8.3 Cross-cutting axes
- **Bundlers:** prove under both Vite and Webpack (the matrix already spans
  bundlers — reuse it).
- **React runtimes:** 17 / 18 / 19 (the composition failure is runtime-agnostic;
  cheap to assert in the existing harness).
- **Import shape:** prove it when importing from the **re-exporting** package
  (`@reference-ui/lib`) *and* directly (`@reference-ui/icons`); they may differ.

### 8.4 Guard in the pipeline (cheap, high value)
Add an assert to the consumer build: if the dev runtime logs `no compiled class`
during the matrix run, fail. Until a structural fix lands, this converts a
silent prod risk into a red test.

---

## 9. Acceptance criteria

- [ ] `createIcon`'s six shell utilities are compiled into a stylesheet that a
      consumer loads without importing anything extra **or** the composition
      model guarantees they are adopted transitively.
- [ ] Zero `no compiled class` warnings when rendering every icon in a consumer.
- [ ] New matrix tier asserts "every emitted class has a backing rule" for a
      prebuilt, separately-packaged library with aliased hosts, under Vite and
      Webpack, across React 17/18/19.
- [ ] `@reference-ui/icons` stylesheet contains a non-empty `utilities`/`recipes`
      layer (or the manifest artifact replaces it) — no empty-layer shipping.
- [ ] This document updated with a Findings log (H1–H6 results) and a decision.

---

## 10. Open questions

1. Is the extraction miss (4.3) specific to `as`-casts, or broader (HOCs,
   `React.createElement`, spread props, `forwardRef` wrappers)? What is the
   exact set of "recognized host" rules?
2. Is `jsxElements` fully retired across the repo? Is removing it from
   `@reference-ui/icons` a no-op or does it regress the generated icon tags until
   StyleTrace covers them natively?
3. Should consumers ever compile dependency call-sites from node_modules, or is
   that explicitly out of scope by design?
4. What is the intended public contract for a *published* Reference UI package:
   "import our CSS" or "extend our baseSystem"? Right now it is undocumented.
5. Does the same failure affect custom components inside *lib* (H5)?
6. How should `layers` and this composition interact for order/specificity?

---

## 11. Proposed execution plan

1. **Reproduce + falsify (0.5 day).** Run H1, H2, H4, H6. Append results.
2. **Characterize the tracer (1 day).** Enumerate which host shapes are
   recognized vs dropped; write it down. This informs A vs C.
3. **Fix the icons build via StyleTrace (0.5–1 day).** Teach host detection the
   aliased `IconShell` (H1) so the shell utilities compile; retire the deprecated
   `jsxElements` list from the icons config. Verify 2.2 flips.
4. **Design composition contract (1 day).** Decide A, C, or A+C; document the
   public rule for published packages.
5. **Implement + matrix tier (1–2 days).** Land the tier in 8.1–8.3 and the
   runtime-warning guard in 8.4.
6. **Harden.** Sweep lib/matrix fixtures for aliased hosts (H5); add coverage.

---

## Appendix A — file map

| Path | Relevance |
| --- | --- |
| `packages/reference-icons/ui.config.ts` | icons system config (`name: reference-icons`, `include`, `jsxElements`, `extends: []`) |
| `packages/reference-icons/src/createIcon.tsx` | aliased `IconShell` host; the six missing props |
| `packages/reference-icons/scripts/build.mjs` | generate → `ref sync` → rollup → tsc → materialize |
| `packages/reference-icons/dist/runtime/reference-ui/react/styles.css` | icons' shipped CSS (empty utilities) |
| `packages/reference-icons/dist/runtime/reference-ui/react/react.mjs` | runtime that emits `reference-icons__*` and warns |
| `packages/reference-lib/.reference-ui/system/baseSystem.mjs` | lib system (`reference-ui`) artifact consumed by docs |
| `packages/reference-docs/ui.config.ts` | `extends: [baseSystem]` from lib |
| `packages/reference-docs/src/app/ThemeToggle.tsx` (etc.) | docs call-sites that surface the warnings |
| `packages/reference-neo/src/config/validate.ts` | config schema incl. `staticCss` |
| `matrix/CHAIN.md` | `extends` vs `layers` semantics; T1–T13 |
| `matrix/fixtures/extend-library`, `layer-library` | existing composition fixtures |
| `matrix/tests/chain/T1..T13` | existing composition provers |

## Appendix B — commands used

```bash
# system names
rg -o '"name": "[^"]+"' packages/*/.reference-ui/system/baseSystem.mjs

# class census per stylesheet
rg -o "\.[a-z][a-z0-9-]*__[A-Za-z0-9_\\\\.:-]+" <css> | sed 's/__.*//' | sort | uniq -c

# icons layers
rg -o "@layer [a-z-]+" packages/reference-icons/dist/runtime/reference-ui/react/styles.css | sort -u

# does lib compose icons?
rg -c "reference-icons|@reference-ui/icons" packages/reference-lib/.reference-ui/system/baseSystem.mjs
```

## Appendix C — glossary

- **System:** a Reference UI compile unit with a `name`; namespaces atomic
  classes as `<name>__…`.
- **baseSystem:** generated artifact (fragment + tokens + types + css) that a
  consumer `extends`.
- **`extends` / `layers`:** two composition modes (full adoption vs css-only).
- **`staticCss`:** manual escape hatch listing style props/values to compile.
- **`jsxElements`:** **deprecated** manual escape hatch listing extra JSX tags
  the tracer should treat as style hosts. Superseded by StyleTrace's own host
  detection; being retired (see §4.6).
- **Unbacked class:** a class present in the DOM with no matching CSS rule —
  the failure mode this document is about.

---

### Findings log

_(append results here as hypotheses are tested)_

- 2026-10-07 — Confirmed 2.2: no stylesheet anywhere backs `reference-icons__*`.
- 2026-10-07 — Confirmed 4.1: docs inherits 2496 `reference-ui__*` via lib's
  baseSystem; icons contributes nothing.
- 2026-10-07 — Confirmed 4.2: icons stylesheet utility layers are empty.
- 2026-10-07 — Confirmed 4.4: six runtime `no compiled class` warnings in docs.
- 2026-10-07 — Noted 4.6: `jsxElements` is deprecated (superseded by StyleTrace
  host detection) and should be removed from `@reference-ui/icons`; H2 is a
  diagnostic, not a fix.
- 2026-10-07 — H1/H2/H4/H5/H6: **pending**.
