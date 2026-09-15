# Base system

The definition. A portable artefact atomic and typegen query.

TypeScript already evaluated `tokens()` / `font()` / `keyframes()` /
`globalCss()` (+ declared recipes) and dumped the objects. This module
**is that artefact**. Rust reads it. It does not run the author files.

A base system is an **utterance** (this package's tokens). Canon is the
**language**. Do not stuff one into the other.

Tonight the crate is a typed bag plus a frozen `@reference-ui/lib`
fixture (`BaseSystem::lib_fixture()`). `BaseSystem::default()` stays
empty. `staticCss` is a property → token-list bag (`color: ['*']` or
`bg: ['n100']`); the lib fixture leaves it empty so AtomSet stays small.
Fragment `from_json`, `extends`, and `layers` are not here yet.

## What it takes

A constructed `BaseSystem`: either empty, or the lib fixture copied from
the lib theme files (palette, `ui.*`, `design.*`, radii, fonts,
breakpoints, named `_` conditions, `:root --spacing-root`). JS still
owns producing a dump later.

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
```
