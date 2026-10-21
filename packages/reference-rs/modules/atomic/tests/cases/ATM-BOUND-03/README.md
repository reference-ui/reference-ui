# ATM-BOUND-03 — a 12-module export-star clique compiles in under 2 s with a missing import

`m0` through `m11` each `export * from` the other eleven, so every module sits on a cycle.
A consumer that does `import { missing } from './m0'` sends the origin and reference walks across
the whole clique, and no module exports `missing`, so no walk can answer early. A walk that
re-expands every path takes factorial time in the clique's size; the per-query visited set in
`identity.rs` and `identity/origin.rs` enters each `(file, name)` once per query, so the compile is
linear in the clique's edges.

`input/` holds the clique alone. The station compiles `input/` in process, and no walk starts
without an import, so the clique alone stays cheap there. `driver.mjs` copies `input/` into a
temp project, adds the consumer `src/app.ts`, and compiles it through the built atomic dist in
a child process. `spec.ts` runs that child through `runIsolated` with a 30 s kill budget and
requires it to finish inside 2000 ms through `expectBounded`. A hang or a slow walk fails this
case by name and does not stall the suite.

Siblings: ATM-BOUND-01 (a deep value compiles in a child process), ATM-SITE-40 (a missing export
through an alias, the single-chain shape of the same lookup).

> Search terms: export star, barrel cycle, cycle cut, visited set, identity walk, origin walk, missing export, bounded compile, factorial paths
