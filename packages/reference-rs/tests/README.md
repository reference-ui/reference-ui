# Reference RS Product Tests (Vitest)

This directory contains the JavaScript/TypeScript product test suite for `@reference-ui/rust`.

All tests here run via **Vitest** through the Node-API binding (`native/virtual-native.<triple>.node`) and high-level TypeScript wrappers (`js/`).

## Runners

- **Vitest (Product Suite):**
  ```sh
  pnpm --filter @reference-ui/rust test:vitest
  ```
  Scores case catalogs, fixtures, AST emit snapshots, and public contracts (`tasty`, `atlas`, `styletrace`, `virtualfs`).

- **Cargo (Crate Internals):**
  ```sh
  pnpm --filter @reference-ui/rust test:rust
  ```
  Runs in-memory unit tests within `crates/*`. Does not execute integration tests against this folder.
