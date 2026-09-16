# Core types — native cutover plan

Reference UI owns its public style type system. Native typegen supplies
system-specific ingredients; it does not replace the authored public
architecture.

Campaign sequence and packet C3:
[`../../../reference-rs/PLAN.md`](../../../reference-rs/PLAN.md).

Printer contract:
[`../../../reference-rs/modules/typegen/SPEC.md`](../../../reference-rs/modules/typegen/SPEC.md).

---

## Fixed decisions

1. `SystemStyleObject` is the one public authored style-object name.
2. `StylePropValue<T>` and recursive condition/selector structure are owned by
   Core.
3. `csstype` supplies the raw CSS property universe.
4. Native typegen supplies token, condition, and font unions from the exact
   evaluated system compiled for CSS. Recipe variant types for `recipe()`
   calls are inferred from Core `RecipeDefinition`. Typegen recipe unions are
   optional fixture output, not a Core import.
5. Generated unions are ingredients, not the public object architecture.
6. Primitive `StyleProps` and `css()` share `SystemStyleObject` for style
   values. `variant` and `colorMode` are primitive metadata props, not members
   of the `css()` style-object contract.
7. There is no Panda bridge, fallback type, or viewport model inherited from a
   backend package.
8. `@reference-ui/styled/types` may remain as the generated native data/type
   location during this cutover. The name does not permit Panda imports or
   executable style helpers.

---

## Current state

Already landed:

- authored `StylePropValue`
- authored `SystemStyleObject`
- authored `StyleProps`
- direct `csstype`-based property assembly
- strict color/radius wrapper infrastructure
- owned recipe callable/variant types
- generated font-registry replacement hooks

Remaining backend leaks:

- `colors.ts` / `radii.ts` use generated `UtilityValues`,
  `SystemProperties`, or `Tokens`
- `conditions.ts` imports generated backend `Conditions`
- generated `system-style-object.d.ts` resolves `Properties` through
  `styled/types/csstype`
- font/type generators are split between Core mutation and native printer
- packager exports still assume generated css/cva/jsx/pattern declarations
- comments and tests still describe Panda as the runtime

C3 removes those leaks. Do not reopen the public naming decision.

---

## Target generated ingredients

The file written from native typegen under
`.reference-ui/styled/types/index.d.ts` must expose stable ingredients such as:

- `ColorToken`
- `SpacingToken`
- `RadiusToken`
- other supported token-category unions
- `Tokens`
- `StyleConditionKey`
- `FontRegistry`, `FontName`, and weight relationships
- recipe variant/compound declarations only when `spec.recipes` is non-empty
  (Core does not import these names)

Core public source consumes only the smallest relevant aliases. It does not
import typegen's `StyleProps` or `SystemStyleObject` and wrap them.

If current typegen names differ, C3 may add a small generated re-export module.
It may not synthesize token unions by parsing emitted declaration text.
Typegen always emits these names, using `never` or `{}` when a category is
empty. C3 does not own `types/public/BaseSystem.ts` or
`types/public/recipe.ts`.

### `csstype` resolution

Generated packages live outside Core's own package directory under pnpm's
strict layout. A declaration import from bare `csstype` is not assumed to
resolve merely because Core depends on it.

Choose and test one hermetic strategy:

- copy the exact `csstype` declaration into generated
  `styled/types/csstype.d.ts`, then import it relatively; or
- package an equivalent self-contained declaration dependency.

Do not rely on workspace hoisting. Do not keep Panda's copied file without
renaming comments/ownership and proving its source/version.

---

## C3 implementation packets

### TYPE-CUT-01 — write native declarations

1. Read `.reference-ui/system/evaluated-system.json` (or receive it from C4's
   phase A helper).
2. Pass the exact parsed value plus `config.strict` to
   `@reference-ui/rust/typegen` from the write helper C4 invokes. C3 does not
   own production scheduling.
3. Write declaration text atomically into the path C4's staging root provides.
4. Assert deterministic bytes on rerun.
5. Remove stale backend declaration directories before package publication.

### TYPE-CUT-02 — replace generated ingredient imports

1. `colors.ts` narrows color-bearing keys with native `ColorToken`.
2. `radii.ts` narrows radius-bearing keys with native `RadiusToken`.
3. spacing uses native `SpacingToken` while preserving Reference rhythm
   strings.
4. `conditions.ts` consumes native `StyleConditionKey`.
5. fonts consume native `FontRegistry`.
6. recipes keep variant inference on `RecipeDefinition` in `recipe.ts` (C2
   owns that file; C3 does not edit it).

Do not import:

- `UtilityValues`
- backend `SystemProperties`
- backend `Conditions`
- backend `SystemStyleObject`

### TYPE-CUT-03 — preserve full property coverage

The owned base map remains:

```text
csstype.Properties
  + Reference aliases
  + token-aware overrides
  + Reference dialect props
  + recursive named conditions/selectors
```

Add compile tests for:

- ordinary properties outside token categories
- CSS custom properties
- aliases (`m`, `px`, `bg`, size aliases)
- rhythm and literal escape hatches
- named conditions and `&...` selectors
- `font`, `weight`, `container`, `r`
- primitive-only `variant` and `colorMode` (not on `css()` / `SystemStyleObject`)
- React event handlers surviving primitive prop intersections

Container-query-first remains a Reference decision. Do not automatically add
viewport breakpoint properties because a generated backend once did.

### TYPE-CUT-04 — generated package exports

Reduce `@reference-ui/styled` to:

- stylesheet export
- runtime-data export
- native types export

Remove declarations/exports for:

- `./css`
- `./css/cva`
- `./jsx`
- `./patterns/box`
- generated styled element factories

Update all generated package manifests and package-copy tests together.

### TYPE-CUT-05 — remove old mutation generators

After native output is consumed:

1. delete generators that patch Panda-emitted declarations
2. retain authored assembly generators only if they still have an independent
   output
3. never regex-edit native declaration output to recover old names
4. update comments from migration language to current native ownership

---

## Verification

Core unit/type checks:

```bash
pnpm agent vitest core -t "types|strict|font|recipe|packager"
pnpm agent run pnpm --filter @reference-ui/core typecheck
```

Generated consumer:

```bash
pnpm agent test --packages=@matrix/typescript
pnpm agent test --packages=@matrix/distro
```

Static assertions:

```bash
! rg -n '@pandacss|UtilityValues|SystemProperties|styled/types/conditions' \
  packages/reference-core/src/types packages/reference-core/src/packager
! rg -n '@reference-ui/styled/(css|jsx|patterns)' \
  packages/reference-core/src/types packages/reference-core/src/system/primitives
```

Done means:

- native typegen is called on the live evaluated spec
- strict/open declarations compile
- token/font/condition/recipe literals match the compiled system
- common CSS and React props retain useful types
- generated declarations resolve in a packed consumer
- no public or generated declaration imports Panda
- no removed styled runtime/type subpath is exported

---

## Do not

- Do not expose a second public style-object alias.
- Do not re-export native typegen's whole `SystemStyleObject` as Core's.
- Do not parse `.d.ts` text to discover token names.
- Do not rely on hoisted `csstype`.
- Do not keep backend bridge aliases "temporarily".
- Do not add generated jsx/pattern/runtime declarations.
- Do not weaken TypeScript matrix expectations to `any`.
- Do not edit browser runtime, compiler-driver, `types/public/BaseSystem.ts`,
  or `types/public/recipe.ts` from C3.
