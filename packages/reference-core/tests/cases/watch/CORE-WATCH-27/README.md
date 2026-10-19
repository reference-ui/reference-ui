# CORE-WATCH-27 — a config dependency created after a failed config load resyncs the watch, and its include reaches the sheet

Evidence: config loading (`loadUserConfigWithDependencies`) and the watch trigger scope (`refreshTriggerScope`).
A failed load records the files of the last successful load, and nothing it tried to import. A file the config imports
but that did not exist at the failure is in neither the live scope nor that record, so creating it wakes no resync, and
the config stays broken until some other save lands.

The spec builds a temp world whose config imports a config include fixture and syncs it. It starts `watchSync()` in-process,
then saves a config that imports a config extra-include fixture, which is not on disk. The failed load must reach `onError`
and name the missing file. The spec then creates an extra tokens file (an accent token) and a config extra-include fixture, whose
include adds `extra/**`. The create must resync the watch, and the accent must reach the sheet. The watch stops and the
temp world is removed in a `finally`.

> Search terms: failed config load, config dependency, missing import, created after failure, trigger scope, widened scope, watch resync, include, onError, onResync, CORE-WATCH-27, CORE-WATCH-13, CORE-WATCH-25
