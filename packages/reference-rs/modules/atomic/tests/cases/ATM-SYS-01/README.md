# ATM-SYS-01

System emission anchor. The only station whose `styles.css` golden is committed
un-normalized: it compiles against the frozen lib spec and pins the full
`@layer global` (keyframes, spacing root) and `@layer tokens` (palette, fonts,
radii) emission in one place. Every other atomic station collapses those layer
bodies via `normalizeSystemLayers`, so a lib token-value change rewrites this
golden and nothing else. Contract: [SPEC.md](../../../SPEC.md).
