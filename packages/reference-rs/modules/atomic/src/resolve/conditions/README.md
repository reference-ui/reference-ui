# Resolve / conditions

StyleProps-era pairing, kept alive:

```text
style prop     color="red"                →  (color, red, [])
pseudo-prop    _hover={{ color: 'red' }}  →  (color, red, [_hover])
```

A condition is the **`when`** list on that atom. Same slot as a style
prop; different coordinate. The leaf inside is still `color` / `bg`.

Two lowerings, one join. **Pseudo-props** are the `_` catalog JSX can
spell. **Pseudo-selectors** apply the `&` template to the utility
class. Extract is one object walk; the split is key grammar (`_` vs
`&` vs `@`), not a second AST. `@media` / `@container` strings pass
through here. `r/` already stamped those onto `when`. Bare `sm` is
not a condition.

```text
_hover  →  hover:bg_n200  +  .hover\:bg_n200:is(:hover, [data-hover])
_dark   →  dark:bg_n200   +  .dark .dark\:bg_n200
```

Nested scopes append, outer to inner. Both color-mode atoms are
emitted; the document picks.

## Must not

- Execute JS condition callbacks.
- Treat `_hover={{ mt, bg }}` as one hashed `:hover` block keyed by both.
- Treat `sm` / `_md` / `300` as conditions. Those keys belong to `r/`.
- Fold `_dark` / `_light` by reading the user’s theme at build time.
