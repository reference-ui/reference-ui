# CORE-WATCH-33 — a tasty failure that settles before the watch drain is reported once and the watch keeps running

The watch drains the folded tasty landing after every sync (`drainFoldedLanding`).
A failed landing prints its own `[ref] watch error: reference tasty build failed:` line instead of exiting. The
one-shot twin is CORE-SYNC-22 (settled before the drain) and CORE-SYNC-23 (pending at the drain): there the same failure
is reported once as an error and the exit stays 0. Watch mode reports and continues; one-shot reports and exits 0.

The spec copies the world to a temp project and adds `src/broken.ts`, a source that is not valid UTF-8 (the CORE-WATCH-08
trick), so the CSS sync succeeds but the cold tasty build fails. Leg one runs `sync()` in-process, waits until the cold
build is no longer pending, so the failure has settled before anyone drains it, then calls the watch's own
`drainFoldedLanding`: it must say the failure line once and return the failed landing, and a second drain must say nothing.
Leg two starts the real `ref sync --watch` on the same project: it must print the failure line and still print the boot
block, and the process must still be running afterwards. The watch stops and the temp project goes in a `finally`.

> Search terms: watch drain, drainFoldedLanding, settled tasty failure, cold tasty build, watch error line, keeps running,
> reports and continues, CORE-SYNC-22, CORE-SYNC-23, CORE-WATCH-08
