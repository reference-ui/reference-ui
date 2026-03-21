# Tasty Refactor Plan

The functionality is there. The pipeline works. This is purely about making the
Rust crate clean, tight, and pleasant — breaking big files into focused modules,
killing duplication, and finding the natural seams.

### Status (as of last pass)

| §   | Topic                         | Status |
| --- | ----------------------------- | ------ |
| 1–4 | Dedup + literal inference     | **Done** |
| 5   | Split resolver `type_ref`     | **Done** (`resolver/resolve.rs`, `instantiate.rs`, `evaluate.rs`) |
| 6   | Split `extract/types`         | **Done** (`extract/types/mod.rs`, `lower_keywords.rs`, `lower_composites.rs`, `lower_references.rs`) |
| 7   | Split generator/types         | **Done** (`types/mod.rs`, `emit_compounds.rs`, `emit_collections.rs`, `emit_leaves.rs`) |
| 8   | Split extract/values          | **Done** (`infer_*.rs`, `values/mod.rs` + `collect`, `infer_dispatch`, `ts_assertions`) |
| 9   | Shared `typeref_util`         | **Done** (`shared/typeref_util.rs`) |
| 10  | `crate::tasty::` imports      | **Done** |
| 11  | TypeRef visitor               | **Done** (`shared/type_ref_map.rs` + hooks in `resolve.rs` / `instantiate.rs`) |
| 12  | emitted vs generator          | **Done** (hybrid; see §12) |
| 13  | `parsed_file_view`            | **Done** (uses `.clone()`) |
| 14  | `ExtractionContext`           | Open   |
| 15  | Housekeeping                  | Open   |

---

## 1. Deduplicate `collapse_union` ✅ DONE

There were two identical `collapse_union` implementations (`ast/extract/values.rs`
and the old monolithic resolver). Both do the same thing: deduplicate a
`Vec<TypeRef>` and return `None | Some(single) | Some(Union)`.

**Implemented:** single implementation in `shared/typeref_util.rs`; call-sites
import from there.

---

## 2. Deduplicate `reference_lookup_name` ✅ DONE

Two copies existed (`ast/resolve/names.rs` and extract). Same split on
`['.', '<']`.

**Implemented:** canonical helper in `shared/typeref_util.rs`; extract imports it.

---

## 3. Deduplicate `property_key_name` ✅ DONE

Members and values had divergent helpers; unified richer `Option<String>` logic
in `shared/typeref_util.rs` with a fallback where needed for signatures.

---

## 4. Deduplicate literal inference helpers in `values.rs` ✅ DONE

Collapsed the `Expression` vs `Span` pairs so only `*_span(source, span, …)`
remains; call sites pass `expression.span()`.

---

## 5. Break up `ast/resolve/resolver/type_ref.rs` ✅ DONE

Was one large file; split into three `impl Resolver` modules:

| Concern       | New file                  |
| ------------- | ------------------------- |
| resolve       | `resolver/resolve.rs`     |
| instantiate   | `resolver/instantiate.rs` |
| evaluate      | `resolver/evaluate.rs`    |

Literal helpers live in `shared/typeref_util.rs` (see §9). `resolver/mod.rs`
holds the `Resolver` struct and constructor.

---

## 6. Break up `ast/extract/types.rs` ✅ DONE

`LoweringContext` entry and dispatch stay under `extract/types/`; splits:

| Concern              | File                      |
| -------------------- | ------------------------- |
| keyword lowering     | `extract/types/lower_keywords.rs`   |
| composite lowering   | `extract/types/lower_composites.rs` |
| reference lowering     | `extract/types/lower_references.rs` |
| entry + `type_to_ref`  | `extract/types/mod.rs`    |

`lower_tuple_element_type` reparse hack is in composites with a `// HACK:` comment.

---

## 7. Break up `generator/types.rs` ✅ DONE

One giant `emit_type_ref` match plus two dozen small helpers. Split by concern:

| Concern                                                                                                                                                              | New file                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **core dispatch** — `emit_type_ref`, `emit_optional_type_ref`, `emit_type_ref_with_optional_resolved`, `emit_indented_array`, `push_optional_type_ref_field`         | `generator/types/mod.rs`        |
| **compound emitters** — `emit_reference_*`, `emit_constructor_type_ref`, `emit_mapped_type_ref`                                                                      | `generator/types/emit_compounds.rs`   |
| **collection emitters** — `emit_type_ref_array`, `emit_fn_params`, `emit_type_parameters`, `emit_members` (+ local `emit_type_parameter`)                         | `generator/types/emit_collections.rs` |
| **leaf emitters** — `emit_member`, `emit_tuple_element`, `emit_fn_param`, `emit_jsdoc*`, `emit_template_literal_part`, `push_description_fields`, `member_kind_name` | `generator/types/emit_leaves.rs`      |

**Implemented:** `pub(super) use` re-exports `emit_jsdoc`, `emit_members`, and `emit_type_parameters` for `symbols.rs`; sibling imports use `crate::tasty::generator::util`.

---

## 8. Break up `ast/extract/values.rs` ✅ DONE

The value inference logic is one long chain. Split:

| Concern                                                                                                                                                                                                                            | New file                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **object inference** — `infer_object_type` (uses shared `property_key_name`)                                                                                                                                                        | `extract/infer_objects.rs`    |
| **array inference** — `infer_array_type`, `infer_array_element_type`                                                                                                                                                               | `extract/infer_arrays.rs`     |
| **primitive inference** — `infer_boolean_type_span`, `infer_numeric_type_span`, `infer_string_type_span`                                                                                                                           | `extract/infer_primitives.rs` |
| **statement collection** — `collect_statement_value_bindings`, `collect_variable_declaration_value_bindings`, `infer_value_type` | `extract/values/collect.rs`   |
| **expression dispatch** — `infer_value_type_with_const_context` | `extract/values/infer_dispatch.rs` |
| **TS assertions** — `infer_ts_as_expression`, `infer_ts_satisfies_expression` | `extract/values/ts_assertions.rs` |
| **facade** — `pub(super) use` of the above | `extract/values/mod.rs` |

**Implemented:** sibling `infer_*` modules under `extract/`; `values/` mirrors `generator/types/` (`collect` / `infer_dispatch` / `ts_assertions` + `mod.rs`). Re-exported APIs use `pub(crate)` in submodules so `pub(super) use` works. `slice_span` stays on `extract::mod`.

---

## 9. Introduce a shared `typeref_util` module ✅ DONE

Helpers shared by extract and resolve:

- `collapse_union`
- `reference_lookup_name`
- `literal_key` / `parse_numeric_literal` / `is_wrapped_literal` /
  `literal_fragment` / `string_literal_type`
- `resolved_or_self`
- plus `property_key_name`, evaluation helpers (`resolve_indexed_access`, etc.)

**Implemented:** `shared/typeref_util.rs`, wired from `shared/mod.rs` as
`pub(crate) mod typeref_util`.

---

## 10. Kill the `super::super::super::super::` chains ✅ DONE

**Implemented:** prefer `crate::tasty::model::…`, `crate::tasty::ast::model::…`,
`crate::tasty::scanner::…`, `crate::tasty::generator::…`, etc., across the tasty
crate (resolver split files included).

---

## 11. Consider a `TypeRef` visitor trait ✅ DONE

**Resolve** and **instantiate** shared one large structural `match` on
`TypeRef`. **Emit** (`generator/types`) still has its own match — it produces
`String`, not `TypeRef`, so it stays separate.

**Implemented:**

- `shared/type_ref_map.rs` — `TypeRefMap` trait (hooks for variants that differ)
  and `map_type_ref` with the single full structural `match`. Default
  `map_member` / `map_fn_param` recurse via `map_type_ref`; `map_type_ref` is
  `M: TypeRefMap + ?Sized` so those defaults compile.
- `ResolverTypeRefMap` in `ast/resolve/resolver/resolve.rs` — wires resolve
  hooks (`resolve_reference`, `resolve_indexed_access_result`, …).
- `InstantiateTypeRefMap` in `ast/resolve/resolver/instantiate.rs` — substitution
  and identity rebuilds.

Adding a new `TypeRef` variant: update `map_type_ref` once, then adjust emit in
`generator/types/mod.rs` and any extract walks (e.g. `type_references/walk`).

---

## 12. Trim the `emitted/` ↔ `model` parallel hierarchy ✅ DONE

`emitted/` defines `TastyTypeRef`, `TastyMember`, manifest types, etc. — serde +
`ts_rs` mirrors of the wire format the JS runtime expects. Internals stay on
`model.rs` (`TypeRef`, `TsMember`, …).

**Decision (hybrid — not A or B wholesale):**

- **Symbol / chunk JSON** stays **hand-rolled string codegen** in
  `generator/types` and siblings. That path is battle-tested and controls the
  exact wire format without allocating full `Tasty*` trees.
- **`emitted/` stays in production** as the **versioned contract**:
  - **`ts_rs`** exports TypeScript under `js/tasty/generated/` so Rust and JS
    agree on field names and nesting.
  - **`TastyManifest` / `TastySymbolIndexEntry` / `TastySymbolKind`** are built
    in Rust (`generator/bundle/modules/manifest.rs`) and serialized for the
    bundle — that *is* serde-backed emission, not dead code.
- **We are not** switching the whole generator to `serde_json` through
  `TastyTypeRef` (option B) without an explicit product decision: it would be a
  large behavioral/format change for marginal gain.

So there is only **one** live codegen path for symbols (strings), and **one**
schema source of truth for the TS/JSON shape (`emitted/` + targeted manifest
serde). The “parallel hierarchy” is intentional: internals vs wire types.

`emitted.rs` keeps `#![allow(dead_code)]` with a module doc: most `Tasty*`
structs exist for `TS` export only and are never constructed in Rust.

---

## 13. Simplify `ParsedFileAst` cloning ✅ DONE

**Implemented:** `ast/resolve/index.rs` uses `parsed.clone()` instead of a manual
`parsed_file_view()` field-by-field clone.

---

## 14. Reduce parameter threading in `extract/`

Many `extract/` functions pass the same 5 parameters:
`(source, comments, import_bindings, current_module_specifier, current_library)`.

This is already partially solved — `types.rs` has `LoweringContext`. Extend that
pattern: give `members.rs` and `symbols.rs` access to a shared extraction
context struct instead of threading five arguments through every call.

The shape would be something like:

```rust
struct ExtractionContext<'a> {
    source: &'a str,
    comments: &'a [Comment],
    import_bindings: &'a BTreeMap<String, ImportBinding>,
    module_specifier: &'a str,
    library: &'a str,
}
```

`LoweringContext` could become a thin wrapper or alias. This cuts function
signatures from 7+ params down to 2–3.

---

## 15. Small housekeeping

| Item                                                   | Detail                                                                                                                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`#[allow(unused_imports)]` on `pub use emitted::*`** | Either use the imports or remove the allow.                                                                                                                |
| **`emitted.rs` has `#![allow(dead_code)]`**            | **§12:** keep — contract types are for `ts_rs` / serde shape; see module doc on `emitted.rs`. Manifest types are constructed in `manifest.rs`.             |
| **`generator/util.rs` string codegen**                 | `emit_object`, `emit_field`, `emit_array` are fine but consider `write!` into a `String` buffer instead of `format!` + `join` for lower alloc pressure.    |
| **`scanner/model.rs` types**                           | `DiscoveredFile`, `ResolvedModule`, `ScannedFile` are small — verify these aren't duplicating fields already on `ParsedFileAst`.                           |
| **Tests**                                              | `tests/mod.rs` is a single file. As tests grow, split by pipeline stage: `tests/scanner.rs`, `tests/extract.rs`, `tests/resolve.rs`, `tests/generator.rs`. |

---

## Recommended order

Do these in dependency order so each step is independently shippable:

1. ~~**§9** — Create `typeref_util`~~ **done** (`shared/typeref_util.rs`)
2. ~~**§1–3** — Deduplicate `collapse_union`, `reference_lookup_name`, `property_key_name`~~ **done**
3. ~~**§4** — Collapse literal inference pairs~~ **done**
4. ~~**§10** — Switch to `crate::tasty::` imports everywhere~~ **done**
5. ~~**§5** — Split `resolver/type_ref.rs` → resolve / instantiate / evaluate~~ **done**
6. ~~**§6** — Split `extract/types.rs`~~ **done**
7. ~~**§7** — Split `generator/types.rs`~~ **done** (`types/mod.rs` + `emit_*` modules)
8. ~~**§8** — Split `extract/values.rs`~~ **done** (`infer_*` + `values.rs`)
9. ~~**§13** — Drop `parsed_file_view` clone boilerplate~~ **done**
10. **§14** — Introduce `ExtractionContext`
11. **§15** — Housekeeping
12. ~~**§12** — emitted/ vs generator~~ **done** (hybrid; see §12)
13. ~~**§11** — TypeRef map / visitor~~ **done** (`shared/type_ref_map.rs`; emit stays separate)

Each step should pass `cargo check` and existing tests before moving on.
