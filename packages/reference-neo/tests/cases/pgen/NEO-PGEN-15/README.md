# NEO-PGEN-15 — every E4 family probe takes style props, and bogus keys fail TS2353.

One probe per E1 family renders type-level: token props, a css object or
array, and a condition arm all assign against the vendored E4 declarations. A
bogus key at the props-object position fails with TS2353, the TYPE-08
precedent. Related: NEO-PGEN-16 (token precision), NEO-PGEN-18 (conditions),
NEO-TYPE-08 (the precedent this invalidation mirrors).

Raw E4 types css as an open record, so the NIGHT-5 vehicle — a bogus key
inside css() — assigns today instead of failing. The case pins that openness
explicitly with an exit-0 probe rather than pretending the narrow check
exists: W4's per-system bake narrows css toward the system style object and
flips the probe to a negative. The world syncs only to publish the narrow
styled declarations the E4 consumers compose with.
