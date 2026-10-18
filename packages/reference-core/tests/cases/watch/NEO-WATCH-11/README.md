# NEO-WATCH-11 — a one-shot covered by a resident watch exits 0 only after the watch's output reflects the saved edit

Evidence: the covered handshake (`src/sync/session-covered.ts` on the one-shot side, `src/lib/watch/handshake.ts`
on the watch side). A one-shot that meets a resident watch pokes it and used to exit 0 at once, "covered", while the
watch's resync was still running, so a caller that read exit 0 as "the output is current" read the old sheet.

The spec syncs a temp world, starts the real `ref sync --watch` CLI, and saves a fragment that spins in a CPU loop for
four seconds before it declares a new token, keeping the watch's resync in flight. A moment later a real one-shot runs
in its own process. It must exit 0 with the covered line naming the watch, and at the instant it exits the generated
sheet must already carry the new token. The old code exited in well under a second with the token absent, and the
sheet caught up seconds later. The watch stops and the world is removed in a `finally`.

> Search terms: covered one-shot, watch poke, SIGUSR2, watch-state.json, requested done, exit 0 before output current, stale output, resync in flight, NEO-WATCH-11
