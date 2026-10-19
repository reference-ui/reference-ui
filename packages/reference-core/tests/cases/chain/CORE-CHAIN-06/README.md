# CORE-CHAIN-06 — extends over real upstream sync output, not stand-ins

Every other chain case extends a hand-built `{name, fragment, jsxElements}`
stand-in — the shape the publisher drifted away from without tripping a
single case. This case closes that hole structurally: the world carries a
real upstream package (`upstream/` with its own config and token fragment),
the spec syncs it mid-run through the real `sync()`, extends the published
`baseSystem` on disk, re-syncs the app, and proves adoption end to end.
The app holds no local tokens, so each painted probe proves the upstream
fragment evaluated; the downstream sheet, evaluated tokens, and republished
fragment pin the adoption alongside, never alone.

Evidence: the matrix chain rules on fragment transitivity; core
the singular system publish; CORE-SYNC-03 publish shape.

> Search terms: real sync, published base system, extends chain, transitivity, republish, stand-in, drift, publish boundary, upstream package, CORE-CHAIN-01, CORE-SYNC-03
