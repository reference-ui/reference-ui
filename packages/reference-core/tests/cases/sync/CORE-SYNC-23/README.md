# CORE-SYNC-23 — a one-shot sync reports a tasty failure once as an error and still exits 0, whether the build settled or was pending at drain

This is the pending order: the drain arrives while the build is still running. The spec copies the world to a temp
project and adds `src/broken.ts`, a source that is not valid UTF-8 (the CORE-WATCH-08 trick), so the CSS sync succeeds
but the cold tasty build fails. It runs `sync()` in-process and drains right away: the drain returns the failure, and a
second drain returns nothing. It then spawns `bin/ref.ts sync` on the same project.

The spawned run must exit 0 and still write the stylesheet. Its output carries the failure once as an error with the
`TST-E-SCAN-FAILED` code, and the boot block's `Errors:` row names `1 tasty error`. CORE-SYNC-22 covers the order where
the failure settles first; CORE-WATCH-33 pins that watch mode reports the same failure and keeps running.

> Search terms: flushReferenceBuild, pending, drain, cold tasty build, one-shot sync, exit code, ref sync, tasty error,
> Errors row, CORE-SYNC-22, CORE-WATCH-33
