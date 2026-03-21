# Tasty Refactor Plan

The functionality is there. The pipeline works. This is purely about making the
Rust crate clean, tight, and pleasant — breaking big files into focused modules,
killing duplication, and finding the natural seams.

---

## 1. Deduplicate `collapse_union`

There are two identical `collapse_union` implementations:

- `ast/extract/values.rs` (line 399)
- `ast/resolve/resolver/type_ref.rs` (line 836)

Both do the same thing: deduplicate a `Vec<TypeRef>` and return
`None | Some(single) | Some(Union)`.

**Move to:** `model.rs` as `TypeRef::collapse_union(types: Vec<TypeRef>)` or a
free function next to the `TypeRef` definition. Everyone imports from one place.

---

## 2. Deduplicate `reference_lookup_name`

Two copies:

- `ast/resolve/names.rs` (line 6) — the canonical one used by the resolver
- `ast/extract/types.rs` (line 531) — a private copy inside the lowering context

They do the same split on `['.', '<']`. The extract-side copy should be removed
and `types.rs` should import from `ast::resolve::names` (or promote the helper
to a shared utility).

---

## 3. Deduplicate `property_key_name`

Two slightly different versions:

- `ast/extract/members.rs` (line 291) — returns the raw span slice as `String`
- `ast/extract/values.rs` (line 388) — returns `Option<String>`, handles
  string literal unquoting and numeric literals

These serve different needs but share intent. Unify into a single
`property_key_name` in a shared util (or in `members.rs` with the richer
signature) and have both call-sites use it.

---

## 4. Deduplicate literal inference helpers in `values.rs`

`infer_boolean_type` / `infer_numeric_type` / `infer_string_type` each have a
two-function pair: one takes an `Expression`, the other takes a raw `Span`. The
`Expression` version just calls the `Span` version with `expression.span()`.

**Collapse** to a single set of functions that take `Span` directly — callers
can pass `expression.span()` at the call site. Cuts six functions down to three.

---

## 5. Break up `ast/resolve/resolver/type_ref.rs` (891 lines)

This is the biggest file. It contains three distinct operations on `TypeRef`,
all as `impl Resolver` methods:

| Concern                                                                                                    | Lines | New file                  |
| ---------------------------------------------------------------------------------------------------------- | ----- | ------------------------- |
| **resolve** — walk `TypeRef` to fill in `target_id`, resolved fields                                       | ~160  | `resolver/resolve.rs`     |
| **instantiate** — substitute type parameters into a `TypeRef` tree                                         | ~200  | `resolver/instantiate.rs` |
| **evaluate** — runtime-like evaluation: indexed access, conditional, template literal, keyof, type_extends | ~350  | `resolver/evaluate.rs`    |
| **literal helpers** — `collapse_union`, `literal_key`, `parse_numeric_literal`, `is_wrapped_literal`, etc. | ~80   | shared util (see §9)      |

The file also has `resolve_reference`, `resolve_import_target_id`,
`resolve_local_target_id` which belong structurally in the resolve split.

After the split, `resolver/mod.rs` just holds the `Resolver` struct and its
constructor, and each sub-file adds an `impl Resolver` block for its concern.

---

## 6. Break up `ast/extract/types.rs` (548 lines)

This is one big `impl LoweringContext` block. Natural splits:

| Concern                                                                                                                                                           | New file                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **keyword lowering** — `lower_keyword_type`, `lower_intrinsic_keyword`, `lower_literal_type`                                                                      | `extract/lower_keywords.rs`   |
| **composite lowering** — `lower_tuple_*`, `lower_array_type`, `lower_function_type`, `lower_constructor_type`, `lower_mapped_type`, `lower_template_literal_type` | `extract/lower_composites.rs` |
| **reference lowering** — `lower_type_reference`, `lower_expression_reference`, `reference_source_module`                                                          | `extract/lower_references.rs` |
| **entry + context** — `LoweringContext` struct, `lower_type` dispatch, `type_to_ref`, `expression_to_reference`, `type_parameters_from_oxc`                       | stays in `extract/types.rs`   |

The tricky `lower_tuple_element_type` reparse hack can stay with composites for
now but deserves a `// HACK: synthetic reparse` comment and eventually a cleaner
approach.

---

## 7. Break up `generator/types.rs` (532 lines)

One giant `emit_type_ref` match plus two dozen small helpers. Split by concern:

| Concern                                                                                                                                                              | New file                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **core dispatch** — `emit_type_ref`, `emit_optional_type_ref`, `emit_type_ref_with_optional_resolved`                                                                | stays in `generator/types.rs`   |
| **compound emitters** — `emit_reference_*`, `emit_constructor_type_ref`, `emit_mapped_type_ref`                                                                      | `generator/emit_compounds.rs`   |
| **collection emitters** — `emit_type_ref_array`, `emit_fn_params`, `emit_indented_array`, `emit_members`, `emit_type_parameters`                                     | `generator/emit_collections.rs` |
| **leaf emitters** — `emit_member`, `emit_tuple_element`, `emit_fn_param`, `emit_jsdoc*`, `emit_template_literal_part`, `push_description_fields`, `member_kind_name` | `generator/emit_leaves.rs`      |

---

## 8. Break up `ast/extract/values.rs` (428 lines)

The value inference logic is one long chain. Split:

| Concern                                                                                                                                                                                                                            | New file                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| **object inference** — `infer_object_type`, `property_key_name`, `unquote_string_literal`                                                                                                                                          | `extract/infer_objects.rs`    |
| **array inference** — `infer_array_type`, `infer_array_element_type`                                                                                                                                                               | `extract/infer_arrays.rs`     |
| **primitive inference** — `infer_boolean_type_span`, `infer_numeric_type_span`, `infer_string_type_span`                                                                                                                           | `extract/infer_primitives.rs` |
| **statement collection** — `collect_statement_value_bindings`, `collect_variable_declaration_value_bindings`, `infer_value_type`, `infer_value_type_with_const_context`, `infer_ts_as_expression`, `infer_ts_satisfies_expression` | stays in `extract/values.rs`  |

---

## 9. Introduce a shared `typeref_util` module

Several helpers are used across both `ast/extract/` and `ast/resolve/` (and
should be):

- `collapse_union`
- `reference_lookup_name`
- `literal_key` / `parse_numeric_literal` / `is_wrapped_literal` /
  `literal_fragment` / `string_literal_type`
- `resolved_or_self`

These belong in a shared `typeref_util.rs` (or `model_util.rs`) at the `tasty/`
root, next to `model.rs`. This eliminates the duplication _and_ removes the
deep `super::super::super::super::model::` import chains that currently
litter `type_ref.rs`.

---

## 10. Kill the `super::super::super::super::` chains

Currently `ast/resolve/resolver/type_ref.rs` has **12 occurrences** of
`super::super::super::super::model::` — four-level relative imports. These are
fragile and unreadable.

**Fix:** Use `crate::tasty::model::` absolute imports everywhere inside the
crate. The code already does this in some files (e.g. `crawler.rs` uses
`crate::tasty::constants::libraries::USER_LIBRARY_NAME`). Be consistent:
`crate::tasty::model::{TypeRef, TsMember, ...}` everywhere.

Similarly, `ast/extract/module_bindings/imports.rs` has
`super::super::super::super::scanner::resolve_import` — just use
`crate::tasty::scanner::resolve_import`.

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

## 13. Simplify `ParsedFileAst` cloning

`ast/resolve/index.rs` has a `parsed_file_view()` function that manually clones
every field of `ParsedFileAst`. Since `ParsedFileAst` already derives `Clone`
(via its `#[derive(Debug, Clone)]`), this can just be `.clone()`.

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

1. **§9** — Create `typeref_util.rs` with the shared helpers
2. **§1–3** — Deduplicate `collapse_union`, `reference_lookup_name`,
   `property_key_name` (now trivial since §9 exists)
3. **§4** — Collapse literal inference pairs
4. **§10** — Switch to `crate::tasty::` imports everywhere
5. **§5** — Split `resolver/type_ref.rs` → resolve / instantiate / evaluate
6. **§6** — Split `extract/types.rs`
7. **§7** — Split `generator/types.rs`
8. **§8** — Split `extract/values.rs`
9. **§13** — Drop `parsed_file_view` clone boilerplate
10. **§14** — Introduce `ExtractionContext`
11. **§15** — Housekeeping
12. **§12** — Decide emitted/ vs generator string codegen
13. **§11** — TypeRef visitor trait (only once everything else is stable)

Each step should pass `cargo check` and existing tests before moving on.
