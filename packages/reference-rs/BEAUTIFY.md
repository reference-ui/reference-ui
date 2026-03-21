# BEAUTIFY

A targeted guide for turning the `tasty` Rust codebase into something that reads
like it was _meant_ to be read.

This is not a style guide. Style guides are for strangers. This is a love letter
to code that already works — a plan for making it _sing_.

---

## The shape of what we have

The `tasty` module is ~7,000 lines of Rust across four subsystems:

| Layer           | Role                                                             | Entry                    |
| --------------- | ---------------------------------------------------------------- | ------------------------ |
| **scanner**     | Finds files, resolves imports, builds the workspace graph        | `scan_workspace()`       |
| **ast/extract** | Parses TypeScript via Oxc, lowers into symbol shells             | `extract_ast()`          |
| **ast/resolve** | Resolves cross-file references, evaluates type-level expressions | `resolve_ast()`          |
| **generator**   | Emits JavaScript artifact modules from the resolved bundle       | `emit_artifact_bundle()` |

The pipeline is clean: **scan → extract → resolve → generate**. That clarity is a
gift. Everything below is about making each layer worthy of the architecture it
already serves.

---

## I. Naming: the first kindness

### 1. Heal the `typeref` split

Two shared files live side by side with subtly different naming:

```
shared/type_ref_map.rs    ← underscored
shared/typeref_util.rs    ← smashed together
```

Pick one convention. `type_ref_map` wins — it mirrors the type it serves
(`TypeRef`) and reads instantly. Rename:

```
shared/typeref_util.rs  →  shared/type_ref_util.rs
```

Update the `mod` declaration in `shared/mod.rs` and all `use` paths. One find-
and-replace. One commit.

### 2. Name functions for what they _return_, not what they _do_

Several `push_*` helpers in `ast/extract` and `generator/symbols.rs` mutate a
`&mut Vec` parameter. When a function pushes into a collection it was handed,
the name should still tell you _what_ it contributes:

```rust
// before
fn push_interface_fields(fields: &mut Vec<String>, ...) -> Result<(), String>

// after — the name says what you get
fn interface_fields(bundle: &TypeScriptBundle, ...) -> Result<Vec<String>, String>
```

Returning the value and letting the caller `extend` makes callsites self-
documenting and removes `&mut` aliasing noise. Apply everywhere one `push_*`
function is the sole contributor to a local vec.

### 3. Consistent `_from_*` / `_for_*` suffixes

The codebase already favors these well:

- `module_specifier_for_file_id`
- `resolved_module_from_file_id`
- `ts_file_from_parsed`

But a few functions break the rule:

| Current                             | Proposed                         |
| ----------------------------------- | -------------------------------- |
| `members_from_signatures`           | keep (good)                      |
| `collect_statement_exports`         | `exports_from_statement`         |
| `collect_statement_import_bindings` | `import_bindings_from_statement` |
| `collect_statement_value_bindings`  | `value_bindings_from_statement`  |

The `collect_*` prefix was an early pattern. It implies iteration — fine when
you're folding a list, misleading when you're inspecting one statement and
optionally producing output. The `_from_` suffix is already the dominant idiom.
Let it win everywhere.

---

## II. Signatures: the long parameter problem

### The offenders

```rust
// policy.rs — 8 parameters
fn resolve_import_for_discovery(
    root_dir: &Path,
    current_file_id: &str,
    source_module: &str,
    known_file_ids: &BTreeSet<String>,
    user_file_ids: &BTreeSet<String>,
    is_user_file: bool,
    reexport_specifiers: &BTreeSet<String>,
    current_library: &str,
) -> Option<ResolvedModule>
```

```rust
// crawler.rs — 6 parameters (plus &self)
fn resolve_import(
    &self,
    file_id: &str,
    source_module: &str,
    known_file_ids: &BTreeSet<String>,
    is_user_file: bool,
    reexport_specifiers: &BTreeSet<String>,
    current_library: &str,
) -> Option<ResolvedModule>
```

When a function needs eight arguments, it is asking you to notice a missing
struct.

### The fix: introduce `DiscoveryContext`

```rust
/// Everything known about the file currently being crawled.
struct DiscoveryContext<'a> {
    root_dir: &'a Path,
    file_id: &'a str,
    library: &'a str,
    is_user_file: bool,
    known_file_ids: &'a BTreeSet<String>,
    user_file_ids: &'a BTreeSet<String>,
    reexport_specifiers: BTreeSet<String>,
}
```

Then `resolve_import_for_discovery` becomes:

```rust
fn resolve_import_for_discovery(
    ctx: &DiscoveryContext,
    source_module: &str,
) -> Option<ResolvedModule>
```

The `ExtractionContext` pattern already works perfectly in `ast/extract`. This is
the same idea, applied one layer lower. Mirror it; don't reinvent it.

---

## III. Generator: from string soup to structured emission

`generator/util.rs` builds JavaScript source with raw `String` concatenation:
`emit_object`, `emit_array`, `emit_field`. It works. But every callsite builds a
`Vec<String>` of fields, then passes it into `emit_object`. The intermediate
representation is invisible.

### Introduce `JsBuilder`

```rust
struct JsBuilder {
    fields: Vec<(String, String)>,
}

impl JsBuilder {
    fn new() -> Self { ... }
    fn field(mut self, name: &str, value: String) -> Self { ... }
    fn field_if(self, name: &str, value: Option<String>) -> Self { ... }
    fn build(self) -> String { ... }
}
```

Before:

```rust
let mut fields = vec![
    emit_field("id", to_js_literal(export_name)?),
    emit_field("name", to_js_literal(&symbol.name)?),
    emit_field("library", to_js_literal(&symbol.library)?),
];
push_symbol_metadata_fields(&mut fields, bundle, symbol, export_names)?;
// ...more conditional pushes...
Ok(emit_object(fields))
```

After:

```rust
JsBuilder::new()
    .field("id", to_js_literal(export_name)?)
    .field("name", to_js_literal(&symbol.name)?)
    .field("library", to_js_literal(&symbol.library)?)
    .field_if("description", symbol.description.as_ref().map(to_js_literal).transpose()?)
    .field_if("descriptionRaw", symbol.description_raw.as_ref().map(to_js_literal).transpose()?)
    .build()
```

No more `push_*_fields` mutation. No more 4-parameter helper that exists only to
append to someone else's vec. The builder _is_ the intermediate representation.

---

## IV. Error handling: give the errors a home

Every fallible function returns `Result<T, String>`. That works — until you're
debugging a production scan and the error says `"failed to read …"` with no
context about which phase produced it.

### Phase 1: a single error type (low effort, high return)

```rust
/// A Tasty pipeline error with enough context to locate and diagnose.
#[derive(Debug)]
pub struct TastyError {
    pub phase: &'static str,   // "scan", "extract", "resolve", "generate"
    pub file_id: Option<String>,
    pub message: String,
}

impl std::fmt::Display for TastyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match &self.file_id {
            Some(id) => write!(f, "[{}] {}: {}", self.phase, id, self.message),
            None => write!(f, "[{}] {}", self.phase, self.message),
        }
    }
}
```

You don't need `thiserror`. You don't need an enum with 12 variants. You need
one struct that carries the phase and the file. Migrate one phase at a time,
starting with the scanner (which already has file-level granularity).

### Phase 2: replace `format!` at error sites with a helper

```rust
fn scan_err(file_id: &str, msg: impl std::fmt::Display) -> TastyError {
    TastyError { phase: "scan", file_id: Some(file_id.to_string()), message: msg.to_string() }
}
```

This is not about abstraction. It's about making every error site tell you where
it came from without reading the call stack.

---

## V. Module documentation: the missing `//!` headers

Some files have exquisite module-level docs:

```rust
//! Structural [`TypeRef`] → [`TypeRef`] maps shared by resolve and instantiate.
```

Others — equally important — have nothing. The rule is simple:

> **Every `mod.rs` and every file that defines a public-facing function or type
> gets a `//!` header.**

Priority targets (files with no module doc today):

| File                                | Suggested header                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- |
| `scanner/packages.rs`               | `//! External and relative import resolution dispatch.`                                         |
| `scanner/packages/package_entry.rs` | `//! Package entrypoint resolution from node_modules layout and package.json exports.`          |
| `scanner/workspace/crawler.rs`      | `//! Breadth-first import graph crawler that builds the reachable file set.`                    |
| `scanner/workspace/policy.rs`       | `//! Discovery-phase import policy: which imports to follow and when.`                          |
| `generator/symbols.rs`              | `//! JavaScript source emission for symbol descriptors and cross-references.`                   |
| `ast/extract/pipeline.rs`           | `//! Per-file Oxc parse + statement walk that produces ParsedFileAst.`                          |
| `ast/extract/statements/exports.rs` | `//! Export statement collection: named exports, default exports, and bare type declarations.`  |
| `ast/extract/comments/leading.rs`   | `//! Leading comment extraction and normalization for JSDoc and block comments.`                |
| `ast/resolve/index.rs`              | `//! Top-level resolve orchestration: symbol index → export index → resolved graph.`            |
| `ast/resolve/resolver/resolve.rs`   | `//! TypeRef resolution pass: resolves import references and evaluates type-level expressions.` |

One sentence per file. That's all it takes. A reader opening any file should know
what room they're standing in before they read a single function.

---

## VI. The `TypeRef` match: taming the giant

`generator/types/mod.rs` — `emit_type_ref` — is a single `match` with 16 arms,
each building a different JavaScript object. It's ~180 lines. It is correct. It
is also one of the hardest functions to scan visually.

### Strategy: one arm, one function

The compound variants (`emit_collections`, `emit_compounds`, `emit_leaves`)
already factor out some arms. Finish the job:

```rust
pub(super) fn emit_type_ref(...) -> Result<String, String> {
    match type_ref {
        TypeRef::Intrinsic { name } => emit_intrinsic(&name),
        TypeRef::Literal { value } => emit_literal(&value),
        TypeRef::Reference { .. } if has_type_arguments(type_ref) => {
            emit_reference_with_type_arguments(bundle, type_ref, export_names)
        },
        TypeRef::Reference { .. } => emit_reference(bundle, type_ref, export_names),
        TypeRef::Object { members } => emit_object_type(bundle, &members, export_names),
        TypeRef::Union { types } => emit_union(bundle, &types, export_names),
        // ... every arm is a one-line delegation
    }
}
```

The match becomes a _table of contents_. Each helper lives in the sub-module
where it belongs. The reader sees the full vocabulary at a glance and dives into
the one variant they care about.

---

## VII. Small elegances

### 1. Replace `clone()` chains in index building

`ast/resolve/index.rs` has patterns like:

```rust
(parsed.file_id.clone(), symbol.name.clone())
```

scattered across index-building closures. When the same clone pair appears three
or more times, extract a micro-helper:

```rust
fn file_symbol_key(file_id: &str, name: &str) -> (String, String) {
    (file_id.to_string(), name.to_string())
}
```

Not for abstraction. For rhythm. The reader stops seeing `clone` noise and
starts seeing intent.

### 2. Let `normalize_comment_text` use iterators

In `leading.rs`:

```rust
fn normalize_comment_text(raw: &str) -> String {
    strip_block_comment_delimiters(raw)
        .lines()
        .map(normalize_comment_line)
        .collect::<Vec<_>>()
        .join("\n")
        .trim()
        .to_string()
}
```

The `.collect::<Vec<_>>().join("\n")` allocates an intermediate vec. Use
`itertools::join` or `fold` directly. Tiny savings, but it's the kind of care
that signals this code was _polished_, not just correct.

### 3. Unify `first_existing_candidate` patterns

`package_entry.rs` calls `first_existing_candidate` in three places with the
same candidate-generation logic. Consider consolidating the candidate list
generation into a single `resolve_with_candidates` that takes an iterator of
candidate paths:

```rust
fn resolve_with_candidates(
    base_dir: &Path,
    candidates: impl IntoIterator<Item = String>,
) -> Option<PathBuf> {
    candidates.into_iter().find_map(|c| {
        let path = base_dir.join(&c);
        path.exists().then_some(path)
    })
}
```

### 4. Boolean parameters → enums

In `packages.rs`:

```rust
fn resolve_relative_import(
    ...,
    allow_file_lookup: bool,  // what does `true` mean here?
)
```

A boolean parameter at a call site is invisible context. Replace with:

```rust
enum FileLookup { Allowed, Denied }
```

One more line of code. Infinitely more readable at the call site:

```rust
resolve_relative_import(root_dir, file_id, source, file_ids, FileLookup::Allowed)
```

---

## VIII. File-level targets: where love is most needed

These files are functional but would benefit most from the changes above,
ranked by impact:

| Priority | File                                | What to do                                                |
| -------- | ----------------------------------- | --------------------------------------------------------- |
| 1        | `scanner/workspace/policy.rs`       | Introduce `DiscoveryContext`, add `//!` header            |
| 2        | `generator/symbols.rs`              | Introduce `JsBuilder`, eliminate `push_*_fields` mutation |
| 3        | `generator/types/mod.rs`            | Factor remaining match arms into one-line delegations     |
| 4        | `ast/extract/statements/exports.rs` | Rename `collect_*` → `_from_*`, add `//!` header          |
| 5        | `ast/resolve/index.rs`              | Extract `file_symbol_key`, add `//!` header               |
| 6        | `scanner/packages.rs`               | Boolean → enum for `allow_file_lookup`, add `//!` header  |
| 7        | `scanner/workspace/crawler.rs`      | Adopt `DiscoveryContext` from policy, add `//!` header    |
| 8        | `shared/typeref_util.rs`            | Rename file, add `//!` header                             |
| 9        | `ast/extract/pipeline.rs`           | Add `//!` header                                          |
| 10       | `ast/extract/comments/leading.rs`   | Iterator cleanup, add `//!` header                        |

---

## IX. What not to touch

Some things look like they could be "improved" but are exactly right:

- **`BTreeMap` everywhere.** Deterministic iteration order is a feature, not an
  accident. Do not swap to `HashMap` for "performance."

- **`pub(crate)` / `pub(super)` discipline.** The visibility boundaries are
  precise and intentional. Respect them.

- **The four-phase pipeline.** Scan → extract → resolve → generate. Each phase
  owns its model. Don't merge them.

- **`Result<T, String>` in internal helpers.** The `TastyError` struct belongs
  at phase boundaries, not in every leaf function. Keep the leaf functions cheap.

- **The `TypeRefMap` trait.** It's the backbone of both resolve and instantiate.
  It's complex because the problem is complex. It is already beautiful.

---

## X. The order of operations

1. **Add `//!` headers** to the 10 files listed above. One PR, zero risk. Merge
   it fast so every future reader benefits immediately.

2. **Rename `typeref_util.rs` → `type_ref_util.rs`**. Mechanical. Ship it.

3. **Introduce `DiscoveryContext`** in the scanner. This touches `policy.rs`,
   `crawler.rs`, and call sites in `workspace.rs`. One focused PR.

4. **Build `JsBuilder`** in `generator/util.rs`. Migrate `symbols.rs` first.
   Then `types/mod.rs`. Each file can be its own commit.

5. **Rename `collect_*` → `_from_*`** in extract/statements. Coordinate with
   any open branches.

6. **Factor `emit_type_ref` arms** into per-variant helpers. The match becomes
   the table of contents it was always trying to be.

7. **Introduce `TastyError`** at phase boundaries. Start with scanner. Expand
   outward.

8. **Boolean → enum** for `FileLookup` in scanner/packages. Small, satisfying,
   standalone.

---

_Code that is clear is code that invites contribution._
_Code that is beautiful is code that resists decay._
_This codebase is already good. Let's make it undeniable._
