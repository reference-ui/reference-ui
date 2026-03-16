# Oxc TSType / TSTupleElement audit

Every Oxc `TSType` and `TSTupleElement` variant is handled explicitly so nothing slips through to an implicit fallback. Unmodeled variants become `TypeRef::Raw { summary: source_slice }`.

---

## Why we leave some variants as Raw

**Our goal:** Drive API docs from users’ interfaces and type aliases — i.e. “this is the type of this property/member” and “this type alias expands to this shape.” We focus on **data shape**: names, optionality, unions, tuples, references, object literals. We do not implement a full type-level language or resolve values.

**What “Raw” means:** We still **capture** the type: we store the **source slice** (the exact text in the file) as `summary`. So we never drop information — we just don’t parse it into a structured form. Docs can show “type: `Foo<K>`” or “type: `typeof config`” as opaque strings if needed.

**Definition:** `Raw` means we parsed the AST variant successfully, but we are preserving the original type expression as source text instead of lowering it into structured `TypeRef`. `Raw` is not an error state. `Raw` is not parser uncertainty. `Raw` is an intentional IR choice.

**What is `summary` in our context?**  
`summary` is the **exact substring of the TypeScript source file** for that type — we take the AST node’s span (start/end character offsets) and slice it out of the file. So we **pass the type through as text**: we don’t resolve it or turn it into our structured `TypeRef`, but we do preserve it. In the emitted bundle you get `kind: "raw", summary: "<that text>"`.  

Example: if the source has `theme: Props['theme']`, the member’s type is `TSIndexedAccessType`. We emit `Raw { summary: "Props['theme']" }`. So yes — we pass through the type expression as a string. Downstream (docs UI, tooltips) can display it as-is; we just don’t represent it as a structured reference + key.

**Will this affect us?**

- **For the stated goal (props-and-types docs):** **No.** When a member has a still-raw type, we emit `Raw { summary: "..." }`. Consumers still see the type text (e.g. in a tooltip). We do not need to evaluate those expressions to generate “this prop exists and here’s its type label.”
- **If we later want** to resolve `typeof x` to a full type, or fully evaluate mapped/conditional types, we would add more handling. For now, conditionals and mapped types are modeled structurally, while the harder remaining cases still use Raw + summary.

**Why each category is Raw:**

| Category | Variants | Reason we don’t model them (yet) |
|----------|----------|-----------------------------------|
| **Type-level computation** | — | Conditional and mapped types are now modeled structurally without evaluation. The remaining heavier raw cases are listed below. |
| **Value-dependent types** | Type predicate (`x is T`) | **Type query is now modeled** as `TypeRef::TypeQuery { expression }` with the queried expression preserved as source text; we still do not resolve values. Type predicates remain assertion shapes rather than data shapes, so they stay Raw and are low priority for docs. |
| **Callable shapes** | Function type | **Function type** is now modeled when it appears as a property type (e.g. callback props): we emit `TypeRef::Function { params, return_type }` so we can document the callback signature. Call/construct *signatures* on interfaces are already modeled as members, and bare constructor types are now modeled separately as `TypeRef::Constructor { abstract, type_parameters, params, return_type }`. |
| **Operators & keywords** | This type | **Type operators are now modeled** as `TypeRef::TypeOperator { operator, target }` for `keyof`, `readonly`, and `unique`. `this` remains context-dependent, so it stays Raw and low priority. |
| **Module/value references** | Import type (`import('pkg')`) | We could resolve the module and expose its export type; that’s a larger feature. For now we preserve the source so docs can show “type: import('react').FC”. |
| **Indexed access** | — | We now support it: `TypeRef::IndexedAccess { object, index }`; object and index are full type refs (e.g. reference to `User` + literal `'name'`). |
| **Infer** | `infer X` (inside conditional types) | Conditional types are now structural, but `infer` is still only meaningful semantically inside them. Keeping `infer` Raw inside those branches is consistent. |
| **JSDoc-only** | JSDocNullableType, JSDocNonNullableType, JSDocUnknownType | These come from JSDoc comments, not from TS syntax we parse for interfaces/type aliases. We don’t parse JSDoc tags; preserving them as Raw would be a separate JSDoc layer. |

So: we are **intentionally** not modeling these variants as structured types. We are **not** dropping them — they all become `Raw { summary: source_slice }`. The audit below lists every variant and its outcome; the match is exhaustive so new Oxc variants force us to decide.

---

## TSType (37 variants)

Below, “→ Raw { summary }” means: we emit `TypeRef::Raw` with `summary` set to the **source slice** (the exact type text from the file). We pass that text through; we don’t parse it into a structured form.

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
| `TSTemplateLiteralType` | → `TemplateLiteral { parts }`              | alternating text/type parts; no evaluation                   |
| `TSIndexedAccessType`   | → `IndexedAccess { object, index }`         | `T[K]` — object type and index type (key) fully modeled       |
| `TSFunctionType`         | → `Function { params, return_type }`        | `(x: T) => R` — params (name, optional, typeRef), returnType; used for callback properties so we can document the signature. |
| `TSConstructorType`     | → `Constructor { abstract, type_parameters, params, return_type }` | `new (...args) => T` or `abstract new (...args) => T` |
| `TSTypeOperatorType`    | → `TypeOperator { operator, target }`     | `keyof`, `readonly`, `unique`                                |
| `TSTypeQuery`           | → `TypeQuery { expression }`              | `typeof x` — expression preserved without resolution         |
| `TSConditionalType`     | → `Conditional { check_type, extends_type, true_type, false_type }` | structural only; no evaluation |
| `TSMappedType`          | → `Mapped { type_param, source_type, name_type?, optional_modifier, readonly_modifier, value_type? }` | structural only; no evaluation |
| `TSImportType`          | → `Raw { summary }`                        | `import('module')`                                           |
| `TSInferType`           | → `Raw { summary }`                        | `infer X`                                                    |
| `TSTypePredicate`       | → `Raw { summary }`                        | `x is T`                                                     |
| `TSThisType`            | → `Raw { summary }`                        | `this`                                                       |
| `JSDocNullableType`     | → `Raw { summary }`                        | JSDoc-only                                                   |
| `JSDocNonNullableType`  | → `Raw { summary }`                        | JSDoc-only                                                   |
| `JSDocUnknownType`      | → `Raw { summary }`                        | JSDoc-only                                                   |


## TSTupleElement (tuple-element-specific + inherited TSType)


| Variant                   | Handling                                                                | Notes                                             |
| ------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------- |
| `TSOptionalType`          | → `TupleElement { optional: true, rest: false, element }`               |                                                   |
| `TSRestType`              | → `TupleElement { optional: false, rest: true, element }`               |                                                   |
| `TSNamedTupleMember`      | → `TupleElement { label, optional, rest: false, element }`              |                                                   |
| Inherited TSType variants | → `TupleElement { label: None, optional: false, rest: false, element }` | `element` from `type_to_ref` on transmuted TSType |


All other tuple-element variants (e.g. `TSStringKeyword` inside a tuple) are handled by the `_` arm that transmutes to `TSType` and calls `type_to_ref`, then wraps in a default `TupleElement`.

## Summary

- **Fully modeled:** intrinsics (including bigint, symbol, never, void, intrinsic), literal, union, array, tuple (with element metadata), intersection, object type literal, parenthesized (unwrapped), type reference, **indexed access** (`T[K]` with object + index), **function type** (`(params) => returnType` with param names, optionality, and types for callback properties), **constructor type** (`Constructor { abstract, type_parameters, params, return_type }`), **type operators** (`keyof`, `readonly`, `unique` as `TypeOperator { operator, target }`), **type query** (`typeof x` as `TypeQuery { expression }`), **conditional** (`Conditional { check_type, extends_type, true_type, false_type }`), **mapped** (`Mapped { type_param, source_type, name_type?, optional_modifier, readonly_modifier, value_type? }`), **template literal** (as `TemplateLiteral { parts }` with alternating text/type segments), named tuple member as type. These cover the data shapes we need for “props and types” docs.
- **Intentionally Raw:** import type, infer, type predicate, this type, JSDoc types. All emit `Raw { summary: source_slice }` — see “Why we leave some variants as Raw” above. This does not block our current goal; we can add structured handling later if we need it.
- **No implicit catch-all:** the `type_to_ref` match is exhaustive; any new variant added by Oxc will cause a compile error until we add an arm and document it here.

---

## Planned structured variants (remaining)

There are no additional agreed “small structured wins” queued in this audit right now. Remaining Raw cases are the more semantic/heavier ones: import type, infer, type predicate, this type, and JSDoc variants.

### Lower-priority remaining Raw variants

- `TSInferType`: not useful on its own; it only really pays off if we later want richer conditional-type explanation semantics.
- `TSTypePredicate`: usually not useful for our current docs goal because `x is T` describes narrowing behavior more than data shape.
- `TSThisType`: low-value and highly context-sensitive; representing `this` structurally would not add much on its own.

