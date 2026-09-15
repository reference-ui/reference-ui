# Stylesheet

The product. AtomSet + recipes + tokens + reset → **CSS text**.

If this module does not exist, there is no system. Extract without a
sheet is a linter. `css()` without a sheet is a ghost-class machine.
`compile()` returns the sheet from here and the `css()` map from
`src/runtime` in the same call so the two cannot drift.

```css
@layer reset, global, base, tokens, recipes, utilities;

@layer reset { /* preflight */ }
@layer global { /* globalCss */ }
@layer tokens { :root { --colors-n-300: … } }
@layer recipes { .recipe-button--size_sm { … } }
@layer utilities {
  .mt_2r { margin-top: calc(2 * var(--spacing-root)); }
  .bg_n300 { background: var(--colors-n-300); }
}
```

## Cascade sort

Two mechanisms guard the shorthand cascade, not one. `resolve/shorthands`
expands `borderBottom` so it never resets `border-bottom-color`. This module
additionally **orders** utilities so a longhand always beats the shorthand it
belongs to — expansion alone cannot order two colour utilities against each
other, because `border-color` is itself a shorthand of four longhands.

Sort key:

1. rule bucket — base, selector-only, then at-rule / mixed
2. at-rule priority — supports, media, container, print, other; size queries by
   resolved length and direction
3. selector priority — pseudo-class priority table
4. **property priority** —
   `shorthands-of-shorthands → shorthands → logical longhands → physical longhands`
5. deterministic ties — property name, value key, rule conditions, class conditions

Class names and rule order are **separate concerns**: condition order inside a
class name is runtime-visible and must be preserved verbatim, while rule order is
sorted for cascade. The sorter never rewrites a name.

Does not invent declarations. Does not walk source. If a want is
missing here, extract or resolve lost it.

`name/` stamps `.mt_2r`. `layers/` buckets the text. Dedup already
happened in `atom`. Adjacent identical declaration blocks may coalesce
into a selector list — that is CSS size, not a hashed StyleProp object.

## Must not

- Print a hashed `.Box_a3f2 { mt; bg }` for StyleProps.
- Rescan source to “fix” a missing atom.
- Live in JS.
