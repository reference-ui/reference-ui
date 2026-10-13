# NEO-WATCH-12 — a one-shot that meets a stopping watch syncs for itself, so an edit saved during the stop is never lost

Evidence: `[neo]` the covered handshake (`src/sync/session-covered.ts`, `src/lib/watch/index.ts`). A one-shot that pokes a
watch which is stopping used to be told "covered" (exit 0), but a stopping watch drops the poke, so the edit it was asked
to sync was never synced and nothing was left watching. The watch now publishes `stopping` before it settles, and a
one-shot that finds it waits for the release and syncs for itself.

The spec syncs a temp world and starts the real `ref sync --watch` CLI. A gate in the config holds the watch's next
resync before it reads anything, and SIGINT begins the graceful stop while the resync waits. Opening the gate lets the
resync read its inputs and enter a fragment that spins for a moment; while it spins, the brand token is edited, which
that resync has already read. A real one-shot then runs. It must say the watch is stopping and wait, then take the lock
and sync itself: exit 0, no covered line, and the generated sheet carries the edit. The old code exited 0 "covered"
at once and the edit was lost. The watch must end by an exit code, never a signal.

> Search terms: stopping watch, poke lost, covered while stopping, watch-state stopping, graceful stop, one-shot syncs itself, edit lost, SIGINT, NEO-WATCH-12
