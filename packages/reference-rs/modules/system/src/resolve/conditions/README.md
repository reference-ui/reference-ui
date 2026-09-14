# Resolve / conditions

Turns `_hover` / `_dark` / breakpoint arrays into **part of the atom
key**, plus a selector / at-rule on that utility.

```text
_hover: { bg: 'n200' }   →  atom (bg, n200, [_hover])  →  .bg_n200:hover
_dark:  { color: '…' }   →  atom (color, …, [_dark])   →  @media / host
```

Both color modes’ atoms get emitted; the document picks. Do not fold
`_dark` by reading the user’s theme at build time.

A condition is not a reason to hash the whole style object. It is a
third coordinate on the same `(prop, value, when)` lookup `css()` uses.

## Files (when coded)

- `mod.rs` — condition key → selector / at-rule
- `breakpoints.rs`

## Panda

Config: `pandacss_config` `UserConfig.conditions`. CSS lower:
`pandacss_stylesheet/src/conditions.rs`. Runtime helpers:
`pandacss_codegen/src/artifacts/conditions`. One condition model, three
homes there — we keep lower next to resolve and let `stylesheet` print
it / `css` serialize it from the same atom.when.

## Must not

- Execute JS condition callbacks.
- Treat `_hover={{ mt, bg }}` as one hashed `:hover` block keyed by both.
