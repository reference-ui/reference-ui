# Tasty tests

- **Rust** (`pnpm agentrs c tasty`): scanner, AST, and resolver unit tests. No bundle emission.
- **Vitest** (`pnpm agentrs v tasty`): station runner plus JS API tests against the compiled N-API addon.

Each `cases/TST-*` station has `input/`, `spec.ts`, `README.md`, and committed `output/` goldens (`manifest.js`, `chunks.json`). Compilation is on demand. The API loads a full emit from `tests/.scratch/<station>/`, which is gitignored. Goldens are not rewritten unless you pass `--update-goldens`.
