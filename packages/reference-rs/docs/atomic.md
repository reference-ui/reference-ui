# Atomic style engine

TypeScript above the cut. Rust below. The engine emits two things:
`styles.css` and types. This is the written form of
[`modules/map.html`](../modules/map.html) — a set of plans each module can
implement and verify on its own.

Interactive map: open `packages/reference-rs/modules/map.html` in a browser.
Hover a function to see which module it rests on. tasty, atlas, virtualrs, and
`modules/runtime` (the `.node` loader) are other products — not this engine.

Mandate and user story (historical): [`REFERENCE_SYSTEM.md`](../../../docs/archive/REFERENCE_SYSTEM.md). Current campaign: [`PLAN.md`](../PLAN.md).
Panda autopsy: [`modules/atomic/PANDA.md`](../modules/atomic/PANDA.md).

---

## The cut

```
5  Div  Span  Button  …                      primitives (React)
         ▲
4  css()  recipe()                           runtime · authored TS
         ▲  class map
3  tokens() font() keyframes() globalCss()   build-time · authored TS
         ▲
   fragments                                 collector · JS, stays JS
╌╌╌╌╌╌ TypeScript above · engine artefacts below ╌╌╌╌╌╌
2                    styles.css                           types
                         ▲                                  ▲
1  ┌──────────────────────────────────────────────────────────┐
   │  ENGINE  — rust modules                                  │
   │  base-system    atomic    typegen                        │
   │  canon          styletrace                               │
   └──────────────────────────────────────────────────────────┘
```

Fragments stay in JavaScript. Authors write real TypeScript with imports and
computed values. Rust consumes the dump; it does not run the files. A native
fragment evaluator is Panda v2. Do not.

Bottom-up: build the Rust engines, verify them inside `reference-rs`, then
worry about host integration. The live wire from atomic CSS into
`reference-core` already exists at codegen (`@reference-ui/rust/system`). We
emulate one seam cleanly and move the rest slowly.

---

## Rust modules

Each module has a README, a crate, and a way to verify itself
(`pnpm agentrs c <crate>`). Do not dump this into one crate.

### canon — the language

**Status:** extracted sibling. Refine this first.

Platform + dialect. What tags and CSS properties exist. `mt` means
`marginTop`. `r`, `container`, conditions. Generated from `@webref` plus a
Reference dialect.

A base system is an utterance (this package's tokens). Canon is the language.
Atomic, typegen, and styletrace all need it so they do not import the
stylesheet crate to ask “is `mt` a style prop?”

Verify: `pnpm agentrs c canon`. Then `pnpm --filter @reference-ui/rust run canon`.

README: [`modules/canon`](../modules/canon).

### base-system — the definition

**Status:** crate stub. Core still writes `baseSystem.mjs`.

Consumes the fragment spec from TypeScript — does not evaluate author JS.
Tokens, fonts, keyframes, globals, declared recipes. What `extends` / `layers`
pass around.

Atomic asks: is `n300` a token, what's the CSS value, what recipes exist.
Typegen asks the same questions for unions. `compile()` does not take one yet.
That is the missing contract.

Verify: `pnpm agentrs c base_system`.

README: [`modules/base-system`](../modules/base-system).

### atomic — stylesheet + class map

**Status:** today's compiler. Was `modules/system`.

Extract → atoms → stylesheet + class map. One namer. Want → Atom → AtomSet.
Extract both ternary branches (no JS eval). Resolve rhythm, shorthands,
conditions.

Outputs: `styles.css`, class map, recipe tables.

Does not collect `tokens()`. Does not emit `StyleProps`. Does not own `Div`.

The live wire stays: core still `import { compileSync } from
'@reference-ui/rust/system'`. Canonical subpath is `@reference-ui/rust/atomic`.
N-API remains `compileSystem`.

Verify: `pnpm agentrs c atomic` and `pnpm agentrs v atomic`.

README: [`modules/atomic`](../modules/atomic).

### typegen — unions, not a jsx farm

**Status:** crate stub.

`.d.ts` from the base system + canon. Token unions, recipe variants, font
registry. No jsx factory, no patterns farm, no recipes-as-modules.

Panda v2's type printer exists so their generated `css()` cannot drift from
the editor types. We author `css()`; we still generate the unions. Language
(Rust vs TypeScript) is a later call. The *input* is the base system either
way.

Verify: `pnpm agentrs c typegen`.

README: [`modules/typegen`](../modules/typegen).

### styletrace — already a sibling

Which JSX names still carry StyleProps down to a Reference primitive. Atomic
extract/jsx calls this. Do not fork it inside atomic.

Verify: `pnpm agentrs c styletrace` and `pnpm agentrs v styletrace`.

README: [`modules/styletrace`](../modules/styletrace).

---

## What the engine emits

### styles.css — from atomic, given a base system

Layered atomic stylesheet:
`@layer reset, global, base, tokens, recipes, utilities`.

This is data out of atomic. Not primitives. Not the `css()` function. The
class map rides alongside so runtime `css()` can look up the same names.

Portable / chain wrapping (`[data-layer]`, upstream sheets) still lives in
core for now.

### types — from typegen, given a base system + canon

Token unions, `StyleProps`, recipe variants, font registry. Users never write
`.mt_2r` in these files. Today `SystemStyleObject` still aliases Panda. That
is the leftover to kill.

---

## TypeScript land (not these crates)

### Build-time — collected by fragments

`tokens()`, `font()`, `keyframes()`, `globalCss()` are authored TypeScript.
Fragments find the call sites, micro-bundle those files, `import()` them,
capture the objects, dump into the base system. This is why the collector
stays TypeScript.

Rust does not execute these functions.

Home: `packages/reference-core/src/lib/fragments`.

### Runtime — authored TypeScript, not generated

`css()` concatenates class names the compiler already printed. Open
composition. If sheet and `css()` disagree, you get a ghost class. That is a
P0. Do not generate a new `css.js` from Rust every compile. The algorithm is
stable; only the map changes.

`recipe()` is closed variants (this is cva). Atomic can emit one class per
declared variant into `@layer recipes`. Style props on a recipe host still go
through `css()`.

Not `modules/runtime` — that folder is the N-API loader.

### Primitives — React, above the runtime

`Div`, `Span`, and the rest of the tag set. They split StyleProps from DOM
props (canon knows which keys are style), call `css()`, and stamp
`data-layer` / color-mode. Atomic never ships a component. No `Box` / `Flex` /
`Grid`. Their prop types come from typegen.

---

## Implementation order

Do not skip to integration. Each step is provable in `reference-rs`.

1. **Canon** — dictionary is the lookup everyone else uses. Refine join,
   dialect (`r`, `container`, `font`, `weight`), fail-closed tests.
2. **Base system artefact** — typed dump atomic and typegen can both read.
   Still produced by fragments in JS.
3. **Atomic consumes a base system** — `@layer tokens`, honest token vs raw
   CSS, `staticCss` as a third want source. Goldens, then Panda v1
   differential.
4. **Typegen** — unions from the same artefact. Kill the Panda
   `SystemStyleObject` alias.
5. **Recipes / empty layers** — closed classes, variant table, reset / global
   / keyframes bodies.
6. **Host wiring** — core sync behind a flag. Panda still runs. Then matrix.
   Then cut `@pandacss/*`.

Do not rename N-API or move the core import in the same diff as `compile()`
taking a base system. The folder rename is done; the live wire is the alias.
