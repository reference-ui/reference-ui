# MCP server

This document describes the intended top-level shape of the MCP server for Reference UI.

The direction is straightforward:

- the MCP server will live inside `reference-ui`
- the server will build its component inventory from Atlas
- the server will enrich those components with prop and interface data from `@reference-ui/types`
- the final MCP surface will be assembled dynamically from both sources

This is not a generic frontend research document.
It is the architecture note for the actual MCP product we want to ship.

## Goal

The MCP server should answer one practical question well:

- what components are available in this project, and what can I pass to them?

That breaks down into four concrete outputs:

- component inventory
- component usage
- component props/interfaces
- prop descriptions and type information

Atlas is responsible for the first two and for identifying the interface that belongs to a component.
`@reference-ui/types` is responsible for enriching that interface into the final prop shape the MCP serves.

## Top-level architecture

There are three pieces:

### 1. Atlas

Atlas analyzes the repo as React code.

Its job is to tell us:

- which components exist
- where they come from
- how often they are used
- which props interface each component maps to
- which components are commonly used together

Atlas should stay thin and declarative.
It is the source of truth for component inventory and usage, not the full source of truth for rich type metadata.

### 2. `@reference-ui/types`

The generated `@reference-ui/types` package already exists as the canonical typed artifact produced from the reference build.

That package is the right place to read:

- interface members
- prop types
- member descriptions
- jsdoc-derived metadata
- any other final type-level detail we want to expose in MCP

The MCP server should read from the same generated type artifact that `reference` and the bridge already rely on.
We should not invent a parallel type metadata path for MCP.

### 3. Dynamic MCP server

The MCP server composes both layers at runtime.

In simple terms:

1. Atlas gives us the list of components.
2. Atlas tells us which interface belongs to each component.
3. The server looks up that interface inside `@reference-ui/types`.
4. The server enriches the component with final prop/type/description data.
5. The server exposes the merged result through MCP tools/resources.

That means Atlas is the discovery layer, and `@reference-ui/types` is the enrichment layer.

## Data ownership

We should keep ownership clear.

### Atlas owns

- component discovery
- component source/origin
- usage counts
- examples
- co-usage
- component to interface mapping

### `@reference-ui/types` owns

- final interface member list
- prop types
- prop descriptions
- jsdoc text
- richer type rendering details

### MCP owns

- joining the two data sources
- shaping the final tool/resource payloads
- serving the final project-aware component model to the assistant

## The join point

The critical join is:

- Atlas component
  - `name`
  - `source`
  - `interfaceName`
  - `interfaceSource`

joined with:

- `@reference-ui/types` symbol/interface data
  - members
  - member types
  - member descriptions
  - symbol docs

This is the important architectural boundary.

Atlas does not need to become a full type engine.
It only needs to identify the right contract to enrich.

## Desired final MCP shape

At the top level, the MCP should be able to serve something conceptually like this per component:

```ts
type McpComponent = {
  name: string
  source: string
  usage: Usage
  usedWith: Record<string, Usage>
  examples: string[]
  interface: {
    name: string
    source: string
  } | null
  props: Array<{
    name: string
    type: string | null
    description: string | null
    usage: Usage
    values?: Record<string, Usage>
  }>
}
```

The exact wire format can change.
The important part is the assembly model:

- Atlas supplies the component shell
- `@reference-ui/types` fills in the prop details

## Prop descriptions

One specific goal is to weave description into each component prop.

That means the final prop model should include, where available:

- prop name
- prop type
- prop description
- prop usage frequency
- observed value distribution when Atlas has it

This is the level that makes the MCP genuinely useful to an assistant.

Without descriptions, we only know that a prop exists.
With descriptions, the MCP can explain what the prop is for in project terms.

## Why this split is right

This keeps each layer narrow:

- Atlas stays focused on React-aware discovery and usage
- `@reference-ui/types` stays focused on final type metadata
- the MCP server becomes the only place that needs to care about the final assistant-facing schema

That is a better separation of concerns than trying to teach Atlas to fully own type enrichment.

## What Atlas should do for MCP

For MCP purposes, Atlas is good enough when it can reliably answer:

- what components are available?
- what source does each component come from?
- what interface does each component map to?
- how much is each component used?
- what components commonly appear with it?

That is the contract the MCP needs from Atlas.

Everything else is secondary unless it improves those outputs.

## What `@reference-ui/types` should do for MCP

For MCP purposes, the generated types package is good enough when it can reliably answer:

- does this interface exist?
- what members does it have?
- what is each member's final type?
- what description or jsdoc belongs to each member?

That gives the MCP enough information to construct the real prop table for a component.

## Dynamic server behavior

The server should be dynamic in the literal sense:

- read the current Atlas output for the repo
- read the current generated type artifacts
- merge them into one project-specific MCP model
- serve that model without requiring hand-authored component registries

If the project changes, the MCP server should be able to rebuild that joined view from the latest Atlas analysis plus the latest generated type package.

## Sync and event bus integration

The MCP layer should hook into the existing sync event bus.

The important lifecycle fact is:

- Atlas can run once the reference Tasty bridge has finished building
- MCP enrichment cannot finish until the generated `@reference-ui/types` surface is ready

There are really two useful hook points in the current graph.

### Rough post-bridge completion

The existing rough event for "the reference Tasty bridge finished" is:

- `reference:complete`

That event is emitted by the reference bridge after `rebuildReferenceTastyBuild(...)` completes.
So if the question is "do we already have an event after the Tasty bridge finishes?", the answer is yes: `reference:complete`.

That makes it a valid event for work that only depends on finished Atlas-adjacent discovery inputs coming out of the reference side.

### Final types-ready barrier

The later event MCP enrichment depends on is:

- `packager-ts:complete`

That is the event that says the final generated TypeScript package surface exists.
For MCP purposes, that is the point where the server can safely read `@reference-ui/types` and join it with Atlas output.

So the intended flow is:

1. sync builds the virtual workspace and generated runtime artifacts
2. the reference bridge emits `reference:complete`
3. packager emits the final types-ready barrier via `packager-ts:complete`
4. MCP work starts from the point where both of those facts are true
5. MCP runs Atlas, reads `@reference-ui/types`, and builds the joined component model
6. MCP emits its own completion event

Conceptually, the event edge should look like:

```ts
'reference:complete' + 'packager-ts:complete' -> 'run:mcp:build'
'mcp:complete' -> 'sync:complete'
```

That ordering matters.

If MCP output is part of what `ref sync` is supposed to produce, sync should not claim completion before the MCP join has been built.
Listening to the types-ready event is correct, but leaving `sync:complete` unchanged would mean sync can finish before MCP artifacts are actually ready.

## Why the hook belongs there

The MCP server needs both sides of the join:

- Atlas inventory
- final generated type metadata

Running only from `reference:complete` would still be too early for the enrichment side.
At that point, the Tasty bridge output exists, but the final `@reference-ui/types` surface is not guaranteed to exist yet.

Running only from `packager-ts:complete` is safer, but it hides the fact that MCP conceptually depends on the completed reference bridge output too.
The clean model is that MCP sits after both:

- `reference:complete`
- `packager-ts:complete`

By using those two facts, the MCP build can stay simple:

- start once the reference bridge is complete and the final type package exists
- run Atlas
- enrich from generated types
- emit the final MCP-ready model

## Recommended MCP events

The exact names can change, but the shape should stay explicit.

Recommended additions:

- `run:mcp:build`
- `mcp:complete`
- `mcp:failed`

That keeps MCP aligned with the rest of the event graph:

- sync emits work
- MCP worker performs the join
- MCP reports success or failure back onto the bus

## Watch mode implication

This same design works in watch mode.

When a later sync pass regenerates `@reference-ui/types`, the next `packager-ts:complete` should trigger a fresh MCP rebuild.
That gives the MCP server a stable rule:

- whenever the final type surface is rebuilt, rebuild the joined MCP model too

## Practical summary for sync

For event-bus purposes, the intended ownership is:

- sync owns the build graph
- `packager-ts:complete` is the types-ready barrier
- MCP owns the final Atlas plus generated-types join
- sync should only be considered complete after MCP has finished if MCP output is part of the sync product

## Non-goals

This design does not require:

- Atlas to become the full owner of rich type metadata
- a second MCP-specific type generation pipeline
- a manually curated component registry as the primary source of truth
- broad speculative modeling of every possible React pattern before the server is useful

## Practical summary

The architecture is:

- Atlas finds the components
- Atlas tells us which interface each component uses
- `@reference-ui/types` tells us what that interface actually contains
- the MCP server joins them into the final assistant-facing component model

If we keep that boundary clean, the MCP stays simple:

- Atlas provides inventory
- generated reference types provide enrichment
- MCP provides the final shape
