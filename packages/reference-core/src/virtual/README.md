# Virtual

The `virtual` module builds the transformed source mirror under
`outDir/virtual`.

That mirror is what Panda scans during `ref sync`. It lets the CLI rewrite
source into a Panda-friendly shape without mutating the user's real source tree.

## What It Does

The virtual pipeline is responsible for:

- copying files that match `ui.config.include` into `.reference-ui/virtual`
- excluding obvious non-source areas like `node_modules`, `.reference-ui`, and
  `.git`
- transforming certain files during copy so Panda sees the right import/runtime
  shape
- keeping the mirror in sync on watch-mode add/change/unlink events

## Why It Exists

Reference UI wants user code to author against `@reference-ui/react`, but Panda
needs to scan code in a form that resolves to the generated system runtime.

The virtual mirror solves that by rewriting only the files Panda needs to see,
while leaving the user's actual source untouched.

Examples:

- MDX is compiled into JSX before Panda scans it
- `css()` imports from `@reference-ui/react` are rewritten to the system CSS path
- `recipe()` usage is rewritten to `cva()` against the system CSS path

## Output Layout

For a normal project, virtual writes into:

```text
.reference-ui/
  virtual/
    src/
    ...
```

The mirror preserves the source-relative directory structure, with one important
extension change:

- `.mdx` source files become `.jsx` in virtual output

## Full Copy Flow

On cold start, `copyAll()`:

1. resolves the project root and virtual output dir
2. expands `config.include` with `fast-glob`
3. ignores `node_modules`, `.reference-ui`, and `.git`
4. copies every matched file into `.reference-ui/virtual`
5. emits `virtual:fs:change` for each file
6. emits `virtual:complete` when the full mirror is done

If `include` is empty, virtual skips the copy and still emits `virtual:complete`.

## Watch Flow

The worker handles watch events one file at a time:

- `add` and `change` run `copyToVirtual()`
- `unlink` removes the mirrored file from virtual output
- every handled event emits `virtual:fs:change`

This keeps the mirror aligned with source changes without needing a full recopy
for every edit.

## Transform Rules

Virtual does not transform every file.

It transforms:

- all `.mdx` files
- `.js`, `.jsx`, `.ts`, and `.tsx` files only when they contain the marker
  `@reference-ui/react`

If a file does not need transformation, it is copied byte-for-byte.

### Transform pipeline

The transform order is:

1. MDX to JSX
2. recipe/cva import rewrite
3. css import rewrite

That ordering matters because MDX must first become JSX before the import
rewriters operate on it.

## Native Rewrite Dependency

The import-rewrite transforms use the Rust/N-API binding from
`@reference-ui/rust`.

That native binding is used for:

- `rewriteCssImports()`
- `rewriteCvaImports()`

Important behavior:

- the loader returns `null` when no supported native binary is available
- the rewrite transforms currently throw in that case
- so native availability is effectively part of the virtual transform contract

Supported binary targets are currently documented in the transform error path as:

- macOS x64 / arm64
- Linux x64 GNU
- Windows x64 MSVC

## MDX Behavior

MDX files are compiled with `@rspress/mdx-rs`.

If MDX compilation fails, virtual logs the error and writes a harmless empty
module shape instead of crashing the whole transform step:

```ts
// Failed to compile <file>
export {}
```

That keeps the pipeline moving, though it also means MDX failures degrade into
missing extracted behavior rather than a hard stop.

## Event Contract

Virtual owns these events:

- `virtual:ready`
- `run:virtual:copy:all`
- `run:virtual:sync:file`
- `virtual:fs:change`
- `virtual:failed`
- `virtual:complete`

In the current sync flow:

1. the worker starts and emits `virtual:ready`
2. sync triggers `run:virtual:copy:all`
3. if the full copy or a watch sync fails, virtual emits `virtual:failed`
4. when the mirror is complete, virtual emits `virtual:complete`
5. sync then moves on to config generation

Watch events are routed from `watch:change` to `run:virtual:sync:file`.

## Confidence Today

The strongest current confidence is downstream:

- `reference-unit` verifies the baseline mirror exists and respects include/exclude
  behavior
- `reference-unit` verifies transform behavior for CSS, recipe/cva, and MDX cases
- `reference-unit` verifies mirror invariants like no missing files and no orphan
  files
- `reference-unit` verifies watch-mode updates flow through to the virtual mirror
- `reference-e2e` verifies watch updates propagate all the way to visible runtime
  styling in a broader environment

Direct `reference-core` coverage now pins down:

- `copyAll()` include handling and completion behavior
- `copyToVirtual()` copy-vs-transform selection
- transformed-extension cleanup during unlink
- native loader target resolution and missing-binary behavior
- worker-level failure propagation through `virtual:failed`

The main confidence that still lives outside this package is end-to-end proof of
the rewrite semantics themselves, which remain covered downstream in
`reference-unit`.

## Design Rules

- virtual never mutates user source
- transform is part of copy, not a separate pipeline
- the mirror should stay source-shaped unless a transform intentionally changes
  the extension or contents
- orchestration belongs in events and sync wiring, not in the virtual worker
- native rewrite behavior is part of the product contract and should be treated
  as release-critical
