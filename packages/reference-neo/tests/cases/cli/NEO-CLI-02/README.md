# NEO-CLI-02 — spawned `ref sync --watch`: boot, resync, debug events, shutdown

Evidence: install-dimension investigation NATIVE GAP (LOG-2 §2 —
no native test spawns the `neo sync --watch` binary) over the bin
flag path (`bin/neo.ts:86-111` cmdWatch).

The runner syncs this world fresh, then the spec spawns the real
`ref sync --watch` binary against it and proves four legs. Boot:
the child prints its boot block, which proves the flag routed to
the watch runner, the baseline sync ran, and the watcher
subscriptions are live, the block carries the CSS and watch rows
with the TOTAL warnings (the runner drains the folded tasty landing
before printing, so sync plus tasty fold into one Warnings row —
this world's sync is clean, so the row is the tasty count) with no
standalone summary line after it, and no `watching` line or `Built
reference` trivia prints. Resync: a token-value
edit produces another sync one-liner with no file-event lines and no
resync word, and the sheet pin flips to the new value; restoring the
spelling resyncs again and flips the pin back. Debug: a `--debug` spawn
traces the triggering `[ref] change …` line on the dev-only channel
alongside the sync one-liner. Shutdown: SIGTERM exits the resident child 0,
proving the graceful shutdown path rather than death by signal. A
`finally` reaps the children, restores the canonical spelling, and
heal-syncs, so the world is byte-clean for the next run whatever
fails.

This case is the one coverage home for the bin `--watch` flag
path. It is deliberately not a second watch loop: one mutation
type, one resync signal plus output-change assert — loop breadth
(add/change/delete, debounce, config-dep) stays with SYNC-14 and
the browser-paint loop with WATCH-01, one-shot lifecycle with
CLI-01, and the bin routing negatives (`clean --watch`, unknown
command, missing-config failure) with `bin/neo.test.ts`.

> Search terms: cli watch flag, neo sync --watch, spawned watcher, watch boot, watch resync, watch shutdown, sigterm shutdown, resync signal, bin flag path, NATIVE GAP, NEO-CLI-01, NEO-WATCH-01, NEO-SYNC-14
