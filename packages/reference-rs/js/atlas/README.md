# Atlas JS API

Atlas is the thin JS wrapper around the native Rust Atlas engine.

It answers three questions:

- which React components exist in this project?
- which props type does each component map to?
- how are those components and props actually used in JSX?

All analysis logic lives in Rust and is exposed through the shared `.node`
binding. The JS layer is intentionally limited to argument normalization,
native invocation, and type re-exports.

Higher layers may enrich `component.interface` later, but Atlas itself should
already be trustworthy about component identity, source, props-type mapping,
usage counts, examples, and diagnostics.

## Public API

### `analyze(rootDir, config?)`

Returns the Atlas component list.

```ts
import { analyze } from '@reference-ui/rust/atlas'

const components = await analyze('/absolute/path/to/app', {
  include: ['@fixtures/demo-ui'],
  exclude: ['@fixtures/demo-ui:Badge'],
})
```

Use this when the caller only needs the component surface.

### `analyzeDetailed(rootDir, config?)`

Returns both components and diagnostics.

```ts
import { analyzeDetailed } from '@reference-ui/rust/atlas'

const result = await analyzeDetailed('/absolute/path/to/app')

console.log(result.components)
console.log(result.diagnostics)
```

Use this for build steps, golden-output generation, or internal pipelines that
need to preserve partial results and understand failure modes.

## Output Model

Each component includes:

- `name`: the canonical component name
- `source`: local file path or package name
- `interface`: the props type identity `{ name, source }`
- `props`: observed prop inventory with usage and literal-value summaries
- `count`: JSX call-site count
- `examples`: representative JSX snippets, deduplicated by shape
- `usedWith`: components that commonly appear alongside it

## Scope Boundaries

Atlas currently supports a narrow, intentional slice of React and TypeScript:

- exported function components
- exported arrow-function components
- default-exported function components consumed through default imports
- props type references that resolve through local files or included packages
- interfaces, type aliases, intersections, interface extension, and literal unions
- JSX call-site aggregation for local and explicitly included package components
- alias tracking for renamed imports and namespace package imports
- local barrel re-exports for components and prop types

Atlas does not attempt to fully evaluate dynamic expressions or arbitrary type
metaprogramming. Unsupported or unresolved inputs should surface through
diagnostics rather than guessed data.

Current diagnostics include:

- `unresolved-props-type` — a component was found but its named props type could not be resolved
- `unsupported-props-annotation` — the first props parameter was annotated with an unsupported inline shape rather than a named type reference
- `unresolved-include-package` — an included package could not be resolved into a source project

## Internal Structure

The public JS surface is intentionally small:

- `analyzer.ts`: normalize input paths and call the native binding
- `types.ts`: re-export Rust-generated TypeScript types
- `generated/*`: `ts-rs` output from Rust Atlas types

Rust owns the analysis internals and is split by concern under `src/atlas/`.
