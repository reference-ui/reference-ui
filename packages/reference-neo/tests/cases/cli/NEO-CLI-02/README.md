# NEO-CLI-02 — spawned `neo sync --watch`: boot, resync, and shutdown

Evidence: install-dimension investigation NATIVE GAP (LOG-2 §2 —
no native test spawns the `neo sync --watch` binary) over the bin
flag path (`bin/neo.ts:86-111` cmdWatch).

The runner syncs this world fresh, then the spec spawns the real
`neo sync --watch` binary against it and proves three legs. Boot:
the child prints its `watching <dir>` line, which proves the flag
routed to cmdWatch, the baseline sync ran, and the watcher
subscriptions are live. Resync: a token-value edit produces the
`[neo] resync →` stdout line plus the `[neo] change` line, and the
sheet pin flips to the new value; restoring the spelling resyncs
again and flips the pin back. Shutdown: SIGTERM exits the resident
child 0, proving the graceful shutdown path rather than death by
signal. A `finally` reaps the child, restores the canonical
spelling, and heal-syncs, so the world is byte-clean for the next
run whatever fails.

This case is the one coverage home for the bin `--watch` flag
path. It is deliberately not a second watch loop: one mutation
type, one resync signal plus output-change assert — loop breadth
(add/change/delete, debounce, config-dep) stays with SYNC-14 and
the browser-paint loop with WATCH-01, one-shot lifecycle with
CLI-01, and the bin routing negatives (`clean --watch`, unknown
command, missing-config failure) with `bin/neo.test.ts`.

> Search terms: cli watch flag, neo sync --watch, spawned watcher, watch boot, watch resync, watch shutdown, sigterm shutdown, resync signal, bin flag path, NATIVE GAP, NEO-CLI-01, NEO-WATCH-01, NEO-SYNC-14
