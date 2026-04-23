# packager-ts

This folder is the **TypeScript declaration install** path for `ref sync`. It turns core sources plus the consumer’s generated `.reference-ui/styled` output into **typed virtual packages** (`@reference-ui/react`, `@reference-ui/system`, `@reference-ui/types`, …) so the user’s editor and `tsc` resolve imports the same way normal `node_modules` packages do.

It is intentionally **boring infrastructure**: one compiler, standard declaration emit, stable `package.json` `types` / `exports`, and explicit sync barriers—not a second declaration bundler.

---

## What must stay true

1. **Virtual packages behave like real packages** — output under `outDir` (usually `.reference-ui/`), symlinks under `node_modules/@reference-ui/*`, correct `exports` and runtime entries from the main packager (esbuild).

2. **Type surface matches runtime** — anything exported from the bundled entry (e.g. `Div`, `DivProps`) must be visible when importing `@reference-ui/react` from the consumer project.

3. **Consumer `tsconfig` must not drive this compile** — the user’s `rootDir`, `paths`, and TypeScript version are irrelevant for *generating* these declarations. A **synthetic `tsconfig`** is built per run so only core layout + generated `@reference-ui/styled` matter.

4. **Stable `types` entry** — `package.json` keeps canonical paths like `./react.d.mts` (see `packager/packages.ts` + `createBundleExports`). The compiler emits a **graph** under the package directory; a small **root barrel** file at that canonical path re-exports the real program entry (e.g. `./entry/react`) so tooling and downstream steps (e.g. font registry patches) always target one predictable file.

5. **Sync ordering** — Runtime declarations (`@reference-ui/react`, `@reference-ui/system`) must complete before the reference build that depends on them; final declarations (`@reference-ui/types`) run after the reference pipeline. That is expressed with **`packager-ts:runtime:complete`** and **`packager-ts:complete`** (see `sync/events.ts` and `orchestrator.ts`).

---

## How it works (high level)

| Piece | Role |
|--------|------|
| **`init.ts`** | Registers the packager-ts worker and orchestrator; optional pool recycle in watch mode after `packager-ts:complete`. |
| **`orchestrator.ts`** | Serializes **runtime** vs **final** declaration passes; emits `run:packager-ts` with the right completion event. |
| **`worker.ts`** | Thin worker: single-flight queue, listens for `run:packager-ts`. |
| **`run.ts`** | Spawns the **child process**, then emits the completion event. |
| **`child-process/`** | Short-lived Node process: heavy compiler RSS leaves with the child, not the worker isolate (`argv` carries a **small JSON** payload only—no full config—to avoid `E2BIG`). |
| **`execute-dts.ts`** | Chooses package subset per phase; calls `installPackagesTs`. |
| **`install/`** | Per package: `compileDeclarations` → update `package.json` `types` / `exports['.'].types` → then `writeGeneratedSystemTypes` / `writeGeneratedReactTypes` for font registry augmentation. |
| **`compile/`** | `create-temp-tsconfig.ts` writes the synthetic project; `diagnostics.ts` runs **`tsgo`** (TypeScript native preview) when resolvable, else **`typescript/lib/tsc`**. Emit is declaration-only; output is copied into the virtual package; **root barrel** is written at the canonical `types` path. |

---

## Synthetic tsconfig (why it exists)

Declaration builds cannot use the consumer’s real `tsconfig.json`:

- Core sources live under `@reference-ui/core`; consumer **`rootDir`** / include patterns can reject or mis-shape those files.
- **`@reference-ui/styled`** must resolve to the **consumer’s** generated package under `.reference-ui/styled`, not whatever happens to exist next to core in a dev checkout.

So the temp config pins **`rootDir`** to core’s `src`, sets **`paths`** for `@reference-ui/styled`, and uses a single **`files`** entry for the package entry (e.g. `src/entry/react.ts`). Overrides are minimal; the rest mirrors a sane library baseline (`moduleResolution: bundler`, `declaration`, `emitDeclarationOnly`, etc.).

---

## Root declaration barrel (why it exists)

`tsgo` / `tsc` emit declarations in a **tree** that mirrors sources (e.g. `entry/react.d.ts`, `system/primitives/…`, `types/…`). Published UX and `createBundleExports` expect a **single** `./react.d.mts` (or `.d.ts`) at the package root next to `react.mjs`.

After copying the graph, we write a tiny root module:

- `export * from './entry/react'` (path derived from the real emitted entry; extension stripped for resolution).

That way:

- **`types` / `exports['.'].types`** stay `./react.d.mts` without forking every consumer.
- **Re-exports** (`export * from '../system/primitives'`, etc.) resolve through the copied graph.
- **`writeGeneratedReactTypes` / `writeGeneratedSystemTypes`** can keep targeting the stable root path; **font registry** edits apply to split files under `types/` when present (see `system/types/generate.ts`), not only to a monolithic bundle.

---

## TypeScript 7 (`tsgo`) vs `tsc`

Resolution order in `compile/diagnostics.ts`: prefer **`@typescript/native-preview`**’s `tsgo` (CLI), then fall back to **`typescript`**’s `tsc`. Both are invoked as **subprocesses** with `--project` and `--outDir`; no requirement for a stable programmatic `typescript` API on the declaration path.

---

## Failure and performance notes

- **Diagnostics** — If emit fails or the entry `.d.ts` is missing, a second subprocess run surfaces compiler output for errors.
- **Memory** — Heavy work runs in a **child** so the worker thread’s heap does not retain the whole program graph for the rest of sync.
- **Speed** — `tsgo` is expected to dominate wall time on large graphs; parallelization is a future lever; correctness and predictable layout come first.

---

## Related code (outside this folder)

| Location | Why |
|----------|-----|
| `packager/init.ts` | `initTsPackager` wires this subsystem into sync. |
| `packager/packages.ts` | Canonical `types` / `main` / `exports` for each virtual package. |
| `packager/run.ts` | Emits `packager-ts:runtime:complete` / `packager-ts:complete` when skipping TS. |
| `sync/events.ts` | DAG edges that wait on packager-ts barriers. |
| `system/types/generate.ts` | Font registry + `types.generated.d.mts`; patches **split** `types/fontRegistry.d.mts` / `types/fonts.d.mts` when the declaration graph is multi-file. |
| `workers.json` / `tsup.config.ts` | Worker entry `packager-ts`; CLI bundle **`packager-ts-child`**. |

---

## Guiding principle

Prefer **one compiler**, **normal package layout**, and **explicit, testable steps** over clever declaration bundling. If something is hard to explain in this README, it probably does not belong in infra-grade packaging.

---

## If this folder is docs-only

`packager/init.ts` re-exports `initTsPackager` from `./ts/init`. If you keep only this README under `packager/ts/`, restore the rest of the module (worker, compile, install, child process, tests) **or** temporarily remove that re-export until the implementation is back, or `ref sync` will fail to resolve `./ts/init`.
