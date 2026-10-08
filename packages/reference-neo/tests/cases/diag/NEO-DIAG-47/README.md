# NEO-DIAG-47 — TST-W-DUPLICATE-DECLARATION reproduces through the whole compiler as warning

Same-file alias/mixed same-name group keeps the last shell. The world carries the minimal workspace (src/dup.ts). The spec drives the whole tasty compiler (`buildTasty` over the case world) and asserts the code with warning level plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/tasty/src/ast/resolve/merge.rs`. Driver: the whole tasty compiler (`buildTasty` over the case world).

Evidence: `[diag]` TST-W-DUPLICATE-DECLARATION (REGISTRY.md inventory + the shared repro suite row).

> Search terms: TST-W-DUPLICATE-DECLARATION, tst-w-duplicate-declaration, diagnostics case index, NEO-DIAG-47
