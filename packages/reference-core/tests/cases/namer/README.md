# CORE-NAMER — runtime and compiler namers agree

Proves the two namers are one algorithm: the runtime namer constructs exactly the slot and className lists the compiler namer wrote into the plans, over every engine input plus a browser corpus, while misses construct a miss class that paints nothing and warns once. `SPEC.md` carries the differential-gate contract; `TESTS.md` is the case ledger.

> Search terms: runtime namer, compiler namer, differential gate, miss class, className lists, slot lists, pre-cutover corpus

## Cases

- CORE-NAMER-01 — the runtime namer equals the compiled plans on every engine input.
- CORE-NAMER-02 — the browser corpus paints exactly the pre-cutover class lists.
- CORE-NAMER-03 — a miss constructs its miss class and warns once in browser dev.
- CORE-NAMER-04 — a late inline sheet warns only the true miss, never the present rule.

Parent: [tests/cases/](../README.md).
