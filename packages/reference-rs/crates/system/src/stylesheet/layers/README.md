# Stylesheet / layers

The shipped contract is **six** layers, not five:

```css
@layer reset, global, base, tokens, recipes, utilities;
```

Asserted verbatim in three places — do not "simplify" it to Panda's five:

- `matrix/css/tests/e2e/css-contract.spec.ts:112` and `:313`
- `matrix/system/tests/e2e/system-contract.spec.ts:215`
- `matrix/distro/tests/unit/distro.test.tsx:277`

| Layer | Content |
| :--- | :--- |
| `reset` | CSS reset (`reference-core` `system/stylesheet/reset.ts`) |
| `global` | `globalCss`, element defaults |
| `base` | Panda's own base layer, kept for order compatibility |
| `tokens` | `:root` / `[data-layer]` CSS variables |
| `recipes` | closed `cva` / `sva` classes |
| `utilities` | atomic StyleProp / `css()` leaves |

## `system` emits all six natively — decided

Panda emits five and core patches in the sixth. **We emit six.** The engine is
the only thing that prints the preamble, and it prints the real contract.

Consequence: `reference-core`'s `demotePandaGlobalCssLayer` becomes dead code at
cutover (Phase 4), along with the `base`-block-rename it performs. Do not delete
it before Gate D — Panda v1 still needs it. Note that `base` stays in the
preamble even though `global` now carries `globalCss`: the order string is the
contract, and matrix asserts it verbatim.

## Where `global` comes from today (background)

Panda emits `reset, base, tokens, recipes, utilities`. The `global` layer is
**not Panda's** — `reference-core` synthesizes it after the fact in TypeScript:
`src/system/stylesheet/transform/demotePandaGlobalCssLayer.ts` renames Panda's
`base` block to `global` and splices `global` in front of `base` in the
preamble (`insertGlobalIntoLayerOrder`, line 47).

Real emitted order in a built sheet
(`.pipeline/registry/staging/reference-ui-lib-0.0.46/.reference-ui/styled/styles.css`):

```
line 1   @layer reset { … }            ← reset block precedes the preamble
line 70  @layer reset, global, base, tokens, recipes, utilities;
line 72  @layer global{ … }
line 1817 @layer tokens{ … }
line 2761 @layer utilities{ … }
```

## Sorting

Sorting is for stable diffs **and** for cascade safety. We adopt Panda's
property-priority ranking (`sort.rs:769`) in addition to shorthand expansion:

```
shorthands-of-shorthands → shorthands → logical longhands → physical longhands
```

Longhands rank last so they override the shorthands they belong to. This is the
second half of the white-border fix: `resolve/shorthands` stops `borderBottom`
from resetting color, and this ordering makes `.bd-b-c_*` (longhand) beat
`.bd-c_*` (`border-color` is itself a shorthand of four longhands) regardless of
which one extract happened to see first. Expansion alone cannot order two
colour utilities against each other.

See `../README.md` for the full sort key.

## Panda

- `vendor/panda/crates/pandacss_stylesheet/src/layers.rs`
- `src/lib.rs` — `StylesheetLayer::{Reset,Base,Tokens,Recipes,Utilities}` (five;
  ours is six)
- cascade / sort: `cascade.rs`, `sort.rs` when we need deterministic utility
  order

## Must not

- Put StyleProp atoms in `@layer recipes`.
- Drop the preamble.
- Assert the five-layer list. The matrix asserts six.
