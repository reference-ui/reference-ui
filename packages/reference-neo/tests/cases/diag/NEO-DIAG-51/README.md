# NEO-DIAG-51 — TST-E-SCAN-FAILED reproduces through the whole compiler as error

Scan walk, glob, path, or file read failed; the request is refused as a coded throw. The world carries one clean file; the refusal comes from the invalid glob. The spec drives the whole tasty compiler with an invalid glob (coded throw) and asserts the code with error severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/tasty/src/scanner/workspace/**`. Driver: the whole tasty compiler with an invalid glob (coded throw).

Evidence: `[diag]` TST-E-SCAN-FAILED (REGISTRY.md inventory + the shared repro suite row).

> Search terms: TST-E-SCAN-FAILED, tst-e-scan-failed, diagnostics case index, NEO-DIAG-51
