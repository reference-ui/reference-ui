# NEO-DIAG-12 — ATM-W-EMPTY-AT-RULE reproduces through the whole compiler as warning

At-rule key with an empty query. The world carries the minimal fixture (theme/empty-rule.ts) on the diagnostics channel. The spec drives the whole compiler (`compileWorld` over the case world) and asserts the code with warning severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/src/stylesheet/global/walker.rs`. Driver: the whole compiler (`compileWorld` over the case world).

Evidence: `[diag]` ATM-W-EMPTY-AT-RULE (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-W-EMPTY-AT-RULE, atm-w-empty-at-rule, diagnostics case index, NEO-DIAG-12
