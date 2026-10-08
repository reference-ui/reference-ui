# NEO-DIAG-50 — TST-W-DUPLICATE-SYMBOL-NAME reproduces through the whole compiler as warning

One name indexes several symbols; disambiguate by id or scope. The world carries the minimal workspace (src/alpha.ts, src/beta.ts). The spec drives the whole tasty compiler (`buildTasty` over the case world) and asserts the code with warning level plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/tasty/src/generator/bundle/modules/manifest.rs`. Driver: the whole tasty compiler (`buildTasty` over the case world).

Evidence: `[diag]` TST-W-DUPLICATE-SYMBOL-NAME (REGISTRY.md inventory + the shared repro suite row).

> Search terms: TST-W-DUPLICATE-SYMBOL-NAME, tst-w-duplicate-symbol-name, diagnostics case index, NEO-DIAG-50
