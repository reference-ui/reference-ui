# Tasty — Rust API

This document describes the **Rust** side of Tasty: the crate layout, public functions, and how emitted artifacts relate to the TypeScript contract.

## Crate and features

- **Package / crate name:** `reference-virtual-native` (Cargo), published to npm as `@reference-ui/rust`.
- **Library type:** `cdylib` + `rlib` — shared library for Node and Rust tests/embedders.
- **Feature `napi` (default):** enables `napi` / `napi-derive` and exports Node-API functions from `src/lib.rs`. With `napi` off, you can build/link without the JS addon path (e.g. tests that only use `rlib`).

`build.rs` runs **napi-rs** build glue when the `napi` feature is active so the `cdylib` links correctly for Node.

## Root exports (`src/lib.rs`)

| Item | Notes |
| --- | --- |
| `scan_typescript_bundle` | `ScanRequest` → `TypeScriptBundle`. Full pipeline without emitting JS modules. |
| `ScanRequest` | `root_dir: PathBuf`, `include: Vec<String>` (glob patterns for workspace files). |
| `rewrite_css_imports` | **N-API only.** String in/out for virtual CSS import rewriting. |
| `rewrite_cva_imports` | **N-API only.** String in/out for CVA import rewriting. |
| `scan_and_emit_modules` | **N-API only.** Runs the Tasty pipeline and returns **JSON** with emitted module sources and diagnostics (see below). |

Non-NAPI consumers use `scan_typescript_bundle` and the `tasty` module directly; the NAPI layer is a thin JSON adapter for Node.

## `scan_and_emit_modules` payload

When called from JavaScript via `scanAndEmitModules(rootDir, include)`, Rust returns a JSON string roughly shaped as:

- `modules` — map of **relative path → emitted JS module source**
- `type_declarations` — map of **relative path → `.d.ts` source** (where applicable)
- `diagnostics` — scanner diagnostics from the bundle

The exact shape is defined in `src/tasty/scan.rs` (`EmittedModulesPayload`) and should stay aligned with `js/tasty/build.ts` consumers.

## Module tree (`src/tasty/`)

High-level responsibilities:

| Area | Responsibility |
| --- | --- |
| `scanner/` | Workspace discovery, policy, path handling, file gathering. |
| `ast/` | Parse (oxc), extract symbols/types, resolve references. |
| `model/` | In-memory graph and diagnostics used during scanning. |
| `generator/` | Turns the resolved model into ESM chunks, manifest, and supporting files. |
| `emitted/` | Serde + **`ts-rs`** contract types; drives generated TypeScript under `js/tasty/generated/`. Most structs are contract shapes; emission is implemented separately in `generator/`. |
| `scan.rs` | Orchestrates `scan_workspace` → `extract_ast` → `resolve_ast` → `build_typescript_bundle`; NAPI path adds `emit_artifact_bundle` and JSON serialization. |
| `request.rs` | `ScanRequest` (root + include globs). |

`scan_typescript_bundle` is the main **library** entry for “scan and build a `TypeScriptBundle`” without going through NAPI.

## `virtualrs/` (non-Tasty natives)

`src/virtualrs/` implements **virtual module** post-processing used elsewhere in the workspace (CSS and CVA import rewriting). The same functions are what N-API exposes as `rewrite_css_imports` / `rewrite_cva_imports`.

## Generated TypeScript contract

Rust-owned types in `src/tasty/emitted/` use **`ts-rs`** to export TypeScript definitions into `js/tasty/generated/`. The hand-written emitter in `generator/` must stay aligned with those shapes. The JS runtime re-exports them as `RawTasty*` types (see [tasty-js.md](./tasty-js.md)).

## Tests

- `cargo test` — Rust unit tests (scanner, lowering, etc.).
- Fixture outputs under `tests/tasty/cases/` — emitted bundles and Vitest tests that assert shape and runtime behavior.

For the JavaScript-facing runtime (loaders, `TastyApi`, graph helpers), see [tasty-js.md](./tasty-js.md).
