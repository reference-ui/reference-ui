# ATM-SITE-21: Ternary Object Arms in JSX `css`/Condition Props

Tests that a ternary (or nested ternary) with object-literal arms in a JSX
`css` or condition prop (`_hover`, `_dark`, …) compiles every leaf of every
arm — the `css()` object path already did, the JSX style-attr path silently
dropped all of them. Core parity: `@reference-ui/lib` `Tabs.tsx` nests
`guard ? (line ? { color, borderColor } : { color, bg }) : undefined` under
`_hover`, which core extracted (RS-34). The `undefined` arm stays silent.
