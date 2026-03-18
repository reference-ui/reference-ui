# Tasty Rust

Tasty is the Rust-side TypeScript metadata pipeline in `packages/reference-rs`.
This directory owns scanning, lowering, and artifact emission.

There is also a JavaScript runtime elsewhere at `packages/reference-rs/js/tasty`.
That runtime loads the emitted artifacts lazily and exposes the graph API, but
the contract itself starts here in Rust.

The most important thing in Tasty is how OXC type nodes are lowered into the
Rust `TypeRef` IR. This README is the canonical doc for that.

## What Tasty Does

Rust Tasty:

- discovers the relevant TypeScript files
- parses them with OXC
- resolves symbols, members, and references into a normalized graph
- lowers OXC type syntax into `TypeRef`
- emits a manifest-first artifact set
- generates the raw TypeScript contract types consumed by the JS runtime

It is not trying to be another TypeScript compiler, a type evaluator, a
bundler, or the runtime graph API.

## Shape Of The Pipeline

The pipeline is:

1. discover files
2. parse with OXC
3. resolve symbol and reference structure
4. lower types into `TypeRef`
5. emit manifest and chunk artifacts
6. let the JS runtime load those artifacts on demand

The architecture split is simple:

| Layer | Role |
| --- | --- |
| OXC AST | parser-facing syntax tree |
| `model.rs` | normalized Rust IR |
| `emitted.rs` | raw emitted artifact contract |
| `packages/reference-rs/js/tasty` | lazy runtime API built on top of emitted artifacts |

If you are changing Tasty, the usual starting points are `model.rs` for the IR,
`ast/` for parsing and graph resolution, `scan.rs` for orchestration,
`generator/` for emitted artifact shape, and `emitted.rs` for the generated
contract.

## Scan Boundary

Within the scan root, Tasty maps exported interfaces and type aliases, plus the
non-exported interfaces and aliases needed to keep the graph coherent. The goal
is a usable user-owned type graph, not just a list of public names.

Tasty does not eagerly ingest all of `node_modules`. Library code is only
pulled in when the user explicitly re-exports from a package, such as
`export type { X } from 'some-library'` or `export * from 'some-library'`.
From there, Tasty follows imports within that same package, but it does not
walk arbitrary dependency trees.

## Emitted Shape

Tasty emits a manifest-first artifact set.

The manifest is a small eager module containing `version`, `symbolsByName`, and
`symbolsById`. Each symbol index entry records the symbol `id`, `name`, `kind`,
`chunk`, and whether it comes from a library.

Chunk modules hold the actual symbol payloads keyed by exported ids.

Rust also generates the raw TypeScript contract types into
`packages/reference-rs/js/tasty/generated/`. Those generated types are the
bridge between the Rust emitter and the JS runtime.

## Comments And JSDoc

Tasty captures leading comments on symbols and members in three forms:

| Field | Meaning |
| --- | --- |
| `description` | display-friendly summary |
| `descriptionRaw` | normalized comment text including tags |
| `jsdoc` | lightweight parsed JSDoc object with `summary` and flat `tags` |

This is a best-effort JSDoc pass-through layer, not a full TSDoc semantic
model.

## OXC Type Lowering

This is the core design surface.

Every OXC `TSType` and `TSTupleElement` variant should be handled deliberately.
Useful data-shape constructs are modeled structurally. Harder or lower-priority
constructs are preserved as `Raw { summary }`. Nothing should silently fall
through an implicit catch-all.

### What `Raw` Means

`Raw` is intentional, not an error state.

When a type stays raw, Tasty preserves the original source slice as `summary`.
That lets downstream consumers show the exact type text without pretending that
Tasty understands more than it actually does.

Example:

- source: `type X = import('./dep').Widget`
- emitted shape: `{ kind: "raw", summary: "import('./dep').Widget" }`

### Structurally modeled today

| Category | Lowered shape |
| --- | --- |
| intrinsic keywords | `Intrinsic { name }` |
| literal types | `Literal { value }` |
| references | `Reference { name, target_id, source_module, type_arguments }` |
| unions | `Union { types }` |
| arrays | `Array { element }` |
| tuples | `Tuple { elements }` |
| intersections | `Intersection { types }` |
| object type literals | `Object { members }` |
| indexed access | `IndexedAccess { object, index }` |
| function types | `Function { params, return_type }` |
| constructor types | `Constructor { abstract, type_parameters, params, return_type }` |
| type operators | `TypeOperator { operator, target }` |
| type queries | `TypeQuery { expression }` |
| conditional types | `Conditional { check_type, extends_type, true_type, false_type }` |
| mapped types | `Mapped { type_param, source_type, name_type, optional_modifier, readonly_modifier, value_type }` |
| template literal types | `TemplateLiteral { parts }` |

### Intentionally raw today

| Variant family | Why it stays raw |
| --- | --- |
| `TSImportType` | needs richer module and export semantics |
| `TSInferType` | only really matters with deeper type-level evaluation |
| `TSTypePredicate` | describes narrowing behavior more than data shape |
| `TSThisType` | highly context-dependent |
| JSDoc-only type variants | outside the main TypeScript syntax path we model |

### Full `TSType` matrix

`Raw { summary }` means the original source text is preserved exactly.

| OXC variant | Tasty lowering | Notes |
| --- | --- | --- |
| `TSStringKeyword` | `Intrinsic "string"` | |
| `TSNumberKeyword` | `Intrinsic "number"` | |
| `TSBooleanKeyword` | `Intrinsic "boolean"` | |
| `TSUnknownKeyword` | `Intrinsic "unknown"` | |
| `TSAnyKeyword` | `Intrinsic "any"` | |
| `TSUndefinedKeyword` | `Intrinsic "undefined"` | |
| `TSNullKeyword` | `Intrinsic "null"` | |
| `TSObjectKeyword` | `Intrinsic "object"` | |
| `TSBigIntKeyword` | `Intrinsic "bigint"` | |
| `TSSymbolKeyword` | `Intrinsic "symbol"` | |
| `TSNeverKeyword` | `Intrinsic "never"` | |
| `TSVoidKeyword` | `Intrinsic "void"` | |
| `TSIntrinsicKeyword` | `Intrinsic { name }` | preserves intrinsic keyword text |
| `TSLiteralType` | `Literal { value }` | |
| `TSUnionType` | `Union { types }` | |
| `TSArrayType` | `Array { element }` | |
| `TSTupleType` | `Tuple { elements }` | tuple metadata preserved via `TupleElement` |
| `TSIntersectionType` | `Intersection { types }` | |
| `TSTypeLiteral` | `Object { members }` | property, method, call, index, and construct signatures |
| `TSParenthesizedType` | unwrap to inner type | no extra wrapper layer |
| `TSTypeReference` | `Reference` or array special-case | `Array<T>` lowers to `Array` |
| `TSNamedTupleMember` | one-element `Tuple` | when encountered as a standalone type node |
| `TSTemplateLiteralType` | `TemplateLiteral { parts }` | alternating text and type parts |
| `TSIndexedAccessType` | `IndexedAccess { object, index }` | fully structural |
| `TSFunctionType` | `Function { params, return_type }` | callback-style types stay structural |
| `TSConstructorType` | `Constructor { abstract, type_parameters, params, return_type }` | includes abstract constructors |
| `TSTypeOperatorType` | `TypeOperator { operator, target }` | currently `keyof`, `readonly`, `unique` |
| `TSTypeQuery` | `TypeQuery { expression }` | preserves `typeof ...` expression text |
| `TSConditionalType` | `Conditional { check_type, extends_type, true_type, false_type }` | structural only, no evaluation |
| `TSMappedType` | `Mapped { ... }` | structural only, no evaluation |
| `TSImportType` | `Raw { summary }` | preserved text only |
| `TSInferType` | `Raw { summary }` | preserved text only |
| `TSTypePredicate` | `Raw { summary }` | preserved text only |
| `TSThisType` | `Raw { summary }` | preserved text only |
| `JSDocNullableType` | `Raw { summary }` | JSDoc-only |
| `JSDocNonNullableType` | `Raw { summary }` | JSDoc-only |
| `JSDocUnknownType` | `Raw { summary }` | JSDoc-only |

### `TSTupleElement` matrix

| OXC tuple-element variant | Tasty lowering | Notes |
| --- | --- | --- |
| `TSOptionalType` | `TupleElement { optional: true, rest: false, element }` | |
| `TSRestType` | `TupleElement { optional: false, rest: true, element }` | |
| `TSNamedTupleMember` | `TupleElement { label, optional, rest: false, element }` | preserves tuple labels |
| inherited `TSType` variants | `TupleElement { label: None, optional: false, rest: false, element }` | lowered via `type_to_ref` |

### Why the remaining raw cases are acceptable

For Tasty's current goal, the important thing is preserving graph shape:
symbol identity, member shape, optionality, references, and the common
structural forms that matter for docs and graph navigation.

For the remaining cases, exact source preservation is still enough for display,
hover-ish presentation, and honest runtime inspection without pretending we
have a full evaluator for the TypeScript type system.

## Status And Testing

The core Rust pipeline is in place: scanner, normalized IR, manifest and chunk
emission, generated TS contract types, and fixture-driven tests. The JS runtime
layer exists elsewhere and is also covered by runtime-facing tests.

Coverage today includes generics, signatures, unions, literals, default type
parameters, external library references, mapped types, conditional types,
template literals, type queries, type operators, JSDoc handling, raw-versus-
structural edge cases, TSX scanning, and mixed fixture scenarios.
