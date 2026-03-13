# System

The `system` module owns the design-system generation pipeline inside
`reference-core`.

Its job is to turn user config and fragment calls into generated artifacts under
`outDir`, then hand those artifacts off to the packager so downstream code can
import `@reference-ui/system`, `@reference-ui/styled`, and `@reference-ui/react`
like normal packages.

## What It Produces

On a normal `ref sync`, the system pipeline is responsible for:

- writing `panda.config.ts` into `outDir`
- mirroring transformed source files into `outDir/virtual`
- generating Panda output into `outDir/styled`
- writing the portable `baseSystem` artifact into `outDir/system`
- generating font-registry-driven type artifacts under `outDir/system`
- preparing the runtime artifacts that the packager later bundles and links

## Why This Exists

Reference UI has a bootstrapping problem:

1. user code contributes tokens, patterns, fonts, keyframes, and global CSS
2. Panda needs a config that includes those contributions
3. runtime primitives eventually depend on Panda output
4. the CLI still has to be able to generate everything from a cold start

The system solves that by separating:

- fragment collection from code generation
- base artifact creation from Panda execution
- worker orchestration from worker implementation

## High-Level Flow

The live orchestration is in `src/sync/events.ts`, not inside the workers.

Current cold-start flow:

1. virtual worker starts and emits `virtual:ready`
2. `virtual:ready` triggers `run:virtual:copy:all`
3. virtual mirror finishes and emits `virtual:complete`
4. `virtual:complete` triggers `run:system:config`
5. config worker prepares base artifacts and writes `panda.config.ts`
6. once `system:config:complete` and `system:panda:ready` have both happened, sync emits `run:panda:codegen`
7. Panda writes `outDir/styled/*` and layer postprocessing updates `outDir/system/baseSystem.mjs`
8. packager then bundles and links the generated packages
9. sync only reports ready after packaging and type generation finish

Important nuance:

- `run:panda:css` exists as a worker capability, but the default sync flow
  currently drives full `run:panda:codegen`
- watch events currently feed the virtual mirror directly; they do not yet wire a
  separate CSS-only Panda fast path

## Architecture

### `api/`

Public fragment authoring surface.

These functions collect data from user code. They do not run Panda and they do
not write files themselves.

Examples:

- `tokens()`
- `font()`
- `globalCss()`
- `keyframes()`
- `extendPattern()`

### `base/`

Owns the portable `baseSystem` contract.

Responsibilities:

- resolve upstream and local fragment inputs for `extends`
- build the portable fragment bundle stored in `baseSystem.fragment`
- write `outDir/system/baseSystem.mjs`
- write `outDir/system/baseSystem.d.mts`
- attach portable layer CSS to `baseSystem.css` after Panda runs

### `panda/config/`

Owns generated Panda config creation.

Responsibilities:

- define the import-free structural base config
- bundle the extensions runtime used by generated config
- render `outDir/panda.config.ts`
- merge built-in and collected fragment contributions

The userspace base config writes Panda output to `outDir/styled`, not to a
source-side `system/styled` directory.

### `panda/gen/`

Owns Panda execution.

Responsibilities:

- ensure `outDir` can resolve `@pandacss/*`
- run full Panda codegen and CSS generation
- run the optional CSS-only generation entrypoint
- apply layer postprocessing to generated CSS
- update `baseSystem.css` with the portable layer-safe CSS form

### `layers/`

Owns CSS transforms for layer-aware output.

This is where Panda output is rewritten into the portable form used by
`baseSystem.css` and layered consumer flows.

### `types/`

Owns generated type augmentation for system/runtime outputs.

Today this is mostly about font-registry-derived declarations such as:

- `outDir/system/font-registry.json`
- `outDir/system/types.generated.d.mts`

These generated types are later folded into the packaged `system` and `react`
type outputs.

### `primitives/`

Generated React primitive source used by the runtime package build.

This directory is source for packaging, not the final user output directory.
The generated runtime contains the layer-name placeholder that the packager later
replaces with `ui.config.name`.

### `build/`

Internal prebuild tooling for `reference-core` itself.

This is distinct from user-project sync output:

- internal prebuild writes `src/system/styled/*`
- user sync writes `.reference-ui/styled/*`

### `workers/`

Worker entrypoints only.

They subscribe to events, run a narrow task, and emit completion. They do not
decide what happens next.

## Generated Output Layout

For a user project, the relevant system-owned outputs are:

```text
.reference-ui/
  panda.config.ts
  virtual/
  styled/
    styles.css
    css/
    patterns/
    jsx/
    extensions/
  system/
    baseSystem.mjs
    baseSystem.d.mts
    font-registry.json
    types.generated.d.mts
```

Then the packager turns those artifacts into generated packages under:

- `outDir/react`
- `outDir/system`
- `outDir/styled`

and links them into `node_modules/@reference-ui/*`.

## Event Contract

Important system events today:

- `run:system:config`
- `system:config:ready`
- `system:config:complete`
- `run:panda:codegen`
- `run:panda:css`
- `system:panda:ready`
- `system:panda:codegen`
- `system:panda:css`

The main orchestration rule is:

- worker code stays local and dumb
- pipeline order lives in `src/sync/events.ts`

## Confidence Today

The current implementation has meaningful direct coverage for:

- fragment authoring helpers in `api/*.test.ts`
- Panda config merge helpers in `panda/config/extensions/api/*.test.ts`
- layer CSS transforms in `layers/transform.test.ts`
- generated font registry output in `types/generate.test.ts`

And it has strong downstream proof in `reference-app` for:

- real sync artifact creation
- layer isolation behavior
- generated type augmentation
- interrupted-sync recovery
- stale-output readiness behavior

That downstream coverage is important, but it does not replace direct module
tests for every dangerous path in `system/base` and worker orchestration.

## Design Rules

- Base config must stay import-free so cold-start sync is always possible.
- Fragments are collected data, not ad hoc runtime behavior.
- `baseSystem` is a real contract, not an implementation detail.
- Worker orchestration belongs in events, not inside workers.
- Internal prebuild output and user sync output are different pipelines and
  should be documented separately.

## Related Docs

- [`base/README.md`](base/README.md)
- [`panda/config/README.md`](panda/config/README.md)
- [`panda/gen/README.md`](panda/gen/README.md)
- [`workers/README.md`](workers/README.md)
- [`primitives/README.md`](primitives/README.md)
