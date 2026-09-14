# Atomic

Extract → atoms → stylesheet + class map. One namer. Does not own `Div`.
Does not emit `StyleProps`.

Authors write StyleProps / `css()` / recipes. They never write class names.
Compile still emits utilities (`.mt_2r`, `.bg_n300`) because runtime `css()`
is an open composition API: build finds **what's possible**, runtime
concatenates **what this instance needs**. Hashed whole-object classes cannot
name `{ ...base, ...override }`.

This crate is the stylesheet compiler. It is not `@reference-ui/system` (the
authoring package for fragments) and it is not the host pipeline in
`reference-core`. The stack lives in [`docs/atomic.md`](../../docs/atomic.md).
The interactive map is [`modules/map.html`](../map.html).

## What it takes

Sources (TSX / `css()` / recipe calls) plus, eventually, a **base system**.
`compile()` currently takes sources only. Token resolution is a heuristic.
That is the missing contract, not a polish item.

Styletrace answers which JSX names still carry StyleProps. Canon answers
whether `mt` is a style prop. Do not fork either inside this crate.

## What it emits

Two artefacts, same namer:

| Name | What | Disk after cutover |
| :--- | :--- | :--- |
| `stylesheet` | CSS text, six layers | `.reference-ui/styled/styles.css` |
| `css` | `(prop, value, when) → class`, concat | `.reference-ui/styled/css` |

Ghost class (runtime asks for an atom the sheet never printed) is a P0. A
collected want that never became an atom is a P0.

## What it does not do

- Collect `tokens()` — fragments already did, in JS
- Emit `StyleProps` — that is typegen
- Own `Div` / `Span` / `Button` — primitives sit on the runtime, in React
- Evaluate author JS to learn a value
- Hash a StyleProp object as the runtime key
- Drive the compiler from JS by calling a parser over the boundary

Tripwires. Any of these means we built the wrong machine.

## Pipeline

Want → Atom → AtomSet. Extract both ternary branches (no JS eval). Resolve
rhythm, shorthands, conditions. Print `@layer reset, global, base, tokens,
recipes, utilities`. The class map rides alongside so authored `css()` can
look up the same names.

`compile(request) -> { stylesheet, css, diagnostics }`. Individual file
descriptions belong in each file's top comment.

## Public contract (when wired)

```text
compile(request) -> { stylesheet, css, diagnostics }
```

JS face: `import { compile } from '@reference-ui/rust/atomic'`. The live wire
from core is still `@reference-ui/rust/system` — same module, old subpath.
N-API remains `compileSystem` so the native binary does not move.

Class spelling may differ from Panda; grain (one class per leaf) does not.

## Verify

v1 must be provable without `reference-core`. The engine is a pure function —
sources + config in, CSS + class map out.

```bash
pnpm agentrs c atomic
pnpm agentrs v atomic
pnpm agentrs v atomic --update-goldens
```

| # | Gate | Home | Touches core? |
| :--- | :--- | :--- | :--- |
| A | Crate internals | `#[cfg(test)]` next to each module | no |
| B | Golden cases | `tests/fixtures/<case>/` — sources in, `{styles.css,css.json,diagnostics.json}` out | no |
| C | Panda v1 differential | Same fixtures through both engines; coverage of `(prop, value, when)`, not spelling | no |
| D | Matrix | integration, after A–C | yes |

Panda v1 stays in production until D.
