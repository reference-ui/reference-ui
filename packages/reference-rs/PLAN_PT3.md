# reference-rs — runtime host + per-module ABI (`PLAN_PT3`)

This is **after** `PLAN_PT2.md`. Not a cosmetic `mv`. Independent of `DIST.md` (where the `.node` *file* lands).

One coin: **runtime is the host**; **each product owns its ABI** (`native.rs` + `js/runtime.ts`). The JS kitchen sink and the `native/src/*.rs` kitchen sink are the same bug.

**Orchestration:** one parent agent. Write `modules/runtime/README.md` as architecture (never a filename table). Do not redesign tasty/atlas/system test *meaning*. Do not spawn a harness swarm.

---

## Why (the choke point)

There is one `.node`. That stays. The mistake is that the **host also authored every product’s ABI**.

Today three JS files know every native function by name:

1. `runtime/loader.ts` — `VirtualNativeBinding` lists `rewriteCssImports` … `compileSystem`
2. `runtime/shared/native-contract.ts` — `REQUIRED_VIRTUAL_NATIVE_EXPORTS` is the same list
3. `runtime/index.ts` — wrappers for the same list (`analyzeAtlas`, `scanAndEmitModules`, …)

And the rust twin: `native/src/{atlas,tasty,system,styletrace,virtualrs}.rs`.

PT2 already moved **call sites** to `callNativeJson`. Modules still type against the god interface (`native.analyzeAtlas`). `getNativeCapabilities()` mixes product flags (`styletraceSyncRootHint`, `replaceFunctionNameImportFrom`). Root `@reference-ui/rust` *is* this sink — `reference-core` imports `rewriteCssImports` from the host, which is virtualrs’s API.

One `.node` is a **link** constraint, not a license to dump every ABI in one folder.

PT2 left host folders beside products (`runtime/`, `shared/`, `native/`). No fake package-root `src/`. All **code** under `modules/`. Fixture `package.json`s stay with the module. Some modules are products, some are supporting libraries — they are all modules.

---

## Two faces of the host

**Runtime (JS + cdylib)** is the Node host. Isolated machinery:

- Resolve `virtual-native.<triple>.node` (contributor path + optionalDeps)
- Fail closed when the binary is missing or the **host** ping fails
- `requireNative` / `callNativeJson` with **no product names**
- `ensure-native`, publish, dts entrypoints
- The cdylib that **links** product `native.rs` files (`napi-build`)

It is not Atlas, tasty, system, styletrace, or virtualrs. It is not a public `./runtime` subpath. It does not own ts-rs types.

**Each product ABI** is two files on that module:

```text
modules/atlas/native.rs       rust  #[napi] fn analyze_atlas(...)
modules/atlas/js/runtime.ts   js    analyzeAtlas(...)  — names, types, calls
modules/atlas/js/index.ts     public door (no napi)
modules/atlas/src/            domain rlib — zero napi deps
```

Domain crates stay napi-free. `#[napi]` is compiled **only** by `modules/runtime` via `#[path]`. rustc / napi-rs / clippy see it as part of `reference-virtual-native`. The atlas package does not compile that file.

---

## Constraints (do not violate)

- **One npm package** `@reference-ui/rust`. **One `.node`.** Do not publish per-module addons.
- Domain crates stay `rlib`. **Zero** `napi` / `napi-derive` on those crates.
- `#[napi]` lives in the product’s `native.rs`, compiled only by the runtime cdylib. Not part of domain `[lib]`.
- Public subpaths unchanged (`./system`, `./tasty`, `./atlas`, `./styletrace`). Root may re-export virtualrs. **Do not add** `./runtime` or `./shared`.
- `compile()` still `{ stylesheet, css, diagnostics }`.
- `js/runtime.ts` is the JS ABI. Other JS stays in sibling files.
- `callNativeJson` stays in the host; product names do not.
- Follow `agent-rs`. Do not header-stamp generated files.
- Do not start `pnpm dev:lib`. Do not commit unless asked.
- Do not do `DIST.md` in this pass. After PT3 the **crate** is `modules/runtime`; the dumped `.node` can stay `--output-dir native` until DIST.
- `git mv` where it is a move.

---

## Target tree

```text
packages/reference-rs/
  Cargo.toml                    members = ["modules/*"]
  package.json
  dist/                         DIST.md — generated only
  modules/
    runtime/                    HOST (JS + the only cdylib)
      Cargo.toml                crate-type = ["cdylib"]  name = reference-virtual-native
      build.rs                  napi_build::setup()
      src/lib.rs                host ping + #[path] product native.rs
      js/
        index.ts                host: loader, call helper; re-export virtualrs for root
        loader.ts               find/load .node, host ping only
        native.ts               requireNative, callNativeJson — no product names
        tools/                  ensure-native, publish, dts
      README.md                 load/link the addon, not compile/analyze
    shared/                     rust oxc helpers (no js door, no native.rs)
      Cargo.toml
      src/
      README.md
    atlas/
      Cargo.toml                rlib — no napi
      native.rs                 #[napi] analyze_atlas
      src/
      js/
        runtime.ts              ABI
        index.ts
        …
      tests/                    fixtures / package.json ok
      README.md
    tasty/                      same pattern
    styletrace/
    system/
    virtualrs/                  js/runtime.ts gets rewrite* (today on runtime/index.ts)
```

**Gone from the package root:** `runtime/`, `shared/`, `native/` (the crate).  
**Gone from the host:** product function lists, a handwritten `VirtualNativeBinding` of every export, a handwritten `REQUIRED_VIRTUAL_NATIVE_EXPORTS`.

```toml
[workspace]
members = ["modules/*"]

[workspace.dependencies]
shared = { path = "modules/shared" }
atlas = { path = "modules/atlas" }
# … tasty, styletrace, system, virtualrs
```

Cargo glob picks up every crate with a `Cargo.toml`. `modules/runtime` depends on product **rlibs** + `napi`. Products never depend on `runtime`. `shared` has no public door.

---

## Pattern

Host rust:

```rust
// modules/runtime/src/lib.rs
#![deny(clippy::all)]

use napi::Result;
use napi_derive::napi;

#[path = "../atlas/native.rs"]
mod atlas;
#[path = "../tasty/native.rs"]
mod tasty;
#[path = "../styletrace/native.rs"]
mod styletrace;
#[path = "../system/native.rs"]
mod system;
#[path = "../virtualrs/native.rs"]
mod virtualrs;

#[napi]
pub fn get_native_capabilities() -> Result<String> {
    // HOST ping only. No product flags.
    Ok(serde_json::json!({ "schema": 1 }).to_string())
}
```

Product JS:

```ts
// modules/atlas/js/runtime.ts
import { callNativeJson } from '../../runtime/js/native'
import type { AtlasAnalysisResult } from './types'

export const ATLAS_NATIVE_EXPORTS = ['analyzeAtlas'] as const

export interface AtlasNative {
  analyzeAtlas(rootDir: string, configJson?: string): string
}

export function analyzeDetailed(rootDir: string, configJson?: string): AtlasAnalysisResult {
  return callNativeJson<AtlasAnalysisResult, AtlasNative>('analyze Atlas data', (native) =>
    native.analyzeAtlas(rootDir, configJson)
  )
}
```

Tighten `callNativeJson` so the module passes **its** interface. `js/index.ts` re-exports `analyze` / types. It does not talk to napi.

Product capability flags live on that product (`native.rs` + `js/runtime.ts`). `ensure-native` may **union** `*_NATIVE_EXPORTS` from each `js/runtime.ts` — composition, not authorship.

---

## Public API (do not break core)

```ts
import { rewriteCssImports } from '@reference-ui/rust'
import { compile } from '@reference-ui/rust/system'
import { analyze } from '@reference-ui/rust/atlas'
```

`tsup` `index` → `modules/runtime/js/index.ts`, which **re-exports** virtualrs `js/`. Implement rewrite helpers in `modules/virtualrs/js/runtime.ts`.

Tasty tests use tasty `js/`, not host `scanAndEmitModules`. Runtime tests cover load failure only.

---

## Phase order

0. Skills / tsup / vitest / `ensure-native` hashes / Cargo members accept `modules/runtime`, `modules/shared`. Write host README as soon as the folder exists.
1. `git mv` `runtime/` → `modules/runtime/js/` (reshape). `shared/` → `modules/shared`.
2. Cdylib into `modules/runtime/`. Peel `native/src/*.rs` → `modules/<product>/native.rs`. `lib.rs` = `#[path]` + host ping.
3. Each product `js/runtime.ts`. Delete host product functions.
4. Virtualrs `js/runtime.ts`. Host index re-exports.
5. God interface / contract → composed from module export lists + host ping.
6. Delete empty package-root `native/`, `runtime/`, `shared/`.
7. Prove:

```bash
pnpm agentrs b
pnpm agentrs c
pnpm agentrs v runtime
pnpm agentrs v tasty
pnpm agentrs v atlas
pnpm agentrs v system
pnpm agentrs v styletrace
pnpm agentrs v virtualrs
pnpm agentrs t
```

`rg analyzeAtlas packages/reference-rs/modules/runtime` must be empty (virtualrs names live in virtualrs).

---

## Done when

- Opening `modules/` is the whole source tree
- Opening a product finds `native.rs` + `js/runtime.ts` + domain + tests
- Opening `modules/runtime` (and its README) explains **load/link the addon**, not compile/analyze
- No product function is *defined* on the host (re-export of virtualrs from root is ok)
- Domain crates have no napi deps
- Still one `.node`, same package exports
- `@reference-ui/rust` rewrite helpers still work for `reference-core`

---

## Read first

- `packages/reference-rs/runtime/index.ts` (JS sink)
- `packages/reference-rs/runtime/loader.ts` (`VirtualNativeBinding`)
- `packages/reference-rs/runtime/native.ts` (keep the helper, drop product names)
- `packages/reference-rs/runtime/shared/native-contract.ts`
- `packages/reference-rs/native/src/lib.rs`
- `packages/reference-rs/native/src/atlas.rs` (file moves; idea stays)
- `packages/reference-rs/modules/atlas/js/analyzer.ts`
- `packages/reference-core/src/virtual/transforms/css-imports/index.ts`
- `PLAN_PT2.md`, `DIST.md` (output path only)

Then host crate. Then per-module `native.rs` + `js/runtime.ts`. Then delete the sinks.
