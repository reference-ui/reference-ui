# OXC `TSType` / `TSTupleElement` Audit

This file tracks how Tasty lowers OXC type nodes into the Rust `TypeRef` IR.

The goal is simple:

- every OXC `TSType` and `TSTupleElement` variant is handled deliberately
- useful data-shape constructs are modeled structurally
- harder or lower-priority constructs are preserved as `Raw { summary }`
- no variant silently falls through an implicit catch-all

## What `Raw` Means

`Raw` is an intentional IR choice, not an error state.

When a variant is left raw, Tasty still preserves the exact source slice as
`summary`. That means downstream consumers can still show the original type text
without Tasty pretending to understand more than it actually does.

Example:

- source: `type X = import('./dep').Widget`
- emitted shape: `{ kind: "raw", summary: "import('./dep').Widget" }`

## Current Status

Tasty now models more of the type surface structurally than it did in the
earlier scanner phase.

### Structured today

| Category | Lowered shape |
| --- | --- |
| Intrinsic keywords | `Intrinsic { name }` |
| Literal types | `Literal { value }` |
| References | `Reference { name, target_id, source_module, type_arguments }` |
| Unions | `Union { types }` |
| Arrays | `Array { element }` |
| Tuples | `Tuple { elements }` |
| Intersections | `Intersection { types }` |
| Object type literals | `Object { members }` |
| Indexed access | `IndexedAccess { object, index }` |
| Function types | `Function { params, return_type }` |
| Constructor types | `Constructor { abstract, type_parameters, params, return_type }` |
| Type operators | `TypeOperator { operator, target }` |
| Type queries | `TypeQuery { expression }` |
| Conditional types | `Conditional { check_type, extends_type, true_type, false_type }` |
| Mapped types | `Mapped { type_param, source_type, name_type, optional_modifier, readonly_modifier, value_type }` |
| Template literal types | `TemplateLiteral { parts }` |

### Intentionally raw today

| Variant family | Why it stays raw |
| --- | --- |
| `TSImportType` | Requires richer module/export semantics than we currently need |
| `TSInferType` | Only meaningful inside deeper conditional-type evaluation |
| `TSTypePredicate` | Better describes narrowing behavior than data shape |
| `TSThisType` | Highly context-dependent and low-value for current docs/runtime goals |
| JSDoc-only type variants | Outside the main TypeScript syntax path we model structurally |

## Full `TSType` Matrix

Below, `Raw { summary }` means the original source text is preserved exactly.

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
| `TSIntrinsicKeyword` | `Intrinsic { name }` | preserves the intrinsic keyword text |
| `TSLiteralType` | `Literal { value }` | |
| `TSUnionType` | `Union { types }` | |
| `TSArrayType` | `Array { element }` | |
| `TSTupleType` | `Tuple { elements }` | tuple metadata preserved via `TupleElement` |
| `TSIntersectionType` | `Intersection { types }` | |
| `TSTypeLiteral` | `Object { members }` | property/method/call/index/construct signatures |
| `TSParenthesizedType` | unwrap to inner type | no extra wrapper layer |
| `TSTypeReference` | `Reference` or array special-case | `Array<T>` lowers to `Array` |
| `TSNamedTupleMember` | one-element `Tuple` | when encountered as a standalone type node |
| `TSTemplateLiteralType` | `TemplateLiteral { parts }` | alternating text/type parts |
| `TSIndexedAccessType` | `IndexedAccess { object, index }` | fully structural now |
| `TSFunctionType` | `Function { params, return_type }` | callback-style types are preserved structurally |
| `TSConstructorType` | `Constructor { abstract, type_parameters, params, return_type }` | includes abstract constructors |
| `TSTypeOperatorType` | `TypeOperator { operator, target }` | currently `keyof`, `readonly`, `unique` |
| `TSTypeQuery` | `TypeQuery { expression }` | preserves `typeof ...` expression text |
| `TSConditionalType` | `Conditional { check_type, extends_type, true_type, false_type }` | structural only; no evaluation |
| `TSMappedType` | `Mapped { ... }` | structural only; no evaluation |
| `TSImportType` | `Raw { summary }` | preserved text only |
| `TSInferType` | `Raw { summary }` | preserved text only |
| `TSTypePredicate` | `Raw { summary }` | preserved text only |
| `TSThisType` | `Raw { summary }` | preserved text only |
| `JSDocNullableType` | `Raw { summary }` | JSDoc-only |
| `JSDocNonNullableType` | `Raw { summary }` | JSDoc-only |
| `JSDocUnknownType` | `Raw { summary }` | JSDoc-only |

## `TSTupleElement` Matrix

| OXC tuple-element variant | Tasty lowering | Notes |
| --- | --- | --- |
| `TSOptionalType` | `TupleElement { optional: true, rest: false, element }` | |
| `TSRestType` | `TupleElement { optional: false, rest: true, element }` | |
| `TSNamedTupleMember` | `TupleElement { label, optional, rest: false, element }` | named tuple labels preserved |
| inherited `TSType` variants | `TupleElement { label: None, optional: false, rest: false, element }` | lowered via `type_to_ref` |

## Why The Remaining Raw Cases Are Acceptable

For the current Tasty goal, the important thing is preserving useful graph shape:

- symbol identity
- member shape
- optionality
- references
- common structural type forms

For the remaining raw variants, preserving exact source text is still good enough
for:

- docs labels
- hover-ish presentation
- honest runtime inspection

without pretending we have a full evaluator for the TypeScript type-level
language.

## Confidence

This modeled surface is now covered by fixture-driven tests across:

- emitted bundle-shape tests in `tests/tasty/cases/*/bundle.test.ts`
- runtime API tests in `tests/tasty/cases/*/api.test.ts`

So this audit is no longer just aspirational design text. It reflects the
currently implemented and exercised Tasty type surface.

