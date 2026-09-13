# @reference-ui/rust

Rust-backed native tooling for `reference-ui`. This package ships a **Node-API (N-API) native addon** built with **[napi-rs](https://github.com/napi-rs/napi-rs)** plus TypeScript in **`js/`** that loads the `.node` binary and provides **higher-level APIs** on top of those low-level bindings.

## What lives here

| Piece | Role |
| --- | --- |
| **Cargo workspace** (`crates/*`) | Modular, pure Rust domain crates (`shared`, `virtualrs`, `atlas`, `tasty`, `styletrace`) with zero Node dependencies. |
| **N-API bridge** (`crates/napi`) | Crate `reference-virtual-native`, built as a `cdylib` with `#[napi]` exports wrapping domain crates. |
| **TypeScript (`js/`)** | Loads the `.node` addon, wraps it with ergonomic/higher-level APIs (runtimes, builders, helpers), and ships bundled ESM/DTS per public subpath (`tsup` → `dist/`). |
| **Product suite (`tests/`)** | Vitest product tests covering fixtures, snapshots, and public contracts through the native addon and TS wrappers. |

## How it is bootstrapped

1. **Install** dependencies from the repo root (this package is part of the workspace).
2. **Build the native addon** so the `.node` binary exists for your platform:

   ```sh
   pnpm --filter @reference-ui/rust run build
   ```

   or only ensure the binary is present:

   ```sh
   pnpm --filter @reference-ui/rust run ensure-native
   ```

3. **Run tests**:

   ```sh
   # Crate unit tests (pure Rust in-memory units):
   pnpm --filter @reference-ui/rust run test:rust

   # Product suite (Vitest against N-API + wrappers):
   pnpm --filter @reference-ui/rust run test:vitest

   # Full package verification (ensure-native + cargo test + vitest):
   pnpm --filter @reference-ui/rust run test
   ```

`package.json` declares **napi-rs targets** (e.g. `aarch64-apple-darwin`, `x86_64-unknown-linux-gnu`). The compiled artifact is named `virtual-native` and is loaded from `native/virtual-native.<triple>.node` (see `js/runtime/loader.ts`).

## Layout

```
packages/reference-rs/
├── Cargo.toml            # workspace root manifest
├── crates/               # pure Rust domain crates and N-API bridge
│   ├── shared/           # oxc parser flags, span helpers, unquoting
│   ├── tasty/            # TypeScript scanner, AST extraction, generator, emitter
│   ├── atlas/            # token and component usage analysis
│   ├── virtualrs/        # virtual module CSS/CVA rewrites and responsive lowering
│   ├── styletrace/       # styletrace prop resolver & JSX wrapper tracing
│   └── napi/             # reference-virtual-native cdylib (#[napi] bridge only)
├── js/                   # TypeScript runtime wrappers and tooling
├── tests/                # Vitest product test suite (fixtures, snapshots, contracts)
└── native/               # gitignored compiled .node outputs
```
