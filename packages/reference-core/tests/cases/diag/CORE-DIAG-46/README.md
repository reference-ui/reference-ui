# CORE-DIAG-46 — TST-W-PARSE-ERROR reproduces through the whole compiler as warning

A file failed to parse; extraction keeps the recoverable shells. The world carries a minimal workspace with one broken file. The spec drives the whole tasty compiler (`buildTasty` over the case world) and asserts the code with warning level plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: the tasty extract pipeline. Driver: the whole tasty compiler (`buildTasty` over the case world).

Evidence: TST-W-PARSE-ERROR (the diagnostic registry inventory + the shared repro suite row).

> Search terms: TST-W-PARSE-ERROR, tst-w-parse-error, diagnostics case index, CORE-DIAG-46
