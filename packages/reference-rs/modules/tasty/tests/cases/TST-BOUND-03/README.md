# TST-BOUND-03 — a 7-directory link clique and a 16-level lattice scan in under 2 s with each real file once

`input/` is a plain tree of two files with no links. `src/app.ts` declares `App` and `src/card/card.ts` declares `Card`. `spec.ts` copies it into two temp projects it owns, through `withTempDir`. One adds `src/clique/k0` through `k6`, each holding one interface file and linked to the other six. The other adds `src/lattice/n0` through `n15`, each level's two directories holding one interface file apiece and linked to both directories of the level below. Each project builds through `build-linked.mjs` in a child process under `runIsolated`: the kill budget is 15 s and the budget through `expectBounded` is 2000 ms.

The build must report no diagnostics and must list every real file exactly once, so its symbols are the plain two plus one per linked file, with no duplicates. Under the shared walk a linked directory is walked once per directory and include state, so the work follows directories times states, not link paths; a walk that follows every link path again multiplies its work by the number of paths, and fails this case by name. The parent removes both temp projects, so a child killed by its budget leaks nothing.

Siblings: TST-BOUND-02 (a deep declaration is bounded in a child process under the same budget), ATM-BOUND-05 (the same clique and lattice shapes compile in atomic), and the loop and clique tests in `scanner/workspace/tests/dangling_links.rs`.

> Search terms: symlink clique, link lattice, symlink loop, directory link, recursive walk, shared walk, visited directory state, canonical directory, bounded scan, child process budget, each real file once
