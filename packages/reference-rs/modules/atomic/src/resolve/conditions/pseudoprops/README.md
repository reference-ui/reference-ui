# Resolve / conditions / pseudo-props

StyleProps-era pairing, kept alive:

```text
style prop     color="red"                →  (color, red, [])
pseudo-prop    _hover={{ color: 'red' }}  →  (color, red, [_hover])
```

Same slot. Different coordinate. A style prop is `(prop, value)`. A
pseudo-prop is the **`when`** token. The leaf inside is still a style
prop. JSX can spell this because `_hover` is an identifier.

This folder owns the `_` catalog. It emits a class segment (`hover`)
and a wrap string. It does not apply `&` to a class.

```text
_hover / _focus / …    selector template   &:is(:hover, [data-hover])
_dark / _light         host selector        .dark &
_osDark / _print / …   @media
```

Nested pseudo-props append, outer to inner. Unknown `_foo` still
extracts (open `_`). No preset means the join falls through to `&:foo`.
Canon’s catalog (`_before`, `_groupHover`, …) is larger than the table
here. `sm` / `300` are not pseudo-props.

## Must not

- Execute JS condition callbacks.
- Treat `_hover={{ mt, bg }}` as one hashed `:hover` block keyed by both.
- Treat `sm` / `_md` / `300` as pseudo-props.
- Fold `_dark` / `_light` by reading the user’s theme at build time.
