# Reference System

> **Mandate.** Own the style engine. Public authoring stays small. Atomic CSS stays an implementation detail. Panda v1 (`@pandacss/*` ^1.11.1) remains production until the matrix is green on the native path.
>
> Living code: `packages/reference-rs/modules/atomic` (compiler) and `packages/reference-core/src/system` (host, fragments, types, portable CSS). Architecture: [`packages/reference-rs/docs/atomic.md`](packages/reference-rs/docs/atomic.md). This file is the map of **what users do**, **what has landed**, and **what still has to be a contract** before we can cut Panda.

Panda still does atomic CSS, layers, conditions, and recipes well. We are not writing Panda v3. We are deleting the translation layer between JSX we already parse and CSS the matrix already scores — and splitting the jobs Panda fused into one “styled-system” farm.

---

## 1. User story

A Reference UI app author never writes a class name and never configures an atomic CSS engine.

They write this:

```tsx
import { Div, css, recipe } from '@reference-ui/react'
import { tokens, font, globalCss, keyframes } from '@reference-ui/system'

tokens({
  colors: {
    n300: { value: 'oklch(…)' },
  },
})

keyframes({ fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } } })

const card = recipe({
  base: { p: '4r', rounded: 'md' },
  variants: {
    tone: { quiet: { bg: 'n100' }, loud: { bg: 'n300' } },
  },
})

export function Card({ selected }: { selected: boolean }) {
  return (
    <Div
      mt="2r"
      bg={selected ? 'n300' : 'n100'}
      _hover={{ bg: 'n400' }}
      className={css({ borderBottom: '3px solid' })}
    />
  )
}
```

That is the whole public surface, by package:

| Package | What authors import | What it is |
| :--- | :--- | :--- |
| **`@reference-ui/react`** | `css`, `recipe` (this *is* `cva`), ~90 tag primitives (`Div`, `Span`, …), `StyleProps` | Runtime. Style props on primitives. Open composition. |
| **`@reference-ui/system`** | `tokens()`, `font()`, `globalCss()`, `keyframes()`, `getRhythm()` | Build-time design-system fragments. Not a CSS compiler. |
| **`@reference-ui/styled`** | nothing, in userland | Generated plumbing: `sva`, `cx`, `splitCssProps`, `box()`. Not documented authoring. |

There is **no `Box` / `Flex` / `Grid`**. `sva` is not exported from `@reference-ui/react`. Earlier drafts of this document listed both.

What authors believe they are doing:

1. **Declare a design system** — tokens, fonts, keyframes, global CSS. Data, evaluated once at sync.
2. **Style instances** — StyleProps on primitives, or `css({ … })`. Open map. Ternaries, spreads, runtime props.
3. **Name component variants** — `recipe()` / `cva`. Closed set of variants. Style props on a recipe host are still atoms, not baked into the recipe class.

What they must never have to know: utility class spelling (`.mt_2r`), `@layer` buckets, whether a value became a CSS variable, or which engine printed the sheet.

---

## 2. “System” is three jobs with one name

The word is overloaded. Snubbing that first is the whole map.

| Name in the repo | What it actually is | Owner today |
| :--- | :--- | :--- |
| **`@reference-ui/system`** | Authoring API for fragments (`tokens`, `font`, `globalCss`, `keyframes`) | `reference-core` `src/entry/system.ts` |
| **`reference-core/src/system`** | The **host pipeline**: collect fragments, write Panda config, run Panda, post-process CSS, write `baseSystem`, generate some types, build primitives | TypeScript. Stays the host. |
| **`reference-rs/modules/atomic`** | The **atomic CSS compiler**: source in, `{ stylesheet, css, diagnostics }` out | Rust + a thin JS `compile()`. Was `modules/system`. |
| **`baseSystem`** | The design-system **definition**, made portable. Fragments collected (`tokens`, `font`, `globalCss`, `keyframes`) become `fragment`; compiled CSS becomes `css`. This is what `ui.config.ts` `extends` and `layers`. | `reference-core` `src/system/base` |

Call the Rust crate what it does: **stylesheet compiler** / **atomic engine**. Keep `@reference-ui/system` as the authoring package. Do not invent a fourth public name for users.

Panda today is the thing that secretly does *all four*: evaluate config, emit CSS, emit `css()`, *and* emit a type farm (`styled-system/types`, recipes, jsx, patterns). That fusion is why “replace Panda” feels like one project. It is not.

---

## 3. High-level map

Fragments do not plug into types or the engine. They **become a base system**. That artefact is the definition. Types and the atomic engine both read it. Other packages `extends` / `layers` it.

```
┌────────────────────────────────────────────────────────────────┐
│ 1. FRAGMENTS  (JavaScript)                                     │
│    Scan tokens() / font() / globalCss() / keyframes()          │
│    Micro-bundle those files, execute them                      │
└───────────────────────────────┬────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. BASE SYSTEM                                                 │
│    The definition of this design system                        │
│    fragment  — bundled fragment IIFEs                          │
│    css       — compiled sheet (filled in after the engine)     │
│    name, jsxElements                                           │
└───────────────────────────────┬────────────────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ 3. TYPES (TS)    │  │ 4. ATOMIC ENGINE │  │ 5. OTHER PACKAGES│
│ token unions,    │  │ (Rust)           │  │ extends: [bs]    │
│ StyleProps,      │  │ extract → atom → │  │ layers:  [bs]    │
│ recipe variants  │  │ stylesheet+css() │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

`extends` merges an upstream base system’s `fragment` into yours (tokens land in types). `layers` appends upstream `css` without merging the definition. Neither is a fourth compiler.

### 3.1 Fragments stay in JavaScript

`packages/reference-core/src/lib/fragments` already does this: find call sites, micro-bundle, `import()` the bundle, capture the objects passed to `tokens()` / `keyframes()` / …. Fast, and the right grain — authors write real TS with imports and computed values. Rust must not grow a JS evaluator to learn a token scale.

The product of this step is a **base system** — the definition of this package’s design system. Not CSS. Not class names. Other packages do not import captured fragment objects; they import `baseSystem` and pass it to `extends` or `layers` in `ui.config.ts`.

### 3.2 Types are a separate compiler

Panda generates types on the fly (`styled-system/types`, recipe types, jsx). We already started owning the public surface in `packages/reference-core/src/types/public` (`StyleProps`, `CssFunction`, `RecipeDefinition`, …). That work is incomplete: `SystemStyleObject` is still an identity over `@reference-ui/styled/types`, and recipe types still re-export Panda’s generated `recipe` module.

Types need the **base system**, not the atom set.

- If `n300` is a color token, `bg="n300"` typechecks. The type does not care whether the engine will print `.bg_n300` or `.background_n300`.
- Types do **not** enumerate atomic classes. Users never write those names.
- Types **do** need token *names* (and categories: color vs spacing vs radius) so StyleProps can be strict or open per `ui.config.ts`.
- Token *values* matter to types only insofar as they prove the token exists. They matter to CSS because they become `var(--colors-n-300)`.

`csstype` covers raw CSS. Generated unions narrow tokens. That split is already the types plan (`src/types/plan.md`). Do not put type emission in the Rust compile façade.

### 3.3 Atomic CSS is a stylesheet compiler

Authors write StyleProps. Compile still emits utilities (`.mt_2r`, `.bg_n300`) because runtime `css()` is an **open** composition API:

```text
build:   every literal want in the program  →  AtomSet  (what's possible)
runtime: this element's (prop, value)*      →  concat those class names
```

Hashed whole-object classes cannot name `{ ...base, ...override }` or `bg={color}` where `color` is a prop. Recipes are the exception: the variant table is closed, so they may be one class in `@layer recipes`. Style props on a recipe host stay atoms.

The engine does **not** execute author JS to learn a value. Nested ternaries are two (or more) leaves. `undefined` is no leaf.

### 3.4 A collection of fragments is a base system

Yes. `tokens` + `font` + `globalCss` + `keyframes` (and patterns) *are* the definition. Reference UI already names that definition **`BaseSystem`**. `ref sync` writes it; `ui.config.ts` consumes it:

```ts
import { baseSystem } from '@reference-ui/lib'

export default defineConfig({
  name: 'system',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],   // merge upstream definition (tokens land in your types)
  // layers: [baseSystem], // include upstream CSS only (tokens stay out)
})
```

```ts
interface BaseSystem {
  name: string
  fragment: string   // bundled fragment IIFEs — the definition
  css?: string       // compiled sheet of that definition, for layers
  jsxElements?: string[]
}
```

- **`extends`** consumes `fragment`. Upstream tokens, fonts, keyframes, global CSS merge into yours. Types see them.
- **`layers`** consumes `css`. Upstream components render; their tokens do **not** enter your config or TypeScript. Chain matrix T1–T13.

The old `BaseSystem` had explicit `tokens` / `font` / `keyframes` / `globalCss` fields. Those collapsed into executable `fragment` because that is how the definition travels. Same artefact. Panda currently reads a collector bundle derived from it. After cutover, the atomic engine is parameterized by a **base system**, not by a Panda `Config` and not by a newly invented format.

The portable CSS stage (`reference-core/src/system/stylesheet`) still has to exist in some form: token re-scoping onto `[data-layer]`, theme selectors, chain assembly. That is `baseSystem.css`, not “print `.mt_2r`”.

---

## 4. Module map (do not dump this into one crate)

Interactive map (open in a browser): [`packages/reference-rs/modules/map.html`](packages/reference-rs/modules/map.html) — stack from the foundation up. Hover a function to see which module it rests on. Written plan: [`packages/reference-rs/docs/atomic.md`](packages/reference-rs/docs/atomic.md).

The rename is done. Product modules:

```
packages/reference-rs/modules/
  atomic/          ← was system. Atoms, extract, resolve, stylesheet, class map.
  base-system/     ← the definition. Fragments land here. Tokens, fonts, keyframes, globalCss. Stub.
  typegen/         ← .d.ts from base-system + canon. Not a JS farm. Stub.
  canon/           ← platform + dialect. Sibling crate.
  styletrace/      ← already a sibling. Which JSX names carry StyleProps.
```

`modules/runtime` is the N-API loader. It is **not** the browser `css()` / `recipe()` contract. Do not overload that name.

```
5  Div  Span  Button  …                 primitives (React)
         ▲
4  css()  recipe()                      runtime · authored TS
         ▲  class map
3  tokens() font() keyframes() globalCss()     build-time · authored TS
         ▲
   fragments                            collector · JS, stays JS
╌╌╌╌╌╌ cut: TypeScript above · engine artefacts below ╌╌╌╌╌╌
2                    styles.css                          types
                         ▲                                 ▲
1  ┌─────────────────────────────────────────────────────────┐
   │  ENGINE  — rust modules                                 │
   │  base-system    atomic    typegen                       │
   │  canon          styletrace                              │
   └─────────────────────────────────────────────────────────┘
```

The engine emits **styles.css** (atomic) and **types** (typegen). Above the cut is TypeScript land: **build-time** (`tokens()` / `font()` / `keyframes()` / `globalCss()`, sitting on **fragments**) and **runtime** (`css()` / `recipe()`). Primitives sit on the runtime. Fragments stay in JS — authors write real TypeScript with imports and computed values; Rust consumes the dump. A native fragment evaluator is Panda v2. Do not.

### 4.1 `modules/atomic` (was `system`)

The atomic style layer. Definition of an atom. Extract leaves from TSX / `css()` / `cva()`. Resolve rhythm, shorthands, conditions. Print `@layer utilities`. Emit the **class map** the runtime concatenates with.

It takes a base system (not yet — that’s the missing contract) plus sources. It does not collect `tokens()`. It does not emit `StyleProps`. It does not own `Div`.

### 4.2 `modules/base-system`

The seam between fragments and everything else.

JS already evaluates fragment files (`lib/fragments`). Those objects dump **into** a base system. This module is that artefact: this package’s tokens, fonts, keyframes, global CSS, declared recipes — the styles the user defined up front. `extends` / `layers` in `ui.config.ts` already pass this around.

Atomic asks it: is `n300` a color token, what’s `--colors-n-300`, what recipes exist. Typegen asks the same questions for unions. One definition, two consumers.

### 4.3 Typegen (not codegen)

Panda’s `styled-system/` is a **codegen farm**: `css/`, `cva`, `sva`, `jsx/`, `patterns/`, `recipes/`, `tokens/`, `types/`. We do not need that.

Primitives already exist as authored React (`src/system/primitives`). They are not `styled.div`. They need **types** that stay in sync with the base system (token unions, strict colors, recipe variants, font registry). That’s typegen.

One source: base system + canon → `.d.ts`. Packager already folds generated types into `@reference-ui/system` and `@reference-ui/react`.

### 4.4 Runtime contract (`css` / `recipe`) — not generated

Look at what Panda actually ships, and what we already wrap.

`@reference-ui/styled` (Panda output the packager exposes):

| Subpath | What it is | Keep? |
| :--- | :--- | :--- |
| `./css` | `css()` — lookup + concat class names | **Runtime contract.** Stable function + generated **map**. |
| `./css/cva` | `cva()` / our `recipe` | **Runtime contract.** Closed variant table → `css()`. |
| `./css/cx` | className join | Tiny. Hand-write. |
| `./css/sva` | slot recipes | Plumbing. Only if we keep `sva`. |
| `./jsx` | `styled.div` factory, `splitCssProps` | **Do not port the factory.** Primitives are not this. `splitCssProps` is “which keys are style props” — that’s **canon**. |
| `./patterns/box` | `box(props) → className` | Primitives call this today. It is `css()` plus dialect props (`font`, `weight`, `container`, `r`). Once those live in canon + resolve, **`box` is `css`**. |
| `./tokens` | JS dump of the token dict | Types + CSS variables cover this. Optional. |
| `./types` | `SystemStyleObject`, recipe types, … | **Typegen.** We already author the public surface in `src/types/public`; this is the leftover Panda alias. |

Panda v2’s own `cva` artifact is explicit: *“Config-independent — the runtime impl is a fixed string; recipe data lives in the `recipes` artifact.”* They generate a function by pasting a constant. We should just **author** that function.

So:

- **Atomic** generates **data**: class map, recipe variant tables, `styles.css`.
- **`css()` / `recipe()`** are **authored TypeScript** in core (`src/system/runtime` already is this adapter). They read the data. They do not re-name classes. One namer stays in atomic.
- Disk path can stay `.reference-ui/styled/css` so the packager barely moves. The *package* `@reference-ui/styled` thins down to “the runtime + the map”, not a jsx/patterns farm.
- **Primitives sit above.** `Div` splits style props (canon), calls `css()` / `recipe()`, sets `data-layer` / color-mode. They are not the runtime contract. They are not generated by Panda. The Liquid tag mill (`primitives/generate`) is boilerplate, not a style engine.

Do not put `css()` inside `modules/runtime` (N-API loader). Do not generate a new `css.js` from Rust every compile unless the map is inlined for the bundler — the **algorithm** is stable.

### 4.5 Does Panda v2 generate types in Rust?

Yes. v1 (`@pandacss/generator`) printed `.d.ts` from TypeScript. v2 moved the whole `styled-system/*` farm into `pandacss_codegen`: a TypeScript AST in Rust (`InterfaceDecl`, `TypeAliasDecl`, `TsType`) → emit `.ts` or `.js` + `.d.ts`. `artifacts/types.rs` is ~1,260 lines (GitHub’s `size: 44278` is **bytes**, not LOC); the `types/` subfolder adds jsx/recipe/strict-prop emitters on top. They did it so **one** `CodegenContext` emits `css()` *and* the `.d.ts` from the same resolved config — not because printing `'n300' | 'n100'` needs a native compiler. Leave types in TS after extract/stylesheet went native and you get the same split-brain as `utility.transform`.

We are not generating that farm. Typegen for us is unions from the base system. Rust is fast at it; it is not required. Start typegen as its own module whose **input** is the base system. Implementation language is a later call: TS is already how `src/types` and font-registry generation work; lift to Rust if the farm grows. Do not copy Panda’s codegen AST to emit three union types.

### 4.6 Canon

Canon is the language (tags, properties, `mt`, `r`). A base system is an utterance (this package’s tokens). Types, styletrace, and atomic all need the language. It is a sibling crate at `modules/canon` so they do not import atomic to ask what `mt` means.

---

## 5. What has landed

The cargo split is done. Product code lives under `packages/reference-rs/modules/` (`atomic` ← was `system`, `canon`, `base-system`, `typegen`, `tasty`, `atlas`, `styletrace`, `virtualrs`, plus `runtime` as the N-API loader). JS face: `import { compile } from '@reference-ui/rust/atomic'` — core's live wire is still `@reference-ui/rust/system`. `compileSync({ rootDir | files }) → { stylesheet, css, diagnostics, wants }`. N-API: `compileSystem`. Do not rename the native export in the same diff as `compile()` taking a base system.

The compiler is a real pipeline, not a README scaffold:

```
User TSX / css() / recipe()
        │
        ▼
 canon          @webref + Reference dialect (JS generator → Rust tables)
 styletrace     which names are StyleProps / wrappers
 extract/jsx          StyleProps on tags
 extract/css          css() / css.object()
 extract/recipes      recipe() style objects (not closed class emit)
 extract/expressions   both ternary branches; local constants; no JS eval
        │
        ▼
 resolve        rhythm, token→var heuristic, shorthands, conditions, patterns
 atom           Want → Atom → AtomSet
        │
        ├──────────────┐
        ▼              ▼
 stylesheet        runtime
 styles.css        css() lookup (same namer)
 @layer utilities  .reference-ui/styled/css  (path after cutover)
```

Proven inside `packages/reference-rs` (no core, no Panda on the path):

| Fixture / suite | What it proves |
| :--- | :--- |
| `nested_ternaries` | Tabs-shaped `borderBottom` ternary → longhands, no dropout |
| `shorthand_cascade` | `borderBottom` + `borderColor` do not fight as a shorthand that resets color |
| `rhythm_fractions` | `2r`, `1/3r` → `calc(n * var(--spacing-root))` |
| `responsive_arrays` / `pseudo_conditions` | breakpoint arrays, `_hover` / `_dark` |
| `seed_contract` | empty project still emits the six-layer preamble |
| `differential.test.ts` | ghost-class invariant: every runtime class appears in the sheet |

`compile()` currently takes **sources only**. No base system. Token resolution is a **heuristic** (`blue.600` on a color prop → `var(--colors-blue-600)`). It does not know whether `blue.600` was actually declared. It does not print `@layer tokens`. That is the next contract, not a polish item.

Canon is generated (`pnpm --filter @reference-ui/rust run canon`) from `@webref/css` + `@webref/elements` plus the Reference dialect. Passes look up tags / aliases / shorthands from it. Do not grow a second property list in extract or resolve. It lives at `modules/canon`.

---

## 6. The missing contract: compile against a base system

Fragments already produce a base system. Types and the atomic engine both need to **read that same artefact**. `compile()` does not take one yet. That is the seam this document used to skip by saying “config ingest.”

A base system must answer:

| Question | Who asks | Why |
| :--- | :--- | :--- |
| Is `n300` a token, and of which category? | engine + types | Engine: emit `var(--colors-n-300)` vs pass through as raw CSS. Types: allow it on `bg` / `color`. |
| What is its CSS value (and light/dark)? | engine | `@layer tokens { :root { --colors-n-300: … } }` plus `[data-panda-theme]` / layer-domain selectors. |
| What keyframes / global CSS / fonts exist? | engine | `@layer global`, `@font-face`, `@keyframes`. |
| What recipes were declared (name, variants, compound)? | engine + types | Closed classes in `@layer recipes`; variant prop types. |
| What conditions / breakpoints exist? | engine + types | `_hover`, `_dark`, container queries, arrays. |

JS owns *producing* the base system (fragments already do). Rust owns *consuming* it on `CompileRequest`, not by re-parsing user modules. Types own *reading* the same base system to emit unions.

Until `compile()` takes a base system, `staticCss`, token-layer emission, and strict StyleProps cannot be honest. Heuristic `KNOWN_CATEGORIES` in `resolve/tokens` is a stand-in.

Do not send the engine a Panda `Config`. Send a `BaseSystem`. Panda-shaped fields (`utilities.extend`, `hooks`, `jsx` name lists) are the translation layer we are deleting.

---

## 7. Parity map — what still has to exist to cut Panda

Production is still Panda v1.11.1 + virtual FS + core postprocess. Full parity means the matrix suites in §9 stay green with `@pandacss/*` gone. Grouped by machine, not by “write more Rust.”

### A. Atomic engine (Rust) — incomplete products

| Gap | Today | Need |
| :--- | :--- | :--- |
| **Base system ingest** | `CompileRequest` is `{ rootDir, files }` | `compile()` takes a `BaseSystem`. Third want source. |
| **`@layer tokens`** | Utilities reference `var(--…)` that nobody defines | Emit custom properties from the base system. Color-mode truth table currently lives in core’s stylesheet README. |
| **`@layer recipes`** | `src/recipes` is a stub | Closed `cva` / `sva` classes + variant table for the runtime. StyleProps on the host stay atoms. |
| **`@layer reset / global / base`** | Preamble only | Reset, `globalCss()`, keyframes. |
| **`staticCss`** | Core asks Panda for `color: ['*']` on ~35 props | Lower to wants in `config` so `bg={prop}` still resolves. AtomSet size is dominated by this, not by source leaves. |
| **Recipe *calls* in source** | Extract sees `cva` / `sva` sites as style objects | Plus declared recipes from fragments. Two inputs, one `@layer recipes`. |
| **MDX, `r` sugar in `css()` args, real import specifiers** | Virtual transform currently rewrites these for Panda | Engine must accept source as authored. `virtualrs` stays until those jobs are gone. |

### B. Types (TypeScript) — still Panda’s farm under the hood

| Gap | Today | Need |
| :--- | :--- | :--- |
| **`SystemStyleObject`** | Alias of `@reference-ui/styled/types` | Owned type from `csstype` + base-system unions (`src/types/plan.md`). |
| **Recipe types** | Re-export `@reference-ui/styled/types/recipe` | Generate from the same recipe table the engine compiles. |
| **Token unions / strict mode** | Packager patches generated styled types | Generate from the base system. Font registry generation already exists. |
| **Atomic class names in `.d.ts`** | Panda emits them | **Do not port.** Users do not write those names. |

### C. Host / portable CSS (TypeScript) — stays, thins out

| Gap | Today | Need |
| :--- | :--- | :--- |
| **`baseSystem`** | Written by `system/base` from fragments + post-Panda CSS | Same artefact. `fragment` still from JS. `css` eventually from engine output + remaining portable transforms. |
| **Portable stylesheet stage** | PostCSS after Panda: `[data-layer]`, theme rewrite, **synthesize color utilities Panda missed**, chain assembly | Decide which of those jobs move into Rust `stylesheet` vs stay as TS over engine output. Utility synthesis in TS is a **second namer** — forbidden in the engine, still live in core. |
| **Sync / watch / bundler sinks** | Parcel, Piscina, virtual mirror, Liquid `panda.config.ts` | Engine returns strings; core writes `.reference-ui/styled/{styles.css,css}`. Do not make Rust write files. Cadence (config vs every source change) is a host concern. |
| **Primitives** | Generated React wrappers over styled runtime | Unchanged authoring. Swap the runtime they import. |

### D. Cutover (last)

Panda, `.reference-ui/virtual/`, Liquid `panda.config.ts` go **after** Gate B (standalone goldens + Panda v1 differential) and Gate D (matrix). `virtualrs` stays until its remaining rewrite jobs are unused. Class *spelling* may differ from Panda; grain (one class per leaf) and coverage (every `(prop, value, when)` Panda emitted) may not.

---

## 8. Constraints

These are still the machine. Do not resolve remaining work by violating them.

1. **Wrong machine, right atoms.** Keep atom / layer / condition / recipe *ideas*. Do not keep a JS-eval extractor, a TS-only utility transform, or a dumb `css()` that cannot see those transforms.
2. **One naming function.** Sheet and runtime `css()` produce the same class for `(prop, value, conditions)`. Ghost class is a P0.
3. **Collect leaves. Do not run user JS for StyleProps.** Ternaries / `&&` / `||` yield literal branches. `undefined` is no leaf. Fragment eval is a *different* machine, on a *different* set of functions (`tokens`, not `css`).
4. **Compile CSS, not racing utilities.** Shorthand expansion before cascade. `borderBottom` + `borderColor` must not flash `currentColor`.
5. **Postel on `StyleProps`.** If the type allows it, the engine supports it or fails closed with a diagnostic — never a missing class in the browser. `staticCss` is part of that promise.
6. **React/TSX only.** No Vue / Svelte / Astro.
7. **Atomic CSS is not a public API.** Types describe tokens and style objects. They do not describe `.mt_2r`.
8. **Engine is a pure function** until wired: sources + base system → CSS + class map. Prove it in `reference-rs` goldens. Debugging the compiler *through* core sync is how a two-week engine becomes a two-month seam hunt.
9. **Host writes files.** Vite and Webpack are polymorphic sinks. `compile()` returns strings.
10. **No new public authoring.** No “only recipes now,” no hashed-only classes as a surprise break.
11. **Linter ≠ compiler.** Warn on nested ternaries; still emit every branch.
12. **`utilities` are dialect, not user config.** Rhythm, shorthands, `container` / `font` / `weight` live in canon + resolve. A user-facing `utilities()` fragment is optional and late.
13. **Canon is not a base system.** Canon is platform + dialect. A base system is this package’s fragments. Do not stuff the former into the latter, and do not require the type generator to import the stylesheet crate to ask what `mt` means.
14. **One published native package:** `@reference-ui/rust`. Quality gate in `agent-rs`. No Criterion, no 12-crate split named after Panda. Sibling *modules* (styletrace, maybe canon) are not that mistake.

---

## 9. Matrix is the merge gate

Not a vibe. Public APIs above must keep passing. Counts below are a snapshot; the suites are the contract.

| Package | What it proves |
| :--- | :--- |
| `matrix/css` | Atomic generation, specificity, concatenation |
| `matrix/css-selectors` | `_hover`, `_focusVisible`, combinators |
| `matrix/primitives` | Tag primitives and StyleProp forwarding |
| `matrix/recipe` | `cva` / `sva`, compound variants |
| `matrix/spacing` | Rhythm `r` → px |
| `matrix/responsive` | Container + media, breakpoint arrays |
| `matrix/color-mode` | `_dark` / `_light`, semantic tokens |
| `matrix/tokens` | OKLCH, `--colors-*` |
| `matrix/system` | Six layers verbatim, `globalCss`, keyframes |
| `matrix/chain` T1–T13 | `extends`, token overrides, layer isolation |
| `matrix/watch` | Live stylesheet regeneration |

Panda v1 stays in production until this list is green on the native path.

---

## 10. Remaining work, in order

Phase 0 (workspace split) and the extract → resolve → utilities sheet are **done**. Do not reopen them to “clean up the name.”

1. **`compile()` takes a base system** — the artefact fragments already produce. Token vs not. Not a newly invented format.
2. **Engine consumes the base system** — `@layer tokens`, `staticCss` → wants, fail-closed unknown tokens vs raw CSS.
3. **Folder rename is done** — `modules/atomic`, `modules/canon`, stub `modules/base-system` and `modules/typegen`. Next is refine canon, then the base-system artefact `compile()` can read.
4. **Runtime stays authored** — `css()` / `recipe()` in core, reading atomic’s class map. Do not generate Panda’s jsx/patterns farm. `box` collapses to `css` once dialect props are in canon.
5. **Recipes** — closed classes + variant table; types from the same table. `recipe()` runtime is authored JS over that table.
6. **Reset / global / keyframes** — fill the empty layers.
7. **Owned `SystemStyleObject`** — stop aliasing Panda’s type farm. Token unions from the base system.
8. **Standalone goldens + Panda v1 differential** — coverage of `(prop, value, when)`, not class spelling. Includes `staticCss` expansion so a dropped `['*']` is visible before a browser.
9. **Wire core sync behind a flag** — Panda still runs. Then matrix. Then cut virtual + `@pandacss/*`.
10. **Portable CSS seam** — which of core’s PostCSS jobs move into Rust. Decide then, not in (1). A standalone engine returning strings does not need the answer; guessing now grows the seam early.

Optional and parallel: lib internals off nested StyleProp ternaries onto recipes / `data-state`. Insulates `@reference-ui/lib` *today*. Does not shrink extractor obligations.

---

## 11. Why not Panda v2 (short)

`vendor/panda` is the autopsy, not the destination. ~61k LOC of Rust that ported a JS evaluator into OXC, then split extract (Rust) from `utility.transform` (TS callbacks) from browser `css()` (string concat). The Tabs ghost class (`borderBottom: '3px solid'` → sheet has `.bd-b-w_3px`, runtime asks for `.bd-b_3px_solid`) is that split. Nested ternaries with `undefined` folding to `Null` are that evaluator.

We copy the **process** (extract → encode → stylesheet + generated `css()`), not the evaluator, not the 12-crate layout, not the type/jsx/patterns farm. Production is v1.11.1; skipping v2 is already decided.

Detail and citations: `packages/reference-rs/modules/atomic/PANDA.md`. Architecture: `packages/reference-rs/docs/atomic.md`. Module internals: each `src/*/README.md` under `modules/atomic`. Host pipeline: `packages/reference-core/src/system/README.md`.
