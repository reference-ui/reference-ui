# Types Architecture

## Why This Exists

The current type-generation layout is doing too many unrelated jobs in one place.

Today, `packages/reference-core/src/system/types` mixes together:

- generated font registry work
- strict-token composition
- package-specific declaration patching
- system-facing orchestration concerns

That makes the type pipeline hard to reason about and encourages the wrong kind of implementation: post-emit fixes that depend on whatever declaration shape the compiler happened to output.

The main goal of this proposal is to separate public types from type-generation strategy, so we can support dynamic typing modes cleanly without crawling emitted `.d.ts` files.

---

## Problems With The Current Shape

### 1. `system/types` is not really “system types”

The folder currently contains logic for generated font registries and strict-token wiring. That is generator infrastructure, not the public system type surface.

### 2. Public API and generation strategy are mixed

`src/types` is the authored public type surface, but the generation logic that decides how consumers eventually see those types is currently hanging off the `system` side.

### 3. Strict-token handling is happening too late

The current model rewrites generated declaration output after emit. Even when the implementation is small, that is still the wrong layer. We should decide the canonical source graph before `tsgo` runs, not patch the output after it runs.

### 4. Dynamic type strategies need explicit ownership

If we want to support multiple type-generation modes over time, we need named generators with clear inputs and outputs, not one general-purpose folder that slowly accumulates special cases.

---

## Proposed Direction

Split the world into two layers:

- `src/types/public` is the authored public type API
- `src/types/generators` is the internal generation machinery

`src/system` can still invoke type generation, but it should call into a dedicated type-generator entrypoint rather than owning the generator implementation itself.

---

## Target Structure

Proposed shape:

```txt
packages/reference-core/src/types/
  public/
    index.ts
    BaseSystem.ts
    colors.ts
    strict-colors.ts
    radii.ts
    strict-radii.ts
    fonts.ts
    fontRegistry.ts
    conditions.ts
    css.ts
    primitives.ts
    props.ts
    recipe.ts
    style-prop.ts
    style-props.ts
    system-style-object.ts

  generators/
    generate.ts
    fonts.ts
    strict.ts
    shared.ts
```

Notes:

- The exact filenames can change, but the split should remain explicit.
- `public/` is authored API surface.
- `generators/` is implementation detail.
- `system/types` should go away once the move is complete.

---

## Public Types Contract

The public rule should be simple:

- whatever lives under `src/types/public` is authored public API
- `src/types/index.ts` becomes a thin barrel over that public surface
- the public API should not contain generation-orchestration code
- the public API should not depend on emitted declaration rewriting

This makes it obvious which files are safe to treat as stable authored surface and which files are generator internals.

---

## Generator Contract

`src/types/generators/generate.ts` should be the entrypoint used by the system worker / sync path.

Its job is to coordinate generation strategies, not to define public types.

At a high level:

- `fonts` generator: derive font registry artifacts from collected fragments
- `strict` generator: resolve which strict-token strategy should be active
- shared helpers: explicit file-path and package-writing utilities

The important boundary is that generators should operate on an explicit authored source graph.

They should not infer meaning from emitted declaration topology.

---

## Strategy-Based Type Generation

The long-term model should be strategy-driven.

Instead of one blob of “types generation,” we should have named strategies such as:

- `fonts`
- `colors`
- `radii`
- later: `spacing`

That does not necessarily mean each category always generates new files. It means each category has an explicit implementation point and can be composed deliberately.

---

## Strict Tokens: Preferred Direction

Strict-token support should move away from post-emit declaration rewriting.

The preferred model is:

1. keep multiple authored variants in source
2. choose the canonical variant before declaration generation
3. let `tsgo` emit declarations from that canonical source graph

Example shape:

- `colors.ts`
- `strict-colors.ts`
- `radii.ts`
- `strict-radii.ts`

If a consumer config enables strict colors, the packager should make `strict-colors` the canonical source for that generated package instead of rewriting emitted declarations later.

In other words, the switch should happen at package assembly / declaration-input time, not at declaration-output time.

---

## Why Packager-Level Switching Is Better

This is the crucial design point.

The packager already decides:

- which source files belong to the generated package
- which files are seeded into `tsgo`
- which module graph is visible to declaration generation

That is the right layer to choose between strict and non-strict authored modules.

It gives us:

- explicit source ownership
- deterministic declaration input
- no emitted-DTS probing
- no declaration-tree crawling
- no “patch whatever `.d.ts` happened to exist” logic

The packager strategy can be as simple as a switch statement keyed by config:

```ts
switch (category) {
  case 'colors':
    return strictEnabled ? 'strict-colors.ts' : 'colors.ts'
  case 'radii':
    return strictEnabled ? 'strict-radii.ts' : 'radii.ts'
}
```

The exact implementation may use aliasing, file selection, virtual staging, or generated barrels, but the principle should stay the same: choose source, do not patch output.

---

## What Still Belongs In Generators

Not every generation task is the same.

Font registry generation is still a real generator concern because it derives type information from runtime-authored fragments.

That kind of work belongs in `types/generators/fonts.ts` because it is actual generated data.

Strict-token selection is different. That is a source-selection problem, not a declaration-patching problem.

So the architecture should distinguish between:

- generated data: fonts, registries, derived augmentations
- selected source variants: strict vs non-strict colors/radii/spacing

---

## Migration Plan

### Stage 1

Document the boundary and stop adding more behavior to `system/types`.

### Stage 2

Move the current generator files out of `src/system/types` into `src/types/generators`.

Expected first move:

- `system/types/generate.ts` -> `types/generators/generate.ts`
- supporting generator files move with it

### Stage 3

Make `src/system` call the new generator entrypoint instead of owning generator implementation details.

### Stage 4

Replace strict-token post-emit rewriting with explicit packager-level source selection.

This is where strict and non-strict authored modules become the real source of truth.

### Stage 5

Delete any remaining code that crawls or patches emitted declarations for strict-token switching.

---

## Guardrails

To keep this architecture clean:

- do not crawl emitted `.d.ts` files to decide behavior
- do not infer strategy from declaration topology
- do not mix public types with generation orchestration
- do not keep strict-mode switching in `system/types`
- prefer explicit file selection over post-emit rewriting
- keep packager ownership clear when the task is “choose which authored types are canonical”

---

## Open Questions

### 1. Should `src/types/index.ts` stay as the public barrel, or should it re-export from `src/types/public/index.ts`?

Probably yes: keep `src/types/index.ts` as the stable barrel and make it a thin forwarder into `public/`.

### 2. Should strict and non-strict variants live side-by-side in `public/`, or should strict variants live under a subfolder?

Either is fine, but the naming needs to make variant ownership obvious. `strict-colors.ts` / `strict-radii.ts` is much clearer than implicit generator mutation.

### 3. Should the packager switch files directly, or generate a tiny canonical barrel per package?

Either can work. The important thing is that the switch happens before declaration emit and remains explicit.

### 4. Should colors and radii be the first two strategies?

Yes. They are the clearest current use cases and already have the strongest product motivation.

---

## Decision For Now

Before refactoring code, treat this as the target architecture:

- public authored types are one layer
- type-generation machinery is another layer
- strict-token mode selection is a packager concern
- emitted declaration crawling is not the long-term solution

That should be the baseline for the next implementation pass.