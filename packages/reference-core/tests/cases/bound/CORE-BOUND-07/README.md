# CORE-BOUND-07 — a src tree holding a FIFO named pipe.ts and a link to it syncs in under 10 s with the CSS of the tree without them

A FIFO is not a regular file: opening one blocks until a writer appears, so a walk that reads every path named
like a source hangs on it. The world is a plain consumer whose include reaches `src/`. The spec copies the world
twice, into temp projects it owns.

- The baseline copy is the world as committed. `ref sync` must exit 0 under 10 s.
- The FIFO copy adds a FIFO at `src/pipe.ts`, made with `mkfifo` at runtime since git cannot hold one, and a link
  `src/pipe-link.ts -> pipe.ts`. `ref sync` must exit 0 under 10 s too, and its `styled/styles.css` must be
  byte-identical to the baseline's.

Every walker must skip both paths: the JS listing, the native scan and the Rust walk. A walker that opens the FIFO
fails the time budget, and one that lists it but drops it later can still leak it into the fragment scan. Both
children are run through the spawned bin, so a signal or an overrun reads as a named failure, and both temp
projects are removed in a finally. The case is skipped on Windows, which has no `mkfifo`.

Siblings: CORE-BOUND-03 (self-linked directories under the same budget), ATM-BOUND-06 (the FIFO in the atomic
compile alone).

> Search terms: FIFO, named pipe, mkfifo, non-regular file, special file, blocking open, link to a FIFO, project files, listProjectFiles, native scan, source walk, sync budget, CSS equality, temp world
