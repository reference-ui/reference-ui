# ATM-BOUND-03 — a 12-module export-star clique compiles in under 2 s with a missing import

`m0` through `m11` each `export * from` the other eleven, so every module sits on a cycle.
A consumer that does `import { missing } from './m0'` sends the origin and reference walks across
the whole clique, and no module exports `missing`, so no walk can answer early. A walk that
re-expands every path takes factorial time in the clique's size; the per-query visited set in
`identity.rs` and `identity/origin.rs` enters each `(file, name)` once per query, so the compile is
linear in the clique's edges.

`input/` holds the clique alone. The station compiles `input/` in process, and no walk starts
without an import, so the clique alone stays cheap there. `spec.ts` copies `input/` into a temp
project it owns through `withTempDir`, adds the consumer `src/app.ts`, and compiles that project
through `driver.mjs` in a child process. The child runs under `runIsolated` with a 30 s kill
budget and must finish inside 2000 ms through `expectBounded`. A hang or a slow walk fails this
case by name and does not stall the suite. The parent removes the temp project, so a child killed
by its budget cannot leak it.

Siblings: ATM-BOUND-01 (a deep value compiles in a child process), ATM-SITE-40 (a missing export
through an alias, the single-chain shape of the same lookup).

> Search terms: export star, barrel cycle, cycle cut, visited set, identity walk, origin walk, missing export, bounded compile, factorial paths
