# NEO-REF-04 — reference refresh after rename

Port of the matrix refresh unit test plus a browser leg: the spec rewrites one fixture from its original to
its renamed spelling, re-syncs (the wipe deletes the manifest), and the warm-session trigger restores the
artifacts on the background loop. The manifest half asserts the renamed symbol loads and the original rejects;
the browser half loads `?name=` for the renamed symbol and asserts the page renders with no stale spelling.
The spec restores the original spelling at the end, and resets it at the start, so reruns are deterministic.

> Search terms: refresh, rename, resync, rebuild trigger, warm session, stale manifest, NEO-REF-11

## Oracle mapping

Matrix unit test 7 (`refreshes generated reference artifacts after a source symbol rename`), with the D2
browser leg added: manifest refresh plus rendered update across the resync. The world entry mirrors the
matrix `?name=` consumer shell, and the importmap wires the generated bundles plus a local `react/jsx-runtime`
shim that delegates to the generated react `createElement`.
