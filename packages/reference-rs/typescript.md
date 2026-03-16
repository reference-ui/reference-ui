# TypeScript Scanner Plan

This document outlines a proposed Rust-side `typescript` module for
`@reference-ui/rust`.

The module is not intended to become a full TypeScript typechecker. Its purpose
is to act as a very fast structural scanner over a user's TypeScript source so
Reference UI can:

1. generate documentation views such as API/type tables
2. expose discovered type information through MCP

The Rust side should focus on scanning, indexing, normalization, and reference
tracking. Higher-level presentation, filtering, and query UX can stay in the JS
or MCP layers.

## Goals

- scan a repo from one or more glob patterns
- parse TypeScript and TSX quickly
- extract named type information into a stable graph
- preserve relationships between types instead of flattening everything into
  disconnected objects
- return data detailed enough for docs and MCP consumers
- distinguish between what a type defines locally and what it inherits or
  extends

## Non-Goals

- full TypeScript semantic checking
- replacing `tsc`
- evaluating runtime JavaScript behavior
- perfect inference of every advanced generic edge case in a first version
- rendering final documentation inside Rust

## Proposed Module

Create a new Rust module at `src/typescript`.

Suggested initial layout:

- `src/typescript/mod.rs`
- `src/typescript/scan.rs`
- `src/typescript/glob.rs`
- `src/typescript/parse.rs`
- `src/typescript/index.rs`
- `src/typescript/model.rs`
- `src/typescript/serialize.rs`
- `src/typescript/tests.rs`
- `src/typescript/README.md`

The outer package can also keep this top-level planning document as the source
of truth for the first implementation pass.

## Core Idea

The scanner should produce a structured type graph, not just a list of plain
objects.

That graph should function like an ESM-friendly bundle of type metadata:

- each discovered symbol gets a stable ID
- each symbol records where it came from
- symbols reference other symbols by ID
- external references are preserved inside the bundle, not discarded

This makes the output usable for both:

- documentation generation, where we want clean tables and inheritance views
- MCP exposure, where we want navigable structured data with cross-links

The bundle should be self-contained and self-sufficient. A consumer should not
need to reopen the user's repo or perform a second resolution pass just to
understand the scanned type graph at a useful level of detail.

## Output Shape

The right mental model is:

- a bundle
- containing modules
- containing exported and local symbols
- connected by references

Suggested top-level shape:

```ts
type TypeScriptBundle = {
  version: 1
  rootDir: string
  entryGlobs: string[]
  files: Record<FileId, TsFile>
  symbols: Record<SymbolId, TsSymbol>
  exports: Record<ModuleSpecifier, ExportMap>
  diagnostics: ScannerDiagnostic[]
}
```

Key design point: `symbols` should be the canonical registry. Everything else
should point into it.

The bundle should also carry enough normalized data to stand on its own:

- file and module metadata for where symbols came from
- declaration and member data for user-owned symbols
- normalized reference nodes for unresolved or external symbols
- enough textual summaries to render useful docs even when a reference cannot be
  fully resolved

## Symbol Model

We likely need more than one symbol kind. Initial support should focus on the
shapes most valuable for docs and MCP:

- `interface`
- `type_alias`
- `enum`
- `class`
- `function`
- `const`
- `namespace`

Each symbol should include:

- `id`
- `name`
- `kind`
- `file_id`
- `exported`
- `declared_at`
- `js_doc`
- `type_params`
- `references`

For type-like symbols, we also need a shape that separates local definition from
inherited structure.

Example:

```ts
type TypeShape = {
  definedMembers: MemberId[]
  extends: TypeRef[]
  implements?: TypeRef[]
  callSignatures?: Signature[]
  indexSignatures?: IndexSignature[]
  union?: TypeRef[]
  intersection?: TypeRef[]
  underlying?: TypeRef
}
```

This is important for a case like `ButtonProps extends StyleProps`:

- docs should show `ButtonProps`-owned members separately
- docs should show `StyleProps` under an `extends` section
- MCP should be able to follow the `StyleProps` reference directly

## Type References

The scanner should not try to stringify everything too early.

Instead, represent type references as structured nodes:

```ts
type TypeRef =
  | { kind: 'intrinsic'; name: string }
  | { kind: 'literal'; value: string | number | boolean | null }
  | { kind: 'array'; element: TypeRef }
  | { kind: 'tuple'; elements: TypeRef[] }
  | { kind: 'union'; types: TypeRef[] }
  | { kind: 'intersection'; types: TypeRef[] }
  | { kind: 'object'; members: InlineMember[] }
  | { kind: 'function'; signature: Signature }
  | { kind: 'reference'; name: string; targetId?: SymbolId; typeArgs?: TypeRef[] }
  | { kind: 'type_operator'; operator: 'keyof' | 'readonly' | 'unique'; target: TypeRef }
  | { kind: 'type_query'; expression: string }
  | { kind: 'template_literal'; parts: Array<{ kind: 'text'; value: string } | { kind: 'type'; value: TypeRef }> }
  | { kind: 'indexed_access'; object: TypeRef; index: TypeRef }
  | { kind: 'mapped'; summary: string }
  | { kind: 'conditional'; summary: string }
  | { kind: 'unknown_source'; summary: string }
```

That gives us a pragmatic split:

- preserve rich structure where it is straightforward
- fall back to normalized summaries for harder constructs
- keep enough detail for docs and MCP without blocking on full typechecking

## Clean Separation For Docs

For documentation, the most important split is:

- what this symbol defines
- what this symbol extends or references

For interfaces and object-like aliases, we should preserve:

- locally declared properties
- inherited parents
- whether each property is required or optional
- property type
- property docs
- default-value metadata if we can infer it later

Example normalized output:

```ts
type InterfaceSymbol = {
  kind: 'interface'
  name: 'ButtonProps'
  extends: [{ kind: 'reference', name: 'StyleProps', targetId: 'sym:style-props' }]
  definedMembers: [
    {
      name: 'size'
      optional: true
      type: { kind: 'union', types: [{ kind: 'literal', value: 'sm' }, { kind: 'literal', value: 'lg' }] }
    }
  ]
}
```

That shape is clean enough for:

- docs tables
- inheritance sidebars
- MCP queries like "show me all own props" vs "show me inherited props"

## Scan Pipeline

Suggested high-level flow:

1. expand glob patterns against the user's repo
2. normalize file paths and module IDs
3. parse TypeScript or TSX into ASTs
4. walk declarations and collect symbol shells
5. build cross-file references and export maps
6. normalize members, extends clauses, signatures, and aliases
7. serialize the result as a stable bundle

This should be designed as a multi-stage pipeline internally so we can keep the
scanner maintainable and add more precision over time.

## Repo Scanning

The scanner should take its source-file scope from the user's Reference UI
config, specifically `ui.config.ts` `include`.

Example from `reference-docs` today:

```ts
export default defineConfig({
  include: ['src/**/*.{ts,tsx,mdx}'],
})
```

For the TypeScript scanner, that input should be narrowed to TypeScript-relevant
files such as `.ts` and `.tsx`.

The Rust entrypoint should likely receive a normalized scan request derived from
that config, something like:

```ts
type ScanRequest = {
  rootDir: string
  include: string[]
  exclude?: string[]
  tsconfigPath?: string
}
```

Important questions for the scanner:

- do we respect `tsconfig` path aliases?
- do we scan only source files or also generated declaration files?
- do we include `node_modules` declarations when a symbol extends an external
  type?

My recommendation for v1:

- scan only user-owned files matched from `ui.config.ts` `include`
- filter that set down to TypeScript source inputs for this scanner
- exclude `node_modules`, build output, and hidden tool directories by default
- do a full sweep of the matched repo surface on each scan
- preserve external references inside the bundle even when we do not scan their
  full source
- keep the scanner one-bundle-per-scan for now, and benchmark later before
  designing incremental indexing

That gives us useful output without turning v1 into a full ecosystem indexer.

## Parsing Strategy

Rust should own the fast parse and AST walk. The likely direction is to use a
Rust parser that handles TS and TSX well and is friendly to large repo scans.

The scanner needs to understand:

- interfaces
- type aliases
- extends and implements
- import and export statements
- re-exports
- JSDoc/TSDoc comments where available
- generic parameters
- literal unions and object types

It does not need full checker-level symbol resolution on day one.

## Resolution Strategy

There are really two kinds of references:

- local/internal references we can link precisely
- external references we may only partially resolve structurally

For each reference we should try to capture:

- display name
- source module if known
- local symbol ID if resolved
- whether it is external, unresolved, or ambiguous
- a normalized summary shape when full structural expansion is not possible

This is enough for docs and MCP to be honest about confidence levels.

When an external symbol cannot be fully scanned, the bundle should still contain
a useful placeholder or external-symbol record so the bundle remains
self-sufficient.

## Why A Bundle Instead Of Plain Objects

Plain disconnected objects will make it hard to answer questions like:

- where did this type come from?
- what does it extend?
- which other types reference it?
- can I jump from a prop type to its source declaration?

A bundle with shared symbol IDs makes those operations cheap and composable.

It also maps more naturally to MCP, where a consumer may want:

- a symbol by ID
- exports for a file
- inheritance chain for a symbol
- owned members vs inherited members

Most importantly, it lets a consumer answer these questions from the bundle
alone without needing the source tree to still be present.

## JS Boundary

Rust should return a structured plain-data payload over N-API.

That payload should avoid Rust-specific concepts and be easy for JS to:

- cache
- filter
- render into docs
- expose through MCP responses

Even if the internal Rust model is richer, the JS-facing output should be plain
serializable objects. The "bundle" concept still works here because it is just a
plain object graph with explicit IDs and references.

Rust should do the normalization work centrally so the TypeScript-facing output
is already useful and readable before JS touches it. JS should not need to
reconstruct core type relationships or clean up low-level AST details.

That plain-data payload should also be self-sufficient enough to persist, cache,
ship to docs generation, or expose through MCP without requiring a fresh repo
scan just to answer ordinary symbol questions.

## MCP Use Cases

The bundle should support MCP use cases such as:

- "show me the exported types from this module"
- "show me the full structure of `ButtonProps`"
- "what does `ButtonProps` extend?"
- "list all symbols that reference `StyleProps`"
- "give me a docs-ready summary of this exported component type"

This means we should bias the representation toward queryability, not only human
readability.

## Documentation Use Cases

The docs layer should be able to derive:

- API tables
- property tables
- inheritance summaries
- exported type indexes
- "defined here" vs "inherited from" sections

The Rust scanner does not need to render those views, but it must preserve the
right distinctions to make them possible.

## Suggested First Milestone

The first milestone should deliberately be narrow.

Recommended scope:

- scan files matched by glob
- collect exported interfaces and type aliases
- capture JSDoc on exported declarations
- resolve internal references where possible
- preserve `extends` clauses
- capture object members for interfaces and object-like aliases
- return one bundle object to JS

That would already unlock useful documentation and MCP experiments.

## Suggested Second Milestone

After v1 works, expand into:

- re-export following
- class and function types
- enum support
- generic constraint modeling
- path alias resolution
- reverse-reference indexing
- richer declaration and docs metadata

## Current Decisions

- scan scope should come from `ui.config.ts` `include`
- the TypeScript scanner should narrow that set to TypeScript-relevant files
- Rust should own normalization so the returned objects are already useful to JS
- the scanner should aim for a full sweep of the matched repo surface
- v1 should return one bundle per scan
- the bundle should be self-contained and self-sufficient for docs and MCP use

## Open Questions

- should symbol IDs be path-based, content-based, or stable synthetic IDs?

## Recommendation

Build `src/typescript` as a fast structural type indexer that returns a
reference-rich, self-contained bundle to JS.

Do not aim for full checker parity up front.

If the scanner can reliably answer:

- what symbols exist
- what kind of type each symbol is
- what each symbol defines locally
- what each symbol extends or references
- where each symbol came from

then it will already be useful for both documentation and MCP.
