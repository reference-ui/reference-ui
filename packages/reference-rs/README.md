# @reference-ui/rust

High-performance Rust compiler and native runtime tooling for Reference UI. Ships a single **Node-API (N-API) native addon** built with **[napi-rs](https://github.com/napi-rs/napi-rs)**, orchestrated via a shared runtime loader and typed TypeScript sibling modules.

The **atomic style engine** is a stack of sibling crates — TypeScript above the cut, Rust below. Architecture: the atomic engine doc. Interactive map: `map.html`. The sole `cdylib` (`reference-native`) and its JS loader live in the runtime crate; shared Rust helpers live in the shared crate.

## Atomic style engine

Sibling crates (canon, base-system, atomic, typegen,
styletrace). Each verifies itself with `pnpm agentrs c <crate>`; ask
Memex (`memex search <crate>`) for what each one is.

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
