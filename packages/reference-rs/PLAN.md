# Reference RS — native cutover plan

This is the campaign plan for replacing Panda CSS with `reference-rs` in
Reference UI. It is written for low-context implementation agents: every
packet has an owner, inputs, forbidden scope, proof, and an explicit hand-off.
Do not substitute a plausible implementation for the stated contract.

Campaign 1 (the initial canon, base-system, typegen, and atomic compiler work)
landed on 2026-09-15. Git history owns that provenance. This document starts
at the integration boundary.

---

## 0. Mission and non-negotiable decisions

This branch is the native system branch. There is no compatibility campaign.

- `pnpm dev:lib` becomes native.
- `pnpm dev:docs` becomes native through the same normal sync path.
- `dev:lib:native` is deleted.
- `REF_SYSTEM_ENGINE` is deleted.
- Panda generation, Panda runtime helpers, Panda types, Panda config output,
  Panda worker/event names, and Panda dependencies are deleted.
- There is no flag-off branch, fallback import, dual-written artefact, or
  "temporary" Panda type pass.
- Intermediate integration commits may break the branch. A completed wave may
  not hide a missing native feature behind Panda.

We are not restarting `reference-core`. Keep its useful chassis:

- source and fragment discovery
- JavaScript fragment evaluation
- virtual file copying
- workers
- the scheduler as a serialized compile queue
- package generation/materialisation
- watch/session invalidation
- Vite/Webpack integration

Change what that chassis calls. Delete code whose only purpose was coercing
Panda output after the native replacement is proven. Do not redesign unrelated
CLI, reference, MCP, Book, or component architecture during this campaign.

### Definition of done

The campaign is complete only when all of these are true:

1. A normal `ref sync` evaluates the project's fragments into one versioned
   native system spec and passes that exact spec to atomic and typegen through
   `NativeCompileRequest` (source root, staged declaration root, and
   configured plus extends-adopted `jsxHosts`). Layers never contribute hosts.
2. Rust emits the local stylesheet, downstream-portable stylesheet, browser
   runtime plans, recipe tables, diagnostics, and declarations required by
   Core. Plans and class names carry owning-system identity. TypeScript does
   not recreate Rust class naming or style lowering.
3. Browser `css()`, primitive StyleProps, `box()`, and `recipe()` consume
   generated native data bound to an owning system and never import
   Panda-generated functions. `css()` and primitives share `SystemStyleObject`
   for style values; `variant` and `colorMode` stay primitive metadata, not
   `css()` keys.
4. A published library carries transitive CSS **chunks** and transitive
   runtime plans. Bundles externalise `createCss` / the plan registry; each
   package ships a tiny bound `css`/`recipe` helper closed over its `name`.
   CSS without that owner's plans is an incomplete portable system.
5. `extends` adopts config, types, and JSX hosts; `layers` does not. Both
   modes carry owner-qualified runtime plans and hashed CSS chunks. T5 proves
   two layered packages can map `font: "sans"` and `sm` independently.
6. `data-theme` is the only light/dark DOM and stylesheet attribute. Matrix
   product source uses it before deletion greps `matrix/`.
7. `@reference-ui/styled` is, at most, our generated data package. It contains
   no executable `css`, `cva`, `jsx`, or `patterns` implementation.
8. Core unit tests, native module tests, TypeScript consumers, the relevant
   single-consumer matrix, and chain T1–T13 pass. Missing T4/T5 fixtures are
   created before the chain claim is made. A clean output tree can sync:
   typegen and primitive declarations stage first, then styletrace/Atomic run
   against that root, then outputs publish atomically.
9. Book and docs run through their ordinary commands. Book is recognisable and
   usable in multiple captured states; native misses are filed as native bugs,
   not covered with a legacy fallback.
10. Product source and package manifests contain no Panda dependency or engine
    switch. Historical migration documents may still explain Panda. Public
    `getRhythm` still exists, moved off the deleted Panda tree.

---

## 1. Authority and vocabulary

### Plans and contracts

| Document                                                                     | Authority                                                                                             |
| :--------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **This file**                                                                | Campaign order, Core cutover, ownership, gates                                                        |
| [`modules/atomic/plan.md`](./modules/atomic/plan.md)                         | Atomic ABI/runtime/global/portable work and remaining `ATM-*` stations                                |
| [`modules/base-system/plan.md`](./modules/base-system/plan.md)               | Evaluated spec, profile, global-style IR                                                              |
| [`modules/typegen/PLAN.md`](./modules/typegen/PLAN.md)                       | Printer and Node binding                                                                              |
| [`modules/styletrace/PLAN.md`](./modules/styletrace/PLAN.md)                 | Hermetic StyleProps graph and fail-closed extraction                                                  |
| [`../reference-core/src/types/plan.md`](../reference-core/src/types/plan.md) | Core-owned public type assembly                                                                       |
| [`modules/atomic/SPEC.md`](./modules/atomic/SPEC.md)                         | Atomic behaviour                                                                                      |
| [`modules/base-system/SPEC.md`](./modules/base-system/SPEC.md)               | System ingestion/query behaviour                                                                      |
| [`modules/typegen/SPEC.md`](./modules/typegen/SPEC.md)                       | Declaration-printer behaviour                                                                         |
| [`../../docs/FEATURES/DATA_THEME.md`](../../docs/FEATURES/DATA_THEME.md)     | Public `data-theme` outcome; its Panda translator is obsolete once native emits the selector directly |
| [`../../matrix/CHAIN.md`](../../matrix/CHAIN.md)                             | `extends`/`layers` topology                                                                           |

If a module plan disagrees with this file about sequencing or cross-package
wire format, this file wins and both documents are corrected in the same
change. A module SPEC owns behavioural truth inside its crate. Do not add a
second root orchestration document.

### Use these names precisely

- **`EvaluatedSystemSpec`** — nested, JSON-safe output of evaluated local plus
  adopted `extends` fragments. This is the system definition Core lowers and
  Rust compiles. It is not the compile request.
- **`NativeCompileRequest`** — production Atomic input: the spec plus
  `jsxHosts`, `sourceRoot`, and staged `declarationRoot`.
- **`ResolvedBaseSystem`** — planning term for Rust's existing indexed
  `BaseSystem` after lowering. A broad Rust source rename is not required; the
  value never crosses into browser code.
- **`NativeRuntimeArtifact`** — data-only plans used by owner-bound browser
  `css()` and `recipe()`. Every style plan carries `system`.
- **`PortableBaseSystem`** — the published `baseSystem.mjs` object used by a
  downstream `extends` or `layers` entry: source-tagged fragments, hashed CSS
  chunks, owner-qualified runtime, extends-only JSX hosts.

Do not cast one of these into another. The current code has two incompatible
types both called `BaseSystem`; that ambiguity is the first footgun to remove.

---

## 2. Verified ground truth

These are integration facts, not implementation suggestions.

### The current native branch is not native

- `packages/reference-core/src/system/panda/gen/codegen.ts` still imports
  `@pandacss/node`.
- Under `REF_SYSTEM_ENGINE=native`, Panda global cssgen still runs before
  `compileSync`.
- `compileSync({ rootDir })` receives no live system and therefore uses
  `BaseSystem::lib_fixture()`.
- Core writes `CompileResult.stylesheet` but discards runtime and recipe data.
- Core's current portable `BaseSystem` is `{ name, fragment, css?,
jsxElements? }`, not Rust's indexed `BaseSystem`.
- `customCssFn.ts`, `customCvaFn.ts`, primitive generation, and
  `split-props.ts` still call generated Panda code.
- Core public types still import generated Panda ingredient types.

### Existing machinery worth keeping

- `getBaseCollectors()` already evaluates token, keyframe, font, global CSS,
  and pattern fragments in JavaScript.
- `prepareBaseFragments()` already distinguishes upstream `extends` fragments
  from local fragments and suppresses duplicate upstream global collection.
- `baseSystem.mjs` already transports bundled fragments, portable CSS, and JSX
  metadata between packages.
- workers and `scheduler.ts` already serialize codegen around a shared outdir.
- `reference-lib/scripts/materialize-runtime.mjs` already packages generated
  runtime files into a published bundle.
- matrix packages already exercise runtime, styles, types, rebuilds, and most
  composition topologies.

### Facts that change the design

1. `globalCss()` collects structured objects, not CSS strings. Real lib rules
   contain aliases, rhythm values, token references, named conditions, nested
   selectors, numeric values, `container: true`, responsive arrays, and
   `undefined` entries. Core cannot correctly stringify those with a generic
   serializer. Rust must lower and print them. Boolean is a legal declaration
   value only for dialect macros that document it (`container`).
2. `CssRuntime.classes` is insufficient for browser parity. One authored
   declaration can lower to several classes (`font`, `size`, `container`,
   border shorthands), and merge semantics need declaration slots, not a bag
   of class names.
3. `font`/`weight` lower through the compiling system's font registry, and
   breakpoint names carry that system's queries. Class names today use only
   condition/property/value. Two layered packages can therefore map
   `font: "sans"` or `sm` to different CSS. Runtime plans, class names, and
   bound `css()` carry `system`. `LayerScopeContext` is the active layer name
   (`string | null`), not a boolean, so B → A transitions emit `data-layer`.
4. `RecipeTable` currently lacks enough identity/default information for
   `customCvaFn`. Compiler variable bindings are not available when the
   browser later receives only the recipe config object. Runtime identity is
   `${system}__${className}`. A non-object-literal `recipe(definition)` is a
   diagnostic, not a silent skip.
5. Published fixture/library bundles externalise `@reference-ui/react`. A
   shared unbound `css()` cannot choose among owners. Each package ships a
   bound helper closed over its `name`; `createCss` and the merged plan
   registry stay external. Every `PortableBaseSystem` transports owner-tagged
   runtime plans and hashed CSS chunks.
6. Native atomic output is structured before printing. Portable package CSS
   is emitted from that structure in Rust as per-system chunks with content
   hashes. Flattened CSS strings cannot diamond-dedupe. Running PostCSS to
   deconstruct and reconstruct the emitted stylesheet would preserve the jank
   this campaign exists to delete.
7. `data-panda-theme` is still embedded in Rust conditions/goldens, Core
   runtime/tests, and matrix product source (`matrix/color-mode`,
   `matrix/system`). The native compiler emits `data-theme`. Matrix source
   moves in M0 before G2 so K1's product grep can pass.
8. `matrix/chain` currently has T1, T2, T3, and T6–T13. T4 and T5 are described
   in `matrix/CHAIN.md` but no packages exist. A "T1–T13 pass" is false until
   those fixtures are added.
9. Public config `jsxElements` exists for names tracing cannot infer
   (`matrix/primitives` uses a non-exported `PrimitiveJsxMarker`). Production
   compile receives configured plus extends-adopted hosts; layers are excluded.
   Styletrace returns module-qualified bindings, not a global name set.
10. Current production codegen runs before the runtime/declaration bundle, so
    `.reference-ui/react/system/primitives` does not exist on a clean tree when
    extraction would trace. Typegen and primitive `.d.ts` need only the spec.
    The driver stages those declarations, then runs styletrace/Atomic, then
    publishes atomically.
11. Core collectors cover tokens, fonts, keyframes, global CSS, and box
    patterns. There is no recipe fragment collector. Application `recipe()`
    types come from Core `RecipeDefinition` inference. `EvaluatedSystemSpec.recipes`
    may be empty in production. Typegen does not read Atomic output.
12. Typegen today omits empty token categories and can omit the style/condition
    surface when colors and spacing are absent. Core's public types import
    `ColorToken`, `SpacingToken`, `RadiusToken`, `StyleConditionKey`, and
    `FontRegistry`. Those aliases always exist (`never` / empty interface).
13. `getRhythm` is a public `@reference-ui/system` export, implemented under
    `system/panda/config/extensions/rhythm/`. `matrix/distro` tests it. It
    moves to `system/api/` before that Panda tree is deleted.
14. Panda `staticCss` currently pre-emits color, spacing, size, and radius
    wildcards from `system/panda/config/static-css.ts`. Atomic wildcard
    expansion today covers colors only. Production spec always includes that
    default table; N4 expands every category in it.
15. `variant` and `colorMode` are primitive metadata. Atomic discards them
    during style lowering. They are not members of the `css()` style-object
    contract.

---

## 3. Frozen cross-package contracts

Packet N1 may refine Rust field types while implementing this exact behaviour.
It may not change the meanings below without stopping and updating this file,
the module plans, generated TypeScript types, and contract fixtures together.

### 3.1 `EvaluatedSystemSpec`

The host writes a JSON artefact equivalent to:

```ts
interface EvaluatedSystemSpec {
  schemaVersion: 1
  profile: 'reference-ui'
  name: string
  tokens: Record<string, unknown>
  fonts: Record<string, unknown>
  breakpoints?: Record<string, string | { value: string }>
  conditions?: Record<string, string>
  globalCss: Array<{
    source: string
    rules: Record<string, GlobalStyleNode>
  }>
  keyframes: Record<string, unknown>
  recipes: Record<string, unknown>
  staticCss: Record<string, string[]>
  provenance: Array<{
    source: string
    kind: 'tokens' | 'fonts' | 'keyframes' | 'globalCss' | 'recipes' | 'fragment'
    keys?: string[]
  }>
}
```

`name` is the package identity (`ui.config.ts` `name`). It is the owner stamped
onto runtime plans, class names, recipe keys, CSS chunks, and bound `css()`.

`recipes` is fragment-declared recipe data only. Production lib currently has
no recipe fragment collector; an empty map is valid. Typegen may print recipe
unions when the spec contains recipes (fixtures). Application `recipe()` calls
in TSX are Atomic's runtime/CSS job; their TypeScript types come from Core
`RecipeDefinition` inference, not from typegen. Do not feed Atomic output into
typegen to invent live recipe ingredients.

`staticCss` is required on the production spec. When config omits an override,
Core writes the current Panda default wildcard table: color props, spacing
props, `width`/`height`/`size`, and `borderRadius`, each `['*']`. That list is
the F0 fixture default. Atomic must expand every wildcard category in this
table (not only colors) before G1.

`provenance` lists collector invocations with file path and contributed keys.
Rust token/font/recipe diagnostics include `source` from this table. Do not
label the whole spec `"upstream system fragment"`.

`GlobalStyleNode` is a recursive map of selectors, named conditions, and
declaration values. Declaration values are a closed enum, not unrestricted
JSON:

```ts
type GlobalDeclarationValue =
  | string
  | number
  | boolean
  | null
  | GlobalDeclarationValue[]
  | { [key: string]: GlobalStyleNode }

type GlobalStyleNode = Record<string, GlobalDeclarationValue | GlobalStyleNode>
```

JSON normalisation drops `undefined` object properties, preserves strings,
finite numbers, object order, responsive arrays, and `null` array holes.
Functions, symbols, non-finite numbers, and cycles are source diagnostics.
Boolean is legal only on dialect macros that document it (`container`). N4
rejects `display: true` and other non-macro booleans with a path-bearing
diagnostic. `container: true` lowers the same way as utility `container={true}`.
Do not turn `globalCss` into `string[]` in TypeScript.

`profile: 'reference-ui'` applies the canonical named conditions and standard
breakpoints in Rust. Authored breakpoints override same-name defaults in
declaration order. Canonical `_dark`/`_light` conditions use
`[data-theme=dark]` and `[data-theme=light]`. The profile is explicit so `{}` is
never mistaken for a live lib system.

Production Core must pass this field. Omitted `baseSystem` is an error at the
Node API. Rust-only tests may use an explicit fixture constructor; no implicit
`lib_fixture()` fallback survives on the production request.

This spec is not the compile request. JSX hosts, source root, and declaration
root live on §3.6 `NativeCompileRequest`.

### 3.2 `NativeRuntimeArtifact`

The browser receives versioned data, never generated executable style logic:

```ts
interface NativeRuntimeArtifact {
  schemaVersion: 1
  stylePlans: RuntimeStylePlan[]
  recipes: Record<string, RecipeRuntimeTable>
  stylePropNames: string[]
}

interface RuntimeStylePlan {
  system: string
  when: string[]
  prop: string
  value: unknown
  important: boolean
  declarations: Array<{
    slot: string
    className: string
  }>
}
```

Rules:

- `system` is the compiling package `name`. It is part of the lookup key and
  the class-name identity. Two packages may both author `font: "sans"` or `sm`;
  those plans must not collide.
- `when`, `prop`, `value`, and `important` describe the authored declaration
  before Rust expands aliases, shorthands, macros, arrays, or `r`.
- Lookup key is `(system, when, prop, value, important)`.
- `declarations` is what that authored declaration resolved to under **that
  system's** font registry, breakpoints, and tokens.
- Class names include a stable Rust-owned system segment. TypeScript must not
  derive class names or the system segment.
- `slot` is an opaque Rust-authored cascade identity **within one owner**.
  Aliases and shorthands that address the same final CSS property under the
  same conditions share a slot. `important` participates in lookup but does
  not create a second slot: a later declaration replaces an earlier
  declaration for that slot regardless of either spelling.
- The generated module builds an index using one checked stable serializer.
  Rust and TypeScript share a fixture corpus for strings, numbers, arrays,
  nested `r`, conditions, and `!important`.
- Bound `css(...inputs)` walks inputs in call order and replaces by `slot` for
  **its owner only**. Later declarations win without relying on class-string
  order.
- A runtime lookup miss emits one development diagnostic and omits that
  declaration. It never hashes a class, never searches another system, and
  never calls a fallback engine.
- A missing artefact or schema mismatch fails module initialisation.
- `stylePropNames` is the canon + Reference dialect property set used by
  `splitPrimitiveProps`; it is not inferred from only the classes encountered
  in one source tree. `variant` and `colorMode` are **not** style-object keys
  and are not in this list.

`css` and `recipe` are factories bound to an owner. The compiling package's
generated runtime binds them to `name`. Because published bundles externalise
`@reference-ui/react`, C5 rewrites each library's `css`/`recipe` imports to a
tiny generated bound helper that closes over the **publishing** package name
and reads the consumer's merged plan registry. `createCss` / the registry
implementation stay external; the owner is not the consumer's name.

`LayerScopeContext` is `string | null` (active layer system name), not
`boolean`. Primitives emit `data-layer` when the primitive's system name
differs from the inherited context, including consumer B → imported A.

Every recipe has an explicit string-literal `className`. Runtime identity and
CSS stem are `${system}__${className}` so generic stems such as `button` remain
composable across packages. `RecipeRuntimeTable` includes that qualified
identity, base class, variant keys/maps, default variants, compound matches,
and complete combination lookup. Duplicate `(system, className)` inside one
compile is an error. Identical transitive tables may dedupe across a diamond;
same qualified identity with different content is a sync error. Missing recipe
tables throw a descriptive error rather than returning an unstyled function.
A `recipe(definition)` call whose first argument is not an object literal is
a diagnostic (fail sync). Statically resolvable const bindings are out of this
cutover; they must not be silently skipped.

`RecipeRuntimeFn.raw()` is implemented from the original config captured by
`customCvaFn`; it does not need executable code from Rust. Boolean selections
normalise to `"true"`/`"false"` exactly once.

### 3.3 `CompileResult`

The Node seam returns:

```ts
interface CompileResult {
  stylesheet: string
  portableStylesheet: string
  runtime: NativeRuntimeArtifact
  diagnostics: Diagnostic[]
  wants?: Want[]
  atomCount?: number
}
```

- `stylesheet` is the current package's application form: package-layered
  rules with local token roots.
- `portableStylesheet` is emitted from the same Rust IR: package-layered rules
  whose tokens are scoped for downstream `[data-layer="<name>"]` use. It is
  one chunk whose `system` is this compile's `name`.
- Core concatenates already-portable upstream **chunks** by hash. It may not
  parse native CSS to make it portable or to recover a shared ancestor from a
  flattened string.
- Reset wrapping is Core's, not Rust's. Default (`normalizeCss !== false`)
  prepends `createRuntimeResetStylesheet()` to application CSS and
  `createPortableResetStylesheet(name)` to that package's portable chunk.
  `normalizeCss: false` prepends neither. Both forms and the opt-out are C4
  proofs.
- Both CSS forms use `data-theme`, contain deterministic layer order, and are
  syntactically valid CSS.
- `runtime.stylePlans[].system` equals this compile's `name`. Core concatenates
  upstream plans; lookup stays owner-qualified.
- Any diagnostic with severity `error` fails sync. Warnings are surfaced with
  `provenance` source information; they are not silently discarded.

### 3.4 `PortableBaseSystem`

The public `baseSystem.mjs` value is:

```ts
interface PortableCssChunk {
  system: string
  hash: string
  css: string
}

interface PortableFragment {
  source: string
  code: string
}

interface PortableBaseSystem {
  schemaVersion: 1
  name: string
  fragments: PortableFragment[]
  cssChunks: PortableCssChunk[]
  runtime: NativeRuntimeArtifact
  jsxElements: string[]
}
```

- `fragments` is the ordered, source-tagged config contribution for `extends`.
  Core evaluates them with per-file source wrappers. Do not flatten to one
  unlabelled string.
- `cssChunks` is ordered portable CSS, one chunk per originating system, with
  a content hash. Diamond merge: identical `(system, hash)` dedupes; same
  `system` with a different hash is a duplicate-version sync error naming both
  importers. Do not byte-compare concatenated strings to detect shared
  ancestors.
- `runtime` is this package's plans plus transitively adopted `extends` plans,
  each plan still carrying its originating `system`. `layers` contributions
  are merged the same way at the consumer, without adopting fragments or JSX.
- `jsxElements` is transitive **extends-only** metadata (`config.jsxElements`
  plus upstream `extends` hosts). Layers never contribute.
- `extends` consumes fragments, cssChunks, runtime, and jsxElements.
- `layers` consumes cssChunks and runtime only. It never evaluates fragments,
  adopts JSX metadata, or contributes token/type definitions.
- Identical duplicate style plans (including `system`) and recipe tables
  dedupe. A duplicate lookup key or qualified recipe identity with different
  content fails sync with both system names. Do not silently last-write.

A convenience concatenated `css` string may be derived at publish time for
humans; merge and conflict detection use `cssChunks` only.

### 3.5 Generated output inventory

| Path                                               | Contents                                             | Negative assertion                            |
| :------------------------------------------------- | :--------------------------------------------------- | :-------------------------------------------- |
| `.reference-ui/system/evaluated-system.json`       | Exact versioned Rust input                           | no functions, no core portable shape          |
| `.reference-ui/system/baseSystem.mjs` + `.d.mts`   | `PortableBaseSystem`                                 | no missing `cssChunks` or `runtime`; no unlabelled flattened `fragment` |
| `.reference-ui/system/compile-request.json`        | `NativeCompileRequest` (or equivalent driver input)  | no missing `jsxHosts` / `declarationRoot`     |
| `.reference-ui/styled/styles.css`                  | final assembled native CSS                           | no `data-panda-theme`, no Panda banner        |
| `.reference-ui/styled/runtime-data.mjs` + `.d.mts` | merged native runtime data                           | no generated namer or fallback code           |
| `.reference-ui/styled/types/index.d.ts`            | native typegen output/ingredients                    | no `@pandacss` import                         |
| `.reference-ui/styled/types/csstype.d.ts`          | vendored declaration dependency if still required    | no dependency on a consumer-hoisted `csstype` |
| `.reference-ui/react/**`                           | Core-authored runtime/primitives/types wired to data | no styled `css/cva/jsx/patterns` imports      |

After sync, obsolete `panda.config.ts`, `styled/global.css`, `styled/css/`,
`styled/jsx/`, and `styled/patterns/` paths must not exist. Cleanup is part of
generation, not a manual pre-test step.

### 3.6 `NativeCompileRequest`

Production Atomic is invoked with this request, not with a spec-only object:

```ts
interface NativeCompileRequest {
  schemaVersion: 1
  spec: EvaluatedSystemSpec
  jsxHosts: string[]
  sourceRoot: string
  declarationRoot: string
}
```

- `jsxHosts` is `config.jsxElements` ∪ every `extends` portable `jsxElements`.
  Layers never contribute. These names are extraction hosts even when
  styletrace cannot infer them (non-exported aliases such as
  `PrimitiveJsxMarker`).
- `sourceRoot` is the project files to extract.
- `declarationRoot` is the **staging** tree of generated primitive and
  `StyleProps` declarations from phase A, not a missing live outdir.
- Styletrace traces against `declarationRoot` and returns
  **module-qualified** bindings (`{ module, name }[]`), not a global
  `Set<string>`. A traced `Card` in one module does not make an unrelated
  `Card` in another module a host.
- Atomic unions module-qualified traces with unqualified `jsxHosts` (the
  allowlist matches local identifiers on purpose).
- Explicit traced-name injection remains a test/helper API only.

F0 includes a positive compile-request fixture with a configured host and an
extends-adopted host, and a negative fixture that must not include a layers
host.

---

## 4. Target flow

```text
author JS
  tokens() / font() / keyframes() / globalCss()
        │
        ▼
existing fragment bundler + collectors
        │
        ├── Portable fragments[] (source-tagged, for downstream extends)
        ▼
EvaluatedSystemSpec v1
        │
        ├── Phase A (spec-only, no source extraction)
        │     typegen ─────────► staging/styled/types
        │     primitive .d.ts ─► staging/react/.../primitives
        │
        ├── Phase B (extraction against staging)
        │     styletrace(declarationRoot) + jsxHosts
        │     atomic compile ──► stylesheet
        │                      ├► portableStylesheet chunk
        │                      └► NativeRuntimeArtifact (plans carry system)
        │
        └── Phase C — atomic publish of staging + compile outputs
              + upstream PortableBaseSystem cssChunks / runtime / fragments
                                ▼
                    .reference-ui/styled data package
                                │
                                ▼
              bound css() / box() / recipe() / primitives (owner = name)
```

The crossed-out path is:

```text
panda.config.ts → @pandacss/node → generated css/cva/jsx/patterns
                → PostCSS deconstruct/re-scope/reconstruct
```

---

## 5. Execution graph

Use one integration/orchestrator agent and at most three editing agents at
once. Separate worktrees are expected. Shared-file ownership below is strict.

```text
F0 contract freeze (orchestrator)
 │
 ├───────────────┐
 ▼               ▼
N1 base-system   N6 styletrace
 │
 ├───────────────┐
 ▼               ▼
N2 runtime ABI   N5 typegen Node seam
 │
 ▼
N3 recipes
 │
 ▼
N4 global + portable CSS + ATM-STATIC-03
 │
 └──────────┬────────── N5 ───────── N6
            ▼
          G1 native gate
            │
     ┌──────┼────────┐          Q1 remaining ATM stations
     ▼      ▼        ▼          (atomic only; frozen ABI)
    C1     C2       C3
  spec/   browser   types/
  compose runtime   package     exclusive files listed in packets
     └──────┼────────┘
            ▼
          C4 two-phase driver/workers (serial)
            ▼
          C5 materialisation (bound css rewrite)
            ▼
          M0 matrix backend-text (data-theme / K1 needles)
            ▼
          G2 prototype gate
            ▼
          K1 one-way switch + deletion
            ▼
          K2 residue audit
            ▼
          M1 matrix oracles + T4/T5
            ▼
          G3 final gates + Book
```

### Parallelism rules

- After F0, N1 and N6 may run in parallel.
- After N1's wire types land, N2 and N5 may run in parallel. N3 and N4 are
  sequential behind N2 because they share atomic compile/result/emitter files.
- N4 includes `ATM-STATIC-03` (wildcard static CSS for spacing/size/radius, not
  only colors). That station is not optional remaining-queue work.
- Do not run generic atomic station agents while N2–N4 are editing the crate.
- After G1, **Q1** (remaining `ATM-*` stations except STATIC-03) may run in
  parallel with C1–C3. Q1 must not change the frozen ABI. One atomic editor at
  a time.
- After G1, C1, C2, and C3 may run in parallel **only** because their owned
  files are exclusive:
  - C1: `types/public/BaseSystem.ts` among `types/**` (portable type rename)
  - C2: `types/public/recipe.ts` among `types/**` (`className` only)
  - C3: `types/**` except those two files
- C4 waits for all three. C4 owns production invoke order (typegen then
  atomic). C3 must not schedule codegen in `sync/events.ts`.
- C5 waits for C4 because it packages C4's exact output.
- M0 waits for C5 and runs before G2. K1 waits for G2. M1 waits for K2.
- K1 is one broad deletion/rename owner. Do not split deletion across agents.
- Read-only audits may run beside test commands. Matrix/Dagger commands are
  exclusive and run sequentially through `pnpm agent`; Rust builds use the
  `agentrs` CPU gate. Never bypass either queue.

### Merge order

Even when work was implemented in parallel, integrate in this order:

1. N1
2. N6
3. N2
4. N3
5. N4
6. N5
7. G1
8. C1
9. C2
10. C3
11. C4
12. C5
13. M0
14. G2
15. K1
16. K2
17. M1
18. G3

The orchestrator reruns each packet's proof after merge. An agent report is
evidence to inspect, not a gate result. Q1 stations merge after N4 and must
not land after K1 if they still mention Panda-only behaviour.

---

## 6. Native implementation packets

### F0 — freeze fixtures before editors start

**Owner:** orchestrator only.

**Work**

1. Add one committed JSON fixture for each contract in §3:
   `EvaluatedSystemSpec`, `NativeRuntimeArtifact`, `CompileResult`,
   `PortableBaseSystem`, and `NativeCompileRequest`.
2. Include scalar, array, nested condition, `r`, macro, shorthand,
   `!important`, recipe defaults/compound, private token, global CSS,
   `container: true`, a responsive array with a `null` hole, provenance
   entries, a `staticCss` wildcard table, `system` on every style plan, and
   cssChunks with hashes.
3. Include a second-system plan (`font: "sans"` / `sm`) whose class names and
   lookup keys differ from the first system.
4. Include `jsxHosts` with a configured name and an extends-adopted name, and
   a negative layers-host fixture.
5. Add a schema/version rejection fixture and a token-light spec (no colors /
   no spacing) for typegen empty-alias proof.
6. Record the expected output paths and absence list.

**Proof**

- Every N/C packet imports or reads the same fixture; no hand-copied mock
  shape.
- A TypeScript `satisfies` check and Rust serde test accept the positive
  fixture and reject the version/unknown-field fixture.
- The token-light fixture still typechecks Core's stable ingredient imports
  once N5 emits empty aliases.

**Do not**

- Do not start implementation before disputed fields are resolved.
- Do not call a current generated file the contract; it is legacy output.

### N1 — evaluated spec and Reference profile

**Owner:** base-system agent.

**Read first**

- `modules/base-system/SPEC.md`
- `modules/base-system/plan.md`
- `modules/base-system/src/spec.rs`
- `modules/base-system/src/lower/mod.rs`
- `modules/base-system/src/conditions.rs`
- `modules/base-system/src/breakpoints.rs`

**Work**

1. Make the nested v1 spec a public, versioned Rust boundary, including
   required `staticCss`, `provenance`, and `name`.
2. Add explicit `profile: reference-ui` lowering for canonical conditions and
   standard breakpoints; authored entries override defaults deterministically.
3. Expose the wire as `EvaluatedSystemSpec`; keep Rust's existing indexed
   `BaseSystem` name if a rename would add churn. Core's portable type is
   renamed instead, and docs must distinguish the forms.
4. Replace `global_css: Vec<String>` with the §3.1 declaration-value enum:
   string, finite number, boolean, null, arrays, nested maps. Accept
   `container: true` and responsive arrays with `null` holes. Reject boolean
   on non-macro properties with a path-bearing error. Carry `provenance`
   `source` on token/font/recipe diagnostics.
5. Make unknown top-level fields and unsupported schema versions errors.
6. Keep `lib_fixture()` only as an explicit Rust test fixture.
7. Change all canonical theme conditions to `data-theme`.

**Owned files**

- `modules/base-system/**`
- shared Rust fixture helpers required by base-system
- generated base-system TypeScript shape if owned by `reference-rs`

**Forbidden**

- `packages/reference-core/**`
- atomic emit/runtime code
- JavaScript fragment evaluation in Rust

**Proof**

```bash
pnpm agentrs c base_system
pnpm agentrs q packages/reference-rs/modules/base-system
pnpm --filter @reference-ui/rust base-system --check
```

Expected assertions: v1 accepted; v2/unknown field rejected; profile conditions
contain `data-theme`; override order stable; `container: true` and responsive
arrays survive lowering; `display: true` is a path-bearing error; provenance
source appears on a token diagnostic; omission is not an implicit lib fixture.

### N2 — authored-declaration runtime plans

**Owner:** atomic runtime-contract agent.

**Depends on:** N1.

**Work**

1. Replace browser-facing `CssRuntime.classes` with §3.2 style plans. Every
   plan has `system` equal to the spec `name`. Lookup key is
   `(system, when, prop, value, important)`.
2. Capture authored values before macro/shorthand/array/`r` expansion.
3. Record every resolved atom as an opaque cascade slot + class. Class names
   include a stable Rust-owned system segment so two systems' `font: "sans"`
   and `sm` do not collide.
4. Define one stable value serializer and a Rust/TypeScript fixture corpus.
5. Prove last-wins by slot for alias/longhand, shorthand/longhand, macro,
   conditions, arrays, multiple `css()` arguments, and `!important`, all
   within one owner.
6. Add `stylePropNames` from canon plus native dialect props. Exclude
   `variant` and `colorMode`.
7. Move `ATM-MERGE-01`–`03`, `ATM-UNIT-01`–`02`, and `ATM-SEAM-01` onto this
   contract. Do not defer them past browser integration.
8. Update generated TS bindings and `@reference-ui/rust/atomic` tests.

**Owned files**

- `modules/atomic/src/runtime/**`
- the smallest required atom/extract/resolve/result files
- `modules/atomic/js/**`
- atomic contract fixtures/tests

**Forbidden**

- Core runtime implementation
- class hashing changes unrelated to a proven collision
- generated executable `css.js`

**Proof**

```bash
pnpm agentrs c atomic
pnpm agentrs v atomic
pnpm agentrs q packages/reference-rs/modules/atomic
```

Expected assertion: TypeScript consumes the returned plan fixture and produces
the exact class list expected by Rust without implementing a namer. Two
fixtures with the same authored `font: "sans"` and different `system` values
produce different class names and do not share a lookup key.

### N3 — recipe identity and runtime table

**Owner:** atomic recipe agent.

**Depends on:** N2.

**Work**

1. Require a string-literal `className` on every production recipe definition.
2. Remove variable-binding identity fallback from the public contract.
3. Carry `defaultVariants` into extraction and the table.
4. Emit a recipe dictionary keyed by `${system}__${className}`. CSS stems use
   the same qualification.
5. Diagnose a non-object-literal first argument (`recipe(definition)`); fail
   that compile. Do not silently skip. Statically resolvable const bindings
   are out of this cutover.
6. Prove default selection, explicit override, boolean variants, compounds,
   multi-axis combinations, `.raw()`, variant metadata, duplicate
   `(system, className)` failure, and two systems both using stem `button`.
7. Migrate all authored source and matrix recipe definitions to explicit
   `className`. Test-only refusal fixtures may intentionally omit one.

**Owned files**

- atomic recipe/extract files and tests
- generated atomic recipe types
- recipe fixture source outside Core only when adding `className`

**Forbidden**

- `customCvaFn.ts` (C2 owns it)
- a runtime lookup by compiler-local variable name
- fallback to Panda cva

**Proof**

```bash
pnpm agentrs c atomic -t recipe
pnpm agentrs v atomic -t "RECIPE"
pnpm agentrs q packages/reference-rs/modules/atomic
```

Static proof:

```bash
rg -n '\b(recipe|cva)\s*\(\s*\{' packages/reference-lib matrix fixtures
```

Every production object-literal match must contain a nearby explicit
`className`. Also list `recipe(` / `cva(` calls whose first argument is not an
object literal; each is either a named refusal fixture or is migrated to an
inline object.

### N4 — structured global CSS and portable emission

**Owner:** atomic stylesheet agent.

**Depends on:** N1, N2, N3.

**Work**

1. Lower `GlobalStyleNode` through the same canon, shorthand, macro, rhythm,
   token, and condition rules used by utilities, but emit declarations under
   authored selectors instead of classes. Lower `container: true` and
   responsive arrays the same way as utilities. Reject non-macro booleans.
2. Preserve nested `&`, named pseudo conditions, media/container conditions,
   custom properties, keyframes, and deterministic source order.
3. Emit both application and downstream-portable stylesheet forms directly
   from compiler IR. Portable output is one chunk for this compile's `name`.
4. Scope portable token blocks with `data-layer`; preserve nearest
   `data-theme` island behaviour.
5. Expand `staticCss` wildcards for every category in the spec table (colors,
   spacing, size, radius). Close `ATM-STATIC-03` here.
6. Review and intentionally update affected goldens. Never blanket-refresh.
7. Update `LAYER_PREAMBLE`/layer tests to the package-layer contract.

**Owned files**

- atomic stylesheet/global lowering files and stations
- affected base-system query helpers by coordination with N1 owner

**Forbidden**

- PostCSS in Rust or Core
- a TypeScript global-CSS serializer
- raw insertion of unresolved token/rhythm strings

**Proof**

```bash
pnpm agentrs c atomic -t "global"
pnpm agentrs v atomic -t "LAYER|TOKEN|COND"
pnpm agentrs v atomic
pnpm agentrs q packages/reference-rs/modules/atomic
```

Parse both output forms with the existing JS CSS parser in an atomic seam
test. Assert zero `data-panda-theme`, correct package layer, correct scoped
portable tokens, exact global declarations from a real lib-shaped fixture
including `container: true`, and static CSS atoms for a spacing wildcard.

### N5 — typegen Node seam

**Owner:** typegen agent.

**Depends on:** N1 wire type; runs parallel with N2–N4.

**Work**

1. Add a thin N-API binding and JS entry for
   `emitDtsSync({ baseSystem, strict })`.
2. Accept the same `EvaluatedSystemSpec` fixture as atomic and lower it through
   the same base-system entrypoint.
3. Export `@reference-ui/rust/typegen`; stop treating the pure Rust printer as
   unreachable from Core.
4. Keep filesystem writes in Core. The native function returns text.
5. Keep `strict` an option, never a spec field.
6. Always emit Core's imported aliases, including empty systems: `ColorToken`,
   `SpacingToken`, `RadiusToken`, `StyleConditionKey`, and `FontRegistry`.
   Empty token categories are `never`; empty `FontRegistry` is `{}`. Always
   emit the style/condition surface for `profile: 'reference-ui'`.
7. Recipe variant unions print only when `spec.recipes` is non-empty. An empty
   production map is valid. Do not read Atomic output.
8. Preserve the printer contract and forbid generated jsx/pattern/runtime
   code.

**Owned files**

- `modules/typegen/**`
- its thin native binding
- runtime switchboard registration
- `packages/reference-rs` JS build/export metadata

**Forbidden**

- Core type assembly
- filesystem writes in Rust
- adding type fields only to mimic Panda

**Proof**

```bash
pnpm agentrs c typegen
pnpm agentrs v typegen
pnpm agentrs v runtime
pnpm agentrs q packages/reference-rs/modules/typegen
```

Expected assertions: JS import works; same v1 fixture emits expected token,
condition, and font unions; token-light fixture still exports the stable empty
aliases; schema mismatch throws; output contains no `@pandacss`; recipe unions
appear only when the fixture declares recipes.

### N6 — hermetic styletrace

**Owner:** styletrace agent.

**Runs parallel after:** F0.

Follow [`modules/styletrace/PLAN.md`](./modules/styletrace/PLAN.md).

**Outcome**

- Production compile receives `NativeCompileRequest`: source root, staged
  declaration root, and `jsxHosts`.
- Trace results are module-qualified bindings, not a global `Set<string>`.
- Configured `jsxHosts` match local identifiers (the allowlist).
- Virtual tests receive a tiny committed sync-root fixture. Explicit traced
  names remain a test/helper API only.
- Missing primitive declarations and trace errors are explicit diagnostics.
- `ATM-SITE-13` removes scan-every-PascalCase fallback after the positive
  primitive/wrapper graph is proven.

**Proof**

```bash
pnpm agentrs c styletrace
pnpm agentrs v styletrace
pnpm agentrs v atomic -t "SITE-01|SITE-08|SITE-13"
pnpm agentrs q packages/reference-rs/modules/styletrace
```

### G1 — native gate

**Owner:** orchestrator.

Run after N1–N6 merge:

```bash
pnpm agentrs t
```

Then inspect the committed contract fixture through both JS APIs. Do not
proceed if atomic and typegen accept different system shapes, if production
requests still default to `lib_fixture()`, if style plans lack `system`, if
the token-light fixture omits empty aliases, or if either stylesheet contains
`data-panda-theme`.

---

## 7. Core implementation packets

### C1 — collectors → evaluated spec; portable composition

**Owner:** Core system-input agent.

**Read first**

- `packages/reference-core/src/system/base/create.ts`
- `packages/reference-core/src/system/base/fragments/index.ts`
- `packages/reference-core/src/system/api/*.ts`
- `packages/reference-core/src/config/{types,validate}.ts`
- `matrix/CHAIN.md`

**Work**

1. Replace Panda `Config[...]` API types in tokens/font/keyframes/globalCss
   with Reference-owned JSON-safe author types.
2. Remove the box-pattern collector. `box()` is native `css()`; pattern
   extension functions are not a second compiler API.
3. Execute collectors once and normalise their arrays into
   `EvaluatedSystemSpec`, including required `staticCss` (the current wildcard
   table when config omits an override) and `provenance`.
4. Lift authored `tokens({ breakpoints: ... })` entries into
   `EvaluatedSystemSpec.breakpoints`; do not leave them as ordinary style
   tokens. Profile defaults fill only names the author did not override.
5. Record collector `source` in `provenance` and on each `globalCss` entry.
   Publish `fragments: Array<{ source, code }>`; do not flatten to one
   unlabelled string.
6. Apply `extends` privacy correctly: upstream `_private` trees do not enter
   the consumer spec/types, while the owner's compiled portable CSS/runtime
   remains intact.
7. Rename the Core public portable type to `PortableBaseSystem`. Validate
   `cssChunks`, owner-qualified `runtime`, and extends-only `jsxElements`.
8. Merge upstream chunks/runtime in `[...extends, ...layers, local]` bucket
   order. Deduplicate identical `(system, hash)` CSS chunks and identical
   style plans (including `system`). Same system/hash mismatch or same
   qualified recipe identity with different content fails sync naming both
   systems.
9. Collect compile `jsxHosts` as `config.jsxElements` ∪ extends-adopted
   `jsxElements`. Layers never contribute. Write them on the compile request,
   not only on the portable artefact.
10. Move `getRhythm` to `system/api/get-rhythm.ts` (or equivalent non-Panda
    path). Keep the `@reference-ui/system` export. `matrix/distro` continues
    to import it.
11. Write `evaluated-system.json` and initial `baseSystem.mjs` atomically and
    deterministically.
12. Add stale/corrupt/schema-version tests.

**Owned files**

- Core `system/api/**` (including moved `getRhythm`)
- `system/base/**`
- `config/types.ts`, `config/validate.ts`, related tests
- `types/public/BaseSystem.ts` only (portable type rename). No other
  `types/**` files.

**Forbidden**

- compiler driver/worker/event files
- browser runtime files
- Core public style type assembly (`types/**` except `BaseSystem.ts`)
- evaluating author JavaScript in Rust

**Proof**

```bash
pnpm agent vitest core -t "base|fragment|config"
pnpm agent run pnpm --filter @reference-ui/core typecheck
```

Expected fixture assertions: hundreds of lib token leaves after lib collection,
non-empty structured globals, 31 lib keyframes unless source changed
deliberately, explicit profile, default `staticCss` wildcards present,
provenance sources on collectors, no functions, upstream private removed,
cssChunks hashed, jsxHosts exclude layers, `getRhythm(2)` still a string,
deterministic rerun byte equality.

### C2 — browser runtime, primitives, and `data-theme`

**Owner:** Core browser-runtime agent.

**Consumes:** the F0/N2/N3 runtime fixture, not generated Panda output.

**Work**

1. Implement a data-only runtime loader with schema assertion and an index
   keyed by `(system, when, prop, value, important)`.
2. Export `createCss(systemName)` / `createRecipe(systemName)`. The compiling
   package binds them to `config.name`. Lookup never searches another owner.
3. Rewrite `customCssFn` to walk objects, consume that owner's plans, and
   merge by opaque slots. Keep `css.raw` as the authored object helper. Do
   not type `variant` or `colorMode` as `css()` style keys.
4. Make `box` an alias/wrapper of native `css`.
5. Rewrite `customCvaFn` against qualified recipe tables while preserving the
   public callable helpers.
6. Implement `splitPrimitiveProps` from `stylePropNames`.
7. Change `primitives.liquid` to import only Core runtime helpers. Bind
   primitives to the generating package `name`.
8. Change `LayerScopeContext` to `string | null` (active system name). Emit
   `data-layer` when the primitive's name differs from the inherited name,
   including B → A. Use `data-theme` for color mode. Delete
   `data-panda-theme` handling rather than supporting both.
9. Add one-warning-per-missing-plan development behaviour and hard failure for
   missing/schema-invalid runtime data.

**Owned files**

- `system/runtime/**`
- `system/primitives/**`
- `types/public/recipe.ts` only (`className` on `RecipeDefinition`). No other
  `types/**` files.
- color-mode constants/tests

**Forbidden**

- any `@reference-ui/styled/css`, `/css/cva`, `/jsx`, or `/patterns` import
- a JS class namer
- `compileSync` in browser code
- a Panda fallback on miss

**Proof**

```bash
pnpm agent vitest core -t "customCssFn|customCvaFn|splitPrimitiveProps|color mode|primitive"
pnpm agent run pnpm --filter @reference-ui/core typecheck
```

Required tests: shorthand/longhand and alias/longhand last-wins; macro
multi-class; responsive array; nested selector; nested `r`; multiple inputs;
important; miss; schema mismatch; lookup does not return another system's
`font: "sans"`; recipe defaults/boolean/compound/raw/split; two `button` stems
under different systems; `box === css` behaviour; `data-theme` nearest island;
layer context B → A re-emits `data-layer`.

### C3 — native declarations and data package

**Owner:** Core types/package agent.

**Read first**

- [`../reference-core/src/types/plan.md`](../reference-core/src/types/plan.md)
- `packages/reference-core/src/types/public/**`
- `packages/reference-core/src/types/generators/**`
- `packages/reference-core/src/packager/packages.ts`
- `packages/reference-core/src/system/build/styled/**`

**Work**

1. Own the declaration text, public type wiring, and a `writeTypes` helper
   C4 calls during phase A. Do not register production invoke order in
   `sync/events.ts`.
2. Keep Core's authored `SystemStyleObject` as the public composition over
   `csstype`; consume native token/condition/font unions as ingredients.
   Import the stable empty aliases from N5. Do not import typegen recipe
   types; application recipe types stay `RecipeDefinition` inference.
3. Remove `UtilityValues`, `SystemProperties`, Panda `Conditions`, and every
   other backend type import.
4. Ensure generated declarations can resolve `csstype` hermetically. Preserve
   or generate the local declaration copy; do not assume pnpm hoists it.
5. Reduce `@reference-ui/styled` exports to data:
   `styles.css`, `runtime-data`, and `types`. Remove css/cva/jsx/pattern
   exports.
6. Cover `variant` and `colorMode` on primitive `StyleProps` only, not as
   `css()` / `SystemStyleObject` keys.
7. Update package-copy manifests and declaration tests. Include a token-light
   consumer that still resolves the stable aliases.

**Owned files**

- Core `types/**` except `types/public/BaseSystem.ts` and
  `types/public/recipe.ts`
- `packager/packages.ts` and packager tests
- `system/build/styled/**`

**Forbidden**

- browser runtime implementation
- compiler driver and `sync/events.ts` scheduling
- `types/public/BaseSystem.ts` and `types/public/recipe.ts`
- re-exporting typegen's whole `SystemStyleObject` as Core's public type
- running Panda "just for declarations"

**Proof**

```bash
pnpm agent vitest core -t "types|packager|styled"
pnpm agent run pnpm --filter @reference-ui/core typecheck
pnpm agent test --packages=@matrix/typescript
```

Expected assertions: strict and open consumers compile; a token-light system
still resolves `ColorToken` / `SpacingToken` / `StyleConditionKey` /
`FontRegistry`; common CSS properties, aliases, conditions, fonts, and event
handlers retain types; `css()` rejects `variant` / `colorMode` as style keys
while primitives accept them; generated declarations contain native token
literals and zero `@pandacss`.

### C4 — native compiler driver, workers, scheduler

**Owner:** Core integration agent.

**Depends on:** C1, C2, C3. Runs serially.

**Work**

1. Replace `system/panda/gen` with a generically named native compiler driver.
2. Phase A (spec only): write typegen output and generated primitive
   declarations into a staging root. These do not need extraction.
3. Phase B: build `NativeCompileRequest` with the live spec, `jsxHosts` from
   C1, `sourceRoot`, and the staging `declarationRoot`. Run styletrace then
   Atomic against that request.
4. Fail on native error diagnostics; log warnings.
5. Phase C: atomically publish stylesheet, runtime data, declarations,
   primitives, and the final portable system from staging plus compile output.
   A clean deleted `.reference-ui` tree must succeed.
6. Assemble already-portable upstream **cssChunks** by hash without parsing
   compiler output. Prepend `createRuntimeResetStylesheet()` to application
   CSS and `createPortableResetStylesheet(name)` to that package's portable
   chunk when `normalizeCss !== false`. Prove the opt-out leaves both
   unwrapped.
7. Preserve scheduler serialisation and watch invalidation; rename events and
   worker files away from Panda.
8. A CSS-only rebuild may call the same native build operation; correctness
   precedes incremental optimisation.
9. Make native unconditional. Remove the environment branch and root
   `dev:lib:native` script here, before deletion.

**Owned files**

- compiler driver
- system workers/events/scheduler
- sync readiness/complete event wiring
- root script entry
- stylesheet string assembly needed by the native result

**Forbidden**

- `@pandacss/node`
- writing `panda.config.ts`
- calling global cssgen
- keeping old event names as aliases
- PostCSS transformation of native output

**Proof**

```bash
pnpm agent vitest core -t "codegen|compiler|worker|scheduler|sync"
pnpm agent run pnpm --filter @reference-ui/core build
pnpm agent run pnpm --filter @reference-ui/lib sync
```

After a **deleted** `.reference-ui` tree, sync must succeed. Import
`runtime-data.mjs` and `baseSystem.mjs` in a Node assertion, parse
`styles.css`, verify every path/absence item in §3.5, assert `jsxHosts`
contains configured and extends-adopted names only, and assert both reset
forms plus `normalizeCss: false`.

### C5 — package materialisation and externalised runtime

**Owner:** package-boundary agent.

**Depends on:** C4.

**Work**

1. Update `reference-lib` materialisation to copy the data-only styled package
   and rewrite only valid native exports.
2. Remove rewrite entries for styled css/cva/jsx/patterns.
3. Because bundles externalise `@reference-ui/react`, rewrite each library's
   `css`/`recipe` imports to a generated bound helper that closes over that
   package's `name` and reads the consumer plan registry via `createCss`. Do
   not bundle a second style engine. `PortableBaseSystem.runtime` remains
   mandatory.
4. Apply the same boundary to fixture libraries used by chain tests.
5. Assert packaged output contains CSS chunks, runtime data, declarations,
   the complete portable base system, and `getRhythm`.
6. Assert clean rebuild removes stale Panda-generated directories.

**Owned files**

- `packages/reference-lib/scripts/**`
- fixture package build/bootstrap scripts
- package-boundary tests/config only

**Forbidden**

- changing runtime semantics
- silently bundling a second runtime to avoid transitive plan bugs
- leaving stale files because tests ran on an already-generated workspace

**Proof**

```bash
pnpm agent run pnpm --filter @reference-ui/lib build
pnpm agent test --packages=@matrix/distro
pnpm agent test --packages=@matrix/chain-t1
pnpm agent test --packages=@matrix/chain-t2
```

### G2 — working native prototype

**Owner:** orchestrator.

Run:

```bash
pnpm agent vitest core
pnpm agent run pnpm --filter @reference-ui/core typecheck
pnpm agent run pnpm --filter @reference-ui/core build
pnpm agent run pnpm --filter @reference-ui/lib build
pnpm agent test --packages=@matrix/system
pnpm agent test --packages=@matrix/css
pnpm agent test --packages=@matrix/primitives
pnpm agent test --packages=@matrix/recipe
pnpm agent test --packages=@matrix/typescript
```

This gate may expose native compiler holes. File each against an existing or
new SPEC station, implement it natively, and rerun the owning matrix. Do not
proceed to deletion with runtime fallback imports, missing globals,
untransported upstream runtime data, unbound `css()` in published libraries,
or a failed clean-tree sync.

---

## 8. One-way deletion packets

### K1 — delete the old engine

**Owner:** one deletion/rename agent.

**Depends on:** G2 (which depends on M0).

**Work**

1. Delete `packages/reference-core/src/system/panda/**` after confirming
   `getRhythm` lives under `system/api/` (C1) and default `staticCss` is
   produced from the spec (C1/N4), not this tree.
2. Delete Panda-only stylesheet deconstruction/reconstruction:
   `demotePandaGlobalCssLayer`, `dropUnresolvedPrivateTokenDeclarations`,
   `createPortableStylesheetFromContent`, old postprocess orchestration, and
   their Liquid stylesheet templates. Retain only generic reset/string
   assembly still called by native.
3. Delete Panda-only virtual transforms (`css-imports`, `cva-imports`,
   neutralisation) after native extraction tests prove canonical imports.
   Keep a transform only if a named Reference dialect contract still requires
   it, and rename it away from backend vocabulary.
4. Delete box-pattern extension API/collector and generated export.
5. Remove `@pandacss/dev`, `@pandacss/node`, and `@pandacss/types` from Core.
6. Regenerate the lockfile through pnpm; do not hand-edit dependency entries.
7. Delete stale tests that only mock Panda. Replace behavioural coverage at
   the native seam; do not merely remove assertions.
8. Rename source comments, event types, logs, constants, worker names, and
   docs that describe the live backend as Panda.
9. Keep `liquidjs` only if primitive generation still imports it. Primitive
   generator replacement is not part of this campaign.
10. Keep PostCSS dependencies only where a remaining non-Panda production
    feature imports them; test-only parser use belongs in dev dependencies.

**Forbidden**

- compatibility shims
- dead directories kept for import stability
- aliases for old events/environment variables
- deleting matrix expectations instead of migrating them

**Proof**

```bash
pnpm agent vitest core
pnpm agent run pnpm --filter @reference-ui/core typecheck
pnpm agent run pnpm --filter @reference-ui/core build
```

Static assertions:

```bash
test ! -d packages/reference-core/src/system/panda
test ! -f packages/reference-core/src/system/workers/panda.ts
test ! -e packages/reference-lib/.reference-ui/panda.config.ts
! rg -n '@pandacss|REF_SYSTEM_ENGINE|data-panda-theme|run:panda|system:panda|runPanda' \
  package.json packages/reference-core packages/reference-lib matrix \
  --glob '!**/*.md'
! rg -n '@reference-ui/styled/(css|jsx|patterns)' \
  packages/reference-core packages/reference-lib fixtures matrix \
  --glob '*.{ts,tsx,js,mjs}'
```

### K2 — independent residue audit

**Owner:** read-first cleanup agent, different from K1.

**Depends on:** K1.

**Work**

1. Start from the static assertions above.
2. Inspect every surviving `panda` text match. Historical docs may explain the
   removed backend; product code, generated outputs, commands, and current
   architecture docs may not depend on it.
3. Inspect all `@reference-ui/styled` imports. Only native data/type exports are
   allowed.
4. Run a sync from stale output containing fake Panda directories and prove
   generation removes them.
5. Search package manifests and lockfile for Panda packages.
6. Verify there is exactly one default lib/docs command and no engine switch.
7. Report each allowed historical match with path and reason. "Probably fine"
   is not a result.

**Proof**

```bash
rg -n -i 'panda|REF_SYSTEM_ENGINE|dev:lib:native' \
  package.json pnpm-lock.yaml packages/reference-core packages/reference-lib matrix docs || true
pnpm agent run pnpm --filter @reference-ui/lib sync
```

The first command is an audit listing, not automatically zero because
historical markdown can remain. The scoped K1 assertions must be zero.

---

## 9. Matrix migration and final proof

### M0 — matrix product text for native attributes

**Owner:** matrix agent after C5, before G2.

Migrate product and test source that would fail K1's non-Markdown grep, without
creating T4/T5 or changing assertion philosophy:

- `data-panda-theme` → `data-theme` in `matrix/color-mode`, `matrix/system`,
  and any other `matrix/` product or spec file.
- Other K1 needles (`@pandacss`, `REF_SYSTEM_ENGINE`, `run:panda`,
  `system:panda`, `runPanda`) in `matrix/` product/test TypeScript.

Do not weaken computed-style oracles. Do not delete matrix packages.

**Owned files:** `matrix/**` product/test source matching those needles.

**Forbidden:** `packages/reference-core/**`, `packages/reference-rs/**`,
creating chain T4/T5, changing native runtime semantics.

**Proof**

```bash
! rg -n '@pandacss|REF_SYSTEM_ENGINE|data-panda-theme|run:panda|system:panda|runPanda' \
  matrix --glob '!**/*.md'
pnpm agent test --packages=@matrix/system
pnpm agent test --packages=@matrix/color-mode
```

### M1 — remaining native oracles and missing chain fixtures

**Owner:** matrix agent after K2.

Do not weaken assertions to fit native output. Change remaining
backend-specific *shape* assertions to behavioural native assertions:

- `panda.config.ts` path assertions become `evaluated-system.json`,
  `runtime-data.mjs`, `cssChunks`, or absence assertions.
- generated `styled/css` shape assertions become runtime-plan data assertions.
- class names are asserted only where native naming stability is the contract;
  browser tests should assert computed behaviour.
- CSS parser tests continue to validate emitted syntax and stale-rule cleanup.

Create missing `matrix/chain/T4` and `T5` packages:

- T4: three declared `extends`, order preserved; adopted tokens/types and all
  imported components resolve.
- T5: three declared `layers`, order preserved; no token/type adoption; each
  imported component resolves through owner-bound runtime plans and scoped
  CSS. Include colliding authored `font: "sans"` and `sm` with different
  system meaning.

For every T1–T13 package, add or retain assertions for:

1. visible imported component
2. computed token/style result
3. expected layer order
4. extends type adoption or layers type isolation
5. transitive runtime plan presence
6. no duplicate recipe/runtime conflict
7. no Panda artefact after sync

### Verification matrix

| Output/behaviour                                  | Unit seam                      | Required matrix                              |
| :------------------------------------------------ | :----------------------------- | :------------------------------------------- |
| evaluated spec, globals, tokens, fonts, keyframes | base-system + Core base tests  | `system`, `tokens`, `font`                   |
| runtime plans and slot merge                      | atomic + Core runtime tests    | `css`, `spacing`, `responsive`, `primitives` |
| recipes                                           | atomic recipe + Core cva tests | `recipe`                                     |
| declarations                                      | typegen + Core type tests      | `typescript`, `distro`                       |
| portable CSS/runtime                              | Core composition tests         | chain T1–T13                                 |
| rebuild/stale cleanup                             | Core scheduler/sync tests      | `watch`, `css`, `font`                       |
| color islands                                     | base/atomic/Core color tests   | `color-mode`, `system`                       |
| packaged consumer                                 | package materialisation tests  | `distro`, `playwright`                       |

### G3 — final automated gate

Run in this order; stop on first failure and route it to the owning packet:

```bash
pnpm agentrs t
pnpm agent vitest core
pnpm agent run pnpm --filter @reference-ui/core typecheck
pnpm agent run pnpm --filter @reference-ui/core build
pnpm agent run pnpm --filter @reference-ui/lib build

pnpm agent test --packages=@matrix/system
pnpm agent test --packages=@matrix/tokens
pnpm agent test --packages=@matrix/font
pnpm agent test --packages=@matrix/css
pnpm agent test --packages=@matrix/css-selectors
pnpm agent test --packages=@matrix/spacing
pnpm agent test --packages=@matrix/responsive
pnpm agent test --packages=@matrix/primitives
pnpm agent test --packages=@matrix/recipe
pnpm agent test --packages=@matrix/color-mode
pnpm agent test --packages=@matrix/typescript
pnpm agent test --packages=@matrix/watch
pnpm agent test --packages=@matrix/distro

pnpm agent test --packages=@matrix/chain-t1
pnpm agent test --packages=@matrix/chain-t2
pnpm agent test --packages=@matrix/chain-t3
pnpm agent test --packages=@matrix/chain-t4
pnpm agent test --packages=@matrix/chain-t5
pnpm agent test --packages=@matrix/chain-t6
pnpm agent test --packages=@matrix/chain-t7
pnpm agent test --packages=@matrix/chain-t8
pnpm agent test --packages=@matrix/chain-t9
pnpm agent test --packages=@matrix/chain-t10
pnpm agent test --packages=@matrix/chain-t11
pnpm agent test --packages=@matrix/chain-t12
pnpm agent test --packages=@matrix/chain-t13
```

Then run the K1 static assertions again against a freshly generated tree.
`pnpm agent test:matrix` is the final broad regression pass after the targeted
oracles are green; it is not the first debugging command.

### G4 — Book and docs visual gate

Agents do not start `pnpm dev:lib`. Ask the developer to run:

```bash
pnpm dev:lib
```

Then:

```bash
pnpm capture --list
pnpm capture Reference
pnpm capture Portal --states
pnpm capture Overlay --states
```

Capture at least:

- default Book chrome
- a token-heavy component
- a recipe-heavy component
- light and dark nested islands
- focus-visible
- an overlay/portal

Embed the capture table in the implementation chat. The acceptance bar is not
pixel equality with Panda. It is coherent layout, native classes present,
global chrome present, interactions usable, and no console/runtime missing-map
errors. File visual holes against concrete atomic/global/type/runtime
contracts.

After Book, run the ordinary docs command and smoke the docs entry:

```bash
pnpm dev:docs
```

The developer owns the long-running server. The verifier owns browser
inspection and console evidence.

---

## 10. Agent prompt and completion protocol

### Copy this shape into every implementation prompt

```text
Mission:
  Implement packet <ID> from packages/reference-rs/PLAN.md. Do not implement
  adjacent packets.

Read first:
  <exact files and SPEC cases>

Input contract:
  <fixture/schema and dependency commit>

Owned files:
  <exact directories/files>

Forbidden files and shortcuts:
  <exact paths>
  No Panda fallback. No new engine flag. No generated class namer.

Required outcomes:
  1. <observable outcome>
  2. <observable outcome>

Required proof:
  <commands>
  <expected assertions, not just exit code>

Stop conditions:
  Stop and report if the frozen fixture cannot represent the implementation,
  a required dependency is absent, or success requires a forbidden path.
  Do not redesign the contract silently.

Completion report:
  Files changed; contract decisions; commands and results; generated/golden
  review; remaining failures; anything that contradicted the plan.
```

### Orchestrator review after every agent

1. Read the diff, not only the report.
2. Confirm edits stayed inside ownership.
3. Rerun the exact targeted commands.
4. Run the negative assertion for the packet.
5. Test one failure path: wrong schema, missing data, duplicate identity,
   unsupported global value, or runtime miss as applicable.
6. Inspect generated/golden changes line by line.
7. Update this plan immediately if repository evidence invalidated a claim.
8. Merge in §5 order and give the next agent the merged commit, not a stale
   worktree assumption.

### Status words

- **done** — all required proof passed after integration.
- **implemented, blocked at gate** — code exists but named external failure
  remains; include command/output.
- **contract conflict** — frozen fixture or plan is insufficient; no silent
  redesign.
- **not started** — dependency not merged.

Never report "mostly done", "should work", or "tests look fine".

---

## 11. Global prohibitions

- Do not preserve a flag-off Panda path.
- Do not call `compileSync` in browser code.
- Do not generate executable `css.js`, `cva.js`, `jsx`, or patterns code.
- Do not implement a class namer or cascade-slot algorithm in TypeScript.
- Do not serialize `globalCss` to raw CSS in TypeScript.
- Do not parse native emitted CSS to reconstruct portable output.
- Do not pass Core's portable system object as Rust's evaluated spec.
- Do not default production compilation to `lib_fixture()`.
- Do not stuff missing live values into `lib_fixture()`.
- Do not silently dedupe conflicting runtime or recipe identities.
- Do not look up runtime plans without an owning `system`.
- Do not flatten portable fragments or CSS into unlabelled strings used for
  merge or diagnostics.
- Do not omit configured/extends `jsxHosts` from the production compile
  request, or adopt them from `layers`.
- Do not run styletrace/Atomic against a missing live declaration tree.
- Do not import typegen recipe types as required Core ingredients.
- Do not omit empty token-category aliases from typegen output.
- Do not keep `data-panda-theme` as an alias.
- Do not weaken matrix assertions or refresh all goldens to make a run green.
- Do not empty quarantine by editing the quarantine list.
- Do not add `#[allow(clippy::…)]` or `#[expect(clippy::…)]`.
- Do not reopen canon unless a concrete native contract test proves canon data
  is wrong; report that as a contract conflict first.
- Do not re-architect Core workers, virtual files, packager, scheduler, Book,
  docs, reference, or MCP while replacing their styling dependency.
- Do not run raw Cargo, Vitest, or Playwright commands. Use `pnpm agentrs` and
  `pnpm agent`.
- Do not start the developer's `pnpm dev:lib` server.
- Do not let an agent "also clean up" a neighbouring packet.

The speed comes from one-way decisions, small owned packets, and executable
gates—not from skipping contracts.
