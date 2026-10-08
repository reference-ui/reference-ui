# NEO-TOKEN-14 — camelCase token paths define kebab vars that hardcoded uses resolve

The world declares the lib `progress.track` shape (`mixForeground` /
`mixBackground` `{light, dark}` leaves) and paints two probes: one through
the token path, one through a hardcoded `var(--colors-ui-progress-track-mix-foreground)`
exactly as lib's Slider `trackBackground` authors it. The spec checks the
sheet defines the kebab names in both color-mode blocks with no camelCase
ghosts, and that both probes compute the same gray.

Evidence: `[core]` landing-baseline-core kebab defs; `[lib]`
`shared.ts` `trackBackground`, `Slider.tsx`; `[atm]` ATM-TOKEN-13 (RS-41).

> Search terms: serialization, naming, case conversion, lowercasing, token/naming, token/color-mode, NEO-TOKEN-05
