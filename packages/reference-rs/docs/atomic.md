# Atomic style engine

TypeScript above the cut. Rust below. The engine emits two things:
`styles.css` and types. This is the written form of
[`modules/map.html`](../modules/map.html) — a set of plans each module can
implement and verify on its own.

Interactive map: open `packages/reference-rs/modules/map.html` in a browser.
Hover a function to see which module it rests on. tasty, atlas, and
`modules/runtime` (the `.node` loader) are other products — not this engine.

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
worry about host integration. The live wire from atomic into Core is
`@reference-ui/rust/atomic`: Core calls `scan()` from
`packages/reference-core/src/collect/lib/scan/native.ts` and `compile()`
from `packages/reference-core/src/native/compile.ts`.

---

## Rust modules

Each module has a README, a crate, and a way to verify itself
(`pnpm agentrs c <crate>`). Do not dump this into one crate.

### canon — the language

Platform + dialect. What tags and CSS properties exist. `mt` means
`marginTop`. `r`, `container`, conditions. Generated from `@webref` plus a
Reference dialect.

A base system is an utterance (this package's tokens). Canon is the language.
Atomic, typegen, and styletrace all need it so they do not import the
stylesheet crate to ask “is `mt` a style prop?”

Verify: `pnpm agentrs c canon`. Then `pnpm --filter @reference-ui/rust run canon`.

README: [`modules/canon`](../modules/canon).

### base-system — the definition

Consumes the fragment spec from TypeScript — does not evaluate author JS.
Tokens, fonts, keyframes, globals, declared recipes. What `extends` / `layers`
pass around.

Atomic asks: is `n300` a token, what's the CSS value, what recipes exist.
Typegen asks the same questions for unions. `compile()` takes the base
system with the request (legacy `{ baseSystem }` or the frozen
`{ schemaVersion: 2, spec }`).

Verify: `pnpm agentrs c base_system`.

README: [`modules/base-system`](../modules/base-system).

### atomic — stylesheet + class map

Extract → atoms → stylesheet + class map. One namer. Want → Atom → AtomSet.
Extract both ternary branches (no JS eval). Resolve rhythm, shorthands,
conditions.

Outputs: `styles.css`, class map, recipe tables.

Does not collect `tokens()`. Does not emit `StyleProps`. Does not own `Div`.

Core imports `{ compile, scan }` from `@reference-ui/rust/atomic`.
`@reference-ui/rust/system` remains a pack-level alias of the same atomic
entry, unused by Core. N-API remains `compileSystem`.

Verify: `pnpm agentrs c atomic` and `pnpm agentrs v atomic`.

README: [`modules/atomic`](../modules/atomic).

### typegen — unions, not a jsx farm

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
`.mt_2r` in these files. `SystemStyleObject` is the recursive condition /
breakpoint object typegen prints; no Panda alias remains.

---

## TypeScript land (not these crates)

### Build-time — collected by fragments

`tokens()`, `font()`, `keyframes()`, `globalCss()` are authored TypeScript.
Fragments find the call sites, micro-bundle those files, `import()` them,
capture the objects, dump into the base system. This is why the collector
stays TypeScript.

Rust does not execute these functions.

Home: `packages/reference-core/src/collect` (the surface calls and the collector).

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

## Standing order

Canon → base system → atomic / typegen → host wiring. Each module is
provable inside `reference-rs` (`pnpm agentrs c <crate>`); the host wiring
is live (Core `scan()` + `compile()` from `@reference-ui/rust/atomic`).
Per-module READMEs carry current verification.
