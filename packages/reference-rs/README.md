# @reference-ui/rust

Rust-backed native tooling for `reference-ui`. This package ships a **Node-API (N-API) native addon** built with **[napi-rs](https://github.com/napi-rs/napi-rs)** plus TypeScript in **`js/`** that loads the `.node` binary and provides **higher-level APIs** on top of those low-level bindings.

## What lives here

| Piece | Role |
| --- | --- |
| **Rust crate** (`reference-virtual-native`) | Workspace features implemented in Rust (parsers, transforms, emitters). Built as a `cdylib` for Node and as `rlib` for tests and embedding. |
| **napi-rs** | Binds selected Rust entrypoints to JavaScript via `#[napi]` on `src/lib.rs` (see **What napi-rs does here**). |
| **TypeScript (`js/`)** | Loads the `.node` addon, wraps it with ergonomic/higher-level APIs (runtimes, builders, helpers), and ships bundled ESM/DTS per public subpath (`tsup` → `dist/`). |

New capabilities will typically add a **`src/<module>/`** tree (and often a matching **`js/<module>/`** surface) and extend `lib.rs`, `package.json` `exports`, and `tsup.config.ts` as needed.

## Documentation

Feature-specific docs live under **`docs/`** (e.g. Tasty: [tasty-rs.md](./docs/tasty-rs.md), [tasty-js.md](./docs/tasty-js.md)).

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

3. **Run tests** (Rust + Vitest):

   ```sh
   pnpm --filter @reference-ui/rust run test
   ```

`package.json` declares **napi-rs targets** (e.g. `aarch64-apple-darwin`, `x86_64-unknown-linux-gnu`). The compiled artifact is named `virtual-native` and is loaded from `native/virtual-native.<triple>.node` (see `js/runtime/loader.ts`).

## What napi-rs does here

[napi-rs](https://napi.rs/) generates Node-API bindings from Rust:

- **`#[napi]`** exports in `src/lib.rs` are included when the `napi` **Cargo feature** is enabled (it is **on by default**).
- **`build.rs`** calls `napi_build::setup()` when `CARGO_FEATURE_NAPI` is set so the linker produces a loadable addon.

From JavaScript, `js/runtime/loader.ts` resolves the package directory, finds the correct `.node` file for the current OS/arch, and `require()`s it (`VirtualNativeBinding`). Feature code in **`js/`** then builds on that — thin direct exports in `js/runtime/index.ts`, richer layers under paths like `js/tasty/`.

## Package entrypoints

Exports are defined in `package.json` and built from `tsup.config.ts`.

| Subpath | Role |
| --- | --- |
| `@reference-ui/rust` | Native addon: rewrites, scanners, and other functions exposed from `lib.rs`; loader helpers. |
| `@reference-ui/rust/tasty` | Tasty runtime (TypeScript). |
| `@reference-ui/rust/tasty/browser` | Tasty browser-oriented entry. |
| `@reference-ui/rust/tasty/build` | Tasty build helpers (emit + filesystem). |

Additional **`exports`** entries will appear as new modules ship.

## Layout

- `src/lib.rs` — N-API exports and crate re-exports.
- `src/<module>/` — per-feature Rust code (e.g. `tasty/`, `virtualrs/`).
- `js/<module>/` — per-feature TypeScript: wrappers and higher-level APIs over the native addon where applicable.

For details on a given feature, see **`docs/`** or the module’s own notes under `src/`.
