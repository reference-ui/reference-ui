# NEO-WATCH-07 — deleting the generated folder under a live watch re-asserts its lock, so a one-shot sync reports covered

The runner syncs this world fresh, then the spec starts `watchSync()` and deletes the
generated `.reference-ui/` folder under it. The sync lock lives inside that folder, so
the watch re-asserts its own owner document, with the same nonce, on a short tick. The
spec waits for the re-assert, then runs a real one-shot `ref sync` in its own process:
it must report `already watching this project` and exit 0 without a sync of its own.
The poke that covers it resyncs the watch, which regenerates the sheet. The watch stops
and the world is restored in a `finally`.

> Search terms: generated folder deleted, rm -rf .reference-ui, sync lock lost, owner document, covered, already watching, one-shot poke, SIGUSR2, lock re-assert, NEO-WATCH-07
