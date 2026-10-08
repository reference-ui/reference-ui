# NEO-PARITY-04 — no panda-isms leak into the generated folder

Evidence: PLAN §4.1 (forbidden paths); the matrix `data-panda-theme` pin
at `matrix/color-mode/tests/e2e/system-contract.spec.ts:103` is the recorded
divergence behind P1's absence assertion (D1: Neo stamps `data-color-mode`).

The world is the same mini-lib as PARITY-01 (identical sources, synced
fresh so the scan never reads a sibling's folder). The node-side spec rgs
the whole generated folder for the four forbidden strings and asserts
`panda.config.*` is absent by filename.

> Search terms: forbidden-strings, leak-scan, filename-check, panda-config, theme-attribute, no-panda, panda-free, parity/no-panda-isms, parity/generated-scan, NEO-PARITY-01
