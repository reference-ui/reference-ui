# Tasty — Rust API

This document describes the **Rust** side of Tasty: the crate layout, public functions, and how emitted artifacts relate to the TypeScript contract.

## Crate and native boundary

- **Crate name:** `tasty` (an `rlib` product crate, `publish = false`).
- **N-API boundary:** `modules/tasty/native.rs`, linked into the `reference-native` cdylib by `modules/runtime` via a compile-time `#[path]` include. The host owns the addon; tasty owns only its `scanAndEmitModules` export.
- No `build.rs`, no napi feature flag: the crate builds as a plain library and the napi export compiles with the host.

## Library exports (`modules/tasty/src/lib.rs`)

| Item | Notes |
| --- | --- |
| `scan_typescript_bundle` | `&ScanRequest` → `TypeScriptBundle`. Full pipeline without emitting JS modules. |
| `scan_and_emit_modules` | `&ScanRequest` → JSON string with emitted module sources and diagnostics. The napi wrapper in `native.rs` takes `(root_dir, include)` and calls this. |
| `ScanRequest` | `root_dir: PathBuf`, `include: Vec<String>` (glob patterns for workspace files). |
| `resolve_external_import_path` | Scanner helper for resolving external import paths. |

Non-NAPI consumers use `scan_typescript_bundle` and the `tasty` module directly; the NAPI layer is a thin JSON adapter for Node.

## `scan_and_emit_modules` payload

`EmittedModulesPayload` (`modules/tasty/src/scan.rs`), serialized as JSON:

- `modules` — map of **relative path → emitted JS module source**
- `type_declarations` — map of **relative path → `.d.ts` source** (where applicable)
- `diagnostics` — scanner diagnostics from the bundle

The shape must stay aligned with `modules/tasty/js/build.ts` consumers.

## Module tree (`modules/tasty/src/`)

High-level responsibilities:

| Area | Responsibility |
| --- | --- |
| `scanner/` | Workspace discovery, policy, path handling, file gathering. |
| `ast/` | Parse (oxc), extract symbols/types, resolve references. |
| `model.rs` | In-memory graph and diagnostics used during scanning. |
| `generator/` | Turns the resolved model into ESM chunks, manifest, and supporting files. |
| `emitted/` | Serde + **`ts-rs`** contract types; drives generated TypeScript under `modules/tasty/js/generated/`. Most structs are contract shapes; emission is implemented separately in `generator/`. |
| `diagnostics/` | Module diagnostic codes rooted in the shared template. |
| `scan.rs` | Orchestrates `scan_workspace` → `extract_ast` → `resolve_ast` → `build_typescript_bundle`; the emit path adds `emit_artifact_bundle` and JSON serialization. |
| `request.rs` | `ScanRequest` (root + include globs). |

`scan_typescript_bundle` is the main **library** entry for “scan and build a `TypeScriptBundle`” without going through NAPI.

## Generated TypeScript contract

Rust-owned types in `modules/tasty/src/emitted/` use **`ts-rs`** to export TypeScript definitions into `modules/tasty/js/generated/`. The hand-written emitter in `generator/` must stay aligned with those shapes. The JS runtime re-exports them as `RawTasty*` types (see [tasty-js.md](./tasty-js.md)).

## Tests

- `cargo test` — Rust unit tests (scanner, lowering, etc.).
- Case fixtures under `modules/tasty/tests/cases/` — inputs, `spec.ts` specs, and committed `output/` goldens that the Vitest case runner asserts.

For the JavaScript-facing runtime (loaders, `TastyApi`, graph helpers), see [tasty-js.md](./tasty-js.md).
