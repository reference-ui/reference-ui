# CORE-WATCH-03 — a directory moved into include resyncs its class in, and moved out drops it

The runner syncs this world fresh, then the spec parks a directory holding one
`css()` file outside `include`, starts `watchSync()`, and moves the directory into
`theme/` and back out. A directory rename reaches parcel as a bare directory event
with no per-file children, so the watch must treat a directory event that can carry
matches as a scope change. Each move waits for its own resync and then reads the
sheet: the class appears on move-in and is gone after move-out. Both directories
are removed and the world restored in a `finally`.

> Search terms: directory move, rename, mv, dir move, bare directory event, move into include, move out of include, scope change, CORE-WATCH-03
