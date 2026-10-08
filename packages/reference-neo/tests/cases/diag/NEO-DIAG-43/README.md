# NEO-DIAG-43 — ATM-E-INVALID-BASE-SYSTEM reproduces through the whole compiler as error

The baseSystem spec failed contract validation. The world carries the base project no authored fixture extends into this code. The spec drives native compile over the case world with the registry-documented request mutation and asserts the code with error severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/atomic/native.rs`. Driver: native compile over the case world with the registry-documented request mutation.

Evidence: `[diag]` ATM-E-INVALID-BASE-SYSTEM (REGISTRY.md inventory + the shared repro suite row).

> Search terms: ATM-E-INVALID-BASE-SYSTEM, atm-e-invalid-base-system, diagnostics case index, NEO-DIAG-43
