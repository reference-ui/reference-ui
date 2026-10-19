# @reference-ui/rust

High-performance Rust compiler and native runtime tooling for Reference UI. Ships a single **Node-API (N-API) native addon** built with **[napi-rs](https://github.com/napi-rs/napi-rs)**, orchestrated via a shared runtime loader and typed TypeScript modules under `modules/`.

The **atomic style engine** is a stack of sibling crates under `modules/` — TypeScript above the cut, Rust below. Architecture: [`docs/atomic.md`](./docs/atomic.md). Interactive map: [`modules/map.html`](./modules/map.html). The sole `cdylib` (`reference-native`) and its JS loader live in `modules/runtime`; shared Rust helpers in `modules/shared`.

## Atomic style engine

Sibling crates under `modules/` (canon, base-system, atomic, typegen,
styletrace). Each verifies itself with `pnpm agentrs c <crate>`; ask
Memex (`memex show modules/<crate>`) for what each one is.

Other products in this package (`tasty`, `atlas`) are not this engine.

JS face for the compiler: `import { compile } from '@reference-ui/rust/atomic'`.

## How It Is Bootstrapped

1. **Build the native addon** with exclusive concurrency lock:

   ```sh
   pnpm agentrs b
   ```

2. **Run tests across modules or workspace**:

   ```sh
   # Rust workspace unit tests:
   pnpm agentrs c

   # Per-module:
   pnpm agentrs c canon
   pnpm agentrs c atomic
   pnpm agentrs v atomic

   pnpm agentrs v tasty
   pnpm agentrs v atlas
   pnpm agentrs v styletrace

   # Full verification pipeline (build -> cargo -> vitest -> quality):
   pnpm agentrs t
   ```
