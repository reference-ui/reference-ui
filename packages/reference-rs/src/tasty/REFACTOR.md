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
| 8   | Split extract/values          | **Done** (`infer_objects.rs`, `infer_arrays.rs`, `infer_primitives.rs`, `values.rs`) |
| 9   | Shared `typeref_util`         | **Done** (`shared/typeref_util.rs`) |
| 10  | `crate::tasty::` imports      | **Done** |
| 11  | TypeRef visitor               | Open   |
| 12  | emitted vs generator          | Open (decision) |
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
| **statement collection** — `collect_statement_value_bindings`, `collect_variable_declaration_value_bindings`, `infer_value_type`, `infer_value_type_with_const_context`, `infer_ts_as_expression`, `infer_ts_satisfies_expression` | `extract/values.rs`           |

**Implemented:** sibling modules under `extract/`; `infer_value_type_with_const_context` and the `as`/`satisfies` helpers are `pub(super)` on `values` for the infer modules. `slice_span` stays on `extract::mod`.

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

## 11. Consider a `TypeRef` visitor trait

Three different operations walk the full `TypeRef` tree with near-identical
match arms:

1. **resolve** (`resolve_type_ref`) — fills in target IDs and resolved slots
2. **instantiate** (`instantiate_type_ref`) — substitutes type parameters
3. **emit** (`emit_type_ref`) — generates JS artifact text

Each one has a 17-arm match that reconstructs every variant. When a new
variant is added to `TypeRef`, all three must be updated in lockstep.

A `TypeRefVisitor` or `TypeRefMapper` trait with a default recursive walk
would let each operation override only the arms it cares about:

```rust
trait TypeRefMapper {
    fn map_reference(&mut self, name: String, target_id: Option<String>, ...) -> TypeRef { ... }
    fn map_type_ref(&mut self, type_ref: TypeRef) -> TypeRef {
        // default: recurse structurally, call map_reference for Reference, etc.
    }
}
```

This is the most invasive change and should come **after** the file splits are
stable. But it would collapse ~400 lines of boilerplate across the three
call sites.

---

## 12. Trim the `emitted/` ↔ `model` parallel hierarchy

`emitted/types.rs` defines `TastyTypeRef`, `TastyStructuredTypeRef`,
`TastyMember`, etc. — serde/TS-export mirrors of the internal `TypeRef`,
`TsMember`, etc. in `model.rs`.

These exist for good reason (the emitted contract is versioned and decoupled
from internals), but the **generator currently doesn't use them** — it does
hand-rolled string-based JS codegen in `generator/types.rs` instead.

Two possible paths:

- **A.** Keep the string codegen (it's battle-tested), but remove or
  `#[cfg(test)]`-gate the `emitted/` serde types if nothing actually
  serializes through them in production.
- **B.** Switch the generator to serialize through the `emitted/` types
  (i.e. build `TastyTypeRef` trees, then `serde_json::to_string`). This would
  eliminate `generator/types.rs` entirely but changes the artifact format.

Decide which path; don't carry both.

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
| **`emitted.rs` has `#![allow(dead_code)]`**            | Same — audit and remove dead items or drop the allow.                                                                                                      |
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
12. **§12** — Decide emitted/ vs generator string codegen
13. **§11** — TypeRef visitor trait (only once everything else is stable)

Each step should pass `cargo check` and existing tests before moving on.
