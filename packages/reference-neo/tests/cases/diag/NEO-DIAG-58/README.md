# NEO-DIAG-58 — STT-E-UNRESOLVED-SURFACE reproduces through the whole compiler as error

No sync root, StyleProps entrypoint, or primitives surface; the trace is refused as a coded throw. The world carries sources plus the declaration root; the traced root lacks entrypoints. The spec drives the whole styletrace tracer against a refused root (coded throw) and asserts the code with error severity plus a non-blank message, so the case fails loudly if the engine ever stops emitting it.

Raised in: `modules/styletrace/src/resolver/sync_root.rs`, `modules/styletrace/src/analysis/surface.rs`. Driver: the whole styletrace tracer against a refused root (coded throw).

Evidence: `[diag]` STT-E-UNRESOLVED-SURFACE (REGISTRY.md inventory + the shared repro suite row).

> Search terms: STT-E-UNRESOLVED-SURFACE, stt-e-unresolved-surface, diagnostics case index, NEO-DIAG-58
