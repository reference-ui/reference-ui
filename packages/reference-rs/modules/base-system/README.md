# Base system

The definition. A portable artefact atomic and typegen query.

TypeScript already evaluated `tokens()` / `font()` / `keyframes()` /
`globalCss()` (+ declared recipes) and dumped the objects. This module
**is that artefact**. Rust reads it. It does not run the author files.

A base system is an **utterance** (this package's tokens). Canon is the
**language**. Do not stuff one into the other.

The crate keeps two shapes. `BaseSystemDump` is the authored nested
wire format (`{ value | light | dark }` leaves, brace aliases intact).
`BaseSystem::from_json` lowers a dump into the indexed `BaseSystem`
query engine (flat `category.path` keys, precomputed `cssVar`).
`compile()` still deserializes the indexed shape directly so station
dumps keep working. `BaseSystem::default()` stays empty. `staticCss` is
a property → token-list bag (`color: ['*']` or `bg: ['n100']`); the lib
fixture leaves it empty so AtomSet stays small. `extends` and `layers`
are not here yet.

`lib_fixture()` loads the committed lib dump (`src/lib_fixture/lib.json`)
through `from_json`, then overlays host/Panda conditions, the standard
breakpoint scale, and `:root { --spacing-root: 0.25rem }`. The dump is
produced by `pnpm --filter @reference-ui/rust base-system` from lib
theme object literals (tokens, fonts, keyframes); `--check` fails if it
would change. Recipes are not scraped from components; the fixture map
stays empty. Atomic prints declared `@keyframes` inside `@layer global`.

## What it takes

A constructed `BaseSystem`: either empty, or the lib fixture (generated
lib tokens and fonts, plus host conditions, breakpoints, and
`--spacing-root`). JS still owns fragment evaluation.

## What it emits

Answers both consumers ask of the same definition:

| Question | Who asks | Why |
| :--- | :--- | :--- |
| Is `colors.gray.800` a token, and of which category? | atomic + typegen | Atomic: `var(--colors-gray-800)` vs raw CSS. |
| What is its CSS value (and light/dark)? | atomic | `@layer tokens` custom properties. |
| What wrap does `_hover` / `_dark` use? | atomic | Host `data-panda-theme`, not `.dark`. |
| What keyframes / global CSS / fonts exist? | atomic | `@layer global`, `@font-face`. |
| What breakpoints exist? | atomic | Array slots and `r/` widths. |
| Which `staticCss` utilities to pre-emit? | atomic | Third want source; `['*']` is category enumeration. |

Atomic `compile()` takes `Option<BaseSystem>`. Omitted means the lib fixture.

## What it does not do

- Evaluate author JS
- Print `.mt_2r`
- Emit `StyleProps`
- Own `Div`

## Verify

```bash
pnpm agentrs c base_system
pnpm --filter @reference-ui/rust base-system --check
```
