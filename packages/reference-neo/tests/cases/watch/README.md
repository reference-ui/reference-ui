# NEO-WATCH — live watch → browser paint case group

Ports the browser-paint leg of the matrix watch contract
(`matrix/watch/tests/e2e/watch-contract.spec.ts`) to Neo: file mutation
→ watch resync → browser paint. The node-side watch behavior (add,
change, deletion, debounce, config dependencies) already lives with
NEO-SYNC-14 — this group proves only what the watcher cannot see, the
paint that follows a resync. Neo emits no `session.json` sentinel, so
these cases key readiness off the watcher's own `onResync` callback.
The matrix contract's webpack dual-consumption leg is not ported (the
H5 default retire stands — Neo has no webpack target).

> Search terms: watch paint loop, live edit repaint, file mutation paint, watch resync paint, P-watch-1, watch port, onResync

## Cases

- NEO-WATCH-01 — live-edit→paint loop: css edit, token-value edit,
  fragment add, and fragment delete each repaint the browser.
