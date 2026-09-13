# Reference RS Restructure

> **Objective:** Split `packages/reference-rs` into a Cargo workspace of pure Rust crates, one N-API crate, and one TypeScript runtime — without changing the published npm package (`@reference-ui/rust`).
>
> **Not in scope:** inventing a second test runner, Criterion benches, a `crates/testing` harness, or extra source trees (`benches/`, `npm/` as source, loose `.node` files, a `build/` folder).

This is a layout and ownership plan. Downstream imports stay the same:

```ts
import { scanTypeScriptBundle } from '@reference-ui/rust/tasty'
import { trace } from '@reference-ui/rust/styletrace'
import { rewriteCssImports } from '@reference-ui/rust'
```

---

## 0. Verdict on the previous draft

The three-tier idea is right: **pure Rust crates → one N-API bridge → TypeScript wrappers**. The previous draft went wrong in four places:

1. **It never scored the tests.** `tests/` was labeled “end-to-end integration tests (Rust + Vitest)” as if those were the same thing. They are not. Today we already have two runners. The restructure has to name them, give each a home, and stop them from scoring the same cases twice.
2. **`benches/` and Criterion should not exist.** `scan_kitchen_sink` is already a Vitest case (`tests/tasty/cases/kitchen_sink`). A Criterion bench that `npm install`s the same fixture and times the same scan is a third copy of the same work. Delete it.
3. **`native/` was used as the N-API *source* crate.** That name is already the gitignored **binary dump** (`native/virtual-native.darwin-arm64.node`). Do not put `src/lib.rs` in the same folder as compiled `.node` files.
4. **`npm/` was drawn as a first-class source tree.** It is a generated publish artifact (`napi create-npm-dirs` / the pipeline). It stays gitignored. It does not belong in the architecture sketch as a place you edit.

`package.json` at `packages/reference-rs/` is fine. That is the one npm package. `node_modules/` next to it is fine. We are not trying to make this look like a pure Cargo repo.

---

## 1. What is actually messy today

```
packages/reference-rs/          # one npm package AND one Cargo crate
├── Cargo.toml                  # napi + tasty + atlas + styletrace + virtualrs
├── build.rs                    # napi-build in the crate root
├── package.json
├── tsup.config.ts
├── src/                        # the monolith
│   ├── lib.rs                  # #[napi] exports mixed with domain re-exports
│   ├── tasty/
│   ├── atlas/
│   ├── styletrace/
│   └── virtualrs/
├── js/                         # TypeScript wrappers (this part is already the right shape)
├── benches/                    # Criterion. Delete.
├── tests/                      # Vitest — the product suite (JS native landscape)
│   ├── tasty/
│   ├── atlas/
│   ├── styletrace/
│   └── virtualfs/
└── native/                     # gitignored .node output (when built)
```

Loose binary search paths already exist in `js/runtime/loader.ts`:

```
native/virtual-native.<triple>.node     # the real local output
virtual-native.<triple>.node            # package root (pipeline / old napi default)
dist/virtual-native.<triple>.node       # leftover search path
npm/<platform>/                         # generated at publish, gitignored
```

The loader, the Dagger rust build (`pipeline/src/build/rust/targets.ts`), and `.github/workflows/rust-compile.yml` still know about root-level `virtual-native.*.node`. That is the sprawl. Contain it; do not add more dump directories.

### Why the monolith hurts

- Domain crates cannot be tested without the `napi` feature and a Node-oriented `cdylib`.
- `cargo test` and `vitest` share fixture folders (`tests/atlas/cases`, `tests/tasty/cases`, `tests/styletrace/cases`). Rust opens the same trees Vitest already scores.
- `benches/scan_kitchen_sink.rs` is a slower, Node-installing duplicate of `tests/tasty/cases/kitchen_sink`.
- Build outputs leak into the source tree whenever a tool forgets `--output-dir native`.

---

## 2. Verification is JavaScript, because the product is JavaScript-native

`@reference-ui/rust` is a Node native addon. Consumers import TypeScript. The `.node` is an implementation detail. So the package-level suite is Vitest, sitting at `tests/` next to `package.json`, and that is the correct shape — not a compromise.

Top-level `tests/` means: we verify the thing Node will actually load. Kitchen sink, case catalogs, snapshots, the public Tasty/Atlas/Styletrace APIs. Written in JS. Fine. That is the landscape we are building for.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Product suite — Vitest (tests/ + js/**/*.test.ts)                       │
│ This is how the package is scored. Goes through N-API + TS wrappers.     │
│ Command: pnpm --filter @reference-ui/rust test:vitest                    │
│ (ensure-native first so the binary exists.)                               │
├──────────────────────────────────────────────────────────────────────────┤
│ Crate internals — cargo test, colocated #[cfg(test)]                     │
│ Optional, narrow, in-memory. Never loads a .node. Never opens tests/.    │
│ Command: cargo test --workspace --exclude reference-virtual-native        │
└──────────────────────────────────────────────────────────────────────────┘
```

There is no mixed “Rust + Vitest e2e” folder. There is no Cargo `[[test]]` integration crate at the workspace root. Cargo does not grow `tests/*.rs` next to `api.test.ts`.

Rust tests are not a second product suite. They exist only so a crate can be iterated as Rust — TypeRef lowering, rewrite string equality, span slicing — without waiting on Node. If a behavior is only meaningful through the public TS API, it is a Vitest test. Kitchen sink is already that. Keep it there.

### Scoring table

| What | Suite | Home | Runner | Proves | Must not |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Kitchen sink (docs reference types) | product | `tests/tasty/cases/kitchen_sink` | Vitest | Public Tasty API + snapshots | Criterion; a Cargo bench; a Rust e2e |
| Tasty case catalog (mapped types, generics, …) | product | `tests/tasty/cases/*/api.test.ts` | Vitest | Emitted manifest/chunks via N-API | Be copied into `cargo test` |
| Atlas case catalog (barrels, collisions, …) | product | `tests/atlas/cases/*/api.test.ts` | Vitest | Analyzer JSON via N-API | Stay as `src/atlas/tests.rs` walking the same folders |
| Styletrace cases (forward_ref, barrels, …) | product | `tests/styletrace/cases` | Vitest | Public `trace()` contract | Remain the primary Rust test input |
| virtualfs rewrite cases | product | `tests/virtualfs/cases` | Vitest | N-API rewrite of real files | Duplicate every string-level `virtualrs` unit test |
| Loader / targets / publish helpers | product | `js/**/*.test.ts` | Vitest | Binary resolution, DTS, publish safety | Compile Rust |
| Matrix (css, primitives, system, …) | outside | `matrix/*` | `pnpm agent test` | Downstream consumers of the published package | Live inside `reference-rs` |
| TypeRef extract / resolve / identity | internals | `crates/tasty` `#[cfg(test)]` | `cargo test -p tasty` | In-memory AST → model | Open `tests/tasty/cases`, emit ESM, call N-API |
| TypeRef proptest | internals | `crates/tasty` test modules | `cargo test -p tasty` | Round-trip / identity of IR | Become a shared `crates/testing` crate |
| virtualrs string rewrites | internals | `crates/virtualrs` `#[cfg(test)]` | `cargo test -p virtualrs` | Exact source transforms | Go through `js/runtime` |
| Atlas scoring math, alias maps | internals | `crates/atlas` `#[cfg(test)]` | `cargo test -p atlas` | Pure functions | Re-run the Vitest case catalog |
| Styletrace unit walks on inline snippets | internals | `crates/system` | `cargo test -p system` | Resolver / walk internals | Own the fixture catalog |

`pnpm --filter @reference-ui/rust test` remains the package-level command: `ensure-native && cargo test && vitest run`. Vitest is the score; `cargo test` is the fast crate loop.

### What we delete or stop doing

| Stop | Why |
| :--- | :--- |
| `benches/` + Criterion | Kitchen sink is a Vitest case. Timing it in Criterion adds `npm install`, a second harness, and no product signal. |
| `crates/testing` | Shared proptest generators belong next to the type they generate (`tasty`), not in a workspace-wide test crate that invites “e2e in Rust”. |
| Cargo integration tests under `tests/` | `tests/` is the Vitest tree. Cargo must not grow `tests/*.rs` next to `api.test.ts`. |
| Rust tests that `npm install` and scan Vitest fixtures | That is how `src/tasty/tests/scanner.rs` and the kitchen-sink bench work today. After the move, scanner smoke uses in-memory / temp dirs. Kitchen sink is Vitest-only. |
| Atlas / Styletrace Rust tests that walk `tests/*/cases` | Those cases are the product suite. Rust keeps small inline snippets. |

Kitchen sink today: Vitest case **and** `scans_kitchen_sink_fixture` in Rust **and** a Criterion bench. After this plan: **Vitest only**. If tasty needs a “big scan does not panic” smoke, write it against a tiny in-memory workspace, not the docs fixture.

---

## 3. Target layout

One npm package. One Cargo workspace. No extra source folders for builds or benches.

```
packages/reference-rs/
├── Cargo.toml                  # workspace root only (no [lib])
├── Cargo.lock
├── package.json                # @reference-ui/rust — this is the published package
├── tsup.config.ts
├── tsconfig.json
├── vitest.config.ts            # include: tests/**/*.test.ts, js/**/*.test.ts
│
├── crates/                     # ALL Cargo members live here
│   ├── shared/                 # oxc parser flags, span helpers, fx_hash
│   ├── tasty/
│   ├── atlas/
│   ├── virtualrs/
│   ├── system/                 # styletrace today; extractor + emitter later
│   └── napi/                   # the only crate that depends on napi / napi-derive
│       ├── Cargo.toml          # crate name remains reference-virtual-native
│       ├── build.rs            # napi-build::setup()
│       └── src/lib.rs          # thin #[napi] wrappers, nothing else
│
├── js/                         # TypeScript runtime (already this shape)
│   ├── runtime/                # loader — resolves native/*.node only
│   ├── tasty/
│   ├── atlas/
│   ├── styletrace/
│   ├── shared/
│   └── tools/                 # ensure-native, publish, dts entrypoints
│
├── tests/                      # VITEST ONLY — product suite, JS native landscape
│   ├── globalSetup.ts
│   ├── tasty/
│   ├── atlas/
│   ├── styletrace/
│   └── virtualfs/
│
├── native/                     # GITIGNORED. Compiled .node only. Not a crate.
├── dist/                       # GITIGNORED. tsup output.
├── npm/                        # GITIGNORED. Generated at publish. Not source.
└── target/                     # GITIGNORED. Cargo output.
```

### Folder rules (what is allowed to exist as source)

| Path | Source? | Role |
| :--- | :--- | :--- |
| `crates/*` except `napi` | yes | Pure Rust libraries |
| `crates/napi` | yes | N-API cdylib (`reference-virtual-native`) |
| `js/` | yes | TS wrappers and tools |
| `tests/` | yes | Vitest cases, fixtures, snapshots |
| `package.json` / `Cargo.toml` | yes | Package + workspace manifests |
| `native/` | **no** | `virtual-native.<triple>.node` + `.inputs.sha256` |
| `npm/` | **no** | `napi create-npm-dirs` / pipeline staging |
| `dist/` | **no** | tsup |
| `benches/` | **gone** | — |
| `artifacts/` | **no** | napi artifact collection, already gitignored |

Do not add `rs/`, `build/`, `bridge/`, a top-level `napi/`, or a second tests tree. The N-API crate is `crates/napi` so it stays a Cargo member; `native/` stays “where the `.node` lands.”

Top-level `napi/` is the wrong cut. It is still a Rust crate, and a sibling folder next to `js/` and `tests/` is another loose tree. The Node seam is the **dependency** (`napi` / `napi-derive` only in `crates/napi`), not a directory at the package root. Enforce that with Cargo.toml, not an extra folder.

---

## 4. Binary containment

Today the binary has three search homes. After this, it has one local home and one publish home.

### Local (contributor checkout)

```
packages/reference-rs/native/virtual-native.<triple>.node
packages/reference-rs/native/virtual-native.<triple>.inputs.sha256
```

- `package.json` `build:native` already uses `--output-dir native --no-js`. Keep that.
- `js/tools/ensure-native.ts` already hashes Rust inputs and writes that path. Keep that; point the hash inputs at `crates/` instead of root `src/` + root `build.rs`.
- `js/runtime/loader.ts` should resolve **only**:
  1. `native/virtual-native.<triple>.node` in the `@reference-ui/rust` package dir
  2. the optional platform package `@reference-ui/rust-<triple>` (published layout)
- Delete fallbacks: package-root `virtual-native.<triple>.node`, `dist/virtual-native.<triple>.node`.

### Publish (pipeline, not a source tree)

`npm/darwin-arm64/` and friends are **generated**. The pipeline (`pipeline/src/build/rust/targets.ts`) already stages them. Gitignore stays:

```
target/
artifacts/
npm/
native/
*.node
```

Work remaining: stop the Dagger rust build and `rust-compile.yml` from writing `packages/reference-rs/virtual-native.*.node` at the package root. Always land on `native/`. Then the loader fallbacks can die.

---

## 5. Crate responsibilities

Workspace `Cargo.toml` (illustrative):

```toml
[workspace]
members = ["crates/*"]
resolver = "2"

[workspace.dependencies]
# oxc_*, serde, serde_json, etc. — versions pinned once
napi = { version = "2", features = ["napi8"] }
napi-derive = "2"
```

`crates/napi` is the only member that lists `napi` / `napi-derive`. Every other crate under `crates/` is Node-free. The current `default = ["napi"]` feature on the monolith goes away.

### `crates/shared`

Production helpers only. Not a test crate.

- OXC parser options (TypeScript, JSX, decorators)
- `slice_span`, identifier helpers
- `fx_hash` if more than one crate needs it

### `crates/tasty`

Move `src/tasty/` here unchanged in behavior.

- Owns scanner, extract, resolve, `TypeRef`, generator
- Public Rust API: `scan_typescript_bundle`, `ScanRequest`, emitted types
- Tests: current `src/tasty/tests/*` that are in-memory (extract, resolve, TypeRef map, proptest) stay. Drop `scanner.rs` fixture scans that `npm install` the Vitest tree.

### `crates/atlas`

Move `src/atlas/` here.

- Token/usage analysis as a Rust library
- Tests: keep pure unit tests (usage scoring, alias maps). Stop walking `tests/atlas/cases`. Those cases stay Vitest.

### `crates/virtualrs`

Move `src/virtualrs/` here.

- `rewrite_css_imports`, `rewrite_cva_imports`, `replace_function_name`, `apply_responsive_styles`
- Current `tests.rs` is already in-memory string tests. That is the model for crate internals.

### `crates/system`

Move `src/styletrace/` here as `crates/system/src/styletrace/`.

- This crate is the future native styling engine (`REFERENCE_SYSTEM.md`). This restructure only relocates styletrace and gives it a crate boundary.
- Do not implement the Panda replacement in the same PR as the folder move.
- Crate internals: inline snippet tests. Product suite: `tests/styletrace/cases` via N-API `analyzeStyletrace` / `js/styletrace`.

### `crates/napi` (`reference-virtual-native`)

`crate-type = ["cdylib"]` only. No `rlib`, no domain logic.

```text
js string/JSON  ──►  #[napi] fn  ──►  tasty | atlas | system | virtualrs
```

Move the `#[napi]` functions out of today’s `src/lib.rs`. Domain `pub use` belongs on the crates, not on the bridge.

`build.rs` lives here (the only `napi-build` setup).

---

## 6. TypeScript runtime (mostly already done)

`js/` does not need a philosophical redesign. It already is Tier 3.

| Path | Job |
| :--- | :--- |
| `js/runtime/loader.ts` | Load one `.node`. After restructure: `native/` + optional platform package only |
| `js/tasty/` | Ergonomic API over `scanAndEmitModules` |
| `js/atlas/` | Analyzer wrappers |
| `js/styletrace/` | `trace()` wrappers |
| `js/tools/ensure-native.ts` | Hash `crates/`, build into `native/` |
| `js/**/*.test.ts` | Product-suite units that do not need case fixtures |

`tsup.config.ts` entrypoints stay as they are. Public subpaths do not change.

---

## 7. How tests sit on disk after the move

```
crates/tasty/src/ast/extract.rs
crates/tasty/src/tests/extract.rs          # internals, in-memory
crates/virtualrs/src/tests.rs             # internals, string equality

js/runtime/loader.test.ts                 # product suite, no fixtures
js/tasty/index.test.ts                    # product suite, wrapper units

tests/tasty/cases/kitchen_sink/          # product suite — the real kitchen sink
tests/tasty/cases/generics/api.test.ts
tests/atlas/cases/...
tests/styletrace/cases/
tests/virtualfs/cases/
tests/globalSetup.ts                      # emit via N-API, then Vitest asserts
```

Cargo never has a workspace `tests/*.rs`. Vitest never lives under `crates/`.

---

## 8. Phased plan

Each phase is independently shippable. Public npm subpaths stay stable the whole way.

### Phase 0 — Delete the obvious junk (no crate split yet)

1. Remove `[[bench]]`, `criterion`, and `benches/scan_kitchen_sink.rs`.
2. Stop searching package-root and `dist/` for `.node` **after** pipeline/CI write only to `native/` (can land in the same PR as the loader change, or immediately after).
3. Confirm `*.node`, `native/`, `npm/`, `artifacts/` remain gitignored.

Proof: `pnpm --filter @reference-ui/rust test` still passes.

### Phase 1 — Workspace scaffolding, still one library crate

1. Turn root `Cargo.toml` into a workspace whose only member is still the current crate, **or** keep the current crate as `crates/napi` in-place without extracting tasty yet — whichever is the smaller diff.
2. Practical sequence that avoids a giant move:
   - Add `crates/shared` and move span/hash helpers.
   - Leave tasty/atlas/virtualrs/styletrace in `src/` until Phase 2.

Do not create `crates/testing`.

### Phase 2 — Extract pure crates (functional freeze)

For each module, in this order (fewest N-API ties first):

1. `virtualrs` → `crates/virtualrs`
2. `atlas` → `crates/atlas`
3. `tasty` → `crates/tasty`
4. `styletrace` → `crates/system`

After each move:

```bash
cargo test -p <crate>
```

While the monolith still exists, `napi` functions can keep calling the old paths. The last step of this phase is: root crate contains only `lib.rs` N-API + `build.rs`.

Drop Rust tests that open `tests/**/cases` as you go. Replace with in-memory snippets only where a crate-internal invariant is still worth a `cargo test`. Leave the Vitest case in place — that is the score.

### Phase 3 — N-API crate in `crates/napi`

1. Move remaining `src/lib.rs` + `build.rs` → `crates/napi/`.
2. Root `Cargo.toml` is workspace-only (no `[lib]`), `members = ["crates/*"]`.
3. `package.json` `napi.binaryName` stays `virtual-native`.
4. `ensure-native.ts` hashes `crates/` and still emits `native/virtual-native.<triple>.node`.
5. Loader: `native/` + optional `@reference-ui/rust-<triple>` only.

Proof:

```bash
pnpm --filter @reference-ui/rust run build:native
pnpm --filter @reference-ui/rust test:vitest
```

### Phase 4 — Product suite stays at `tests/`; crate tests stay crate-local

1. `tests/` is documented as Vitest-only (README at `tests/README.md` if needed — one file, not a new tree).
2. `vitest.config.ts` include list unchanged: `tests/**/*.test.ts`, `js/**/*.test.ts`.
3. Package scripts:

```json
"test": "pnpm run ensure-native && cargo test --workspace && vitest run",
"test:rust": "cargo test --workspace --exclude reference-virtual-native",
"test:vitest": "vitest run"
```

`cargo test --workspace` may still build `crates/napi` as a cdylib; excluding it for the fast Rust loop is the point of `--exclude`. Domain crates have no napi feature, so `--exclude` is optional once Phase 3 is done — `cargo test --workspace` should then just skip a crate with no `#[test]` modules. Prefer **no tests in `crates/napi`**. The bridge is scored by Vitest.

### Phase 5 — Verification

1. Internals: `cargo test --workspace`
2. Product suite: `pnpm --filter @reference-ui/rust test:vitest`
3. Downstream: `pnpm agent test --packages=@matrix/primitives,css,system` (and whatever else currently depends on the native addon)

No new benchmark job. No new “Rust e2e” job.

---

## 9. Mapping current files → target

| Now | After |
| :--- | :--- |
| `src/tasty/**` | `crates/tasty/src/**` |
| `src/atlas/**` | `crates/atlas/src/**` |
| `src/virtualrs/**` | `crates/virtualrs/src/**` |
| `src/styletrace/**` | `crates/system/src/styletrace/**` |
| `src/lib.rs` `#[napi]` fns | `crates/napi/src/lib.rs` |
| `build.rs` | `crates/napi/build.rs` |
| `js/**` | stay |
| `tests/**` | stay (Vitest only) |
| `js/**/*.test.ts` | stay (Vitest) |
| `benches/**` | delete |
| `src/tasty/tests/scanner.rs` fixture scans | delete or rewrite in-memory; kitchen sink stays Vitest |
| `src/atlas/tests.rs` case-folder walks | delete; Vitest keeps `tests/atlas/cases` |
| `src/styletrace/tests` reading `tests/styletrace/cases` | shrink to inline snippets; Vitest owns cases |
| `native/*.node` | stay gitignored output |
| `npm/` | stay gitignored generated output |
| root `virtual-native.*.node` | stop producing; stop searching |

---

## 10. Public contract (zero breaking changes)

| Surface | Change |
| :--- | :--- |
| `@reference-ui/rust` exports | none |
| `napi.binaryName` / platform packages `@reference-ui/rust-<triple>` | none |
| `scanAndEmitModules` / `analyzeAtlas` / `analyzeStyletrace` / rewrite fns | none |
| Matrix, core, docs | still consume the same subpaths |

Internal-only: Cargo package layout, where `.node` is built, where tests live.

---

## 11. Explicit non-goals

- No Criterion, no `benches/`, no perf CI job as part of this restructure.
- No `crates/testing`.
- No Cargo tests under `tests/`.
- No treating `npm/` or `native/` as source crates.
- No implementing `reference-system` (atomic CSS engine) in the same change. `crates/system` is a rename/home for styletrace so that work has a door later.
- No second npm package. Still one `@reference-ui/rust`.
- No “build the Rust” extra package folder. `ensure-native` + `crates/napi` + gitignored `native/` is the whole build story.
