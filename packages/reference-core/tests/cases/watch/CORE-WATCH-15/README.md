# CORE-WATCH-15 — an edit that lands while the watch boots is in its boot sync or resynced after it

Evidence: `src/lib/watch/index.ts` (`createWatchRun`, `start`). The watch used to run its baseline sync and only then
subscribe to parcel, so an edit between the baseline's reads and the subscription was in neither the boot output nor
an event, and stayed stale until the next save. The watch now subscribes first and buffers what arrives during the
baseline, so the boot edit is either read by the baseline or resynced right after it.

The runner syncs this world fresh. The spec spawns the real `ref sync --watch` CLI with a loader hook under
`specs/shim/` that holds the watch's first subscribe for three seconds and writes a mark when that subscribe is
reached. The spec saves a new brand token as soon as the mark appears, inside that hold, and waits for the boot block.
The generated sheet must carry the saved brand at boot. Under the old order the baseline had already read the old token
when the save completed, so the boot printed the stale brand. The child stops and the token file is restored in a
`finally`.

> Search terms: boot edit, boot window, baseline sync, subscribe order, edit during boot, buffered events, catch-up sync, stale boot output, loader hook, CORE-WATCH-15, CORE-WATCH-14
