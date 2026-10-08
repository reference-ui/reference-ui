# NEO-SYNC-06 — two consecutive syncs produce byte-identical folders

Evidence: `[atm]` ATM-ORDER-01..04.

The runner syncs this world fresh, then the spec syncs it twice more
node-side and compares every file under `.reference-ui/`: same relative
paths, same bytes (sha256 per file). The world carries two tokens, a base
utility, and a hover-conditional utility so the comparison covers sheet
order, not just file presence: the engine sorts sources before extraction
and the ORDER stations pin print order (query magnitude, bucket, interaction
order, shorthand-first), so the only way two runs can differ is host-side
nondeterminism — timestamps, random names, or unordered walks — and this
spec fails on any of it.

> Search terms: idempotent, repeatable, byte-stable, reproducible, twin runs, repeatability check, sync/determinism, sync/resync-bytes, ATM-ORDER-02, ATM-ORDER-03, ATM-ORDER-04
