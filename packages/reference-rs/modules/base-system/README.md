# Base system

The definition. A collection of fragments, made portable.

TypeScript already evaluated `tokens()` / `font()` / `keyframes()` /
`globalCss()` (+ declared recipes) and dumped the objects. This module **is
that artefact**. Rust reads it. It does not run the author files.
`ui.config.ts` already `extends` / `layers` it.

A base system is an **utterance** (this package's tokens). Canon is the
**language**. Do not stuff one into the other.

## What it takes

The fragment dump from `packages/reference-core/src/lib/fragments`. Authors
write real TypeScript with imports and computed values. Fragments micro-bundle
those files, `import()` them, and capture the objects. That dump lands here.

A native fragment evaluator is Panda v2. Do not.

## What it emits

Answers both consumers ask of the same definition:

| Question | Who asks | Why |
| :--- | :--- | :--- |
| Is `n300` a token, and of which category? | atomic + typegen | Atomic: `var(--colors-n-300)` vs raw CSS. Typegen: allow it on `bg`. |
| What is its CSS value (and light/dark)? | atomic | `@layer tokens` custom properties. |
| What keyframes / global CSS / fonts exist? | atomic | `@layer global`, `@font-face`, `@keyframes`. |
| What recipes were declared? | atomic + typegen | Closed classes in `@layer recipes`; variant prop types. |
| What conditions / breakpoints exist? | atomic + typegen | `_hover`, `_dark`, arrays. |

Today core's `system/base` writes `baseSystem.mjs`. This module is that
artefact, owned. `compile()` does not take one yet. That is the missing
contract — not a polish item.

## What it does not do

- Evaluate author JS
- Print `.mt_2r`
- Emit `StyleProps`
- Own `Div`

## Verify

```bash
pnpm agentrs c base_system
```

Crate internals only until the artefact shape is honest. Do not debug this
through core sync. Gate A lives here; wiring `CompileRequest` is later.
