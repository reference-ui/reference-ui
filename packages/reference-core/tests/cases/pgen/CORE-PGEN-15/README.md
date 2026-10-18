# CORE-PGEN-15 — the bound entry takes style props everywhere: family probes assign, bogus keys fail TS2353.

One probe per E1 family renders type-level: token props, a css object, and
a condition arm all assign against the bound entry. A bogus key at the
props-object position fails with TS2353, the TYPE-08 precedent. Related:
CORE-PGEN-16 (token precision), CORE-PGEN-18 (conditions), CORE-TYPE-08 (the
precedent this invalidation mirrors).

Raw E4 typed css as an open record, so the bogus-key vehicle — a bogus key
inside css() — assigned instead of failing, pinned exit-0 as an openness
probe. The per-system bake narrows css toward the system style object and
the flip is in place: the bogus key inside css now fails with TS2353, and the
bound css position is object-only (the array form fails TS2322). The world
syncs only to publish the narrow styled declarations the bound consumers
compose with.
