# NEO-CHAIN-06 — extends over real upstream sync output, not stand-ins

Every other chain case extends a hand-built `{name, fragment, jsxElements}`
stand-in — the shape the publisher drifted away from without tripping a
single case. This case closes that hole structurally: the world carries a
real upstream package (`upstream/` with its own config and token fragment),
the spec syncs it mid-run through the real `sync()`, extends the published
`baseSystem.mjs` on disk, re-syncs the app, and proves adoption end to end.
The app holds no local tokens, so each painted probe proves the upstream
fragment evaluated; the downstream sheet, evaluated tokens, and republished
fragment pin the adoption alongside, never alone.

Evidence: matrix `CHAIN_RULES.md` fragment transitivity; core
`system/base/create.ts` singular publish; NEO-SYNC-03 publish shape.

> Search terms: real sync, published base system, extends chain, transitivity, republish, stand-in, drift, publish boundary, upstream package, NEO-CHAIN-01, NEO-SYNC-03
