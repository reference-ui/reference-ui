# NEO-REF-09 — reference type-parameter projector

Pins the A4 numbers for the Crew B `P` to `SystemProperties` projector: the bare name resolves through the
neo decl closure with 1391 display members including `accentColor` and `container`, every scoped lookup misses
(all scanned files are library `user`, so the misses are the documented mechanism, not a fault), the real
projector maps `P` to exactly that 1391-member set, and every non-`P` name declines to `undefined`. The count
is the typegen widen's key universe (LOG-2 `## Typegen-architect` §2), verified identical to the emitted decl
keys — a removal cannot add members, so any drift is widen-side, not projector-side.

> Search terms: projector, SystemProperties, type parameter, bare-name fallback, scoped lookup, A4 numbers, NEO-REF-02

## Oracle mapping

`tasty/api.ts` via the A4 probe (Crew A): `P` resolves to the same 1391 members as the bare lookup, non-`P`
resolves to `undefined`, scoped lookups miss. The spec calls the shipped projector from
`getReferenceUiTastyApiOptions`, not a copy — the numbers pin the production path.
