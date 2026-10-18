# CORE-WATCH-27 — a config dependency created after a failed config load resyncs the watch, and its include reaches the sheet

Evidence: `src/config/load.ts` (`loadUserConfigWithDependencies`) and `src/lib/watch/scope.ts` (`refreshTriggerScope`).
A failed load records the files of the last successful load, and nothing it tried to import. A file the config imports
but that did not exist at the failure is in neither the live scope nor that record, so creating it wakes no resync, and
the config stays broken until some other save lands.

The spec builds a temp world whose config imports `config/include.ts` and syncs it. It starts `watchSync()` in-process,
then saves a config that imports `config/extra-include.ts`, which is not on disk. The failed load must reach `onError`
and name the missing file. The spec then creates `extra/tokens.ts` (an accent token) and `config/extra-include.ts`, whose
include adds `extra/**`. The create must resync the watch, and the accent must reach the sheet. The watch stops and the
temp world is removed in a `finally`.

> Search terms: failed config load, config dependency, missing import, created after failure, trigger scope, widened scope, watch resync, include, onError, onResync, CORE-WATCH-27, CORE-WATCH-13, CORE-WATCH-25
