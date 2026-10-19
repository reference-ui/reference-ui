# CORE-MERGE-04 — borderBottom '1px solid' never clobbers borderColor with currentColor

The world calls `css({ borderBottom: '1px solid', borderColor: 'slate' })`
on one element. The spec checks the sheet carries width, style, and color
atoms with no `currentColor` anywhere, and the computed bottom border
paints the slate color at 1px solid — the shorthand expands to width plus
style only, so the sibling color wins.

Evidence: reference-rs case
`rs-cases:ATM-SHORT-01`.

> Search terms: border-width, border-style, implicit value, sibling prop, border split, merge/border-expansion, merge/no-clobber, CORE-MERGE-03
