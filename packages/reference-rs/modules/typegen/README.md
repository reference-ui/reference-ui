# Typegen

`.d.ts` from the base system + canon. Token unions, recipe variants, font
registry. Not a jsx farm.

Primitives already exist as authored React. They need **types** that stay in
sync with the base system. Typegen is that printer.

## What it takes

- A **base system** — token names and categories, declared recipes, fonts
- **Canon** — which props exist (`mt` means `marginTop`)

It does not take the atom set. If `n300` is a color token, `bg="n300"`
typechecks. The type does not care whether the engine will print `.bg_n300`.

## What it emits

Unions. `StyleProps` narrowed by this package's tokens. Recipe variant props.
Font registry. Packager already folds generated types into `@reference-ui/system`
and `@reference-ui/react`.

Users never write `.mt_2r` in these files. Atomic class names are not a public
API.

## What it does not do

- Generate `css()` / `recipe()` — those are authored TypeScript
- Generate a jsx factory, patterns, or recipes-as-modules
- Import atomic to ask whether `mt` is a style prop — that is canon

We author `css()`; we still generate the unions. Language (Rust vs TypeScript)
is a later call. The **input** is the base system either way.

Today `SystemStyleObject` still aliases `@reference-ui/styled/types`. That is
the leftover to kill.

## Verify

```bash
pnpm agentrs c typegen
```

First real tests land with the union printer, scored against a fixture base
system — no core, no jsx output.
