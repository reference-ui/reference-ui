# Reference RS Restructure: The Modular Rust Workspace

> **Objective:** Transition `packages/reference-rs` from a mixed Rust/Node monolith into a clean, three-tier architecture: **Pure Rust Crates (`crates/`)** ➔ **Single N-API Bridge (`native/`)** ➔ **TypeScript Runtime (`js/`)**.  
> **Core Principle:** One single npm package (`@reference-ui/rust`) for seamless distribution, backed by an isolated Cargo workspace for maximum developer speed, safety, and maintainability.

---

## 1. Motivation: The Current Friction

Right now, `packages/reference-rs` bundles Rust, Node, and TypeScript together in a single root directory:

```
packages/reference-rs/ (Current State)
├── Cargo.toml                --> Root crate tied directly to napi
├── build.rs                  --> napi-build script in the root
├── package.json              --> npm package config in the same root
├── tsup.config.ts            --> TypeScript bundler in the same root
├── virtual-native.*.node     --> Precompiled binaries sitting loose in the root
├── src/                      --> Monolithic crate (tasty, atlas, styletrace, virtualrs)
├── js/                       --> TypeScript wrappers mirroring src/
└── tests/                    --> Tests mixing Cargo unit tests, proptests, and Vitest
```

### Why This Hurts Developer Velocity:
1. **Entangled Toolchains:** `Cargo.toml` and `package.json` compete for the package root. Rust builds require Node dependencies; Node builds require Cargo artifacts.
2. **N-API Contamination:** Pure domain logic (like Tasty's AST type resolution or Atlas's color space math) is compiled within a crate that depends on `napi` and `napi-derive`. This complicates standalone `cargo test` runs and prevents clean dependency boundaries.
3. **No Shared Rust Utilities:** Code that could be shared between Tasty, Atlas, and Styletrace (fast hashing, span utilities, proptest generators) is either duplicated or tightly coupled inside `src/`.
4. **Binary Clutter:** `.node` binary artifacts sit loose in the package root alongside source files.

---

## 2. The Target Architecture: The Three-Tier Model

We maintain **one single npm package** (`@reference-ui/rust`) so we never duplicate CI build matrices or `.node` binary distribution. Internally, we separate concerns into three strict tiers:

```
┌────────────────────────────────────────────────────────┐
│ Tier 1: 🦀 Pure Rust Crates (crates/*)                 │
│ • Zero knowledge of Node.js or N-API                   │
│ • Fast standalone `cargo test` and `cargo bench`       │
│ • Strict dependency boundaries via Cargo workspace     │
├────────────────────────────────────────────────────────┤
│ Tier 2: 🌉 The N-API Bridge (native/)                  │
│ • The ONLY crate that depends on `napi`                │
│ • Thin #[napi] functions mapping Rust ➔ JS/Node        │
│ • Produces a single unified `.node` binary             │
├────────────────────────────────────────────────────────┤
│ Tier 3: 🟦 TypeScript Runtime (js/)                    │
│ • High-level ergonomic APIs over the native binary     │
│ • Type-safe lazy loaders and builders                  │
│ • Bundles to dist/ via tsup for public subpaths        │
└────────────────────────────────────────────────────────┘
```

---

## 3. Target Directory Layout

```
packages/reference-rs/
├── Cargo.toml                  --> Cargo Workspace Root (orchestrates all crates)
├── Cargo.lock
├── package.json                --> Single npm package & public subpath export map
├── tsup.config.ts              --> Bundles the TS layers to dist/
├── tsconfig.json
│
├── crates/                     --> 🦀 PURE RUST (Zero Node/JS dependencies)
│   ├── tasty/                  --> TS AST parser, semantic model, TypeRef IR, chunk generator
│   │   ├── Cargo.toml
│   │   └── src/
│   ├── atlas/                  --> Design tokens, OKLCH math, contrast ratios, theme palettes
│   │   ├── Cargo.toml
│   │   └── src/
│   ├── system/                 --> styletrace + atomic CSS extractor + stylesheet emitter
│   │   ├── Cargo.toml
│   │   └── src/
│   ├── virtualrs/              --> Virtual module import rewrites & responsive CSS transforms
│   │   ├── Cargo.toml
│   │   └── src/
│   ├── shared/                 --> Common OXC AST helpers, fx_hash, span utilities
│   │   ├── Cargo.toml
│   │   └── src/
│   └── testing/                --> Shared proptest generators, in-memory fixtures, test harnesses
│       ├── Cargo.toml
│       └── src/
│
├── native/                     --> 🌉 THE N-API BRIDGE (The ONLY place napi lives)
│   ├── Cargo.toml              --> Depends on crates/* + napi + napi-derive
│   ├── build.rs                --> napi-build setup
│   └── src/
│       └── lib.rs              --> Thin #[napi] export bindings
│
├── js/                         --> 🟦 PURE TYPESCRIPT (High-level ergonomic APIs)
│   ├── tasty/                  --> TastyApi, lazy graph loaders, symbol query engine
│   ├── atlas/                  --> High-level Token & Theme APIs
│   ├── system/                 --> Runtime styling helpers
│   ├── styletrace/             --> Styletrace inspection helpers
│   └── runtime/                --> Native binary loader (resolves native/*.node)
│
├── npm/                        --> Precompiled platform binaries for release
│   ├── darwin-arm64/
│   ├── linux-x64-gnu/
│   └── win32-x64-msvc/
│
├── benches/                    --> Criterion performance benchmarks (targeting crates/*)
└── tests/                      --> End-to-end integration tests (Rust + Vitest)
```

---

## 4. Detailed Crate Responsibilities

### `crates/shared` (Common Foundation)
- Common OXC parser configuration (TypeScript, JSX, decorator flags).
- Source span helpers and string slicing (`slice_span`).
- High-performance non-cryptographic hashing (`fx_hash`).
- String and identifier utilities.

### `crates/testing` (Shared Test Harness)
- Generative `proptest` strategies for AST nodes and type trees.
- In-memory TS/TSX file fixtures for scanner tests.
- Snapshot assertion helpers and Criterion benchmark fixtures.
- Shared between `tasty`, `atlas`, `system`, and `virtualrs`.

### `crates/tasty` (TypeScript Semantic Model & IR)
- Independent Rust library for TypeScript AST analysis and type lowering.
- **Owns:** `scanner/`, `ast/`, `model.rs` (`TypeRef`), `resolve/`, and `generator/`.
- **Zero N-API code:** Produces in-memory `TypeScriptBundle` and emitted artifact maps.
- Native `cargo test -p tasty` runs with zero Node dependencies.

### `crates/atlas` (Design Tokens & Color Science)
- OKLCH color space math, contrast ratio calculations, palette generators.
- Token dictionary structures and theme inheritance resolution.

### `crates/system` (The Native Styling Engine)
- Incorporates **`styletrace`** (identifying style-bearing JSX tags and prop forwarding).
- Recursive leaf literal collector (extracting literals from nested ternaries).
- Native rhythm and shorthand decomposition.
- CSS cascade layer emitter (`@layer reset, base, tokens, recipes, utilities`).

### `crates/virtualrs` (Virtual Module Transforms)
- AST-level CSS import rewriting (`rewrite_css_imports`).
- CVA import rewriting (`rewrite_cva_imports`).
- Container query responsive transforms (`apply_responsive_styles`).

### `native/` (The Single N-API Bridge)
- Compiles the single `.node` dynamic library (`cdylib`).
- Imports `tasty`, `atlas`, `system`, and `virtualrs` as internal workspace crates.
- Exposes thin, strictly typed `#[napi]` functions that translate Rust structs into JSON strings or JS objects.

---

## 5. Phased Migration Plan

### Phase 1: Workspace Scaffolding (Zero Functional Changes)
1. Convert root `packages/reference-rs/Cargo.toml` into a workspace manifest:
   ```toml
   [workspace]
   members = [
     "crates/shared",
     "crates/testing",
     "crates/tasty",
     "crates/atlas",
     "crates/virtualrs",
     "crates/system",
     "native",
   ]
   resolver = "2"
   ```
2. Create `crates/shared` and extract basic span/string/hash helpers.
3. Create `crates/testing` and move shared `proptest` strategies into it.

### Phase 2: Extract Pure Rust Crates
1. Move `src/tasty/` ➔ `crates/tasty/src/`.
2. Move `src/atlas/` ➔ `crates/atlas/src/`.
3. Move `src/virtualrs/` ➔ `crates/virtualrs/src/`.
4. Move `src/styletrace/` ➔ `crates/system/src/styletrace/`.
5. Verify each crate compiles and passes unit tests in pure Rust mode:
   ```bash
   cargo test --workspace --exclude reference-virtual-native
   ```

### Phase 3: Wire the N-API Bridge (`native/`)
1. Create `native/Cargo.toml` with `crate-type = ["cdylib"]` and `napi` dependencies.
2. Move `src/lib.rs` and `build.rs` into `native/`.
3. Point `native/src/lib.rs` at `crates::tasty`, `crates::atlas`, etc.
4. Build the native addon:
   ```bash
   pnpm --filter @reference-ui/rust run build:native
   ```

### Phase 4: Clean Up the TypeScript Runtime (`js/`) & Root
1. Update `js/runtime/loader.ts` to look for the compiled binary in `native/` (or `npm/`).
2. Move loose `.node` binaries out of the root into `native/` or `npm/`.
3. Verify `tsup.config.ts` bundles all public entrypoints (`@reference-ui/rust/tasty`, etc.) to `dist/`.

### Phase 5: Verification & Zero Regression Proof
1. Run full Rust unit test suite: `cargo test`.
2. Run full Vitest suite: `pnpm --filter @reference-ui/rust test`.
3. Run all matrix tests: `pnpm agent test --packages=@matrix/primitives,css,system`.

---

## 6. Public Contract Guarantee (Zero Breaking Changes)

This restructure is an **internal architectural cleanup**. Downstream consumers in `packages/reference-core` and user projects will experience **zero breaking changes**:

```ts
// All public subpaths remain identical:
import { scanTypeScriptBundle } from '@reference-ui/rust/tasty'
import { trace } from '@reference-ui/rust/styletrace'
import { rewriteCssImports } from '@reference-ui/rust'
```

Package exports, DTS definitions, and published npm layouts remain 100% backwards-compatible.
