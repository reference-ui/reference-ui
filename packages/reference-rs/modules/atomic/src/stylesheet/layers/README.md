# Stylesheet / layers

The shipped contract is **six** layers nested inside the compiling
package's layer (`M0-fix21-A`):

```css
@layer color-mode {
@layer reset, global, base, tokens, recipes, utilities;
@layer global { /* ... */ }
@layer utilities { /* ... */ }
}
```

The engine is the only thing that prints the preamble, and it prints
this string. The six-layer order is verbatim and inner; the package
wrap is what lets a composed page order packages without a top-level
internal layer outranking another package's nested utilities. Do not
drop a layer to "simplify." Unnamed compiles and the rejection path
keep the bare preamble; they never compose.

| Layer | Content |
| :--- | :--- |
| `reset` | CSS reset |
| `global` | `globalCss()`, element defaults, `@keyframes` |
| `base` | reserved; stays in the order string |
| `tokens` | `:root` / `[data-layer]` CSS variables |
| `recipes` | closed `recipe()` variant classes |
| `utilities` | atomic StyleProp / `css()` leaves |

`@layer utilities` follows `@layer recipes`, so StyleProps on a recipe
host win by cascade. Do not put those atoms in the recipes layer.

## Sorting

Sorting is for stable diffs **and** for cascade safety. Property-priority
ranking sits on top of shorthand expansion:

```
shorthands-of-shorthands → shorthands → logical longhands → physical longhands
```

That rank is `canon::property_cascade_rank` (longhand nesting plus
`Inline`/`Block` in the name). Longhands rank last so they override the
shorthands they belong to. `resolve/shorthands` stops `borderBottom` from
resetting color; this ordering makes the longhand color utility beat
`border-color` regardless of extract order.

Utilities that share an at-rule wrap print inside one block. See
`../README.md` for the full `CascadeKey`.

## Must not

- Put StyleProp atoms in `@layer recipes`.
- Drop the preamble.
- Change the six-layer order string.
