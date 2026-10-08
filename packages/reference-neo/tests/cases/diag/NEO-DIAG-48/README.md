# NEO-DIAG-48 — TST-W-DUPLICATE-MEMBER reproduces through the whole compiler as warning

Merged interfaces declare one member twice; keeps the first. The world carries the minimal workspace (src/widgets.ts). The spec drives the whole tasty compiler (`buildTasty` over the case world) and asserts the code with warning level plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/tasty/src/ast/resolve/merge.rs`. Driver: the whole tasty compiler (`buildTasty` over the case world).

Evidence: `[diag]` TST-W-DUPLICATE-MEMBER (REGISTRY.md inventory + the shared repro suite row).

> Search terms: TST-W-DUPLICATE-MEMBER, tst-w-duplicate-member, diagnostics case index, NEO-DIAG-48
