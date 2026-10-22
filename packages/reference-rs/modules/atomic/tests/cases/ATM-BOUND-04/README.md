# ATM-BOUND-04 — a src tree with two self-linked directories compiles in under 2 s with the CSS of the tree without them

`input/` is a plain styling tree: `src/app.ts` sets one red colour and `src/card/card.ts` one blue
colour, with no links. The station compiles it in process, and that stylesheet is the reference.

`spec.ts` copies `input/` into a temp project it owns through `withTempDir`, adds `src/loopA -> .` and
`src/loopB -> .`, and compiles that project through `driver.mjs` in a child process under `runIsolated`.
The child must finish inside 2000 ms through `expectBounded`, and its stylesheet and class map must equal
the plain tree's. A walk that follows each self-link again and again multiplies its work by two per link
level, so an unbounded walk fails this case by name rather than stalling the suite. The parent removes the
temp project, so a child killed by its budget leaks nothing.

Siblings: ATM-BOUND-01 (a deep value compiles in a child process), ATM-BOUND-03 (an export-star clique under
the same child-process budget).

> Search terms: symlink loop, self link, directory link, recursive walk, source walk, scan_dir, backfill walk, visited set, canonical directory, bounded compile, child process budget
