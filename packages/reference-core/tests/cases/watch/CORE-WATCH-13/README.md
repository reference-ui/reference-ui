# CORE-WATCH-13 — a fix to a fragment that failed in a newly included dir resyncs the watch

Evidence: the watch entry (`resyncPass`) and the watch trigger scope (`refreshTriggerScope`). A resync whose
fragment fails to load throws before the trigger scope is rebuilt, so the matcher still holds the include from before
the failure. The save that fixes the fragment lands in a dir the matcher does not know, and no resync ever runs.

The runner syncs this world fresh, then the spec starts `watchSync()` in-process. It saves a config whose include adds
`extra/**`, plus an extra tokens file that throws while it loads. The failure must reach `onError`. The spec waits, then
saves the fragment fixed: it defines an accent token. The watch must resync on that save and the sheet must carry the
accent value. The old code widened nothing on the failure, so the fix never resyncs. The watch stops, the config is
restored byte for byte, and `extra/` is removed in a `finally`, so the world is clean for the next run.

> Search terms: failed resync, fragment load failure, trigger scope, widened scope, include widened, newly included dir, watch matcher, fix save, onError, onResync, CORE-WATCH-13, CORE-WATCH-07
