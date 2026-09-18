# NEO-SYNC-15 — zero-config `Card` traces into `local` and `<Card p="1r">` paints

The world configures no `jsxElements` and renders `<Card p="1r" id="card">`
beside two negatives: `Random` (takes `color` but renders a bare `<div>`)
and `Label` (plain props only, no style props at its boundary). The engine
traces `Card` inside `compile()` and returns it on
`NativeCompileResult.tracedJsxHosts`; `sync()` publishes the union through
`resolveJsxElements(config, traced)` while the request stays configured-only.
The spec checks `system/jsx-elements.json` equals `{ primitives: [],
upstream: [], local: ['Card'], merged: ['Card'] }`, `baseSystem.jsxElements`
is `['Card']`, `compile-request.json` keeps its six frozen keys with
`jsxHosts` at primitives only (discovery is not in the request), the sheet
carries exactly the Card-site utility with no `Random` ghost, `#card` paints
4px of padding, both probes stay classless, and a second sync leaves the
discovery artifacts byte-equal.

Evidence: `[atm]` ATM-SITE-56 (engine twin: same Card/Random/Label world at
the seam); `[decision D12]` (frozen request). Siblings: NEO-SYNC-04 (request
pin), NEO-SYNC-06 (determinism), NEO-SYNC-10 (merged shape), NEO-SITE-11
(configured-host twin), NEO-SITE-12 (anti-host trio).

> Search terms: discovery, traced hosts, zero-config, configured union traced, publish union, sync/jsx-hosts, escape hatch, NEO-SITE-11, NEO-SITE-12, ATM-SITE-56
