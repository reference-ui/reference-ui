# Atomic — native cutover plan

Atomic owns extraction, resolution, class naming, recipe compilation,
application/portable stylesheet emission, and the data consumed by browser
runtime helpers. It does not own Core fragment evaluation, filesystem output,
or browser helper implementation.

Campaign sequencing and frozen wire contracts live in
[`../../PLAN.md`](../../PLAN.md). This file owns packets **N2**, **N3**, and
**N4**, then the remaining independent `ATM-*` station queue.

Contract: [`SPEC.md`](./SPEC.md).

Runner: `pnpm agentrs v atomic` / `pnpm agentrs c atomic`.

---

## Current state

The pipeline already performs:

```text
source → wants → resolved atoms → deterministic class names
       → six internal layers + CssRuntime.classes + RecipeTable[]
```

That proves the compiler shape, but the current output is not a complete
browser contract:

- `CssRuntime.classes` records resolved atom keys, not how one authored
  declaration expanded.
- aliases, shorthands, `font`, `weight`, `size`, `container`, responsive
  arrays, and `r` can map one authored value to multiple declarations.
- a browser class bag cannot implement last-wins merge by declaration slot.
- recipe tables do not carry defaults and compiler-local binding names are not
  a runtime identity.
- global CSS is inserted as pre-rendered strings rather than lowered from its
  structured author form.
- portable CSS is reconstructed later in Core by parsing emitted CSS.
- theme conditions still emit `data-panda-theme`.

The old fence against changing `CompileRequest`, `CompileResult`, and runtime
keys is over. The native cutover requires one deliberate ABI change, frozen by
root PLAN packet F0. Do not make several transitional shapes.

---

## Native critical lane

One atomic agent at a time. Implement and merge in this order:

```text
N2 authored declaration plans
  ↓
N3 recipe identity/table
  ↓
N4 global + application/portable stylesheet
```

Do not run unrelated station implementors against `atomic/src` during this
lane. They may prepare read-only research but must wait to edit.

---

## N2 — authored-declaration runtime plans

### Contract

`CompileResult.runtime.stylePlans` records this relationship:

```text
(system, authored when[], prop, JSON value, important)
  → [(opaque cascade slot, system-qualified class), ...]
```

The input side is captured before expansion. The output side is captured after
all normal atomic resolution under that system's fonts, breakpoints, and
tokens. The browser does not need to know that `p` expands, that `font` is a
macro, or which canonical property an alias targets. Two systems may both
author `font: "sans"`; their plans and class names must not collide.

### Required implementation

1. Introduce versioned `NativeRuntimeArtifact` and `RuntimeStylePlan` Rust
   types matching the root F0 fixture. Every plan includes `system`.
2. Preserve the authored declaration through resolution long enough to attach
   all resulting atoms.
3. Derive `slot` from the final cascade identity: resolved property + resolved
   condition path. `important` is part of the lookup key, not a second slot; a
   later declaration replaces the earlier slot regardless of either spelling.
   The slot is opaque outside Rust and is scoped to one owner.
4. Keep class naming in `stylesheet::name::class_name`. Include a stable
   system segment so independent systems do not share class names.
5. Emit `stylePropNames` from the complete canon + Reference dialect set, not
   the source tree's encountered subset. Omit `variant` and `colorMode`.
6. Define one canonical serializer for runtime lookup values. Use structured
   wire values and a shared fixture corpus; do not rely on Rust debug output or
   JavaScript insertion-order accidents.
7. Replace the browser-facing `css` field with `runtime`. Remove the old shape
   after JS binding tests migrate.
8. Keep `wants` and `atomCount` only as diagnostic/test observability.
9. Make a missing evaluated system an error at the public Node seam. Rust unit
   helpers use an explicit fixture constructor.

### Required cases

- scalar string and finite number
- nested named condition
- arbitrary `&` selector
- responsive array
- numeric and named `r`
- alias vs canonical longhand
- four-side shorthand vs one longhand
- `font`, `weight`, `size`, and `container` multi-atom macros
- multiple `css()` argument order
- `!important`
- unknown/invalid values produce diagnostics and no plan
- duplicate extracted declarations dedupe deterministically

`ATM-MERGE-01`–`03`, `ATM-UNIT-01`–`02`, `ATM-GHOST-04`, and
`ATM-SEAM-01` must be reconciled with this contract. If existing SPEC prose
assumes the old map, update the prose first and preserve its behavioural claim.

### Gate

```bash
pnpm agentrs c atomic
pnpm agentrs v atomic
pnpm agentrs q packages/reference-rs/modules/atomic
```

The seam test must index the returned fixture with the tiny TypeScript lookup
helper and prove exact classes/slots. A test that only snapshots JSON is not
enough.

---

## N3 — recipe identity and complete table

### Contract

Every production recipe is authored with:

```ts
recipe({
  className: 'stableIdentity',
  // base, variants, defaults, compounds
})
```

`className` is the authored stem. Runtime identity and CSS stem are
`${system}__${className}` so independently published systems may all use
`button`. Runtime never guesses the compiler's variable binding. A first
argument that is not an object literal is a diagnostic and fails the compile.

### Required implementation

1. Require a string-literal `className` during extraction.
2. Emit a diagnostic and no recipe for absent/dynamic identity.
3. Emit a diagnostic and fail the compile when the first argument is not an
   inline object literal. Do not skip `recipe(definition)` silently.
4. Remove binding-name fallback from production compilation.
5. Extract and preserve `defaultVariants`.
6. Emit recipes under `NativeRuntimeArtifact.recipes[\`${system}__${className}\`]`.
7. Include:
   - qualified identity
   - base class
   - variant keys and value maps
   - default variants
   - compound selectors/classes
   - complete normalised combination lookup
8. Normalise boolean selections to `"true"`/`"false"` at the boundary.
9. Reject duplicate `(system, className)` in one compile. Across portable
   systems, Core dedupes byte-identical transitive tables (required for
   diamonds) and rejects same-identity/different-content conflicts.
10. Keep recipe atoms in `@layer recipes`; do not leak them into utility plans.
11. Update production recipe sources and matrices to explicit identity.

### Runtime behaviour the table must enable

- no props applies defaults
- explicit props override defaults
- unspecified axes retain defaults
- matching compounds append after variant classes
- array-valued compound predicates match any listed value
- invalid selection does not select an arbitrary combination
- `.raw()` can be implemented from the original Core config
- `variantKeys`, `variantMap`, and `splitVariantProps` remain accurate

### Gate

```bash
pnpm agentrs c atomic -t recipe
pnpm agentrs v atomic -t "RECIPE"
pnpm agentrs q packages/reference-rs/modules/atomic
```

Review all production matches from:

```bash
rg -n '\b(recipe|cva)\s*\(\s*\{' packages/reference-lib matrix fixtures
```

Intentional missing-identity refusal fixtures must say so in their README/spec.

---

## N4 — structured globals and direct portable output

### Global-style lowering

Receive base-system's recursive global IR. For every selector tree:

1. distinguish declarations from named conditions and nested selectors
2. canonicalise property names through canon
3. apply shorthands/macros where valid for global declarations, including
   `container: true` and responsive arrays; reject non-macro booleans
4. resolve rhythm and token values
5. lower named conditions through the same condition table as utilities
6. print deterministic kebab-case declarations
7. preserve custom properties and valid at-rules
8. report unsupported values with selector/property/source path
9. expand `staticCss` wildcards for every category in the spec table (colors,
   spacing, size, radius). This is `ATM-STATIC-03` and is required here, not
   remaining-queue work.

Do not create utility classes for global declarations.

Prove with a real lib-shaped fixture containing:

- `:root` custom property
- `body` font/rhythm declarations
- form selector lists
- `_hover`, `_focus`, `_disabled`, `_placeholder`
- `&:focus` and same-element attribute selectors
- token aliases and private token references
- keyframes and font faces

### Application and portable stylesheet forms

Both forms are printed from the same structured compiler result.

Application form:

- current package layer and internal layer order
- local token declarations available to the current app
- `data-theme` light/dark islands

Portable form:

- current package layer and internal layer order
- token declarations scoped to `[data-layer="<system>"]`
- selectors required for nearest unthemed/themed descendants
- no downstream AST rewrite

Core may concatenate upstream portable outputs and prepend its authored reset.
It may not parse either output to recover token blocks.

### Required cases

- `BAS-GLOBAL-01` consumed end to end
- `ATM-TOKEN-11` aliases in token output
- `ATM-COND-10`/`11` named state/media wraps
- `ATM-COND-13`/`14` ranges and nested `&`
- `ATM-COND-15` if its contract is global CSS
- `ATM-COND-16` container conditions
- `ATM-LAYER-05`/`06`/`08` static/global/font/layer chrome
- application vs portable token scope
- no-upstream and composed package layer order
- CSS parser accepts both strings
- zero `data-panda-theme`

The current `LAYER_PREAMBLE` is not sacred. Update it once to the package-layer
contract and review every changed golden. Never run a blanket golden update
before inspecting one representative output per affected family.

### Gate

```bash
pnpm agentrs c atomic -t "global"
pnpm agentrs v atomic -t "LAYER|TOKEN|COND"
pnpm agentrs v atomic
pnpm agentrs q packages/reference-rs/modules/atomic
```

---

## Styletrace join

N2 may retain current positive extraction while
[`../styletrace/PLAN.md`](../styletrace/PLAN.md) is in flight. Before the
native gate:

- compile receives `NativeCompileRequest` (source root, staged declaration
  root, `jsxHosts`)
- trace results are module-qualified bindings
- virtual stations have a hermetic primitive declaration fixture
- tracing errors are diagnostics, not `HashSet::new()`
- `ATM-SITE-13` removes the scan-all-tags fallback
- `ATM-SITE-01` and `ATM-SITE-08` remain positive with real imports/graph

Do not solve this with a PascalCase allowlist.

---

## Remaining station queue

Resume independent station work only after G1 (N2–N4 merged, ABI frozen).
`ATM-STATIC-03` is part of N4, not this queue. One case per implementor,
sequential on shared source.

Suggested order:

1. `ATM-SITE-14` — `css={{ … }}` no-input contract
2. `ATM-SITE-12` — tagged templates refusal
3. `ATM-SITE-15` — namespace/type-only/internal bindings
4. `ATM-LEAF-10` — important spellings
5. `ATM-COND-10`, `11` — state/media proof if not closed by N4
6. `ATM-TOKEN-06`, `07`, `08`, `09`, `11`
7. `ATM-ATOM-05`
8. `ATM-SITE-16` — cross-file constants with unchanged skip policy
9. `ATM-COND-13`, `14`, `15`, `16`
10. `ATM-VALID-01`, `03` — valid raw CSS passthrough; invalid warns/skips
11. `ATM-DIAG-04`, `05`, `06` — portable source spans/codes
12. `ATM-RECIPE-04`, `05`, `06`
13. `ATM-LAYER-05`, `06`, `08`
14. `ATM-FORBID-07`
15. `ATM-PERF-01` — separate measured incremental-compile campaign

For each slice:

1. Read the exact SPEC row.
2. Add/strengthen `tests/cases/<ID>/spec.ts`.
3. Make the smallest compiler change.
4. Run without golden update first.
5. Inspect expected CSS/runtime/diagnostics.
6. Update only the named goldens through the CLI.
7. Run quality.
8. Check the SPEC box only when the test asserts the prose.

```bash
pnpm agentrs v atomic
pnpm agentrs q packages/reference-rs/modules/atomic
```

---

## Do not

- Do not generate browser executable style functions.
- Do not make TypeScript derive class names or cascade slots.
- Do not keep the old `CssRuntime.classes` as a fallback ABI.
- Do not use compiler-local variable names as recipe identity.
- Do not accept a missing live system by calling `lib_fixture()`.
- Do not ingest raw TypeScript fragment source.
- Do not store or inject pre-rendered global CSS strings.
- Do not parse emitted CSS to produce portable CSS.
- Do not preserve `data-panda-theme`.
- Do not broaden extraction to every PascalCase tag.
- Do not refresh all goldens or edit quarantine to create green output.
- Do not reopen canon from an atomic slice without a demonstrated canon defect.
- Do not touch `packages/reference-core` from N2/N4; N3 may only add explicit
  `className` to production fixture sources assigned by the orchestrator.
- Do not add `#[allow(clippy::…)]` or `#[expect(clippy::…)]`.
