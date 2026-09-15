# Resolve / conditions / pseudo-selectors

Applies an `&` template to a utility class. Takes a wrap string
(`&:is(:hover, [data-hover])`, `.dark &`, or a raw `css()` key) and
the escaped class selector. Emits the CSS selector the stylesheet
prints.

```text
&:is(:hover, [data-hover])  +  .hover\:bg_n200
  →  .hover\:bg_n200:is(:hover, [data-hover])

.dark &  +  .dark\:bg_n200
  →  .dark .dark\:bg_n200
```

`css()` can write the selector as the key (`'&[data-slot=inner]'`,
`'&:hover'`). That is not a JSX attribute: `&` is not an identifier.
Extract still walks a nested style object; this folder lowers the
key. `@media` / `@container` strings pass through the join, not here.

A pseudo-prop often *becomes* a pseudo-selector. `_hover` is the
prop; this folder is the `&` math. `_dark` is a host template, not
`:dark`. Do not hash a whole `_hover` object into one `:hover` rule.

## Must not

- Own the `_` catalog. That is `pseudoprops`.
- Look up breakpoint widths. `r/` already stamped `@container …`.
