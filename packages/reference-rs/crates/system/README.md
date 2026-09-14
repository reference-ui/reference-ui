# System

Native **atomic CSS compiler** for Reference UI.

Authors write StyleProps / `css()` / recipes. They never write class
names. Compile still emits utilities (`.mt_2r`, `.bg_n300`) because
runtime `css()` is an open composition API: build finds **what’s
possible**, runtime concatenates **what this instance needs**. Hashed
whole-object classes cannot name `{ ...base, ...override }`. See
`src/atom/README.md`.

Panda v2 already has this machine — extract → encode → **stylesheet**,
plus a generated **`css()`**. We copy that split. We do not copy the JS
evaluator (`PANDA.md`). Production today is still
`@pandacss/*` **^1.11.1**. This tree is README-driven scaffold.

JS face: `packages/reference-rs/js/system` — Atlas-thin `compile()`.
Two artifacts, not a “tables” folder: **stylesheet** and **css**.

## Final shape

```
User TSX / css() / cva() / sva()
        │
        ▼
┌───────────────────┐
│  canon            │  DICTIONARY: webref standards + Reference dialect join
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  styletrace crate │  WHO: StyleProps names + wrapper graph
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ extract/sites     │  WHERE: JSX attrs, css(), recipe calls
│ extract/leaves    │  WANTS: both ternary branches; no eval
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ atom              │  Want → Atom → AtomSet   (Panda encoder)
│ resolve           │  tokens, rhythm, shorthands, conditions
│ recipes           │  cva / sva → closed classes
└─────────┬─────────┘
          ▼
        ┌─┴──────────────┐
        ▼                ▼
┌───────────────┐  ┌───────────────┐
│ stylesheet    │  │ runtime       │
│ styles.css    │  │ css() lookup  │
│ @layer …      │  │ same namer    │
└───────────────┘  └───────────────┘
        │                │
        ▼                ▼
.reference-ui/styled/styles.css
.reference-ui/styled/css          ← browser concat
```

`compile()` returns both. Ghost class (css() asks for an atom the sheet
never printed) is a P0. A collected want that never became an atom is a P0.

Tripwires. Any of these means we built the wrong machine:

- execute the author's JS to learn a value (a sandbox, a fake DOM, a
  module-graph eval)
- hash a StyleProp object as the runtime key
- drive the compiler from JS by calling a parser over the boundary

## Architectural Pipeline

One crate. Panda's 12 process crates are internal **modules** inside `system`:

- **Canon (`canon`)**: Central dictionary defining the official set of HTML elements, Reference primitives, canonical CSS properties, StyleProps aliases, and responsive conditions. Represents the two-layer join between living W3C/WHATWG specifications (`@webref/css`, `@webref/elements`) and the Reference UI design system dialect. The generator lives at `packages/reference-rs/canon/` and emits `src/canon/`. It is a compiler dictionary, not a pass or third artifact (`compile()` returns only `{ stylesheet, css, diagnostics }`).
- **Ingestion (`config`)**: Ingests `tokens()`, recipes, and conditions without external JS hooks.
- **Extraction (`extract`)**: Discovers JSX attributes, `css()`, and recipe calls using `styletrace` without guessing tags, extracting both branches of conditionals without runtime JS evaluation.
- **Encoding (`atom`)**: Lowers wants into canonical `(prop, value, conditions)` atomic sets.
- **Resolution (`resolve`)**: Expands shorthands to non-conflicting longhands and resolves token and condition variables.
- **Recipes (`recipes`)**: Encodes compound and variant recipe combinations into closed utility classes.
- **Stylesheet (`stylesheet`)**: Compiles atoms into layered CSS text (`@layer reset, global, base, tokens, recipes, utilities` — six, see `src/stylesheet/layers/README.md`).
- **Runtime (`runtime`)**: Serializes the single canonical class namer for browser concatenation. Named `runtime` because `stylesheet` is the module that emits CSS.
- **Diagnostics (`diagnostics`)**: Fail-closed traces for unsupported syntax.

`src/lib.rs` coordinates the single compiler façade: `compile() -> { stylesheet, css, diagnostics }`. Individual file descriptions belong in each respective file's top comment.

## Styletrace

Sibling crate. Public API (keep calling it, don’t fork it in):

- `collect_reference_style_prop_names` — the StyleProps surface
- `trace_style_jsx_names` — wrappers that still hit primitives / `css` /
  `splitCssProps` / `box`

Panda only sees tags you listed in config. Styletrace already traces
Reference wrappers. Sites is “which expressions on those tags.”

## Two artifacts

| Name | What | Written by core to |
| :--- | :--- | :--- |
| `stylesheet` | CSS text, layered | `.reference-ui/styled/styles.css` |
| `runtime` | `(prop, value, when) → class`, concat | `.reference-ui/styled/css` |

There is no third “tables” product. Panda’s `styled-system/css/css` **is**
`css`. Their `styles.css` **is** `stylesheet`. JS `compile()` returns
those two fields plus `diagnostics`.

## What we lift vs leave

| Lift | Leave |
| :--- | :--- |
| Atomic grain, cascade layers, conditions, recipes | `literal.rs` evaluator, `undefined` → Null |
| Encoder `Atom` as the IR | Hashed whole-object classes for StyleProps |
| Stylesheet compiler + generated `css()` | Codegen of `jsx/`, `types/`, `patterns/`, Spec Studio |
| One namer (`runtime_class_name_for_atom` idea) | JS `createShorthandUtility` as the only expand |
| Rhythm / token vars we already own in core | Vue / Svelte / Astro (30k LOC in Panda) |

`STYLE_ERRORS_REPORT.md`: expand shorthands to longhands that don’t reset
color, **then** name atoms. Same namer at runtime. Do not hash the pair.

## Must not

- Hashed CSS-in-JS as the StyleProps key
- A JavaScript evaluator
- A Tasty type graph
- A second styletrace
- A `js/system/tables` (or IR, or rule) folder
- Criterion, Vue, 12 crates named after Panda’s

## Public contract (when wired)

```text
compile(request) -> { stylesheet, css, diagnostics }
```

Authoring unchanged. Accurate surface: `css` and `recipe` (= `cva`) plus the ~90
tag primitives (`Div`, `Span`, …) on `@reference-ui/react`; `tokens()`,
`font()`, `globalCss()`, `keyframes()`, `getRhythm()` on `@reference-ui/system`.
`sva` / `cx` / `splitCssProps` / `box()` are `@reference-ui/styled` plumbing, not
authoring. **There is no `Box` / `Flex` / `Grid` component** — earlier drafts
listed one. See `REFERENCE_SYSTEM.md` §1.

Class spelling may differ from Panda’s snapshot; grain (one class per leaf) does
not.

`@reference-ui/rust/system` is not exported yet.

## Testing

**v1 must be provable without `reference-core`.** The engine is a pure function
—  sources + config in, CSS + class map out — so it can be scored end to end
inside `packages/reference-rs`, with no sync worker, no packager, no Panda, no
bundler. Integration is a *later* gate, not the first one.

Gates in order. Do not skip to the last one.

| # | Gate | Home | Touches core? |
| :--- | :--- | :--- | :--- |
| A | Crate internals | `#[cfg(test)]` next to each module | no |
| B | **Golden cases** | `tests/system/cases/<case>/` — `input/app/**.tsx` in, `output/{styles.css,css.json,diagnostics.json}` out. Same layout as `tests/atlas/cases/` and `tests/tasty/`. Vitest via `crates/napi`. | no |
| C | **Panda v1 differential** | Same fixture sources through both engines; diff the CSS. Panda v1 is in production and its real output is already on disk (e.g. `.pipeline/registry/staging/reference-ui-lib-0.0.46/.reference-ui/styled/styles.css`). | no |
| D | Matrix | `matrix/*` Playwright — the **integration** gate, after A–C are green | yes |

Gate B is the one the docs were missing. `tests/atlas/cases/README.md` is the
template: one folder per scenario, `input/app/` as the project root, goldens
written under `output/`. A ghost class or a dropped leaf should fail there, in
milliseconds, long before a browser is involved.

Gate C is why cutover is low-risk: we do not need to *guess* parity, we can
diff against the engine currently shipping. Class **spelling** may legitimately
differ (see the public contract above), so the diff is on declarations and
coverage — every `(prop, value, when)` Panda emitted must have an atom here.

Panda v1 stays in production until D.

## Decided (v1 output contract)

These four were open; they are settled because they define what the Gate B
goldens must contain, so v1 cannot be written without them.

| Call | Decision | Lives in |
| :--- | :--- | :--- |
| `staticCss` | `config` lowers it into **wants**, a third want source beside sites and leaves. Not expanded at emit. | `src/config/README.md` |
| Layer preamble | `system` emits all **six** natively (`reset, global, base, tokens, recipes, utilities`). Core's `demotePandaGlobalCssLayer` becomes dead at cutover. | `src/stylesheet/layers/README.md` |
| Shorthand cascade | Expansion **and** property-priority sorting. Both halves. | `src/stylesheet/README.md`, `src/resolve/shorthands/README.md` |
| Runtime module name | `src/runtime`, not `src/css`. `stylesheet` owns "emits CSS"; `runtime` owns the browser lookup. Disk path stays `.reference-ui/styled/css`. | `src/runtime/README.md` |

## Open questions

Undecided. Do not resolve these by writing code — they change the module map.
Each is a real subsystem that exists in `reference-core` today and has no owner
in this tree.

Both are **deferred to integration (Phase 3)**. A standalone engine returning
strings does not need either answer, and guessing now is how the seam grows
early. That deferral is the de-risking — see Testing.

Also deferred: how thick `js/system` gets. v1 needs one `compile()` so Gate B
can call it. A Panda-style Driver (config diff, split cadences, `applyChange`,
sink routing) is an integration concern, and core's sync worker already owns
those duties today.

### 1. Core's TypeScript stylesheet stage *(deferred to Phase 3)*

`packages/reference-core/src/system/stylesheet/` (573-line README) is a second
CSS stage **after** Panda, in TypeScript, on PostCSS +
`postcss-selector-parser`. It:

- extracts `@layer tokens` and re-hangs root token declarations on
  `[data-layer="<name>"]`
- rewrites `[data-panda-theme=dark]` theme selectors into a layer domain
- **synthesizes public color utility classes** (`.bg_*`, `.bg-c_*`, `.c_*`) when
  Panda did not emit them
- assembles local + upstream layer CSS in source order (the `matrix/chain`
  T1–T13 contract) via `templates/assembledStylesheet.liquid`
- `dropUnresolvedPrivateTokenDeclarations`
  (`demotePandaGlobalCssLayer` is already settled — see Decided; system emits
  `global` itself, so that one transform dies at cutover)
- emits the nested portable form `@layer <lib> { @layer reset { … } }`

Utility-class synthesis is a **second namer, in TypeScript** — the exact thing
`src/stylesheet/name/README.md` forbids. That is a live split-brain in Reference
UI itself, independent of Panda.

Undecided: which of those jobs move into `stylesheet`, and which stay TS
post-processing over system output. This decides whether `compile()` returns
*final* CSS or *pre-portable* CSS, and it is the difference between a lean
engine and a larger one.

### 2. Sink, cadence, and who watches *(deferred to Phase 3)*

- `REFERENCE_SYSTEM.md` §7 shows Rust doing "Direct Emission" to
  `.reference-ui/styled/styles.css`; `js/system/README.md` has core writing it.
  Panda's rule (`design-notes/output-and-host-layer.md`) is that the engine
  returns strings and never writes, because the CSS sink is polymorphic (file,
  PostCSS `root.append`, virtual module, memory). We have Vite **and** Webpack.
- Panda separates two cadences: artifacts regenerate on **config change**, CSS
  on **every build**. Our single `compile() -> { stylesheet, css, diagnostics }`
  fuses them. `css` only changes when config does.
- `@parcel/watcher` is used by `src/watch/watcher.ts`, `src/session/watch.ts`,
  and `src/bundlers/output-subscription.ts` (buffering managed output writes for
  bundlers). Only the first is a Panda-input concern, so "delete
  `@parcel/watcher`" is over-stated the same way "delete `virtualrs`" was.
  `matrix/watch` must stay green. Panda's answer is a host-fed
  `applyChange(change)`; Atlas's answer is `analyze(rootDir)` with discovery in
  Rust. We have not picked.

## Status

Scaffold. Modules exist. No extractor, no printer, no napi, no cutover.
