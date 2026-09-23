# NEO-WATCH-01 — live-edit→paint loop: watch resync repaints the browser

Evidence: `[core]` watch contract (`matrix/watch/tests/e2e/watch-contract.spec.ts`,
all 3 tests: css/primitive/recipe/token edits, config-dependency edits, and
fragment add/delete — each ending in a browser-paint assert).

The runner syncs this world fresh, then the spec starts the in-process
watcher (SYNC-14's proven machinery) and proves four live mutations each
end in paint. A `css()` rewrite flips the probe from brand to ink. A token
value edit flips it again without touching the call site. A new token
fragment file paints its variable onto the probe, and deleting the fragment
unpaints it. Every leg waits the watcher's own `onResync` (Neo emits no
`session.json` sentinel), asserts the sheet first, then reloads and polls
the computed style — the sheet assert plus the paint assert together are
the resync→paint proof. The page entry is rebuilt after the call-site edit
so the reloaded page applies the new class, matching the real dev-loop
order of edit → resync + rebuild → reload → paint. Sources restore and the
world resyncs in a `finally`, so the tree is byte-clean for the next run
even when an assertion fails.

The contract's node-side legs (add/change/delete discovery, debounce,
config-dependency resync) stay covered by NEO-SYNC-14 — this case adds
only the browser-paint leg the watcher cannot see. The webpack
dual-consumption leg is not ported (H5 default retire; Neo has no webpack
target). This case plus NEO-SYNC-14 are the one coverage home for the watch
behavior; the matrix file is the interim keep they release.

> Search terms: watch paint loop, live edit repaint, file mutation paint, css edit repaint, token value repaint, fragment add paint, fragment delete unpaint, onResync, session.json, P-watch-1, watch port, NEO-SYNC-14
