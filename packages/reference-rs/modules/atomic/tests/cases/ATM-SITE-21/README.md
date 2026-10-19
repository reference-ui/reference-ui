# ATM-SITE-21 — Ternary Object Arms in JSX `css`/Condition Props

Tests that a ternary (or nested ternary) with object-literal arms in a JSX
`css` or condition prop (`_hover`, `_dark`, …) compiles every leaf of every
arm — the `css()` object path already did, the JSX style-attr path silently
dropped all of them. Core parity: `@reference-ui/lib` `Tabs` nests
`guard ? (line ? { color, borderColor } : { color, bg }) : undefined` under
`_hover`, which core extracted. The `undefined` arm stays silent.
