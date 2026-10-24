# CORE-SYNC-22 — a one-shot sync reports a tasty failure once as an error and still exits 0, whether the build settled or was pending at drain

This is the settled order: the failure lands before the one-shot drain runs. The spec copies the world to a temp
project and adds `src/broken.ts`, a source that is not valid UTF-8 (the CORE-WATCH-08 trick), so the CSS sync
succeeds but the cold tasty build fails. It runs `sync()` in-process, waits until the cold build is no longer pending,
then calls the one-shot finisher `finishOneShotSync` with console output captured.

A tasty failure is metadata, so the finisher still drains it (the drain hands the settled failure back once) and the
run still ends 0. The failure is printed once as an error with its `TST-E-SCAN-FAILED` code, and the boot block's
`Errors:` row names it, so it cannot be missed at the end of the output. CORE-SYNC-23 covers the pending order through
the spawned `ref sync`; CORE-WATCH-33 pins that watch mode reports the same failure and keeps running.

Before the drain fix, the scheduler deleted the pending entry when the build settled, so the drain returned nothing and
the failure was lost without a trace.

> Search terms: flushReferenceBuild, finishOneShotSync, settled, drain, cold tasty build, one-shot sync, exit code,
> tasty error, Errors row, CORE-SYNC-23, CORE-WATCH-33
