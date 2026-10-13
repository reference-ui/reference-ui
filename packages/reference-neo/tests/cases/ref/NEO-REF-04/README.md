# NEO-REF-04 — reference refresh after rename

A rename proof with a browser leg: the spec rewrites one fixture from its original spelling to its renamed
spelling and re-syncs. A warm sync only queues the tasty rebuild on the background loop, so the spec waits for
freshness (the renamed symbol loads and the original rejects) before it trusts the manifest. The browser leg
loads `?name=` for the renamed symbol and asserts the page renders with no stale spelling. The fixture is
restored in a `finally`, so a failed run never leaves the renamed spelling on disk, and the spec resets it at
the start, so reruns are deterministic.

> Search terms: refresh, rename, resync, rebuild trigger, warm session, stale manifest, NEO-REF-11

## Oracle mapping

The proof is the spec's freshness waits (after each re-sync the manifest must load the spelling in force and
reject the one it replaced), the browser leg's rendered update, and the unit proof
`packages/reference-neo/src/sync/tasty-refresh.test.ts`, which pins that a warm sync queues a rebuild while the
manifest already exists. The world entry mirrors the matrix `?name=` consumer shell, and the importmap wires
the generated bundles plus a local `react/jsx-runtime` shim that delegates to the generated react `createElement`.
