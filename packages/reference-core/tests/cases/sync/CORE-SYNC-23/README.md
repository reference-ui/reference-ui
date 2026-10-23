# CORE-SYNC-23 — a tasty build still pending at the one-shot drain is drained as a failure, and a spawned ref sync on that world exits 1 with the tasty failure line

The spec copies the world to a temp project and adds `src/broken.ts`, a source that is not valid UTF-8 (the
CORE-WATCH-08 trick), so the CSS sync succeeds but the cold tasty build fails. It runs `sync()` in-process and drains
right away, while the build is still pending: the drain must return the failure, and a second drain nothing. It then
spawns `bin/ref.ts sync` on the same project and expects exit 1 with the line
`[ref] sync failed: reference tasty build failed:`.

This pins the order that already exited 1; CORE-SYNC-22 covers the order where the failure settles first.

> Search terms: flushReferenceBuild, pending, drain, cold tasty build, one-shot sync, exit code, ref sync,
> CORE-SYNC-22, CORE-WATCH-08
