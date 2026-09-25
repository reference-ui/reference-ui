# virtualrs retirement — removal plan

Crew: retire-virtualrs. Mission board: `.agents/missions/cleanup-0925/state.md`.
(Note: dispatch said `cleanup-0924/`; the live mission dir is `cleanup-0925/` —
plan lands here so the captain finds it.)

## 0. Audit summary (2026-09-25)

Case-insensitive grep `virtualrs|virtual-native|virtual_native` (excluding
`node_modules`, `target/`, `.git`, `Cargo.lock`) matches **164 files**:

- **~100 historical**: `docs/EVIDENCE/**`, `docs/PERF/**`, `docs/MISSIONS/**`
  (LOG-1/2, COMPLETED/*), `docs/ARCHIVE/**`, `packages/reference-neo/docs/evidence/**`,
  `.agents/doom/logs/**`, `.agents/missions/doom-night-0924/ruling-rsmisc.md`,
  `packages/reference-rs/docs/simulation-learnings.md` (self-declared SIMULATION
  log), `docs/FEATURES/NEO_RESPONSIVE.md` (header: "pre-cutover research
  snapshot … are historical"). **NEVER TOUCH.**
- **Frozen museum**: `packages/reference-legacy/**` — `private`, description
  "FROZEN MUSEUM", excluded from `pnpm-workspace.yaml`. Its transforms import
  the 4 natives from `@reference-ui/rust` root. **LEAVE UNTOUCHED** (see
  consumer impact §5). This is the only caller anywhere outside virtualrs's
  own tests, and it is not a living caller.
- **Living surface** (this plan): `modules/virtualrs/` (whole dir) +
  40 files below.

Zero living callers of `rewrite_css_imports`, `rewrite_cva_imports`,
`apply_responsive_styles`, `replace_function_name` confirmed: neo consumes
`@reference-ui/rust/tasty` and `@reference-ui/rust/contracts` only; no other
`from '@reference-ui/rust'` root-native imports exist in the living tree.

Unrelated lookalikes that MUST NOT be renamed: `VirtualWorkspace`
(`testing/workspace.ts`, `SKILL.md:54`), `VirtualSource`
(`contracts/types.ts`), "virtual npm-style registry" prose (pipeline
registry docs), "virtual mirror/tree" prose, "mmap bytes are virtual length"
(`counters-summary.mjs`).

## 1. End state + justification

The name `virtual-*` described a dead product (virtual-module rewrites), but
the scaffolding now hosts the whole multi-product native addon. Rename to
**`reference-native`**, keeping every structural shape (triple suffixes,
optional-package scheme, napi layout):

| Today | End state | Notes |
| --- | --- | --- |
| napi `binaryName: virtual-native` | `reference-native` | `.node` file inside optionals |
| `dist/native/virtual-native.<triple>.node` | `dist/native/reference-native.<triple>.node` | loader + tools + pipeline + CI + agent-rs move together |
| `virtual-native.<triple>.inputs.sha256` | `reference-native.<triple>.inputs.sha256` | stamp filename |
| crate `reference-virtual-native` | `reference-native` (`reference_native`) | `modules/runtime/Cargo.toml`, `--package` flags |
| `VirtualNative*` TS symbols | `ReferenceNative*` | loader, targets, native, tools, pipeline |
| `VIRTUAL_NATIVE_*` / `SUPPORTED_*` consts | `REFERENCE_NATIVE_*` | incl. `REQUIRED_REFERENCE_NATIVE_EXPORTS` / `_BINARY_MARKERS` |
| `VIRTUALRS_NATIVE_EXPORTS` + root re-export | **deleted** | 4 fns gone from root + binary |
| `#[path] mod virtualrs` + dep | **deleted** | `runtime/src/lib.rs`, both Cargo.tomls |
| optional pkgs `@reference-ui/rust-<triple>` | **UNCHANGED** | never contained "virtual"; registry identity stable |
| env `REFERENCE_UI_NATIVE_PATH` | **UNCHANGED** | no "virtual" in it |

Why `reference-native` and not keep-or-minimal: keeping `virtual-native`
leaves every future reader (and every loader diagnostic) pointing at a
product that no longer exists; the brief orders migration of the
load-bearing scaffolding. `reference-native` is the minimal coherent name
under the `@reference-ui/*` + `reference-rs` identity, preserves the
`<name>.<triple>.node` napi convention, and deliberately does NOT touch the
published optional-package names, bounding consumer impact to the `.node`
filename + root-export surface (both fail-closed, see §5).

## 2. Delete list

- `packages/reference-rs/modules/virtualrs/` — entire dir: `Cargo.toml`,
  `native.rs`, `README.md`, `vitest.config.ts`, `src/` (7 rs files),
  `js/` (2 ts files), `tests/` (`cases.test.ts`, `helpers.ts`, `README.md`,
  `cases/README.md`, 16 `VRT-*` case dirs × {case.json, spec, input, output,
  README}), `node_modules/.vite*` (vitest cache).
- `packages/reference-rs/modules/runtime/js/index.test.ts` — its only
  `describe` covers the removed root re-export fallback behavior.
- `packages/reference-rs/Cargo.lock` entries for `virtualrs` — via regen
  (`cargo check`), not hand-edit.
- Stale gitignored artifacts: `dist/native/virtual-native.*` (6 files) —
  `dist/` is gitignored; rebuilt under the new name by `ensure-native`.

## 3. Rename list (mechanical, ordered)

Order matters: `reference-virtual-native` → `reference-native` FIRST
(it contains `virtual-native` as a substring), then
`reference_virtual_native` → `reference_native`, `VIRTUAL_NATIVE` →
`REFERENCE_NATIVE`, `VirtualNative` → `ReferenceNative`, `virtual-native` →
`reference-native`. `virtualrs`/`VIRTUALRS` never renamed — always deleted.

1. `packages/reference-rs/package.json`: `binaryName`, `build:native`
   `--package`, `test:rust` `--exclude`.
2. `packages/reference-rs/Cargo.toml`: drop `virtualrs = { path … }` dep line.
3. `modules/runtime/Cargo.toml`: crate rename + drop `virtualrs` dep.
4. `modules/runtime/src/lib.rs`: drop `#[path] mod virtualrs;`.
5. `modules/runtime/js/index.ts`: drop re-export block + doc line.
6. `modules/runtime/js/{native,loader}.ts`, `shared/{targets,native-contract,
   native-inputs,native-freshness}.ts`, `tools/ensure-native.ts`:
   identifier + string + doc-comment renames; `native-contract.ts` also drops
   the `VIRTUALRS_NATIVE_EXPORTS` import + `appendExports` line; `loader.ts`
   header "for virtual transforms" → neutral.
7. Tests: `loader.test.ts`, `shared/targets.test.ts`,
   `tools/verify-native-freshness.test.ts` (identifiers, paths, prose).
8. Pipeline: `src/build/rust/{targets,state,planning,package-metadata,
   compatibility}.ts`, `compatibility.test.ts`, `src/build/rust/index.ts`,
   `src/build/index.ts`, `src/registry/load.ts`,
   `src/testing/matrix/runner/{run,paths}.ts`.
9. `.github/workflows/rust-compile.yml`: `--package` + artifact path.
10. `.agents/skills/agent-rs/scripts/{run,flame,alloc-build}.mjs`: drop
    `virtualrs`/`virtualfs` from known-crate sets, module map, golden set,
    help example; `napi`/`runtime` aliases → `reference-native`; binary paths
    + `--package`.
11. `.agents/skills/agent-rs/SKILL.md`: tree line, module list, table row,
    goldens comment (keep `VirtualWorkspace` line).

## 4. Living-doc updates

- `packages/reference-rs/DIST.md`: filenames + `getReferenceNativeCandidates`.
- `packages/reference-rs/README.md`: cdylib name, engine-exclusion list,
  layout tree (`virtualrs/` line).
- `modules/runtime/README.md`: cdylib name, `#[path]` module list (also
  fixes stale `system` mention → `atomic`? NO — out of scope; only drop
  `virtualrs`), re-export bullet (delete), search-terms tag.
- `packages/reference-rs/docs/tasty-rs.md`: crate name; root-exports table
  rows for `rewrite_*` (delete); `## virtualrs/` section (delete).
- `packages/reference-rs/docs/tasty-js.md:27`: loader utility names.
- `packages/reference-rs/docs/atomic.md`, `modules/map.html`: drop `virtualrs`
  from other-products line.
- `modules/diagnostics/REGISTRY.md`: delete `VRS | virtualrs | Reserved,
  unminted` row (never minted; owner gone).
- `docs/ARCHITECTURE.MD:19`: 11 → 10 modules, drop `virtualrs` (living stub).
- `docs/FEATURES/NEO_CSS_COMPOSITION.md:94-95`: implementation-site pointer
  (living design-intent doc) → atomic/Neo seam; keep "virtual tree" prose.
- `packages/reference-neo/benchmark/deepsee/sample-parse.ts:79`:
  `reference_virtual_native` → `reference_native`.

## 5. Consumer-impact flags (for captain / release notes)

1. **`.node` filename changes inside published optionals**
   (`virtual-native.*.node` → `reference-native.*.node`). Old cached
   optionals/tarballs will NOT satisfy the new loader (it looks for the new
   name) — the freshness gate fails closed with "missing binary", never
   silent. Release must publish fresh optionals for all 4 triples; CI
   artifact globs move in lockstep. Optional-package NAMES unchanged, so no
   registry rename/derecognition.
2. **Root `@reference-ui/rust` exports removed**: `rewriteCssImports`,
   `rewriteCvaImports`, `replaceFunctionName`, `applyResponsiveStyles`; N-API
   symbols `rewrite_css_imports`, `rewrite_cva_imports`,
   `replace_function_name`, `apply_responsive_styles` gone from the binary.
   Stale old binaries fail `getReferenceNativeCompatibilityError` loudly
   (missing-exports list). No living callers; frozen `@reference-ui/legacy`
   museum still imports them and is intentionally left untouched — it would
   break only if someone builds the excluded museum.
3. **`pnpm agentrs v virtualrs` / `-p virtualrs` / `--crate virtualrs`
   become unknown-module errors** (fail-closed message, exit ≠ 0).
4. **Stale local checkouts**: gitignored `dist/native/virtual-native.*`
   lingers until rebuilt; `ensure-native` rebuilds under the new name
   (old files inert). Same for `dist/native-trace` instrument dirs.

## 6. Verification

1. Audit grep `virtualrs|virtual-native|virtual_native` (excl. build dirs +
   `Cargo.lock`): matches ONLY the §0 historical/frozen set. Diff the file
   list against the pre-removal list — delta must equal exactly the living
   set, zero additions.
2. `cargo test --workspace` in `packages/reference-rs`: builds (lockfile
   regen) and passes; virtualrs suite gone with the module (state
   same-or-better vs. pre-removal baseline).
3. `pnpm agentrs v` (full Vitest): green except the known harvest-census red
   (owned by another crew — do not touch).
4. `pnpm agentrs q` on touched rs/skill files; `pnpm agentneo q` on
   `sample-parse.ts`.
5. Pipeline rust-build tests covering renamed files (compat/planning/
   metadata/index suites) green.
6. `git status`: only intended files changed; NO commit (captain commits).

## 7. Execution notes (post-execution, 2026-09-25)

Executed as planned with three additions found mid-flight:

1. `pipeline/src/build/rust/compatibility.test.ts` — mock binary buffers
   named the 4 removed exports AND were missing 7 live markers
   (`scanSystem`, `releaseScan`, `analyzeStyletraceBindings/Detailed`,
   `emitDtsSync/Detailed`, `primitivesVocabulary`), so the "accepts full
   contract" case was red before this mission. Rewrote both buffers against
   the actual post-removal contract (12 markers). Now 5/5 green.
2. `packages/reference-rs/docs/tasty-js.md` — root-entrypoint doc listed the
   2 rewrite fns; lines deleted.
3. `docs/BUGS/RECIPE_CLASSNAME_REQUIRED.md:101` — census cited `VRT-CVA-05`
   as a live station case; dropped from the list.

Verification observed: `pnpm agentrs v` 46 files / 638 tests green (incl.
harvest-census — sibling crew's fix); `cargo test --workspace` 39 suites ok,
0 failures; pipeline `src/build/rust` 37/37 + registry/runner suites green;
`pnpm agentrs q` 0 violations (20 pre-existing run.mjs complexity warnings);
`pnpm agentneo q` 0 errors; audit-grep delta exactly the living set, zero
additions. `pnpm --filter @reference-ui/rust run build:js` (tsup + tsc +
dts) exit 0; native rebuilt as `reference-native.darwin-x64.node`.
Pre-existing, untouched: pipeline `tsc --noEmit` TS2835 ×5 in
`native-contract.ts` (was ×6 at HEAD — strictly fewer; extensionless
imports predate this mission; rs's own tsc build is green).
