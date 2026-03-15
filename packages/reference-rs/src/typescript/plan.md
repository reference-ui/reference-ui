# TypeScript Scanner – Plan & Analysis

## 1. Is the current data model enough for docs?

**Partly.** It’s enough for **basic** docs:

- **We have:** symbol name, kind (interface / type alias), description (raw comment), `extends`, `underlying`, `defined_members` (name, optional, description, `type_ref`), `references`, `library`, `file_id`, export vs local.
- **Enough for:** “This is interface X from library Y, it extends Z, here are its props and their types and descriptions.”

**Gaps for “nice” docs:**

- **No generics** (see below).
- **No `readonly`** on members.
- **No distinction** for index signatures, call signatures, or method vs property.
- **TypeRef** is a subset: we have Intrinsic, Literal, Union, Reference, Unknown; we don’t model arrays (`T[]`), tuples, mapped types, conditional types, or type-parameter references; complex annotations often end up as `Unknown { summary: "..." }`.
- **Single description** only; no structured tags (e.g. `@default`, `@deprecated`, `@example`) unless you parse JSDoc downstream.

So: **yes for simple “props and types” docs**, **no for full, rich API docs** without extending the model and extraction.

---

## 2. Do we support generics?

**No.** Generics are not represented anywhere:

- **API/model:** `TsSymbol` has no `type_parameters`; `TypeRef::Reference` has no type arguments; `TsMember` has no generic info.
- **Extract:** We never read `interface_decl.type_parameters` or `type_alias.type_parameters` (Oxc’s `TSInterfaceDeclaration` and `TSTypeAliasDeclaration` both have `type_parameters: Option<Box<TSTypeParameterDeclaration>>`).
- **Emit:** Nothing is emitted for generics.

So today we don’t support things like `interface Foo<T>`, `type Bar<K,V>`, or `ComponentProps<Button>` in a first-class way. We could add support by:

- Adding `type_parameters: Vec<TsTypeParameter>` (name, constraint, default) to `TsSymbol` and the internal shell.
- Adding optional `type_arguments: Vec<TypeRef>` to `TypeRef::Reference` for `Foo<Bar>`.
- In extract, reading `type_parameters` from Oxc and, for type references, `type_arguments` from `TSTypeReference` when present.

---

## 3. Do we get a lot of TypeScript functionality from Oxc / the AST?

**Yes.** We lean on Oxc for:

- **Parsing** (TS/TSX, with errors).
- **AST:** interfaces, type aliases, property signatures, type references, unions, literals, intrinsics, `extends`, imports/exports, comments.
- **Source spans** for slicing and for leading-comment attribution.

We then **narrow** that into our own model:

- Only interfaces and type aliases (no enums, namespaces, etc.).
- A small `TypeRef` subset (intrinsic, literal, union, reference, unknown); everything else is either mapped to that or to `Unknown`.
- No generics, no type parameters, no conditional/mapped types.

So: **Oxc gives us full TS structure; we intentionally expose a subset.** Extending docs/MCP support is mostly about mapping more of the Oxc AST into our types and emission, not about replacing Oxc.

---

## 4. What would we extend for docs + MCP?

Concrete extensions that would make docs and MCP much nicer:

1. **Generics**
   - Type parameters on symbols (name, constraint, default).
   - Type arguments on `TypeRef::Reference`.
   - Emit them in the bundle so “`ComponentProps<Button>`” is visible.

2. **Richer type refs**
   - Array (`T[]` / `Array<T>`), tuple, intersection.
   - Keep a “summary” string for complex types we don’t fully model, so MCP can still show something.

3. **Member metadata**
   - `readonly`.
   - Kind: property vs method (call signature) vs index signature, so docs can render them differently.

4. **Stable, documented surface for MCP**
   - Clear schema for the JSON/JS bundle (or a small Rust struct + serde) so MCP doesn’t depend on ad-hoc shapes.
   - Optional “by-symbol” or “by-file” index for fast lookups.

5. **Optional JSDoc parsing**
   - Either in-Rust or in the consumer: parse the raw description into `@param`, `@returns`, `@deprecated`, `@example`, etc., and expose that structure so docs and MCP can show parameters, examples, and deprecation.

6. **Source locations**
   - Expose file + span (or line/column) for symbols and members so MCP can “go to definition” or link to source.

7. **Re-export / alias chain**
   - For “this type is re-exported from X” or “type Y = Z”, expose enough to show the chain so docs can say “alias of …” or “re-exported from …”.

---

## 5. Different scan directories / one bundle per scenario?

**Right now:** One `ScanRequest` (one `root_dir` + one `include` list) → one `TypeScriptBundle` → one emitted bundle (e.g. `bundle.js`). The fixture is a single scenario: `scan_here/**/*.{ts,tsx}` under one root.

**Using different folders and one bundle per scenario is a good idea:**

- **Pros:**
  - Isolate scenarios (e.g. “only UI”, “only forms”, “with generics”, “re-export only”).
  - Faster, focused tests and smaller bundles.
  - Clear naming: e.g. `scan_here/` → `bundle-scan_here.js`, `scan_forms/` → `bundle-scan_forms.js`.

- **Ways to do it:**
  1. **Multiple requests in tests:** For each scenario dir (e.g. `scan_here`, `scan_generics`), run `scan_typescript_bundle(&ScanRequest { root_dir: fixture_input_dir(), include: vec!["scan_here/**/*.ts".into()] })` and assert (and optionally write) a different output file per scenario (e.g. `output/bundle-scan_here.js`, `output/bundle-scan_generics.js`).
  2. **Single root, multiple globs:** One root, `include: ["scan_here/**/*.ts", "scan_forms/**/*.ts"]` still produces one bundle; to get one bundle per scenario you’d run one request per glob (or per “logical scenario”).
  3. **API shape:** Keep `ScanRequest` as-is (one root + one include). The “different folders → different bundles” is then: N requests, N bundles, N output files. Optionally add a small helper in tests that takes a list of `(scenario_name, include_glob)` and runs scan + emit for each and writes `output/bundle-{scenario_name}.js`.

So: **yes, use different scan directories to test different scenarios, and emit one bundle per scenario (e.g. per folder name)** by running multiple scan requests and naming the output after the scenario. No need to change the core API to support that; it’s mostly test layout and naming.
