# Reference RS Test Framework (`TESTING.md`)

Shared station harness for **`packages/reference-rs`**: `packages/reference-rs/testing`, plus the per-module suites that consume it.

> [!IMPORTANT]
> **Sequencing lives in [PLAN.md](./PLAN.md).** This file is the harness
> contract (§3) plus landed migration notes (§4). §6 is a pointer back to PLAN,
> not a second phase plan. If a snippet here and `testing/*.ts` disagree, the
> TypeScript is right — fix this file.

**Landed:** `testing/` library; `atomic`, `atlas`, `tasty`, `virtualrs`, and `styletrace` station runners; `globalSetup.ts` gone; `--update-goldens` works for those five (`GOLDEN_SUPPORTED_MODULES` in `run.mjs`). Tasty runtime emit lives in `tests/.scratch/` (gitignored). Virtualrs goldens are `output/expected.tsx`. Styletrace goldens are `output/components.json`. `testing/css.ts` validates emitted CSS on every atomic station. Shared `minimal_system()` / `semantic_tokens_system()` / `recipes_system()` parse nested Dump JSON through `BaseSystem::from_json`. `strict_system()` was dropped — `strict` is not a Dump field.

**Remaining:** `typegen` `.d.ts` goldens (PLAN Phase 4); `canon` / `base-system` stay Cargo-only. Styletrace `node_builtin` / `react_reexport` still use TS helpers plus Rust string fixtures (not the four promoted package stations).

§3 is the contract. §4 is historical blueprint with current-state notes. Do not implement §6.

---

## 1. Executive Mandate & Vision

Across `packages/reference-rs`, compiler products share an identical macro lifecycle:
$$\text{Input Scenario (TSX/TS/AST)} \longrightarrow \text{Native N-API Call (Oxc/Rust)} \longrightarrow \text{Semantic Assertions} + \text{Committed Goldens}$$

Historically, however, modules evolved across four disconnected eras:
1. **Era 1 (Eager `globalSetup` Pre-Runners — `tasty`, `virtualrs`, `atlas`)**: Pre-compiles 500+ files to disk before tests run, turning Vitest suites into static file-diff checkers and hiding single-case failures.
2. **Era 2 (Ad-Hoc Temp Workspaces — `styletrace`)**: Generates ephemeral `mkdtemp` trees on the fly to fake `node_modules/`, duplicating fixture code strings across TypeScript and Rust.
3. **Era 3 (Pure Rust Unit Tests — `canon`, `base-system`, `typegen`)**: Instant sub-second Cargo suites, but lacks declarative golden validation for future `.d.ts` declaration printers.
4. **Era 4 (Declarative Station Pattern — `atomic`)**: A single runner, automatic folder discovery, colocated `spec.ts`, universal standing gauges, committed native goldens, and `--update-goldens` CLI intent.

### The Objective
Extract the Era 4 station pattern into a reusable, zero-overhead test library (**`packages/reference-rs/testing`**), eliminate all `globalSetup.ts` pre-runners, delete 60+ duplicate boilerplate test files, establish universal **Standing Gauges**, and standardize the `--update-goldens` developer experience across the entire Rust compiler workspace.

---

## 2. Current State Audit by Module

| Module | Test Model Today | Test Files / Fixtures | Flaws & Antipatterns | Target Architecture |
| :--- | :--- | :--- | :--- | :--- |
| **`atomic`** | Station pattern (`cases.test.ts`) | 1 runner, ID-named `ATM-*` stations (`tests/cases/ATM-COND-04`) | Shared `testing` runner. Folder name is the SPEC ID. | Keep 1:1 ID folders; no slug suffixes. |
| **`atlas`** | Station runner (`cases.test.ts`) | `ATL-*` stations, committed `analysis.json` / `diagnostics.json` | Migrated. | Keep station runner. |
| **`tasty`** | Station runner (`cases.test.ts`) | `TST-*` stations; runtime emit in `.scratch/` | Migrated. Committed goldens are `manifest.js` + `chunks.json`. | Keep station runner. |
| **`virtualrs`** | Station runner (`cases.test.ts`) | `VRT-*` stations, committed `output/expected.tsx` | Migrated. | Keep station runner. |
| **`styletrace`** | Station runner (`cases.test.ts`) | 14 snake_case stations, `output/components.json` | Four package scenarios promoted (`input/packages/` remapped to `node_modules/`). Folder names kept (not `STY-*`). `node_builtin` / `react_reexport` remain non-station fixtures. | Keep station runner; do not reintroduce in-memory copies of the four package cases. |
| **`canon`** | Cargo unit tests (`src/tests.rs`) | 10 generated unit tests, generator script | Static slices tested in Rust. Generator is already fail-closed (`pnpm canon`). | Keep pure Cargo; do not invent a `--check` flag. |
| **`base-system`** | Cargo unit tests (`src/lib.rs`) | 1 stub unit test | Pending 42 SPEC cases; needs in-memory fixture generators. | Shared in-memory `BaseSystem` fixtures across Rust crates. |
| **`typegen`** | Cargo unit tests (`src/lib.rs`) | 1 stub unit test, core prototypes | Will emit `.d.ts` declarations; needs golden snapshot tests and `tsc --noEmit` validation. | Golden `.d.ts` snapshots + TypeScript compilation seam test. |

---

## 3. Core Architecture: `packages/reference-rs/testing`

The shared testing framework lives at `packages/reference-rs/testing/` as a lightweight, type-safe harness built on top of Vitest.

```
packages/reference-rs/
├── testing/                          # Shared Test Mini-Library
│   ├── index.ts                      # Clean barrel exports
│   ├── types.ts                      # Contracts, contexts, and gauge signatures
│   ├── runner.ts                     # createStationSuite() execution engine
│   ├── goldens.ts                    # diffOrWriteGoldens() with CLI flag handling
│   ├── workspace.ts                  # createVirtualWorkspace() scratch FS builder
│   └── normalizers.ts                # AST, whitespace, and hash/ID normalizers
```

### 3.1 Type Contracts (`types.ts`)

```ts
/**
 * Execution context provided to station hooks and specs.
 */
export interface StationContext {
  /** Folder name, e.g. "ATM-LEAF-01" */
  caseName: string
  /** Extracted ID prefix, e.g. "ATM-LEAF-01" */
  caseId: string
  /** Absolute path to the station root */
  caseDir: string
  /** Absolute path to station input directory */
  inputDir: string
  /** Absolute path to station output directory */
  outputDir: string
}

/**
 * Contract implemented by every station's spec.ts.
 */
export interface StationSpec<TResult> {
  /** Primary SPEC.md ID anchor (must match folder prefix) */
  id: string
  /** Secondary or related SPEC IDs proved by this station */
  ids?: string[]
  /** Domain-specific assertions executed against the compilation result */
  verify(result: TResult, context: StationContext): void | Promise<void>
}

/**
 * Declared golden artifact emitted by the compiler.
 */
export interface GoldenDefinition<TResult> {
  /** Filename relative to output/, e.g. "styles.css", "analysis.json" */
  fileName: string
  /** Serialization format */
  format: 'text' | 'json'
  /** Extracts the data payload from the compiler result */
  extract(result: TResult): unknown
}

/**
 * Universal invariant gauge enforced across every station in a suite.
 */
export type StandingGauge<TResult> = (
  result: TResult,
  context: StationContext
) => void | Promise<void>

/**
 * Suite configuration for createStationSuite().
 */
export interface StationSuiteConfig<TResult> {
  /** Top-level Vitest describe block label */
  suiteName: string
  /** Absolute path to cases/ directory */
  casesDir: string
  /** Folder discovery regex (defaults to standard station ID prefix) */
  folderPattern?: RegExp
  /** Compiles or executes the case on-demand */
  compile(context: StationContext): Promise<TResult>
  /** Goldens verified or written for each station */
  goldens: GoldenDefinition<TResult>[]
  /** Universal invariants executed on every station */
  standingGauges?: StandingGauge<TResult>[]
  /** Mandatory files required inside each station folder */
  requiredFiles?: string[]
  /** Normalizer applied to golden text and JSON serialization before diffing or writing */
  normalizeText?(content: string, fileName: string, context: StationContext): string
  /** Known-invalid CSS fragments allowed when writing stylesheet goldens */
  allowedCssProblems?(context: StationContext): readonly string[]
}
```

### 3.2 The Generic Station Runner (`runner.ts`)

`createStationSuite` is the only loop. Source of truth: `testing/runner.ts`. Lifecycle per station:

1. Hygiene (`README.md`, `spec.ts`, `input/` by default).
2. Load `spec.ts`; `spec.id` must equal capture group 1 of `folderPattern` (or the folder name if there is no group).
3. `compile(context)` on demand.
4. `spec.verify(result, context)`.
5. Standing gauges — they run **after** verify, so an exact `toEqual` in the spec will fail first.
6. `diffOrWriteGoldens(..., { update, normalizeText, allowedCssProblems })`.

`normalizeText` on the suite config takes `(content, fileName, context)`. The runner wraps it to the two-argument form `goldens.ts` expects.

### 3.3 The Golden Snapshot Engine (`goldens.ts`)

Unified handling of `--update-goldens` (CLI). `run.mjs` forwards that flag as `UPDATE_GOLDENS=1`. Authors update goldens through the CLI, not by exporting the env var by hand.

- **Deterministic serialization**: JSON is 2-space indent with a trailing newline. Key order is whatever `extract()` returns.
- **Zero silent overwrites**: files are never rewritten during normal runs.
- **CSS write guard**: stylesheet goldens go through `assertWritableCss` before disk write (`testing/css.ts`). Quarantined fragments pass via `allowedCssProblems`.
- **Native file formats**: `.css`, `.json`, `.tsx`, `.d.ts` — never Vitest `.snap`.

```ts
export interface GoldenDiffOptions {
  update: boolean
  normalizeText?: (content: string, fileName: string) => string
  allowedCssProblems?: readonly string[]
}

export function diffOrWriteGoldens<TResult>(
  outputDir: string,
  result: TResult,
  goldens: GoldenDefinition<TResult>[],
  options: GoldenDiffOptions
): void
```

### 3.4 Virtual Workspace Builder (`workspace.ts`)

Solves the `node_modules` problem across `styletrace`, `atlas`, and `tasty`:
- Creates isolated, process-safe scratch trees under `target/scratch-tests/<suite>-<uuid>/`.
- Allows test authors to declare mock packages and subpath exports as in-memory maps:
  ```ts
  const ws = await createVirtualWorkspace({
    'src/index.tsx': 'import { Card } from "@ui/card"; ...',
    'node_modules/@ui/card/package.json': '{ "name": "@ui/card", "main": "./index.js" }',
    'node_modules/@ui/card/index.d.ts': 'export declare const Card: any;',
  })
  ```
- Implements `Symbol.asyncDispose` (`using workspace = ...`) and `afterEach` hooks for guaranteed zero-leak cleanup without polluting git status.

### 3.5 Normalizers (`normalizers.ts`)

Small, named helpers used by `normalizeText` and JSON `extract()` — whitespace/CRLF, unstable hashes/IDs, and anything else a module must strip before a golden diff. Keep them here so modules do not each invent a trim function.

### 3.6 CSS grammar oracle (`css.ts`)

`validateCss(sheet)` parses with css-tree and walks declarations against formal grammar. `assertWritableCss` is the golden-writer guard: `--update-goldens` cannot bless a stylesheet that does not parse or match, unless the fragment is on `allowedCssProblems`. `unexpectedCssProblems` / `staleCssAllowlist` are the quarantine pair — empty a slot by fixing the compiler, not by editing the list. Atomic's station gauges call this; the harness itself has no atomic knowledge.

---

## 4. Module-by-Module Migration Blueprints

### 4.1 `modules/atomic` (The Baseline Refactor)

**Current State**: `cases.test.ts` + local `helpers.ts`. Folder name is the SPEC ID (`ATM-COND-04`). `CASE_FOLDER` is `^(ATM-[A-Z]+-\\d{2})$`.  
**Target State**:
```ts
// packages/reference-rs/modules/atomic/tests/cases.test.ts
import { createStationSuite } from '../../../testing/index.js'
import {
  atomicGauges,
  atomicGoldens,
  compileCase,
  CASES_DIR,
  CASE_FOLDER,
  type CompileResult,
} from './helpers.js'

createStationSuite<CompileResult>({
  suiteName: 'atomic cases',
  casesDir: CASES_DIR,
  folderPattern: CASE_FOLDER,
  compile: (ctx) => compileCase(ctx.caseName),
  goldens: atomicGoldens,
  standingGauges: atomicGauges,
})
```
- **Line Reduction**: `cases.test.ts` drops from 114 lines to ~18 lines.
- **Cleanup**: Delete leftover `AT-*` and slug case folders as part of this refactor, not a later phase.
- **Zero Regressions**: ID-named stations + the discovery test keep identical goldens (`pnpm agentrs v atomic`).

---

### 4.2 `modules/virtualrs` (Eliminate 15 Duplicate Boilerplates & `globalSetup`)

**Current State**:
- 15 identical `tests/cases/**/rewrite.test.ts` files:
  ```ts
  import { runVirtualCaseTest } from '../../assertCase'
  runVirtualCaseTest(import.meta.url)
  ```
- `tests/globalSetup.ts`: 75 lines pre-running transforms before tests start.
- Gitignored `output/result.tsx` and `output/perf-metrics.txt`.

**Target State**:
1. **Delete**:
   - `tests/globalSetup.ts`
   - `tests/assertCase.ts`
   - All 15 `tests/cases/**/rewrite.test.ts`
   - Remove `globalSetup` from `vitest.config.ts`
2. **Rename Case Folders**:
   - `css_basic` $\rightarrow$ `VRT-CSS-01-basic`
   - `css_aliases` $\rightarrow$ `VRT-CSS-02-aliases`
   - `cva_alias` $\rightarrow$ `VRT-CVA-01-alias`
   - `responsive_css_basic` $\rightarrow$ `VRT-RESP-01-css-basic`, etc.
3. **Add `spec.ts` to Each Station**:
   ```ts
   // tests/cases/VRT-CSS-01-basic/spec.ts
   import type { StationSpec } from '../../../testing'
   import type { VirtualResult } from '../../helpers'

   const spec: StationSpec<VirtualResult> = {
     id: 'VRT-CSS-01',
     verify(result) {
       expect(result.metrics.rustApiMs).toBeGreaterThanOrEqual(0)
     }
   }
   export default spec
   ```
4. **Single Runner (`cases.test.ts`)**:
   ```ts
   // packages/reference-rs/modules/virtualrs/tests/cases.test.ts
   import { createStationSuite } from '../../../testing'
   import { compileVirtualCase, CASES_DIR, CASE_FOLDER, type VirtualResult } from './helpers'

   createStationSuite<VirtualResult>({
     suiteName: 'virtualrs transforms',
     casesDir: CASES_DIR,
     folderPattern: CASE_FOLDER,
     compile: (ctx) => compileVirtualCase(ctx),
     goldens: [
       { fileName: 'expected.tsx', format: 'text', extract: (r) => r.code },
     ],
     normalizeText: (text) => text.trim().replace(/\r\n/g, '\n'),
   })
   ```
- **Benefits**: Eliminates 17 boilerplate files, removes all disk pollution during test runs, and supports `pnpm agentrs v virtualrs --update-goldens`.

---

### 4.3 `modules/atlas` (Eliminate Phantom Goldens & Add Schema Gauges)

**Current State**:
- `tests/globalSetup.ts` runs twice as many analyses, writing `output/analysis.json` which is never asserted.
- `atlas.test.ts` contains 344 lines duplicating `indexing.test.ts`, `interface.test.ts`, and `shape.test.ts`.
- 14 `api.test.ts` files plus unused `dynamic_values`. `analysis.json` is written and never asserted.

**Target State**:
1. **Delete**:
   - `tests/globalSetup.ts`
   - Remove duplicate blocks in `atlas.test.ts`
   - Remove `globalSetup` from `vitest.config.ts`
2. **Rename Case Folders**:
   - `demo_surface` $\rightarrow$ `ATL-SURF-01-demo-surface`
   - `barrel_reexports` $\rightarrow$ `ATL-REXP-01-barrel`
   - `same_name_collisions` $\rightarrow$ `ATL-NAME-01-collisions`
   - `wrapped_components` $\rightarrow$ `ATL-WRAP-01-memo-forwardref`, etc.
3. **Universal Standing Gauges (`helpers.ts`)**:
   ```ts
   export const atlasGauges: StandingGauge<AtlasAnalysisResult>[] = [
     // ATL-SCHEMA-01: Component schema integrity
     (res) => {
       for (const comp of res.components) {
         expect(comp.name).toBeTruthy()
         expect(comp.source).toBeTruthy()
         expect(['very common', 'common', 'occasional', 'rare', 'unused']).toContain(comp.usage)
         expect(comp.count).toBeGreaterThanOrEqual(0)
         for (const prop of comp.props) {
           expect(prop.name).toBeTruthy()
           expect(prop.count).toBeGreaterThanOrEqual(0)
         }
       }
     },
     // ATL-DIAG-01: Diagnostic schema integrity
     (res) => {
       for (const diag of res.diagnostics) {
         expect(['warning', 'error', 'info']).toContain(diag.severity)
         expect(diag.message).toBeTruthy()
       }
     }
   ]
   ```
4. **Committed Goldens**:
   - Commit `output/analysis.json` and `output/diagnostics.json` across all 15 stations.
   - Diff on every run; update via `pnpm agentrs v atlas --update-goldens`.
5. **Fix Stale Rust Search Paths**:
   - In `modules/atlas/src/analyzer.rs`, remove stale candidate path `workspace_root.join("tests/atlas/...")`.

---

### 4.4 `modules/tasty` (Consolidate 38 Loose Files & Lazy Compilation)

**Current State**:
- 38 loose `api.test.ts` files repeating identical boilerplate.
- Synchronous `npm install` inside `globalSetup.ts`.
- Only snapshots first lexicographical chunk.

**Target State**:
1. **Replace 38 `api.test.ts` with lightweight `spec.ts`**:
   ```ts
   // tests/cases/TST-GEN-01-generics/spec.ts
   import type { StationSpec } from '../../../testing'
   import type { TastyApi } from '../../js/index'

   const spec: StationSpec<TastyApi> = {
     id: 'TST-GEN-01',
     async verify(api) {
       const user = await api.loadSymbolByName('User')
       expect(user.kind).toBe('Interface')
     }
   }
   export default spec
   ```
2. **On-Demand Compilation**:
   - Eliminate eager `globalSetup.ts`.
   - Compile each case inside `compile(ctx)` on-demand, memoized per test run.
   - Running `pnpm agentrs v tasty -t TST-GEN-01` compiles **only that single case in <20ms**, rather than all 38 cases.
3. **Comprehensive Goldens**:
   - Replace opaque `__snapshots__/*.snap` with committed goldens:
     - `output/manifest.js` (normalized symbol map)
     - `output/declarations.d.ts` (emitted ambient typings)
     - `output/chunks.json` (checksum and export list across **all** chunks, preventing blindspots)
4. **Eliminate In-Test `npm install`**:
   - Vendor test typing dependencies (`csstype`, `@types/json-schema`) into a committed fixture directory or link to root `node_modules`.

---

### 4.5 `modules/styletrace` (Clean Dead Cases & Shared Workspace)

**Current State** *(landed)*:
- Station runner at `tests/cases.test.ts` discovers `tests/cases/<id>/` (`direct_wrapper`, … plus the four promoted package stations). Folder name is the spec id.
- The four package/node_modules scenarios are committed under `input/` with mock libraries in `input/packages/` (git cannot track `node_modules/`). Compile remaps that tree through `createVirtualWorkspace`.
- `ScratchDir` already aliases `shared::testing::ScratchWorkspace`; no second RAII type.
- Unused-disk-folder claim in older drafts was stale — those four folders were already gone from `tests/cases/` before this migration.

**Target State** *(landed 2026-09-15)*:
Promoted the four package scenarios; station runner checks `output/components.json`; `createRuntimeFixture` uses `createVirtualWorkspace`; `ScratchDir` aliases `ScratchWorkspace`. Leftover: `node_builtin` / `react_reexport` still exist as TS helpers and Rust string fixtures (`fixtures.test.ts` / `tracing.rs`). Do not reintroduce in-memory copies of the four promoted package cases.

---

### 4.6 Foundational Rust Crates (`canon`, `base-system`, `typegen`)

**Current State**:
- Pure Rust suites verified via `cargo test` (`pnpm agentrs c <crate>`).
- Zero N-API bindings today.
- Shared in-memory fixtures live in `shared/src/testing/base_system.rs` and return a lowered `BaseSystem` from nested Dump JSON (`from_json`). `strict_system()` is omitted because `strict` / `strictTokens` are not Dump fields.

**Target State**:
1. **Shared In-Memory `BaseSystem` Fixtures** *(landed)*:
   - `minimal_system()`, `semantic_tokens_system()`, `recipes_system()` return a lowered `BaseSystem`. Nested Dump JSON (`tokens.colors.blue.500.value`), not the flat TokenEntry station maps.
   - `strict_system()` was **not** added: `strict` / `strictTokens` / `semanticTokens` are unknown Dump keys (`deny_unknown_fields`).
2. **`typegen` Golden `.d.ts` Harness** *(PLAN Phase 4)*:
   - When the declaration printer is implemented, golden `.d.ts` plus `tsc --noEmit` against consumer fixtures.

---

## 5. Toolchain & CLI Updates (`run.mjs`)

`--update-goldens` is allowed for station harnesses only:

```javascript
const GOLDEN_SUPPORTED_MODULES = new Set([
  'atomic',
  'system',
  'virtualrs',
  'virtualfs',
  'atlas',
  'tasty',
  'styletrace',
])
```

`UPDATE_GOLDENS: '1'` is forwarded when the CLI flag is present. Do not add a second path. The author-facing contract stays `pnpm agentrs v <module> --update-goldens`.

---

## 6. Sequencing

Superseded. The live sequence is [PLAN.md](./PLAN.md) §4. Harness migration (this document's old Phases 1–5) is done except typegen `.d.ts` goldens, which is PLAN Phase 4.

---

## 7. Verification & Definition of Done

The test harness modernization is complete when:
1. `packages/reference-rs/testing` is the single source of truth for case station discovery, standing gauges, and golden management.
2. Zero modules use `globalSetup.ts` to pre-generate test files on disk.
3. Over 60 duplicate boilerplate test files (`*.test.ts`) are eliminated.
4. `pnpm agentrs v <module> --update-goldens` works identically across station-enabled harnesses (`atomic`, `virtualrs`, `atlas`, `tasty`, `styletrace`).
5. Every station folder has a committed `README.md` station card linking intent to `SPEC.md`.
6. Full test suite verification passes:
   ```bash
   pnpm agentrs t  # Build -> Cargo unit tests -> Vitest seam tests -> Quality gate
   ```
