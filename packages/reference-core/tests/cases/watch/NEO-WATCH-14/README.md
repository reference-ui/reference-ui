# NEO-WATCH-14 — a save whose event batch the OS drops still reaches the output through a watch re-scan

Evidence: `src/lib/watch/handler.ts` (`createWatcherErrorHandler`). Parcel reports a dropped OS event buffer as the error
"Events were dropped ... must be re-scanned", with no events. The old handler returned on that error, so a real save
inside the lost batch never resynced, and the output stayed stale until the next save. The fix schedules a debounced
resync, which re-reads the whole scope.

The runner syncs this world fresh. The spec then spawns the real `ref sync --watch` CLI with a loader hook under
`specs/shim/` that wraps the real `@parcel/watcher` backend. While a drop flag exists, the hook replaces the next
non-empty batch with parcel's dropped-buffer error and logs the drop. The spec sets the flag, saves a new brand token,
and waits for the drop to land. It clears the flag and expects the sheet to carry the saved brand. The hook is the only
simulated part: the save, the subscription, the batch and the resync are the real CLI path. The child stops and the
token file is restored in a `finally`.

> Search terms: dropped events, FSEvents dropped, must be re-scanned, parcel error, watch error handler, lost batch, stale output, debounced resync, loader hook, NEO-WATCH-14, NEO-WATCH-13
