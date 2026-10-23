# ATM-BOUND-06 — a FIFO named src/pipe.ts is skipped and the tree compiles in under 2 s with the CSS of the tree without it

`input/` is a plain styling tree: `src/app.ts` sets one red colour and `src/card/card.ts` one blue
colour. The station compiles it in process, and that stylesheet is the reference.

`spec.ts` copies `input/` into a temp project it owns through `withTempDir`, makes a FIFO at `src/pipe.ts`
with `mkfifo` (git cannot hold a FIFO, so the spec makes it at runtime), and compiles that project through
`driver.mjs` in a child process under `runIsolated`. The child must finish inside 2000 ms through
`expectBounded`, and its stylesheet and class map must equal the plain tree's. Opening a FIFO blocks until a
writer appears, so a walk that reads every path named like a source hangs here and fails this case by name
rather than stalling the suite. The parent removes the temp project, so a child killed by its budget leaks
nothing. The FIFO step is skipped on Windows, which has no `mkfifo`.

Siblings: ATM-BOUND-04 (self-linked directories under the same child-process budget).

> Search terms: FIFO, named pipe, mkfifo, non-regular file, special file, blocking open, source walk, read_into, read_lossy, is_file, bounded compile, child process budget
