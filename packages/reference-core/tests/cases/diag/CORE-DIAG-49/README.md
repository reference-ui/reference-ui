# CORE-DIAG-49 — TST-W-STAR-AMBIGUITY reproduces through the whole compiler as warning

`export *` name from two targets is excluded from the barrel. The world carries a minimal multi-file workspace. The spec drives the whole tasty compiler (`buildTasty` over the case world) and asserts the code with warning level plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: the tasty symbol index. Driver: the whole tasty compiler (`buildTasty` over the case world).

Evidence: TST-W-STAR-AMBIGUITY (the diagnostic registry inventory + the shared repro suite row).

> Search terms: TST-W-STAR-AMBIGUITY, tst-w-star-ambiguity, diagnostics case index, CORE-DIAG-49
