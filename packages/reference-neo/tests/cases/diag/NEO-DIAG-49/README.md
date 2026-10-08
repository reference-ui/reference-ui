# NEO-DIAG-49 — TST-W-STAR-AMBIGUITY reproduces through the whole compiler as warning

`export *` name from two targets is excluded from the barrel. The world carries the minimal workspace (src/a.ts, src/b.ts, src/barrel.ts). The spec drives the whole tasty compiler (`buildTasty` over the case world) and asserts the code with warning level plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/tasty/src/ast/resolve/index.rs`. Driver: the whole tasty compiler (`buildTasty` over the case world).

Evidence: `[diag]` TST-W-STAR-AMBIGUITY (REGISTRY.md inventory + the shared repro suite row).

> Search terms: TST-W-STAR-AMBIGUITY, tst-w-star-ambiguity, diagnostics case index, NEO-DIAG-49
