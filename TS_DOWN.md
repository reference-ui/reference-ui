I want to migrate from TSUP to TSDOWN.

I want to use the programmatic api from TSDOWN, to avoid spinng up child process.
in research/tsdown, I have linked the tsdown repo.

in TSDOWN_API.md, i have documented the programmatic api, to my best ability with composer 2.

we need to figure out a real migration plan, fairly detailed.

I tried to use tsdown befrore, programmtyically .. but it was earlier on in the project.
and it ended up just 'not working'

so we need to think harder this time round.

we need to look at unit tests around what the pakcager-ts emits, and w e need to try our best to actually reproduce the same outputs as our tsup version now.

w DO NOT want to spin up a child process, we want to use the programmatic api directly.

have a look at how events and threads work in reference-core, likely it will be all housed in the same packager-ts worker, so we won't need to change much in terms of hte cuirrent architecture, just mplementation of pakcager-ts.

# TSDOWN migration game plan

## Primary objective

Replace the current per-package `npx tsup` declaration compilation path with an in-process `tsdown` integration that uses the programmatic `build()` API directly, while preserving the current runtime/final DTS scheduling model and reproducing the declaration outputs that the rest of the system already expects.

## What we are actually changing first

The first migration target is not the whole repo. The first migration target is the hot path in:

- `packages/reference-core/src/packager/ts/compile/index.ts`

That function currently:

- creates a temp output directory
- creates a temp tsconfig
- spawns `npx tsup ... --dts-only`
- scans the temp output for the first `.d.ts` or `.d.mts`
- atomically copies that declaration into the consumer output
- deletes the temp directory

This is the highest-leverage change because `PERFORMANCE.md` shows that repeated `tsup` process startup is the main startup bottleneck.

## What should stay stable in the first pass

- `sync/events.ts` should stay mostly unchanged
- `packager-ts` should remain the place where DTS work is scheduled
- `orchestrator.ts` should keep the current runtime/final request model unless we discover a hard blocker
- `findDtsFile()` and atomic copy semantics should stay in place until tsdown output parity is proven
- temp tsconfig generation should stay in place unless tsdown proves it can consume the same settings another way without changing behavior

## Non-goals for phase 1

- do not rewrite the sync bus
- do not redesign worker/thread architecture up front
- do not migrate every `tsup.config.ts` before the DTS hot path is proven
- do not depend on spawning `tsdown` as a CLI fallback except as a short-lived local debugging aid

## Ground truth from the current codebase

### Current DTS compiler seam

- `compileDeclarations()` in `packages/reference-core/src/packager/ts/compile/index.ts`
- current flags are effectively:
  - single entry file
  - `--dts-only`
  - `--tsconfig <temp>`
  - `--format esm`
  - `--out-dir <tmp>`
  - `--target es2020`
  - `--external react`
  - `--external react-dom`

### Current output assumptions

- `findDtsFile()` recursively scans temp output for the first `.d.ts` or `.d.mts`
- output layout is already treated as unstable
- the rest of the system cares about the final copied declaration path more than the intermediate temp layout

### Current scheduling boundary

- `sync/events.ts` emits `packager-ts:runtime:requested` after runtime bundle completion
- `sync/events.ts` emits `packager-ts:final:requested` after final package completion
- `orchestrator.ts` decides whether runtime or final DTS runs next
- `worker.ts` simply exposes readiness and executes queued DTS passes

This means the migration should primarily change compile implementation, not high-level orchestration.

## Migration principles

### 1. Parity before cleanup

Match the current emitted declaration behavior first. Only simplify temp output handling or scheduling after parity is demonstrated.

### 2. One risky seam at a time

First replace the DTS compiler implementation in `reference-core`. Only after that is stable should we migrate package-level `tsup.config.ts` files.

### 3. Keep fallback-friendly boundaries

The first implementation should isolate tsdown-specific logic behind a small adapter so it is easy to compare old vs new behavior during validation.

### 4. Measure the result

The migration is justified by performance, so it needs timing and request-count instrumentation, not just “it builds on my machine.”

## Detailed execution plan

## Phase 0: lock down requirements and option mapping

### Goal

Prove that the exact current `tsup` invocation has a valid `tsdown build()` equivalent.

### Tasks

- confirm the trusted `tsdown` version to adopt for the repo
- verify the exact import surface we will use: `import { build } from 'tsdown'`
- map current `tsup` flags to `tsdown` inline config fields
- verify the external-dependency mapping, likely through `deps` config rather than legacy `external`
- verify whether `tsdown` can do true DTS-only output for this use case, or whether it emits JS alongside declarations
- verify expected disposal or watch behavior is irrelevant for this compile path since this path is not using watch mode

### Expected output

- a short mapping table from current `tsup` args to `tsdown build()` config
- an explicit answer to: can we avoid JS emit, or do we tolerate temp JS output and discard it?

### Exit criteria

- no unresolved API-shape questions remain for the first implementation

## Phase 1: create a parity harness around current DTS output

### Goal

Define what “works” means before swapping compiler engines.

### Tasks

- inventory existing tests that cover `packager-ts` output and declaration consumers
- add focused coverage around `compileDeclarations()` behavior if current tests are too indirect
- lock in expectations for:
  - successful declaration generation for representative packages
  - copied final output file path
  - acceptable `.d.ts` vs `.d.mts` behavior
  - failure behavior when the compiler emits no declaration file
- identify representative package cases:
  - runtime package with React externals
  - final `@reference-ui/types` package
  - at least one case that exercises generated `.reference-ui/styled` resolution through the temp tsconfig

### Expected output

- a small but authoritative test matrix for declaration parity

### Exit criteria

- we can compare tsup-backed and tsdown-backed output with confidence

## Phase 2: implement the tsdown-backed DTS adapter in `reference-core`

### Goal

Replace child-process spawning in the declaration hot path with in-process `tsdown build()`.

### Tasks

- add `tsdown` as a dependency where `reference-core` can import it directly
- create a dedicated adapter around `build()` for declaration compilation
- keep the current temp-dir and temp-tsconfig flow initially
- configure `build()` with inline config and `config: false` so the path is fully controlled by code
- keep `cwd: cliDir` behavior aligned with the current invocation
- preserve `target`, entry, output directory, and dependency externalization behavior
- keep `findDtsFile()` as the normalization step for whatever temp layout tsdown emits
- preserve atomic copy into the final declaration location
- preserve cleanup of temp output in `finally`

### Implementation notes

The first version should aim to mirror the current behavior conceptually:

- entry: current `entryFile`
- tsconfig: generated temp tsconfig path
- format: ESM-equivalent output
- target: `es2020`
- declarations enabled
- bundling behavior configured so `react` and `react-dom` are not bundled
- no config-file discovery

If tsdown cannot do a clean declaration-only build in this path, the acceptable first implementation is:

- emit into the temp directory
- ignore any JS output
- keep copying only the declaration file into the real destination

### Exit criteria

- `compileDeclarations()` no longer spawns `npx tsup`
- declaration output still lands in the exact consumer-facing destination expected today
- runtime and final DTS phases still complete through the existing packager-ts orchestration

## Phase 3: validate scheduler and runtime behavior without broad architecture changes

### Goal

Make sure the new compiler implementation behaves correctly inside the current event/thread model.

### Tasks

- verify `packager-ts` still runs entirely inside the existing worker lifecycle
- confirm no change is needed to `sync/events.ts` dependency edges
- confirm `orchestrator.ts` request counting still behaves correctly with the new compile duration profile
- add instrumentation for each sync run:
  - runtime DTS requests received
  - final DTS requests received
  - actual DTS passes executed
  - total DTS time
  - number of child processes spawned for DTS work
- compare startup timing before and after the change

### Exit criteria

- the migration produces a measurable reduction in startup cost
- no regressions appear in runtime/final phase ordering

## Phase 4: migrate package-level tsup configs after the hot path is stable

### Goal

Move repo package builds from `tsup` config files to `tsdown` config files only after the in-process DTS path is proven.

### Initial targets

- `packages/reference-core/tsup.config.ts`
- `packages/reference-rs/tsup.config.ts`
- `packages/reference-lib/tsup.config.ts`

### Tasks

- convert config shape from `tsup` to `tsdown`
- preserve multi-entry worker output for `reference-core`
- map `external` behavior to tsdown dependency config
- map `onSuccess` behavior to tsdown hooks for the Liquid template copy step
- confirm output extensions and directory layout match current expectations
- update package scripts from `tsup` to `tsdown`
- update fixtures and e2e paths that currently call `pnpm exec tsup`

### Exit criteria

- package builds remain output-compatible enough for existing tests and consumers
- no worker entry regressions in `reference-core`

## Risk register

### Risk: tsdown declaration semantics do not match `--dts-only`

Mitigation:

- prove behavior in Phase 0 before changing the compile path
- allow temp JS emit in the first implementation if needed
- keep final output normalization logic unchanged

### Risk: output file layout changes unexpectedly

Mitigation:

- keep `findDtsFile()` in the first pass
- add tests around the copied final output path

### Risk: externals mapping changes declaration output

Mitigation:

- explicitly validate `react` and `react-dom` handling
- compare emitted declaration imports before removing tsup fallback knowledge

### Risk: package-level config migration becomes a distraction

Mitigation:

- defer config-file migration until after `compileDeclarations()` is stable and benchmarked

### Risk: we improve process startup cost but not total DTS time enough

Mitigation:

- instrument total DTS time
- use that data to decide whether the next step is multi-entry batching, graph reuse, or deeper tsconfig tuning

## Acceptance criteria

The migration is only “done” for the first milestone when all of the following are true:

- `compileDeclarations()` no longer shells out to `npx tsup`
- the implementation uses `tsdown` programmatically in-process
- emitted declarations remain compatible with existing downstream consumers
- runtime DTS and final DTS still fit the current scheduler model
- the current test suite covering packager/type output passes
- startup time improves in a measurable way relative to the current baseline in `PERFORMANCE.md`

## Recommended implementation order

1. prove option mapping and DTS-only feasibility
2. lock parity with focused tests
3. replace `compileDeclarations()` with a tsdown adapter
4. add instrumentation and benchmark startup
5. only then migrate package-level `tsup.config.ts` files

## Immediate next actions

- read `packages/reference-core/src/packager/ts/compile/index.ts` and implement the mapping plan on paper first
- inspect current unit coverage for packager-ts output parity
- decide and pin the `tsdown` version to use in-repo
- prototype the smallest possible in-process `build({ config: false, ... })` call that can reproduce one current declaration output

## Decision log

### Decision: keep architecture stable first

We are intentionally not rewriting `sync/events.ts` or worker orchestration in the first pass because the current evidence says the main bottleneck is compiler startup cost, not broad event-bus thrash.

### Decision: prioritize `compileDeclarations()` before config migration

This is the best leverage point because it attacks the hottest path first and gives us a real benchmark before we spend time converting package-level build configs.
