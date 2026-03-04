# system/config

Owns everything needed to produce a valid `panda.config` from user and core source files.

## How the old CLI did it

Each subsystem (fontFace, boxPattern, baseSystem, panda) ran its own isolated pipeline:

1. Build a bespoke entry script that imports just the right files
2. Bundle and execute it in a worker
3. Serialize the result to a JSON file
4. Read that JSON back and run a separate generator to produce the final artifact

Three subsystems meant three full pipelines, three entry templates, three JSON round-trips. The only thing they shared was `deepMerge`. They were structurally identical but could not see each other.

## How this one works

There is one pipeline. `bundleFragments` scans user files, bundles all fragment calls into self-contained IIFEs, and injects them into a single generated `panda.config`. Each IIFE executes at Panda's parse time, pushes a partial config object into a `globalThis` slot, and the final `deepMerge` fold assembles the complete config.

All of the old subsystems — fonts, box patterns, tokens, globalCss, keyframes — output panda config shapes. They always did. The old system just couldn't see that because each ran in isolation.

## Unifying the subsystems

The key insight: `createFragmentCollector` can accept a `transform` function. A fragment collector for font faces would look like:

```ts
const fontCollector = createFragmentCollector({
  globalKey: 'ref:fonts',
  transform: fontDefs => ({
    theme: { tokens: { fonts: fontDefs } },
  }),
})
```

The user calls `font(...)`, the collector captures the raw definition, the transform shapes it into the correct config slice, and it enters the same `deepMerge` fold as everything else. No separate pipeline. No JSON round-trip.

`createPandaConfig` stays unchanged — it just receives whichever collectors are registered, and merges whatever they produce.

## Extends and BaseSystem

`BaseSystem` is the artefact emitted by `ref sync` for an upstream package. Its shape in the new system is exactly two fields:

```ts
interface BaseSystem {
  fragment: string // bundled IIFE — the upstream package's full config contribution
  css: string // pre-compiled layer CSS — scoped to @layer <name> + [data-layer] block
}
```

These serve two entirely separate consumers:

- **`extends`** uses `fragment`. The upstream fragment is passed to `bundleFragments` alongside local fragment files and enters the same `deepMerge` fold. `createPandaConfig` has no special handling — upstream config and local config are the same input.
- **`layers`** uses `css`. The upstream CSS is injected into the consumer's output stylesheet as-is. No config merge happens — tokens stay out entirely.

```
upstream BaseSystem
  .fragment  →  bundleFragments  ←  local fragment files  →  panda.config
  .css       →  layer CSS output  (separate, post-Panda step)
```

The old `BaseSystem` interface (with explicit `tokens`, `font`, `keyframes`, `globalCss` fields) was a serialised-data envelope from the previous pipeline. Those fields are gone — config contributions are executable fragment code, not extracted data.

## Layers

Layers are a post-Panda step and stay separate from config generation. After `panda.config` is written and Panda emits `styles.css`, a layer pass:

1. Reads Panda's output CSS
2. Strips the `@layer` order declaration
3. Wraps all `@layer` blocks inside a named outer layer (e.g. `@layer base { ... }`)
4. Extracts the `:where(:root, :host)` token declarations and re-scopes them to a `[data-layer]` attribute selector

This is not a fragment concern — it's a pure CSS transform on Panda's output. In the new system it's a discrete step that runs after the config pipeline completes, receiving the emitted CSS path and layer name as inputs. No changes needed to `createPandaConfig` or the fragment system to support it.

## What it does not do

Does not run Panda. Does not touch CSS or codegen. Its only output is a written `panda.config` file.
