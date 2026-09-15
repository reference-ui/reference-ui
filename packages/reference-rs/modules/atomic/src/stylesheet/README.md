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
**orders** utilities so a longhand always beats the shorthand it belongs to —
expansion alone cannot order two colour utilities against each other, because
`border-color` is itself a shorthand of four longhands.

`cascade.rs` sorts every utility by `CascadeKey`:

1. rule bucket — unconditioned, selector-only, then at-rule / mixed
2. at-rule kind — supports, media, container, print, other; then size queries
   by parsed length (`min-width` ascending, `max-width` descending, millipx,
   `em`/`rem` × 16)
3. selector rank — `hover` → `focus` → `focusVisible` → `active` → `disabled`
4. **property priority** — `canon::property_cascade_rank` over existing
   longhand slices:
   `shorthands-of-shorthands → shorthands → logical longhands → physical longhands`
5. deterministic ties — property name, value string, condition authored keys

Identical at-rule wrap sequences share one wrapper tree; the sort unit is that
tree, then the rules inside it. Two at-rule wraps nest in author order
(`ATM-GHOST-05`). Adjacent identical declaration blocks do not yet
coalesce into a selector list.

Class names and rule order are **separate concerns**: condition order inside a
class name is runtime-visible and must be preserved verbatim, while rule order is
sorted for cascade. The sorter never rewrites a name.

Does not invent declarations. Does not walk source. If a want is
missing here, extract or resolve lost it.

`name/` stamps `.mt_2r`. `layers/` buckets the text. Dedup already
happened in `atom`.

## Must not

- Print a hashed `.Box_a3f2 { mt; bg }` for StyleProps.
- Rescan source to “fix” a missing atom.
- Live in JS.
