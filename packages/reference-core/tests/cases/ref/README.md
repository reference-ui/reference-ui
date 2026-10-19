# CORE-REF — reference parity case group

Proves the reference behavior end to end: the generated package shape, the
symbol queries, the full browser render contract, rename refresh, the runtime shell, the type-parameter
projector, and the tasty deprioritization the perf law rests on. Worlds duplicate the small oracle fixture
corpus per case on purpose — each world stays a self-contained fixture in the SYNC-world pattern.

> Search terms: reference parity, CORE-REF, render contract, symbol queries, tasty deprioritization

Seven cases carry the group (CORE-REF-01 through 05, 09, and 11). REF-10
is the lib re-commission, proven outside cases by lib typecheck plus
Book fixtures. REF-07 and REF-08 are not cases: the bridge
`run`/`init`/`tasty-build` and `reference-types` suites already prove
them — the cases reference those suites instead of duplicating them.
REF-06 has no case: no `unionTypeLabel` surface remains in the tree.

## Shared helper

`shared/ref-world.ts` carries the readiness wait plus the manifest-backed API opener every spec uses, and
the page-text toolkit the browser specs share: normalized reads, readiness-anchored opens, inherited-section
expansion, settle reads, and the innermost-exact-text frequency map for element-exact count ports.

Parent: [tests/cases/](../README.md).
