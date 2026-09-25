# NEO-DIAG-46 — TST-W-PARSE-ERROR reproduces through the whole compiler as warning

A file failed to parse; extraction keeps the recoverable shells. The world carries the minimal workspace (src/broken.ts). The spec drives the whole tasty compiler (`buildTasty` over the case world) and asserts the code with warning level plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/tasty/src/ast/extract/pipeline.rs`. Driver: the whole tasty compiler (`buildTasty` over the case world).

Evidence: `[diag]` TST-W-PARSE-ERROR (REGISTRY.md inventory + the shared repro suite row).

> Search terms: TST-W-PARSE-ERROR, tst-w-parse-error, diagnostics case index, NEO-DIAG-46
