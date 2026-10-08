# ATM-LAYER-15: Bare Token Names Resolve in `globalCss` Like the Atomic Path

Tests that `globalCss` values resolve bare token names through the
property's category — `fontFamily: 'sans'` → `var(--fonts-sans)`,
`borderRadius: 'md'` → `var(--radii-md)`, `outlineColor: 'ui.focus.ring'` →
`var(--colors-ui-focus-ring)` — instead of printing verbatim. Core parity:
`@reference-ui/lib` authors all three spellings (`global.ts`,
`disclosure.ts`, `shared.ts`), and core's sheet carries the `var()` forms
(RS-35). Plain literals (`display: 'flex'`) still print verbatim, silently.
