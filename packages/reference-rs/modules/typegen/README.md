# Typegen

`.d.ts` from the base system + canon. Token unions, recipe variants, font
registry, FontProps, StyleProps, recursive SystemStyleObject. Not a jsx farm.

Primitives already exist as authored React. They need **types** that stay in
sync with the base system. Typegen is that printer.

## What it takes

- A **base system** — token names and categories, declared recipes, fonts,
  breakpoints
- **Canon** — color properties, padding/margin aliases (`mt` → `marginTop`),
  named conditions

It does not take the atom set. If `n300` is a color token, `bg="n300"`
typechecks. The type does not care whether the engine will print `.bg_n300`.

## What it emits

`emit_dts(&BaseSystem)` prints exported category unions (`ColorToken`,
`SpacingToken`, …) plus an aggregate `Tokens` interface indexed by dump
category names (`colors`, `fontSizes`, `zIndex`). Literals are category-relative
(`brand.primary`, not `colors.brand.primary`), sorted unique, and quoted.
Recipes become `ButtonVariantProps`-style aliases with optional axes. A dump
that lists a valid `compoundVariants` row also prints `ButtonCompoundVariant`
with the same optional axis unions plus a `css` declaration map. Fonts
become a quoted `FontRegistry` whose weight keys are dump map keys (`bold`),
not CSS numbers (`700`). A dump that declares breakpoints plus color or spacing
tokens also prints `StyleConditionKey`, `StylePropValue<T>`, discriminated
`FontProps`, `StyleProps = FontProps & { … }` with dialect `container` /
recursive `r`, and recursive `SystemStyleObject` (condition keys plus
`&${string}` selectors). Radius keys from canon (`borderRadius` and other
`*Radius` names, never Panda `rounded*`) print when the dump has a `radii`
category. Font-less StyleProps still emit `FontRegistry {}` so
`[FontName] extends [never]` falls back to `StylePropValue<string>` instead of
`never`. Empty token and recipe categories are **omitted** rather than printed
as `never`. An empty system emits an empty string — still no `styled.div`.

`emit_dts` is always open-mode: token props keep `Token | (string & {})`.
`emit_dts_with(system, &EmitOptions { strict })` wraps `BaseSystemStyleObject`
(`StyleProps`) as `StrictColorProps` / `StrictRadiiProps` / `StrictSpacingProps`
in declaration order. Unknown and duplicate strict names are skipped. `strict`
is not a spec field and typegen does not parse `ui.config.ts`.

Users never write `.mt_2r` in these files. Atomic class names are not a public
API.

## What it does not do

- Generate `css()` / `recipe()` — those are authored TypeScript
- Generate a jsx factory, patterns (`BoxProps`), or recipes-as-modules (`recipes/*.d.ts`)
- Emit runtime token JS (`tokens.mjs`, `token(`)
- Depend on `atomic`
- Dump all of `csstype.Properties` or import `@reference-ui/styled`
- Host-wire the printer into `reference-core` — that is [PLAN.md](./PLAN.md) / root Track T

We author `css()`; we still generate the unions. The **input** is the base
system either way.

## Goldens

Committed snapshots: `tests/goldens/tokens.d.ts`, `recipes.d.ts`, `compound.d.ts`, `recipes-two.d.ts`, `fonts.d.ts`, `styles.d.ts`, `styles-fonts.d.ts`, `styles-strict.d.ts`.
Tests assert equality against `emit_dts` (open) or `emit_dts_with` (strict). Refresh is opt-in:

```bash
TYPEGEN_UPDATE_GOLDENS=1 pnpm agentrs c typegen
```

A normal `pnpm agentrs c typegen` run never rewrites the files. The token
golden stays token-only; StyleProps and SystemStyleObject live on `styles.d.ts`
(empty fonts) and `styles-fonts.d.ts` (populated dump keys). `styles-strict.d.ts`
is `strict: ['colors', 'radii', 'spacing']`. Open goldens keep `(string & {})`.
`pnpm agentrs v typegen` runs tsc consumer fixtures against those goldens.

## Verify

```bash
pnpm agentrs c typegen
pnpm agentrs v typegen
pnpm agentrs q packages/reference-rs/modules/typegen
```

> Search terms: dts printer, type printer, typegen/tokens, typegen/recipes, typegen/fonts, typegen/style-props, rs:base-system, rs:canon, rs:atomic
