# CORE-SYNC-22 — a tasty build that fails and settles before the one-shot drain is still drained as that failure, once

The spec copies the world to a temp project and adds `src/broken.ts`, a source that is not valid UTF-8 (the
CORE-WATCH-08 trick), so the CSS sync succeeds but the cold tasty build fails. It runs `sync()` in-process, then
waits until the cold build is no longer pending, so the failure has settled before anyone drains it. The first
`flushReferenceBuild` must return that failure, and a second one must return nothing.

Before the fix, the scheduler deleted the pending entry when the build settled, so the drain returned nothing and a
one-shot `ref sync` that lost this race exited 0 on a failed tasty build.

> Search terms: flushReferenceBuild, settled, drain, cold tasty build, one-shot sync, exit code, CORE-SYNC-23,
> CORE-WATCH-08
