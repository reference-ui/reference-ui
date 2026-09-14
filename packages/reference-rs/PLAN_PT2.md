# reference-rs — modules folder + one N-API shape

This is the spec. PT1 moved products out of `crates/` / `js/` / `tests/`. They still sit loose next to `native/` and `runtime/`, and ts-rs still dumps a second copy under package-root `js/`. Nest the products, share the dep trees, delete the duplicates. Do not pause for a third plan.

**Orchestration:** one parent agent. This is packaging, not a per-product harness redesign. Do not re-open tasty/atlas/system test philosophy. Do not spawn four Gemini test agents.

---

## Why it still feels off

PT1 made each product a directory (`atlas/`, `tasty/`, …). That is better than three taxonomies. It is not yet a package of modules.

Opening `packages/reference-rs/` still mixes:

| Kind | What | Where today |
| --- | --- | --- |
| Package shell | npm + cargo workspace | `package.json`, `Cargo.toml` |
| Switchboard | one `.node` | `native/` |
| JS loader / tools | not a product | `runtime/` |
| Shared rust | oxc helpers | `shared/` |
| Products | rust + js + tests | **loose at the root** |
| Ghost dump | live ts-rs output | `js/atlas/generated`, `js/tasty/generated` |

`modules/` already exists and is empty. Put the products in it.

The duplicate you spotted is real:

- **Live emit:** `.cargo/config.toml` sets `TS_RS_EXPORT_DIR` to the package root. Rust still says `export_to = "js/atlas/generated/"`. ts-rs writes `packages/reference-rs/js/…`.
- **Hand copies:** overnight work copied those files into `atlas/js/generated/` and `tasty/js/generated/`, then stamped generic file headers on generated code. The module JS imports the copies. The next `cargo test` / ts-rs export will refresh `js/`, not the copies.

Two trees. One of them is a lie.

Same looseness on the N-API seam: every product re-invents `JSON.parse(runtime.analyzeX(…))`. `compileSystem` is not even on `VirtualNativeBinding` / `REQUIRED_VIRTUAL_NATIVE_EXPORTS` — `runtime/index.ts` casts around it. There is no shared JS client and no shared Cargo path graph (every crate hardcodes `path = "../styletrace"`).

---

## Constraints (do not violate)

- **One npm package:** `@reference-ui/rust`
- **One native addon** (`.node`). Domain crates stay `rlib`. Do **not** put `#[napi]` in `modules/*/src`. Do **not** publish per-module addons.
- Public API stays subpath exports (`./system`, `./tasty`, `./atlas`, `./styletrace`). Root export stays runtime/virtualrs helpers. **Do not add `./virtualrs` unless it already exists.**
- `compile()` still returns `{ stylesheet, css, diagnostics }`. Canon stays inside system. Do not export tables.
- Follow `.agents/skills/agent-rs/SKILL.md`. No `#[allow]`. Generated files are **not** the place for 2–6 sentence headers.
- Do not start `pnpm dev:lib`. Do not commit unless asked.
- **No env flags for goldens.** CLI only: `--update-goldens` on system Vitest.
- Do not rewrite test harnesses. Relocate paths. Keep `api.test.ts` / `spec.ts` / fixture meaning from PT1.
- `git mv`. Do not copy-paste history away.
- **Do not unify build output folders.** `target/`, `npm/`, `artifacts/`, and `native/*.node` stay where they are in this pass. That is `DIST.md` (after PT2). `native/` the **crate** stays; only the dumped `.node` is a later move.
- **Do not unpack `runtime/index.ts` or peel `native/src/*.rs`.** `callNativeJson` is enough for PT2. Per-module ABI + host under `modules/` is `PLAN_PT3.md`.

---

## Target tree

```text
packages/reference-rs/                      @reference-ui/rust
│
├── Cargo.toml                              members = native, shared, modules/*
├── package.json
├── PLAN.md
├── PLAN_PT2.md                             this file
│
├── native/                                 the only cdylib
│   ├── Cargo.toml                          workspace path deps: atlas, tasty, …
│   └── src/
│       ├── lib.rs                          loader + capability ping
│       ├── tasty.rs                        #[napi] JSON bridge → tasty crate
│       ├── atlas.rs
│       ├── system.rs
│       ├── styletrace.rs
│       └── virtualrs.rs
│
├── runtime/                                JS shared tree (core’s lib/)
│   ├── index.ts                            public root: virtualrs helpers + native dispatch
│   ├── loader.ts
│   ├── native.ts                           NEW: require + JSON roundtrip (the JS napi client)
│   ├── shared/                             contract, targets, paths
│   └── tools/
│
├── shared/                                 Rust shared tree (core’s lib/)
│   ├── Cargo.toml                          oxc helpers — not a product
│   └── src/
│
└── modules/                                products only
    ├── tasty/
    │   ├── Cargo.toml                      rlib; deps via workspace.dependencies
    │   ├── src/
    │   ├── js/                             @reference-ui/rust/tasty
    │   │   ├── generated/                  ts-rs ONLY — never hand-edit
    │   │   └── …
    │   ├── tests/
    │   └── README.md
    ├── atlas/                              same shape
    ├── styletrace/                         js may stay thin; still a module
    ├── system/
    │   ├── canon/                          JS ingest
    │   ├── src/canon/                      generated rust tables
    │   ├── js/                             compile() only
    │   └── tests/
    └── virtualrs/                          rust + tests; JS stays on runtime root export
```

**Infrastructure stays at the package root:** `native/`, `runtime/`, `shared/`.
**Products live under `modules/`.** That is the whole point.

**Gone**

- `packages/reference-rs/js/` (the dump)
- Product folders at the package root (`atlas/`, `tasty/`, `styletrace/`, `system/`, `virtualrs/`)
- Dual Vitest includes (`tests/atlas/**`, `js/atlas/**`, `crates/` fallbacks)
- Hand-copied generated files and fake headers on ts-rs output
- Per-crate `path = "../styletrace"` soup

**Still one `.node`.** `native/` is the switchboard. A module “acts as a napi module” by: rust domain + `native/src/<mod>.rs` + `modules/<mod>/js` calling `runtime/native.ts`.

---

## Shared dependency tree

### Rust (`Cargo.toml` workspace)

Put **internal crates** next to the oxc crates so nobody invents a relative path:

```toml
[workspace]
members = [
  "native",
  "shared",
  "modules/*",
]
resolver = "2"

[workspace.dependencies]
# third-party (keep today’s pins)
oxc_parser = "0.115"
# …

# internal
shared = { path = "shared" }
atlas = { path = "modules/atlas" }
tasty = { path = "modules/tasty" }
styletrace = { path = "modules/styletrace" }
system = { path = "modules/system" }
virtualrs = { path = "modules/virtualrs" }
```

Every crate then:

```toml
[dependencies]
shared.workspace = true          # if it needs oxc helpers
styletrace.workspace = true      # system
tasty.workspace = true           # styletrace
```

`native/Cargo.toml` uses the same workspace path deps. No `path = "../atlas"`.

### JavaScript (`runtime/`)

One loader. One native client. Modules do not import `loader.ts`.

```ts
// runtime/native.ts  (name can be native.ts / call.ts — one file, not a framework)
export function requireNative(feature: string): VirtualNativeBinding
export function callNativeJson<T>(feature: string, run: (n: VirtualNativeBinding) => string): T
```

Module JS (all at the same depth `modules/<name>/js/`):

```ts
import { callNativeJson } from '../../../runtime/native'
```

That relative path is the convention. Do not add a second alias system unless tsup cannot bundle it (if you add `#runtime`, wire tsup + tsconfig together; do not leave a dangling path).

`VirtualNativeBinding` and `REQUIRED_VIRTUAL_NATIVE_EXPORTS` must list **every** `#[napi]` export, including `compileSystem`. No more optional casts.

---

## Shared way to be a N-API module

A product is not a cdylib. This is the shape:

```text
modules/<name>/src          rust domain (serde types, ts-rs)
native/src/<name>.rs        #[napi] fn → domain → JSON string (or source string)
modules/<name>/js           typed wrapper: callNativeJson + generated types
package.json exports        ./<name> → dist from that js/index.ts
```

Rules:

1. Domain crate: zero `napi` / `napi-derive` deps.
2. Bridge file: thin. Parse args, call crate, serialize. No analysis.
3. JS wrapper: no `JSON.parse` / `JSON.stringify` copied per module once `callNativeJson` exists. Atlas/system keep their public functions (`analyze`, `compile`).
4. ts-rs emit **into that module’s** `js/generated/`. Nowhere else.
5. Quality gate **skips** `**/js/generated/**` and `modules/system/src/canon/*.rs`. Do not “fix” generated files by adding headers.

### ts-rs (this is the duplicate)

Keep `TS_RS_EXPORT_DIR` at the package root (`.cargo/config.toml` `relative = true` → `packages/reference-rs`).

Change every `export_to`:

```text
js/atlas/generated/   →  modules/atlas/js/generated/
js/tasty/generated/   →  modules/tasty/js/generated/
```

Then **delete** `packages/reference-rs/js/`.

Regenerate once (`cargo test -p atlas -p tasty` or `cargo test --workspace` so ts-rs export runs). Diff `modules/*/js/generated/` against what the wrappers import. Strip the bogus `/** Typescript source file for Reference UI module. */` headers if they survive — ts-rs files should only carry the ts-rs banner.

If a generated barrel (`tasty/js/generated/index.ts`) is hand-written, it can stay **next to** generated files but must not be overwritten by a dump path. Prefer keeping the barrel as a non-generated `js/generated.ts` re-export if ts-rs will clobber `generated/index.ts`. Do not invent a third folder.

---

## Wiring checklist (every path that still thinks PT1)

| File | Change |
| --- | --- |
| `Cargo.toml` | `modules/*` + workspace path deps |
| `native/Cargo.toml` | workspace deps, not `path = "../atlas"` |
| `modules/*/Cargo.toml` | `*.workspace = true` for internal crates |
| `tsup.config.ts` | `modules/tasty/js/index.ts` etc. |
| `tsconfig.json` / `tsconfig.build.json` | include `modules/*/js`, `modules/system/canon` |
| `runtime/tools/create-dts-entrypoints.mjs` | dist stubs point at `./modules/…`; fix tasty/browser (`./js/browser` is already wrong) |
| `package.json` `"canon"` | `modules/system/canon/generate.ts` |
| `vitest.config.ts` | **only** `modules/<name>/tests` + `modules/<name>/js/**/*.test.ts` + `runtime/**`. Delete `tests/` and `js/` fallbacks |
| `tasty/tests/globalSetup.ts` (after mv) | `join(packageDir, 'modules', 'tasty', 'tests')` — today it hardcodes `'tasty'` |
| `.gitignore` | generated outputs under `modules/…/tests`; drop stale `tests/tasty` lines if unused |
| `README.md` | describe modules + native + runtime. It still documents `crates/` / `js/` / `tests/` |
| `AGENTS.md` §4 + `agent-rs` SKILL | tree is `modules/<name>` |
| `.agents/skills/agent-rs/scripts/run.mjs` | drop `crates/system` fallback; cargo `-p` names unchanged; map `napi` → `reference-virtual-native` if anyone filters that crate |

`pnpm agentrs v atlas` / `c atlas` keep working by **crate and vitest project name**, not by folder prefix.

---

## Phase 0 — skills see `modules/` (before or with the first `git mv`)

If the runner still says `crates/system`, every proof command after the nest will look like a failure.

Update:

- `.agents/skills/agent-rs/SKILL.md` architecture tree
- `.agents/skills/agent-rs/scripts/run.mjs` (no `crates/` paths in help text or fallbacks)
- `AGENTS.md` §4
- `vitest.config.ts` include globs that will exist after the move (accept `modules/<name>/` **and** the current root folders for one commit if you must; delete the old globs before you finish)

Required CLI (must work after Phase 1):

```bash
pnpm agentrs v tasty
pnpm agentrs v atlas
pnpm agentrs v system
pnpm agentrs v styletrace
pnpm agentrs c tasty
pnpm agentrs c atlas
pnpm agentrs c system
```

---

## Phase 1 — nest

```bash
git mv packages/reference-rs/atlas      packages/reference-rs/modules/atlas
git mv packages/reference-rs/tasty      packages/reference-rs/modules/tasty
git mv packages/reference-rs/styletrace packages/reference-rs/modules/styletrace
git mv packages/reference-rs/system     packages/reference-rs/modules/system
git mv packages/reference-rs/virtualrs  packages/reference-rs/modules/virtualrs
```

Leave `native/`, `runtime/`, `shared/` where they are.

Wire Cargo workspace path deps. `pnpm agentrs b` then `pnpm agentrs c`.

---

## Phase 2 — one generated tree

1. Retarget every `#[ts(export_to = …)]`.
2. Delete `packages/reference-rs/js/`.
3. Regenerate into `modules/*/js/generated/`.
4. Point wrappers at `./generated/…` only (already true for atlas/tasty — just stop the dump elsewhere).
5. Quality skip generated; remove fake headers.

---

## Phase 3 — one JS napi client

1. Add `runtime/native.ts` (or fold into loader without duplicating `requireVirtualNative`).
2. Put `compileSystem` on the binding + contract.
3. Switch `modules/atlas/js`, `modules/tasty/js`, `modules/styletrace/js`, `modules/system/js` to the helper.
4. Root `runtime/index.ts` can keep named functions for the public root export; they should call the same helper.

Do not move virtualrs’s public JS into `modules/virtualrs/js` in this pass unless a wrapper already exists. Root export is enough.

---

## Phase 4 — prove

```bash
pnpm agentrs b
pnpm agentrs c
pnpm agentrs v tasty
pnpm agentrs v atlas
pnpm agentrs v system
pnpm agentrs v styletrace
pnpm agentrs v runtime
pnpm agentrs q modules native runtime shared
pnpm agentrs t
```

`ls packages/reference-rs/js` must fail. `rg 'js/atlas/generated' packages/reference-rs` must be empty. Opening `modules/atlas/` finds rust, js, tests, README. Opening the package root finds native, runtime, shared, modules — not five products in a pile.

---

## Done when

- Products live under `modules/`. Infrastructure does not.
- One ts-rs output path per product: `modules/<name>/js/generated/`
- No `packages/reference-rs/js/`
- Internal rust deps are workspace path deps
- JS modules call one native helper; `compileSystem` is a first-class export
- Still one `.node`, still three (plus styletrace) doors
- `pnpm agentrs v <module>` / `c <module>` still isolate that product
- README matches the tree
- Test *meaning* unchanged from PT1

---

## Read first

- `packages/reference-rs/PLAN.md` (PT1 — layout intent; this file is the leftover)
- `packages/reference-rs/Cargo.toml`
- `packages/reference-rs/.cargo/config.toml`
- `packages/reference-rs/native/src/lib.rs`
- `packages/reference-rs/runtime/index.ts`
- `packages/reference-rs/runtime/shared/native-contract.ts`
- `packages/reference-rs/atlas/src/model.rs` (`export_to`)
- `packages/reference-rs/tasty/src/emitted/*.rs` (`export_to`)
- `packages/reference-rs/js/` vs `atlas/js/generated/` vs `tasty/js/generated/`
- `packages/reference-rs/tsup.config.ts`
- `packages/reference-rs/runtime/tools/create-dts-entrypoints.mjs`
- `.agents/skills/agent-rs/SKILL.md`
- `.agents/skills/agent-rs/scripts/run.mjs`

Then Phase 0. Then nest. Then one generated tree. Then one native client. Then prove.
