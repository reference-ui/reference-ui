# NEO-REF — reference parity case group

Proves the Objective 1 port is on par with core's reference behavior: the generated package shape, the
symbol queries, the full browser render contract, rename refresh, the runtime shell, the type-parameter
projector, and the tasty deprioritization the perf law rests on. Worlds duplicate the small oracle fixture
corpus per case on purpose — each world stays a self-contained fixture in the SYNC-world pattern.

> Search terms: reference parity, NEO-REF, render contract, symbol queries, tasty deprioritization, Voyage Objective 1

## Cases

- NEO-REF-01 — reference package shape: the generated types package, its legs, the live link, the imports.
- NEO-REF-02 — reference symbol queries: local members, indexed access, StyleProps projection, extends, pins.
- NEO-REF-03 — reference render contract: all 18 oracle browser tests ported as specs.
- NEO-REF-04 — reference refresh after rename: manifest refresh plus browser update across the resync.
- NEO-REF-05 — reference runtime shell: loading, error, degenerate, provider, and provider-required states.
- NEO-REF-09 — reference type-parameter projector: the A4 numbers plus the scoped-miss mechanism.
- NEO-REF-11 — tasty deprioritization proof: sync-complete before manifest-ready plus identical output.

REF-10 is the lib re-commission, proven outside cases by lib typecheck plus Book fixtures. REF-06, REF-07,
and REF-08 are not cases: the `unionTypeLabel`, bridge `run`/`init`/`tasty-build`, and `reference-types`
suites already prove them — the cases reference those suites instead of duplicating them.

## Shared helper

`shared/ref-world.ts` carries the readiness wait plus the manifest-backed API opener every spec uses, and
the page-text toolkit the browser specs share: normalized reads, readiness-anchored opens, inherited-section
expansion, settle reads, and the innermost-exact-text frequency map for element-exact count ports.

## Open blockers

- D-OPEN-1 (RESOLVED): the closure indexed generated `index.d.ts`, so a second top-level `StyleProps` made bare lookups throw ambiguous — the RS scoped-external-ref fix plus the single-root closure change (`style-props.d.ts` alone) resolved it; REF-02/02 + REF-03/18 green, 26/26.
- D-OPEN-2 (reference-rs scope, closed ground): the compiler id-sorts extends, so multi-extends line order
  follows root-sensitive hashes instead of clause order. REF-03 spec 08 pins membership order-insensitively.
