# TypeScript Scanner – Plan & Analysis

## Status & scope

**Done:** Generics (type parameters on symbols, type arguments on references); object type literals (`TypeRef::Object` with members); per-scenario bundles and tests (`generics`, `external_libs`, `signatures`); member description attribution (exclude interface start); libraries array includes `user`; **§4.2** richer type refs (array `T[]`/`Array<T>`, tuple, intersection); **§4.3** member metadata (`readonly`, kind: property vs method vs call vs index signature).

**Out of scope:** Source locations (§4.6) are not planned. Also not in this scope: §4.4 (MCP schema/index), §4.5 (JSDoc tag parsing), §4.7 (re-export/alias chain).

**Focus:** The scanner is focused on **the TypeScript type system itself** — capturing type shape and structure cleanly. JSDoc (e.g. `@default`, `@deprecated`) can be built on top of this later; we care about types first.

---

## 1. Is the current data model enough for docs?

**Partly.** It’s enough for **basic** docs:

- **We have:** symbol name, kind (interface / type alias), description (raw comment), `extends`, `underlying`, `defined_members` (name, optional, description, `type_ref`), `references`, `library`, `file_id`, export vs local.
- **Enough for:** “This is interface X from library Y, it extends Z, here are its props and their types and descriptions.”

**Gaps for “nice” docs:**

- **Generics** – now supported (type parameters, type arguments; see §2).
- **Readonly and member kind** – now supported (§4.3).
- **TypeRef** – we have Intrinsic, Literal, Union, Reference, Object, Array, Tuple, Intersection, Conditional, Mapped, Raw; the remaining advanced cases still end up as `Raw { summary: "..." }`.
- **Single description** only; no structured tags (e.g. `@default`, `@deprecated`, `@example`) unless you parse JSDoc downstream.

So: **yes for simple “props and types” docs**, **no for full, rich API docs** without extending the model and extraction.

---

## 2. Do we support generics?

**Yes.** Implemented:

- **API/model:** `TsSymbol` has `type_parameters: Vec<TsTypeParameter>` (name, constraint, default); `TypeRef::Reference` has optional `type_arguments: Vec<TypeRef>`.
- **Extract:** We read `interface_decl.type_parameters` and `type_alias.type_parameters`, and `type_arguments` from `TSTypeReference` when present.
- **Emit:** Type parameters and type arguments are emitted in the bundle (e.g. `ComponentProps<Button>`).

---

## 3. Do we get a lot of TypeScript functionality from Oxc / the AST?

**Yes.** We lean on Oxc for:

- **Parsing** (TS/TSX, with errors).
- **AST:** interfaces, type aliases, property signatures, type references, unions, literals, intrinsics, `extends`, imports/exports, comments.
- **Source spans** for slicing and for leading-comment attribution.

We then **narrow** that into our own model:

- Only interfaces and type aliases (no enums, namespaces, etc.).
- A `TypeRef` subset: intrinsic, literal, union, reference, object (type literal), array, tuple, intersection, conditional, mapped, raw; plus generics. The remaining advanced cases still become `Raw`.

So: **Oxc gives us full TS structure; we intentionally expose a subset.** Extending docs/MCP support is mostly about mapping more of the Oxc AST into our types and emission, not about replacing Oxc.

**Capturing type data cleanly:** Within interfaces and type aliases we aim to represent TS type structure faithfully:

- **Captured today:** Intrinsics, literals, unions, references (with type args), object type literals (with members), arrays, tuples (element types), intersections. On members: optional, readonly, kind (property / method / call / index). On symbols: type parameters (name, constraint, default). Optional tuple elements and rest are currently reduced to their inner type (we keep the type, drop the optional/rest marker). Named tuple labels (e.g. `[name: string, age: number]`) are not yet preserved.
- **Still become Raw (with source summary):** Mapped types, conditional types, `import()` types, `infer` — we keep the source slice as `summary` so “this exists” is visible; full structure would require a larger model.
- **Done (improvements):** (1) Tuple elements are structured: `TupleElement { label?, optional, rest, element }`; named tuple labels, optional and rest flags are emitted. (2) Construct signatures are extracted: member name `[new]`, kind `construct`. (3) Parenthesized types are unwrapped so `(string)` is emitted as intrinsic `string`. (4) Everything else stays Raw with source summary.

---

## 4. What would we extend for docs + MCP?

**Done (in this scope):** (1) Generics – type parameters on symbols, type arguments on references, emitted in bundle. Object type literals added to type refs.

**Done in this work:** (2) Richer type refs (§4.2)
   - Array (`T[]` / `Array<T>`), tuple, intersection.
   - Keep a “summary” string for complex types we don’t fully model.

3. **Member metadata** (§4.3)
   - `readonly`.
   - Kind: property vs method (call signature) vs index signature.


**Out of scope (this work):** (4) MCP schema/index, (5) JSDoc tag parsing, (6) source locations (purposely left out), (7) re-export/alias chain.

---

## 5. Different scan directories / one bundle per scenario?

**Done.** We use one `ScanRequest` per scenario; Vitest globalSetup runs the native addon per scenario dir (`generics`, `external_libs`, `signatures`, etc.) and writes `output/{scenario}/bundle.js`. Tests load and assert per scenario. API stays one root + one include per request; N scenarios → N requests → N bundles.

---

## 6. Coverage assessment

**Good coverage for the stated goal** (driving TypeScript API docs for users’ own folders):

- **Symbols:** Interfaces and type aliases only; generics (params + args) fully supported.
- **TypeRef:** Intrinsics, literals, unions, arrays, tuples, intersections, references, object literals; everything else → `Raw` with a summary.
- **Members:** Properties (optional, readonly), method signatures, call signatures, index signatures, construct signatures; leading-comment descriptions.
- **Tuples:** Element shape includes optional, rest, and optional label (named tuple).
- **Test scenarios:** `generics` (type params/args, object literals), `external_libs` (node_modules resolution, extends, descriptions), `signatures` (readonly, method/call/index/construct, array/tuple with element metadata, parenthesized unwrap).

**Intentional / acceptable gaps:**

- **Out of scope:** JSDoc tags, source locations, re-export/alias chains.
- **Advanced types:** Mapped and conditional types remain `Raw` with summary (enough for “this exists” in docs).
- **Enums / namespaces:** Not in scope (interfaces and type aliases only).

**Possible next steps (only if needed):** Enums, or further TS type variants.

**Oxc exhaustiveness:** Every `TSType` and `TSTupleElement` variant is handled explicitly (no catch-all). See `OXC_TYPE_AUDIT.md` for the full checklist. New Oxc variants will cause a compile error until an arm is added.

---

## 7. Test coverage (TS scenarios)

**Scenarios and what they cover:**

| Scenario          | Coverage |
|-------------------|----------|
| `generics`        | Type parameters, type arguments, constraints, object type literals, member descriptions, re-exports. |
| `external_libs`   | node_modules resolution, extends, external refs (csstype, json-schema), descriptions, library metadata. |
| `signatures`      | readonly, optional, kind (property/method/call/index/construct), array, tuple (with label/optional/rest per element), intersection, parenthesized unwrap. |
| `unions_literals` | Union types, literal types (string/number), optional members. |
| `tsx`             | .tsx file scanning, interfaces and type aliases from TSX. |
| `default_params` | Type parameters with default (e.g. `T = string`). |
| `unknown_complex` | Mixed advanced types: mapped + conditional structural, nested unsupported pieces may still be `Raw`. |

**Vitest:** Each scenario has a matching `bundle.{scenario}.test.ts` that loads `output/{scenario}/bundle.js` and asserts shape and content. globalSetup emits one bundle per scenario directory under `tests/tasty/input/`.
