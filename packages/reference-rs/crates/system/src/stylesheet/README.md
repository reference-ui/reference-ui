# Stylesheet

The product. AtomSet + recipes + tokens + reset → **CSS text**.

If this module does not exist, there is no system. Extract without a
sheet is a linter. `css()` without a sheet is a ghost-class machine.

Panda’s crate is literally `pandacss_stylesheet`. We kept that name.
Their `compile` returns `StylesheetOutput { css, diagnostics, … }`.
Ours will too (plus we return the `css()` map from `src/runtime` in the
same `compile()` so the two cannot drift).

```css
@layer reset, global, base, tokens, recipes, utilities;

@layer reset { /* preflight */ }
@layer global { /* globalCss */ }
@layer tokens { :root { --colors-n-300: … } }
@layer recipes { .Button_solid { … } }
@layer utilities {
  .mt_2r { margin-top: calc(2 * var(--spacing-root)); }
  .bg_n300 { background: var(--colors-n-300); }
}
```

Six layers, not Panda's five. Panda emits five and core patches the sixth in
with `demotePandaGlobalCssLayer`; **we emit all six natively** and that TS patch
becomes dead at cutover. See `layers/README.md`.

## Cascade sort

Two mechanisms guard the shorthand cascade, not one. `resolve/shorthands`
expands `borderBottom` so it never resets `border-bottom-color`. This module
additionally **orders** utilities so a longhand always beats the shorthand it
belongs to — expansion alone cannot order `.bd-c_*` against `.bd-b-c_*`, because
`border-color` is itself a shorthand of four longhands.

Sort key, adopted from Panda (`pandacss_stylesheet/src/sort.rs`, key at :164):

1. rule bucket — base, selector-only, then at-rule / mixed
2. at-rule priority — supports, media, container, print, other; size queries by
   resolved length and direction
3. selector priority — pseudo-class priority table
4. **property priority** (`:769`) —
   `shorthands-of-shorthands → shorthands → logical longhands → physical longhands`
5. deterministic ties — property name, value key, rule conditions, class conditions

Class names and rule order are **separate concerns**: condition order inside a
class name is runtime-visible and must be preserved verbatim, while rule order is
sorted for cascade. The sorter never rewrites a name.

Does not invent declarations. Does not walk source. If a want is
missing here, extract or resolve lost it.

`name/` stamps `.mt_2r`. `layers/` buckets the text. Dedup already
happened in `atom`. Adjacent identical declaration blocks may coalesce
into a selector list (Panda `grouped.rs`) — that is CSS size, not a
hashed StyleProp object.

## Files (when coded)

- `mod.rs` — `compile(atoms, recipes, config) -> StylesheetOutput`
- `name/` — `(atom) → class`
- `layers/` — `@layer` order + write
- `sort.rs` — the cascade sort key above. Earned: property priority is a
  decided requirement, not a maybe.
- later, as earned: `selectors.rs`, `globals.rs` — only when the printer needs
  them. Do not pre-create Panda’s 15 files.

## Panda

| File | Job |
| :--- | :--- |
| `vendor/panda/crates/pandacss_stylesheet/src/lib.rs` | `compile`, `StylesheetOutput`, `StylesheetLayer` |
| `src/emitter.rs` | write pass |
| `src/layers.rs` | `@layer a, b;` |
| `src/grouped.rs` | adjacent selector merge |
| `src/preflight.rs` | reset |
| `src/static_css.rs` | config static CSS. We take `globalCss` / keyframes, not their pattern zoo — and note core's `staticCss` lowers to wants in `config/`, so it arrives here as ordinary atoms |
| `src/sort.rs` | cascade sort, incl. property priority |
| `src/conditions.rs` | condition → at-rule / selector on the **utility** |
| `design-notes/stylesheet.md` | owned vs not-owned |

Not owned (same as them): theme artifact files, LightningCSS, a second
parser. Not owned (us, extra): Vue, `split_css` into a dozen files in v1.
One `styles.css` is enough until matrix says otherwise.

## Must not

- Print a hashed `.Box_a3f2 { mt; bg }` for StyleProps.
- Rescan source to “fix” a missing atom.
- Live in JS.
