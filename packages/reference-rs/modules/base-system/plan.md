# Base system — native cutover plan

This crate owns the evaluated system boundary consumed by atomic and typegen.
It does not evaluate author JavaScript, load package graphs, print CSS, or
write generated files. Core evaluates fragments; this crate validates,
normalises, indexes, and answers queries.

Campaign sequencing and the frozen cross-package contract live in
[`../../PLAN.md`](../../PLAN.md). This file owns packet **N1**.

Contract: [`SPEC.md`](./SPEC.md).

Runner: `pnpm agentrs c base_system`.

---

## Current state

Already present:

- nested token-spec lowering through `BaseSystem::from_json`
- indexed token/font/breakpoint/condition/keyframe/recipe queries
- explicit invalid-leaf, duplicate, and cycle errors
- a generated `lib.json` fixture
- an indexed `BaseSystem` that atomic and typegen consume

Not sufficient for the cutover:

- the nested wire type is private and unversioned
- omission silently permits an empty/default system
- host conditions and breakpoints are secretly overlaid only by
  `lib_fixture()`
- `global_css` is `Vec<String>`, but Core collects structured objects
- canonical conditions still use `data-panda-theme`
- the wire/query type and Core's portable package artefact are both called
  `BaseSystem`

Do not solve these by scraping more values into `lib.json`.

---

## Required boundary

Use the root plan's names:

- `EvaluatedSystemSpec` — public nested serde wire input
- `ResolvedBaseSystem` — planning term for the existing indexed Rust
  `BaseSystem` query type; a broad source rename is not required
- `PortableBaseSystem` — Core/package output; not a type in this crate

The v1 evaluated spec has:

```text
schemaVersion: 1
profile: "reference-ui"
name
tokens
fonts
breakpoints?
conditions?
globalCss[]
keyframes
recipes
staticCss
provenance[]
```

Unknown top-level fields and unsupported versions fail. JSON is evaluated
data, never TypeScript source. The exact positive and negative fixtures are
owned by root PLAN packet F0.

### Reference profile

`profile: "reference-ui"` explicitly supplies:

- the canonical named pseudo/state/media conditions
- standard responsive breakpoint names/widths
- `_dark` → `[data-theme=dark] &`
- `_light` → `[data-theme=light] &`

Authored condition/breakpoint entries override same-name profile entries
deterministically. Missing or unknown profile names are errors. Do not make
the profile an implicit effect of package name.

### Structured global CSS

Replace `Vec<String>` with a recursive, typed global-style IR:

- top level: ordered `{ source, rules }` fragments
- each `rules` value is an ordered selector → node map
- declaration values: string, finite number, boolean (only dialect macros
  that document it, currently `container`), null array holes, arrays, or
  nested maps
- `undefined` is removed by the Core JSON normaliser before Rust
- custom-property names are preserved
- named conditions and arbitrary `&` selectors remain distinguishable from
  declarations
- non-macro booleans and other unsupported scalar kinds are
  diagnostics/errors, not stringified

The spec also carries required `staticCss`, `name`, and `provenance`. Empty
`recipes` is valid production input.

Base-system stores structure. Atomic owns canonical property/value/condition
lowering and CSS printing.

Do not use unrestricted `serde_json::Value` past the parse boundary. Convert
to an enum/struct whose invalid states are explicit.

---

## Implementation order

### BAS-NATIVE-01 — public versioned spec

1. Expose the nested spec and parse error needed by the N-API boundaries.
2. Validate `schemaVersion === 1`.
3. Deny unknown fields.
4. Keep the indexed Rust `BaseSystem` distinct from the public evaluated spec.
   Core renames its package artefact to `PortableBaseSystem`; do not perform a
   broad Rust rename only for terminology.
5. Add `from_spec`/`from_json` APIs that return `Result`.
6. Remove production reliance on `Default` as a valid live system. Default may
   remain useful for focused Rust unit construction.

**Tests**

- root positive fixture lowers
- version 0/2 reject
- absent version rejects
- unknown field rejects
- current Core `{ name, fragment, jsxElements }` rejects
- TypeScript source rejects

### BAS-NATIVE-02 — profile lowering

1. Move the current fixture-only canonical condition/breakpoint overlays into
   a reusable profile.
2. Apply profile first, then explicit authored overrides.
3. Preserve declaration order for new authored breakpoints.
4. Emit/query only `data-theme`; remove `data-panda-theme` from production
   Rust and affected goldens.
5. Make `lib_fixture()` call the same public lowering path with an explicit
   profile instead of mutating a resolved system afterward.

**Tests**

- profile alone has base + sm/md/lg/xl/2xl
- profile `_hover`, `_dark`, `_light`, `_print`, and container conditions are
  exact
- authored `md` and `_hover` override profile values
- unknown profile rejects
- no serialized resolved system contains `data-panda-theme`

### BAS-NATIVE-03 — global-style IR

1. Add recursive global fragment/node/declaration types.
2. Preserve ordered fragments and selectors.
3. Preserve strings, finite numbers, custom properties, conditions, and
   selectors.
4. Accept boolean only for documented dialect macros (`container`). Accept
   responsive arrays and `null` holes. Reject booleans on other properties,
   functions, and non-CSS nested shapes with a path-bearing error that
   includes `provenance.source` when present.
5. Add query/iterator APIs atomic can consume without cloning the whole tree.

**Tests**

- implement `BAS-GLOBAL-01` with the real object shape
- nested `_focus`, `&:focus`, media/container conditions survive
- rhythm/token strings remain authored strings for atomic
- `undefined`-free normalised input round-trips
- invalid value reports selector/property path
- `container: true` is accepted; `display: true` is rejected
- two fragments retain source order

### BAS-NATIVE-04 — live-query completeness

Complete the SPEC cases required by native integration:

- `BAS-GLOBAL-02` breakpoints
- `BAS-GLOBAL-03` conditions
- `BAS-FONT-01` family/fallback
- `BAS-FONT-02` structured font-face descriptors
- `BAS-FONT-03` named weights
- `BAS-FONT-04` font-level CSS
- `BAS-TOKEN-05` category contract, or explicitly revise the SPEC if open
  categories remain intentional
- `BAS-TOKEN-06` private visibility metadata

Each tick needs a direct unit test asserting the SPEC prose. Do not tick an
item because another broad fixture happens to contain the field.

---

## Composition case ownership

`BAS-EXTEND-*`, `BAS-LAYER-*`, and `BAS-GLOBAL-04` are required campaign
proof, but package graph loading does **not** move into this crate.

- This crate provides visibility/private metadata and deterministic system
  lowering.
- Core owns fragment evaluation, `extends` adoption, `layers` isolation,
  portable CSS/runtime transport, deduplication, and conflict diagnostics.
- Matrix chain T1–T13 owns browser/package proof.

When completing those SPEC rows, point each case at a named Core unit or
matrix oracle. Do not implement package resolution in Rust merely to make the
checkbox local.

---

## Commands and done gate

During a slice:

```bash
pnpm agentrs q packages/reference-rs/modules/base-system
pnpm agentrs c base_system -t "<case or module>"
```

Before N1 hand-off:

```bash
pnpm agentrs c base_system
pnpm agentrs q packages/reference-rs/modules/base-system
pnpm --filter @reference-ui/rust base-system --check
```

Done means:

- the shared v1 fixture is accepted
- atomic and typegen can receive the same resolved result
- profile behaviour is explicit and tested
- global styles are structured
- production paths cannot obtain `lib_fixture()` by omission
- production Rust emits/contains no `data-panda-theme`
- all newly checked SPEC rows have direct assertions

---

## Do not

- Do not evaluate TypeScript or inspect project directories here.
- Do not write CSS, class names, runtime modules, or `.d.ts`.
- Do not store global CSS as pre-rendered strings.
- Do not use `serde_json::Value` as the long-lived domain model.
- Do not add an implicit package-name/profile heuristic.
- Do not keep a Panda condition map beside a native condition map.
- Do not deep-clone the full system per compiler pass.
- Do not add `#[allow(clippy::…)]` or `#[expect(clippy::…)]`.
- Do not change Core files from the N1 agent.
