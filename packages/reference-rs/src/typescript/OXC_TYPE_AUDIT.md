# Oxc TSType / TSTupleElement audit

Every Oxc `TSType` and `TSTupleElement` variant is handled explicitly so nothing slips through to an implicit fallback. Unmodeled variants become `TypeRef::Unknown { summary: source_slice }`.

---

## Why we leave some variants as Unknown

**Our goal:** Drive API docs from users’ interfaces and type aliases — i.e. “this is the type of this property/member” and “this type alias expands to this shape.” We focus on **data shape**: names, optionality, unions, tuples, references, object literals. We do not implement a full type-level language or resolve values.

**What “Unknown” means:** We still **capture** the type: we store the **source slice** (the exact text in the file) as `summary`. So we never drop information — we just don’t parse it into a structured form. Docs can show “type: `Foo<K>`” or “type: `typeof config`” as opaque strings if needed.

**Will this affect us?**

- **For the stated goal (props-and-types docs):** **No.** When a member has type “conditional” or “function” or “typeof x”, we emit `Unknown { summary: "..." }`. Consumers see that the member has a type and can display the source (e.g. in a tooltip). We don’t need to evaluate conditional types or resolve `typeof` to generate “this prop exists and here’s its type label.”
- **If we later want** to resolve `typeof x` to a full type, or show the resolved shape of `Partial<T>`, or represent function signatures in a structured way, we would add handling for those variants. Until then, Unknown + summary is an explicit, documented choice.

**Why each category is Unknown:**

| Category | Variants | Reason we don’t model them (yet) |
|----------|----------|-----------------------------------|
| **Type-level computation** | Conditional, Mapped, Template literal | These are type-level expressions (e.g. `T extends U ? A : B`, `{ [K in keyof T]: ... }`, `` `foo-${T}` ``). Fully representing them would require resolving type params and executing the “type algebra.” We only need “there is a type here” and the source text for docs. |
| **Value-dependent types** | Type query (`typeof x`), Type predicate (`x is T`) | `typeof x` depends on the value `x`; we don’t have a value environment. Type predicates are assertion shapes, not data shapes. We keep the source so the doc can show “type: typeof config” or “x is string.” |
| **Callable shapes** | Function type, Constructor type | We care about **object shape** (properties, index sigs, call/construct *signatures* on interfaces). A bare `(x: T) => R` in a type alias is a function type, not an interface member; we don’t model function parameters/return in our TypeRef. Call/construct *signatures* on interfaces are already modeled as members. |
| **Operators & keywords** | Type operator (`keyof`, `readonly`), This type | `keyof T` / `readonly T` are type operators; representing them would mean parsing their operand and possibly resolving. `this` is a polymorphic type; we’d need context. Source slice is enough to show “keyof T” or “this” in docs. |
| **Module/value references** | Import type (`import('pkg')`) | We could resolve the module and expose its export type; that’s a larger feature. For now we preserve the source so docs can show “type: import('react').FC”. |
| **Indexed access** | `T[K]` | We could represent as “reference to property K of T,” but that would require a small structured form and resolution. Source slice is sufficient for “type: Props['theme']”. |
| **Infer** | `infer X` (inside conditional types) | Only meaningful inside conditional types, which we don’t evaluate. Keeping summary is consistent. |
| **JSDoc-only** | JSDocNullableType, JSDocNonNullableType, JSDocUnknownType | These come from JSDoc comments, not from TS syntax we parse for interfaces/type aliases. We don’t parse JSDoc tags; representing them would be a separate JSDoc layer. |

So: we are **intentionally** not modeling these variants as structured types. We are **not** dropping them — they all become `Unknown { summary: source_slice }`. The audit below lists every variant and its outcome; the match is exhaustive so new Oxc variants force us to decide.

---

## TSType (37 variants)


| Variant                 | Handling                                   | Notes                                                        |
| ----------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| `TSStringKeyword`       | → `Intrinsic "string"`                     |                                                              |
| `TSNumberKeyword`       | → `Intrinsic "number"`                     |                                                              |
| `TSBooleanKeyword`      | → `Intrinsic "boolean"`                    |                                                              |
| `TSUnknownKeyword`      | → `Intrinsic "unknown"`                    |                                                              |
| `TSAnyKeyword`          | → `Intrinsic "any"`                        |                                                              |
| `TSUndefinedKeyword`    | → `Intrinsic "undefined"`                  |                                                              |
| `TSNullKeyword`         | → `Intrinsic "null"`                       |                                                              |
| `TSObjectKeyword`       | → `Intrinsic "object"`                     |                                                              |
| `TSBigIntKeyword`       | → `Intrinsic "bigint"`                     |                                                              |
| `TSSymbolKeyword`       | → `Intrinsic "symbol"`                     |                                                              |
| `TSNeverKeyword`        | → `Intrinsic "never"`                      |                                                              |
| `TSVoidKeyword`         | → `Intrinsic "void"`                       |                                                              |
| `TSIntrinsicKeyword`    | → `Intrinsic` with slice_span name         | TS 5.9+ intrinsic string manipulation                        |
| `TSLiteralType`         | → `Literal { value }`                      |                                                              |
| `TSUnionType`           | → `Union { types }`                        |                                                              |
| `TSArrayType`           | → `Array { element }`                      |                                                              |
| `TSTupleType`           | → `Tuple { elements }`                     | elements are `TupleElement` (label, optional, rest, element) |
| `TSIntersectionType`    | → `Intersection { types }`                 |                                                              |
| `TSTypeLiteral`         | → `Object { members }`                     | property/method/call/index/construct signatures              |
| `TSParenthesizedType`   | unwrap → inner type                        |                                                              |
| `TSTypeReference`       | → `Reference` or `Array` (if `Array<T>`)   |                                                              |
| `TSNamedTupleMember`    | → `Tuple { elements: [one TupleElement] }` | when used as a standalone type                               |
| `TSConditionalType`     | → `Unknown { summary }`                    |                                                              |
| `TSMappedType`          | → `Unknown { summary }`                    |                                                              |
| `TSTemplateLiteralType` | → `Unknown { summary }`                    |                                                              |
| `TSImportType`          | → `Unknown { summary }`                    | `import('module')`                                           |
| `TSIndexedAccessType`   | → `Unknown { summary }`                    | `T[K]`                                                       |
| `TSInferType`           | → `Unknown { summary }`                    | `infer X`                                                    |
| `TSConstructorType`     | → `Unknown { summary }`                    | `new (...args) => T`                                         |
| `TSFunctionType`        | → `Unknown { summary }`                    | `(x: T) => R`                                                |
| `TSTypeOperatorType`    | → `Unknown { summary }`                    | e.g. `keyof`, `readonly`                                     |
| `TSTypePredicate`       | → `Unknown { summary }`                    | `x is T`                                                     |
| `TSTypeQuery`           | → `Unknown { summary }`                    | `typeof x`                                                   |
| `TSThisType`            | → `Unknown { summary }`                    | `this`                                                       |
| `JSDocNullableType`     | → `Unknown { summary }`                    | JSDoc-only                                                   |
| `JSDocNonNullableType`  | → `Unknown { summary }`                    | JSDoc-only                                                   |
| `JSDocUnknownType`      | → `Unknown { summary }`                    | JSDoc-only                                                   |


## TSTupleElement (tuple-element-specific + inherited TSType)


| Variant                   | Handling                                                                | Notes                                             |
| ------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| `TSOptionalType`          | → `TupleElement { optional: true, rest: false, element }`               |                                                   |
| `TSRestType`              | → `TupleElement { optional: false, rest: true, element }`               |                                                   |
| `TSNamedTupleMember`      | → `TupleElement { label, optional, rest: false, element }`              |                                                   |
| Inherited TSType variants | → `TupleElement { label: None, optional: false, rest: false, element }` | `element` from `type_to_ref` on transmuted TSType |


All other tuple-element variants (e.g. `TSStringKeyword` inside a tuple) are handled by the `_` arm that transmutes to `TSType` and calls `type_to_ref`, then wraps in a default `TupleElement`.

## Summary

- **Fully modeled:** intrinsics (including bigint, symbol, never, void, intrinsic), literal, union, array, tuple (with element metadata), intersection, object type literal, parenthesized (unwrapped), type reference, named tuple member as type. These cover the data shapes we need for “props and types” docs.
- **Intentionally Unknown:** conditional, mapped, template literal, import type, indexed access, infer, constructor type, function type, type operator, type predicate, type query, this type, JSDoc types. All emit `Unknown { summary: source_slice }` — see “Why we leave some variants as Unknown” above. This does not block our current goal; we can add structured handling later if we need it.
- **No implicit catch-all:** the `type_to_ref` match is exhaustive; any new variant added by Oxc will cause a compile error until we add an arm and document it here.

