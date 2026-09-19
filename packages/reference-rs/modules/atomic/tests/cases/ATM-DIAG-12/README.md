# ATM-DIAG-12

Surface parity: imported `css()` and traced JSX predict the same
expected runtime lookup key for equivalent declarations, while native
`style` and `globalCss` predict none — they do not use the runtime
style-plan lookup.

`input/src/viaCss.ts` and `input/src/viaJsx.tsx` declare the equivalent
`mt: 2r`; both collapse to one runtime plan key. `input/src/native.tsx`
renders `<div style={{ padding: '99px' }} />` whose unique value must
reach neither wants nor plans. The expectation half of the claim
(identical predicted keys per surface, no facts for native/config
surfaces) is observable on the opt-in compiler channel.

RED (Slice 0): no independent diagnostics analysis and no
`compilerDiagnostics` channel exist yet, so the channel assertions fail.
`globalCss` has no source-import surface (it rides the base-system
config), so its exclusion is asserted on the channel plus Slice 2 unit
tests, not on station input. Related: `ATM-DIAG-08` (present proves
silent), `ATM-DIAG-11` (unknown values), `ATM-DIAG-14` (modes),
`ATM-SITE-01` (JSX StyleProps), `ATM-DIAG-04` (positions). Contract:
[SPEC.md](../../../SPEC.md). Symbols: `ExpectedKey`, `StyleSurfaceKind`,
`compilerDiagnostics`. Search: diagnostics surface parity expected-key
native-style globalCss compiler channel.
