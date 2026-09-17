# reference-rs — one build folder (`dist/`)

This is the remaining dump pass. Source already lives under `modules/` (`modules/runtime` is the cdylib crate). This file only moves **generated** output into `dist/`.

**Orchestration:** one parent agent. Packaging paths only. Do not redesign modules, harnesses, or the public API.

---

## Why

Opening `packages/reference-rs/` still looks like four (really five) product folders that are actually **build output**:

| Folder today | What it actually is | Ships? |
| --- | --- | --- |
| `dist/` | tsup JS (`index.mjs`, `system.mjs`, …) — `package.json` `"exports"` | yes |
| `native/*.node` | napi `--output-dir native` copy of the addon + sha256 stamp | local load; optional-dep packages on npm |
| `target/` | Cargo default scratch (`debug/`, `release/`, `.rlib`) | **never** |
| `npm/` | napi `create-npm-dirs` per-platform package stubs (`@reference-ui/rust-darwin-arm64`, …) | publish staging, not the root tarball |
| `artifacts/` | `napi artifacts` collection for CI / `publish-native` | **never** in git |

`native/` the **directory** is two jobs: crate source (`Cargo.toml`, `src/*.rs`) and binary dump. The dump is what belongs with `dist/`. The crate does not.

Cargo’s default name is `target/`. That is reserved-by-convention, not a law. `[build] target-dir` / `CARGO_TARGET_DIR` can point it at `dist/cargo`. Do that here so the package root is not a second cargo workspace dump.

---

## Constraints (do not violate)

- **One npm package** `@reference-ui/rust`, **one `.node`**, public subpaths unchanged.
- **Cdylib crate source is `modules/runtime` (PT3).** This pass only moves **generated** `.node` / cargo / npm / artifacts. Do not move `native.rs` product ABIs here.
- **`dist/cargo` never ships.** Not in `"files"`, not in the tarball, not in optional-dep packages.
- **tsup `clean: true` must not delete cargo cache or `.node`.** If `outDir` is `dist`, configure clean (or split `dist/js`) so a JS rebuild does not wipe `dist/cargo`.
- Do not start `pnpm dev:lib`. Do not commit unless asked.
- Follow `agent-rs`. Do not “fix” generated binaries with file headers.

---

## Target tree (generated only)

Package root after this pass — **source vs output**:

```text
packages/reference-rs/
│
├── modules/                        SOURCE — runtime (cdylib + JS host), shared, products
│
└── dist/                           ALL generated output. gitignored as a tree,
                                    except we already gitignore `dist` at repo root.
    ├── index.mjs                   tsup (today’s dist/ root)
    ├── tasty.mjs
    ├── atlas.mjs
    ├── styletrace.mjs
    ├── system.mjs
    ├── *.d.ts
    │
    ├── native/                     local .node the loader require()s
    │   ├── virtual-native.<triple>.node
    │   └── virtual-native.<triple>.inputs.sha256
    │
    ├── cargo/                      CARGO_TARGET_DIR  (today’s target/)
    ├── npm/                        napi platform packages (today’s npm/)
    └── artifacts/                  napi artifacts collect (today’s artifacts/)
```

**Gone from the package root**

- `target/`
- `npm/`
- `artifacts/`
- `native/virtual-native.*.node`
- `native/*.sha256`
- `native/index.d.ts` (napi junk next to the crate)

`native/` on disk after this is gone (crate is `modules/runtime`). If a package-root `native/` still has a `.node`, you failed.

### Why subfolders under `dist/` (not a flat pile)

`dist/` is already tsup’s `outDir` with `clean: true`. Dumping cargo incremental output into that same directory without a subdirectory **will get deleted on every `build:js`**. Same for `.node` if you are not careful.

Three consumers, three subtrees:

| Subtree | Producer | Consumer |
| --- | --- | --- |
| `dist/*.mjs` | tsup | `"exports"`, published root package |
| `dist/native/*.node` | `napi build --output-dir dist/native` | `runtime/loader.ts` (contributor checkout) |
| `dist/cargo/` | rustc via `target-dir` | cargo / napi compile; rust-analyzer |
| `dist/npm/` | `napi create-npm-dirs` + artifacts copy | `publish-native.ts` optionalDeps |
| `dist/artifacts/` | `napi artifacts --output-dir dist/artifacts` | CI collect → optional packages |

If tsup cannot clean only JS, set tsup `outDir` to `dist/js` and point `"exports"` there. Prefer **not** doing that if `clean` can ignore `cargo/`, `native/`, `npm/`, `artifacts/`. One `dist/` name is the point; an extra `dist/js` is allowed if tools fight.

---

## Cargo `target-dir`

In `packages/reference-rs/.cargo/config.toml`:

```toml
[build]
target-dir = "dist/cargo"
```

Keep `TS_RS_EXPORT_DIR` as PT2 left it (package root, emit into `modules/*/js/generated/`). Do not reuse `target-dir` for ts-rs.

Also update:

- CI cache paths: `.github/workflows/rust-compile.yml` currently caches `packages/reference-rs/target/`
- rust-analyzer: `rust-analyzer.cargo.targetDir` if the workspace setting assumes `target/`
- `agent-rs` / complexity skip lists that mention `target` / `artifacts`
- Root and package `.gitignore`: drop redundant `target/` if everything is under already-ignored `dist/` (repo root already ignores `dist`). Keep an explicit `packages/reference-rs/dist/cargo` comment so nobody “un-ignores dist” later and commits a 4GB cache.

Do **not** set a repo-wide `CARGO_TARGET_DIR` that steals other packages’ builds. Scope is this workspace’s `.cargo/config.toml`.

---

## Loader + ensure-native + napi scripts

Today:

```text
join(packageDir, 'native', `virtual-native.${triple}.node`)
napi build --output-dir native
napi artifacts --output-dir artifacts
```

After:

```text
join(packageDir, 'dist', 'native', `virtual-native.${triple}.node`)
napi build --output-dir dist/native
napi artifacts --output-dir dist/artifacts
```

Touch:

- `modules/runtime/js/loader.ts` (`getVirtualNativeCandidates`)
- `modules/runtime/js/loader.test.ts`
- `modules/runtime/js/tools/ensure-native.ts` (binary path, stamp path, **input hash still includes `modules/runtime/src` + product `native.rs`**)
- `modules/runtime/js/shared/paths.ts` (`artifactsDir` → `dist/artifacts`)
- `modules/runtime/js/tools/stage-local-artifacts.ts`
- `modules/runtime/js/tools/publish-native.ts` (`npmDir` → `dist/npm`)
- `package.json` `build:native`, `artifacts`, `"files"` (must **not** include `dist/cargo`)
- `.github/workflows/rust-compile.yml` (`--output-dir` + upload path)
- `pipeline/src/build/rust/targets.ts` (same `--output-dir native` today)

Published optional packages stay `@reference-ui/rust-<triple>`. Their **contents** are still one `.node`. Only the **staging directory** moves (`npm/` → `dist/npm/`). Check `@napi-rs/cli` for the npm-dir flag (`create-npm-dirs` / `prepublish -t npm`); do not leave a second `npm/` at the package root.

Root `package.json` `"files"` today lists `dist`, `native`, `npm`. After: JS from `dist/` + do **not** pack `dist/cargo` or `dist/artifacts`. Optional `.node` packages are published from `dist/npm/<triple>`, not from the root tarball. Contributor checkouts load `dist/native/*.node` first, then the optional dep — same order as today, new path.

---

## Gitignore

Intent: generated tree is invisible; crate source is not.

- Repo `.gitignore` already has `dist` and `target`. After the move, `target/` under this package should stop appearing. You can leave global `target` for other rust.
- Delete package-level `native/*.node` rules once binaries are gone from `native/`.
- Delete package-level `npm/` and `artifacts/` once those dirs are gone.
- Do **not** re-add `packages/reference-rs/native/` as a directory ignore (that was the PT1 leftover that hid crate source).

---

## Phase order

0. **Prove current load path** (`pnpm agentrs b`, loader tests) so you know what you are moving.
1. **Cargo target-dir → `dist/cargo`**. `pnpm agentrs c`. Confirm no new `packages/reference-rs/target/` (or only a leftover you then delete).
2. **napi `--output-dir dist/native`**. Point loader + ensure-native + CI + pipeline at it. Delete leftover `native/*.node`.
3. **`artifacts/` and `npm/` → `dist/artifacts`, `dist/npm`.** Publish scripts and pipeline.
4. **tsup clean** does not wipe 1–3. Then `pnpm agentrs t`.
5. **README** — it still says `native/` is gitignored `.node` output. Lie.

---

## Done when

- Package root has no `target/`, `npm/`, `artifacts/`, or `native/`
- Cdylib crate is `modules/runtime`; `.node` lives in `dist/native/`
- All generated output lives under `dist/`
- `dist/cargo` is gitignored and absent from `"files"`
- `import { compile } from '@reference-ui/rust/atomic'` (and the live-wire alias `@reference-ui/rust/system`) still works (exports still resolve)
- Contributor `pnpm agentrs b` still drops a loadable `.node`; loader candidate list finds it
- CI / pipeline native compile + artifact upload paths match
- `pnpm agentrs t` passes

---

## Read first

- Do not undo the dist nest (host vs dump)
- `packages/reference-rs/package.json` (`build:native`, `files`, `napi`)
- `packages/reference-rs/tsup.config.ts` (`outDir`, `clean`)
- `packages/reference-rs/.cargo/config.toml`
- `packages/reference-rs/modules/runtime/js/loader.ts`
- `packages/reference-rs/modules/runtime/js/tools/ensure-native.ts`
- `packages/reference-rs/modules/runtime/js/tools/publish-native.ts`
- `.github/workflows/rust-compile.yml`
- `pipeline/src/build/rust/targets.ts`

Then cargo dir. Then `.node` dir. Then npm/artifacts. Then prove tsup cannot delete them.
