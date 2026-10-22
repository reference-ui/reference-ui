# ATM-BOUND-05 — a 7-directory link clique and a 16-level link lattice compile in under 2 s each with the CSS of the tree without links

`input/` is the plain styling tree of ATM-BOUND-04: `src/app.ts` sets one red colour and `src/card/card.ts` one blue colour, with no links. The station compiles it in process, and that stylesheet is the reference.

`spec.ts` copies `input/` into two temp projects it owns through `withTempDir`. One adds `src/clique/k0` through `k6`, each linked to the other six. The other adds `src/lattice/n0` through `n15`, where each level's two directories link to both directories of the level below. Each project compiles through `driver.mjs` in a child process under `runIsolated`. The child must finish inside 2000 ms through `expectBounded`, and its stylesheet and class map must equal the plain tree's. A walk that follows every link path again multiplies its work by the number of paths, so an unbounded walk fails this case by name rather than stalling the suite. The parent removes both temp projects, so a child killed by its budget leaks nothing.

Siblings: ATM-BOUND-04 (two self-linked directories), ATM-BOUND-01 (a deep value compiles in a child process), ATM-BOUND-03 (an export-star clique under the same child-process budget).

> Search terms: symlink clique, link lattice, symlink loop, directory link, recursive walk, source walk, scan_dir, visited directory state, canonical directory, bounded compile, child process budget
