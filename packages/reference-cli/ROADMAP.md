# @reference-ui/cli Roadmap

`@reference-ui/cli` is now the active system platform for Reference UI. New architecture, composition work, and design-system authoring should continue here. `reference-core` should be treated as legacy reference material while we finish the transition and remove it.

## Current status

- `defineConfig` is the public config API.
- `ref sync` owns virtual copy, config generation, Panda, packaging, and type generation.
- `baseSystem` is the portable composition artifact emitted by synced packages.
- `extends` works end to end for upstream fragment adoption.
- `layers` works end to end for upstream CSS-only composition.
- The runtime `layer` prop exists on generated primitives and emits `data-layer`.
- `reference-lib`, `reference-app`, `reference-docs`, and `reference-test` are now using `reference-cli`.

## Current composition model

Today the composition model is:

- `defineConfig({ extends: [...] })` to adopt upstream tokens and config fragments
- `defineConfig({ layers: [...] })` to consume upstream layer-ready CSS without adopting tokens
- `layer="<name>"` on primitives to scope token inheritance to a subtree at runtime

The portable `BaseSystem` artifact currently carries:

- `name`
- `fragment`
- `css?`

That is enough for the current chain model:

```ts
import { defineConfig } from '@reference-ui/cli'
import { baseSystem } from '@reference-ui/lib'

export default defineConfig({
  name: 'my-app',
  include: ['src/**/*.{ts,tsx}'],
  extends: [baseSystem],
})
```

## Future idea: `extendSystem(baseSystem)`

One important idea from the old `reference-core` design notes is still worth keeping alive:

```ts
const customBaseSystem = extendSystem(baseSystem)
customBaseSystem.tokens({ ... })
customBaseSystem.fonts({ ... })
```

We have **not** implemented this API yet.

What is attractive about it:

- it would give downstream publishers a deliberate theming-builder surface
- it would make "build on top of an upstream system, then republish" more explicit
- it would separate the portable chain artifact from the authoring API that derives a new artifact

Open questions before implementing it:

- should `extendSystem()` return a mutable builder or a pure config authoring helper?
- should it emit a new `BaseSystem`, a config fragment bundle, or a higher-level authoring object?
- how does it interact with `extends`, `layers`, and the current fragment collector pipeline?
- what is the narrow public theming contract versus the full internal token space?

For now, this should be treated as a **future product/API design track**, not a missing bug fix.

## Next milestones

### 1. Finish the `reference-cli` docs as the source of truth

- keep `ARCHITECTURE.md` current with the real pipeline and composition model
- keep `LAYERS.md` current with the shipped implementation
- capture future design ideas here instead of in `reference-core`

### 2. Finalize the composition story

- keep `extends` and `layers` stable
- strengthen tests around layer scoping and downstream composition
- decide whether `extendSystem()` belongs in the public API

### 3. Remove `reference-core`

Operationally we no longer want `reference-core` to be part of the active workspace story.

Removal prep:

- remove any remaining live package/workspace/Nx wiring for `reference-core`
- remove `@reference-ui/core` compatibility paths from `reference-cli`
- sweep docs and comments that still describe `reference-core` as the active platform
- keep only migration notes that are still useful historically

Likely code cleanup targets:

- `src/config/evaluate.ts`
- `src/config/bundle.ts`
- `src/lib/paths/core-package-dir.ts`
- remaining comments/examples that mention `@reference-ui/core`

### 4. Make `reference-cli` the only active design-system platform

Definition of done:

- no active package depends on `@reference-ui/core`
- no active test/build flow requires `reference-core`
- `reference-cli` docs describe the real system without pointing back to `reference-core`
- `reference-core` can be deleted without losing required implementation knowledge

## Decision rule

When there is a choice between preserving old `reference-core` shape and making `reference-cli` clearer, prefer the clearer `reference-cli` shape.
