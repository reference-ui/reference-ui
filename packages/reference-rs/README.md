# @reference-ui/rust

High-performance Rust compiler and native runtime tooling for Reference UI. Ships a single **Node-API (N-API) native addon** built with **[napi-rs](https://github.com/napi-rs/napi-rs)**, orchestrated via a shared runtime loader and typed TypeScript modules under `modules/`.

## Architecture & Responsibilities

| Subsystem | Location | Role |
| --- | --- | --- |
| **Native Addon** | `native/` | The sole `cdylib` crate (`reference-virtual-native`) compiling to `.node`. Thin switchboard exposing domain capabilities through `#[napi]` functions with zero business logic. |
| **Runtime Infrastructure** | `runtime/` | Shared TypeScript layer providing platform detection, addon binary loading (`loader.ts`), and ergonomic JSON call bridging (`native.ts`). |
| **Shared Rust Helpers** | `shared/` | Internal compiler utilities (Oxc parser helpers, span conversions, unquoting). |
| **Product Modules** | `modules/*` | Self-contained feature modules (`system`, `tasty`, `atlas`, `styletrace`, `virtualrs`), each encapsulating its pure domain Rust crate, TypeScript API wrappers, and test suites. |

## Layout

```text
packages/reference-rs/
├── Cargo.toml                              # Workspace manifest (members = native, shared, modules/*)
├── package.json                            # Package exports and scripts
│
├── native/                                 # Sole cdylib native addon
│   ├── Cargo.toml                          # Workspace path deps
│   └── src/                                # #[napi] entrypoint and module bridges
│
├── runtime/                                # Shared JS runtime layer
│   ├── loader.ts                           # Platform resolution & .node loader
│   ├── native.ts                           # Shared napi client (callNativeJson / requireNative)
│   ├── index.ts                            # Root runtime export
│   ├── shared/                             # Contract and platform targets
│   └── tools/                              # Addon build & verification tooling
│
├── shared/                                 # Shared Rust helper crate
│   └── src/
│
├── modules/                                # Product modules
│   ├── system/                             # Atomic style system compiler & canon
│   ├── tasty/                              # AST extraction, type contracts, and emitters
│   ├── atlas/                              # Component and token usage analyzer
│   ├── styletrace/                         # JSX wrapper hierarchy and style prop tracing
│   └── virtualrs/                          # Virtual module CSS/CVA rewrites & responsive lowering
│
└── dist/                                   # All generated outputs (gitignored)
    ├── *.mjs, *.d.ts                       # Public JS entrypoints (tsup + tsc)
    ├── native/                             # Built local .node binary & hash stamp
    ├── cargo/                              # Cargo target build scratch
    ├── npm/                                # Platform package stubs (staging for publish-native)
    └── artifacts/                          # Collected CI / release artifacts
```

## How It Is Bootstrapped

1. **Build the native addon** with exclusive concurrency lock:

   ```sh
   pnpm agentrs b
   ```

2. **Run tests across modules or workspace**:

   ```sh
   # Rust workspace unit tests:
   pnpm agentrs c

   # Per-module Vitest seam tests:
   pnpm agentrs v system
   pnpm agentrs v tasty
   pnpm agentrs v atlas
   pnpm agentrs v styletrace

   # Full verification pipeline (build -> cargo -> vitest -> quality):
   pnpm agentrs t
   ```

