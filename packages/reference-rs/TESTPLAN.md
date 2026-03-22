# TESTPLAN

A plan for proving that `tasty` works. Not eventually. Not probably. _Actually._

---

## On the nature of AST code

Before we talk about testing, we need to talk about the thing nobody says out
loud:

**AST code is cursed. It will always be cursed. And that is fine.**

Here is why. An AST is a tree that represents every possible thing a human could
write in a programming language. Every valid program. Every edge case. Every
three-year-old syntax that nobody uses except one library author far far away who
will absolutely file a bug if you handle it wrong.

The code that walks an AST inherits the shape of the language it reads. If the
language has 16 type expression variants, your match has 16 arms. If properties
can be readonly, optional, computed, shorthand, or all four at once, you get a
`match` arm for each combination. If comments can attach to the node before, the
node after, or float between two statements — you write something ugly to decide
which one wins.

This is not a failure of engineering. This is the _tax_ the language charges for
its expressiveness. TypeScript's type system is Turing-complete; the code that
lowers it into a portable representation is going to look like it fought a war.
Because it did.

The answer is not to make the implementation beautiful. **The answer is to make
the tests so clear, so complete, and so close to real TypeScript, that anyone can
read a test case and know exactly what the system promises.** The implementation
is allowed to be strange. The contract is not.

Every test case in `cases/` is a tiny TypeScript project. The inputs are
readable TypeScript. The assertions are readable API calls. The cursed
`match` arms on 16 `TypeRef` variants — those live behind the wall. If a
variant is wrong, a test in `cases/` will tell you. If a test in `cases/`
passes, you can ship.

That's the deal. The implementation is the engine room. Loud, hot, full of
pipes. The tests are the dining room. Michelin-starred. White tablecloths.
No one needs to see the pipes. They need to trust that the food is safe.

---

## What we have today

### Two test tiers

| Tier                         | Runner             | What it proves                                                                                                                              |
| ---------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rust unit tests**          | `cargo test`       | Scanner resolves imports correctly. Workspace crawl follows the right edges. Export-name collisions are rejected. `extract_ast` / `resolve_ast` in `tests/extract.rs` / `tests/resolve.rs`. `TypeRefMap` identity in `tests/type_ref_map*.rs`. Error-path scans in `error_paths.rs`. |
| **Vitest integration tests** | `pnpm test:vitest` | The compiled napi-rs binary scans real TypeScript, emits artifact modules, and the JS runtime API exposes correct, navigable type metadata. |

### Rust tests (`src/tasty/` + `ast/extract/comments/leading.rs` tests, ~47 tests)

| File                                | Coverage                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| `tests/scanner.rs`                  | Smoke: external_libs and kitchen_sink fixtures scan without error               |
| `tests/extract.rs`                  | Direct `extract_ast` tests: interfaces, extends, unions, re-exports, default export, `as const` values, JSDoc, nested types, import bindings |
| `tests/resolve.rs`                  | `resolve_ast`: cross-file `target_id` on imported types; same-file interface refs |
| `tests/type_ref_map_identity.rs`    | `IdentityMap` for `TypeRefMap` / `map_type_ref` round-trip                       |
| `tests/type_ref_map.rs`             | One union value exercising every `TypeRef` variant; identity preserves structure   |
| `tests/type_ref_proptest.rs`        | `proptest`: random `TypeRef` trees → `map_type_ref` + `IdentityMap` is identity (64 cases) |
| `tests/error_paths.rs`              | Parse diagnostics, missing import resolution, malformed `package.json`, circular type re-exports |
| `ast/extract/comments/leading.rs`   | Leading-comment attachment: gap, statement between, merged `//`, JSDoc+`//`, empty `/** */` |
| `scanner/packages/tests.rs`         | Relative imports; `exports` / deep subpaths; `split_package_specifier` (@scope); `main` fallback; `@types/` fallback; missing entrypoints (`None`); unix: symlinked `node_modules` + globwalk `src/**/*.ts` |
| `scanner/workspace/tests.rs`        | Re-export following, external-import skipping, same-library relative follows    |
| `generator/bundle/modules/tests.rs` | Export-name hash collision detection                                            |

### Vitest tests (19 case folders, including `parse_error`)

Most case folders run `addCaseRuntimeSmokeTests` (manifest-only load, identity
stability) **or** case-specific setup (`duplicate_names` skips bare-name smoke tests),
`addCaseEmittedSnapshotTests` (normalized manifest + representative chunk golden
files), plus case-specific assertions on symbol shapes, member metadata,
type-ref structures, JSDoc, and graph traversal.

| Case                | What it exercises                                                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit_alignment`   | Raw summaries (`import()`, `infer`, type predicates, `this`)                                                                                        |
| `conditional_types` | Conditional type structure, cross-reference resolution                                                                                              |
| `default_params`    | Type parameter defaults                                                                                                                             |
| `duplicate_names`   | Ambiguous name detection, warnings, rejection                                                                                                       |
| `external_libs`     | node_modules resolution, extends chains, csstype/json-schema refs, descriptions                                                                     |
| `generics`          | Type parameters, constraints, type arguments on references                                                                                          |
| `import_resolution` | Default/namespace/named import resolution to user-owned symbols                                                                                     |
| `jsdoc`             | Symbol and member JSDoc, tags, plain-comment fallback                                                                                               |
| `kitchen_sink`      | Everything at once: mapped, conditional, template literal, tuple, indexed access, inheritance, callbacks, JSDoc, generics with constraints+defaults |
| `mapped_types`      | Mapped type structure, modifiers, name types                                                                                                        |
| `parse_error`       | Deliberately invalid TS + valid symbol; scanner diagnostics via `buildTasty`; emitted snapshots                                                      |
| `signatures`        | readonly, optional, method/call/index/construct signatures, array/tuple/function/constructor types                                                  |
| `template_literals` | Template literal parts, keyof interpolation                                                                                                         |
| `tsx`               | `.tsx` file scanning, optional flags                                                                                                                |
| `type_operators`    | keyof, readonly, unique                                                                                                                             |
| `type_queries`      | `typeof` expressions, nested property paths                                                                                                         |
| `unions_literals`   | Union/literal types, optional members, bigint alias                                                                                                 |
| `unknown_complex`   | Indexed access, mapped, conditional, nested structural types                                                                                        |
| `value_resolution`  | `keyof typeof`, array index access, template literal expansion, conditional instantiation, interface member access — all with resolved payloads     |

---

## What's missing

We have excellent _horizontal_ coverage (every `TypeRef` variant has at least one
test case). We have weak _vertical_ coverage (very few tests probe the pipeline
stages independently). And we still have limited _negative_ coverage beyond Phase 1’s narrow error-path
and parse-diagnostics checks.

### Gap 1: No Rust-side unit tests for ~~extract~~ or ~~resolve~~

**Extract:** Phase 2.1 adds `src/tasty/tests/extract.rs` — direct `extract_ast` tests
on synthetic `ScannedWorkspace` inputs (extends, unions, re-exports, default export,
value bindings, JSDoc, nested refs, import bindings).

**Resolve:** Phase 2.2 adds `src/tasty/tests/resolve.rs` — `extract_ast` then
`resolve_ast` on small multi-file workspaces (cross-file import → `target_id`,
same-file `LocalA` / `LocalB` reference).

### Gap 2: Incomplete error-path coverage (Phase 1 is a start)

Phase 1 adds Rust `error_paths` tests and a Vitest `parse_error` case for scanner
diagnostics. Still untested or lightly tested:

- A type parameter references something that isn't in scope?
- Broader `ScannerDiagnostic` surfaces (beyond the parse / resolution cases above)

### Gap 3: ~~No snapshot/golden-file tests for emitted JavaScript~~ (Phase 1: Vitest file snapshots)

**Addressed in Phase 1:** `addCaseEmittedSnapshotTests` snapshots normalized
`manifest.js` and one chunk per case (see §1.1). Remaining gap: no dedicated
assertions for **exact** trivial formatting (normalization hides content-hash ids);
Rust `insta` on emitted modules was intentionally not added.

### Gap 4: No performance regression detection

`perf-metrics.txt` is written for every case. Nothing reads it. There's no
baseline, no comparison, no gate. A 10× regression in scanner performance
would pass CI silently.

### Gap 5: Incomplete TypeRef variant matrix

Every variant is tested, but not every _combination_. The cases test:

- `Union { types: [Literal, Literal] }` ✓
- `Union { types: [Reference, Reference] }` ✓
- `Union { types: [Object { members: [Function] }, Object] }` ✓

But not:

- `Array { element: Union { types: [Conditional, Mapped] } }`
- `Function { params: [Tuple], return_type: TemplateLiteral }`
- `Intersection { types: [Mapped, Object] }`

These compositions are where AST code fails. The individual arms work. The
nesting breaks.

### Gap 6: ~~No Rust-side property tests~~ (TypeRef covered; import paths still open)

**TypeRef:** `tests/type_ref_proptest.rs` uses `proptest` + a recursive strategy
over all `TypeRef` variants to assert `map_type_ref(&mut IdentityMap, t) == t`.

Import resolution and path normalization are still good candidates for proptest
(see §4.2).

---

## The plan

### Phase 1: Strengthen what we have (low effort, high return)

**Status: done.** Implemented on the Vitest side for snapshots and diagnostics;
Rust-side error paths live in `src/tasty/tests/error_paths.rs` (TempDir fixtures,
not a separate `error_cases/` tree).

#### 1.1 Add golden-file snapshot tests for emitted JS — **done**

For each existing case, snapshot the `output/manifest.js` and one representative
`output/chunks/*.js` file. Use `insta` (Rust) or Vitest's `toMatchFileSnapshot`
(JS). When the emitted output changes, the snapshot diff shows exactly what
moved.

**Why now:** This catches silent regressions in the generator — field reordering,
whitespace changes, missing commas — that the runtime API tests can't see.

**Implemented:** Vitest only (`addCaseEmittedSnapshotTests` in
`tests/tasty/api-test-helpers.ts`, called from each case’s `api.test.ts`).
Snapshots are stored under **`tests/tasty/cases/<case>/__snapshots__/`** (not
under `output/`, because `globalSetup` deletes each case’s `output/` tree every
run). Emitted content-hash ids are normalized to stable placeholders (`_s0`,
`_s1`, … by symbol name order) so snapshots stay stable across runs; the
“representative” chunk is the file for the first symbol when sorted by name
(then id).

**Original sketch (paths differ as above):**

```typescript
// In each api.test.ts, add:
it('emitted manifest matches snapshot', async () => {
  const manifest = await fs.readFile(join(caseOutputDir, 'manifest.js'), 'utf-8')
  expect(manifest).toMatchFileSnapshot(
    join(caseOutputDir, '__snapshots__', 'manifest.js.snap')
  )
})
```

Or, in Rust, by extending `tests/scanner.rs`:

```rust
#[test]
fn external_libs_emitted_output_matches_snapshot() {
    let bundle = scan_typescript_bundle(&request).unwrap();
    let artifact = emit_artifact_bundle(&bundle).unwrap();
    insta::assert_snapshot!(artifact.modules["./manifest.js"]);
}
```

Pick one. Don't do both. The JS side is easier to maintain because it tests the
actual napi output path. **We picked Vitest.**

#### 1.2 Add error-path tests (Rust-side) — **done**

Deliberately broken inputs are built in temp dirs in **`src/tasty/tests/error_paths.rs`**
(same TempDir pattern as `scanner/workspace/tests.rs`).

| Scenario                 | Input                                    | Expected                                                                 |
| ------------------------ | ---------------------------------------- | ------------------------------------------------------------------------ |
| `parse_error`            | `export interface { broken`              | `diagnostics` contains parse error (message includes `parse reported`)   |
| `missing_import`         | `import type { Missing } from './nonexistent'` on a member type | Scan succeeds; `Missing` reference has `target_id: None`                 |
| `malformed_package_json` | `node_modules/bad-lib/package.json` = `{bad`, no index file | Scan succeeds; no symbols from `bad-lib`; no panic                       |
| `circular_reexport`      | `a.ts` / `b.ts` circular type re-exports | Scan completes; both symbols present                                     |

**Note:** The original table assumed `parse_error` leaves symbols empty; the
implementation only asserts parse diagnostics (exports may still be extracted
from a partial AST).

#### 1.3 Add diagnostic coverage to Vitest — **done**

**Implemented:** Case folder **`tests/tasty/cases/parse_error/`** (broken +
valid inputs). The test uses **`buildTasty`** and asserts scanner diagnostics
(including `parse reported`), not `loadManifest().diagnostics` — the runtime
manifest contract does not carry scanner diagnostics.

```typescript
it('reports parse errors in diagnostics without crashing', async () => {
  const built = await buildTasty({
    rootDir: join(packageDir, 'tests', 'tasty'),
    include: ['cases/parse_error/input/**/*.{ts,tsx}'],
    outputDir: join(packageDir, 'tests', 'tasty', 'cases', 'parse_error', 'output'),
  })
  expect(
    built.diagnostics.some(
      (d) => d.source === 'scanner' && d.message.includes('parse reported'),
    ),
  ).toBe(true)
})
```

### Phase 2: Test the pipeline stages independently (medium effort)

#### 2.1 Rust unit tests for `extract` — **done**

The extract layer takes a `ScannedFile` (just source text + file_id) and
produces a `ParsedFileAst`. This is a pure function — no filesystem, no
network, no side effects. Test it directly.

**Implemented:** `src/tasty/tests/extract.rs` (`crate::tasty::ast::extract_ast` on
in-memory `ScannedWorkspace`). Nested `Array<Map<string, number>>` uses `number`
instead of a custom `Foo` alias so the assertion stays fully structural.

```rust
#[test]
fn extracts_interface_with_optional_member() {
    let scanned = ScannedFile {
        file_id: "test.ts".to_string(),
        module_specifier: "test".to_string(),
        library: "user".to_string(),
        source: "export interface Props { label?: string }".to_string(),
    };
    let workspace = ScannedWorkspace {
        root_dir: PathBuf::from("."),
        files: vec![scanned],
        file_ids: BTreeSet::from(["test.ts".to_string()]),
    };
    let ast = extract_ast(&workspace);
    let exports = &ast.files[0].exports;

    assert_eq!(exports.len(), 1);
    assert_eq!(exports[0].name, "Props");
    assert_eq!(exports[0].defined_members[0].name, "label");
    assert!(exports[0].defined_members[0].optional);
}
```

Priority targets for extract tests:

| Aspect                 | What to test                                                 | Covered |
| ---------------------- | ------------------------------------------------------------ | ------- |
| Interface with extends | `extends` vec is populated with correct `TypeRef::Reference` | ✓ |
| Type alias with union  | `underlying` is `TypeRef::Union` with correct branches       | ✓ |
| Re-export bindings     | `export { X } from './other'` populates `export_bindings`    | ✓ |
| Default export         | `export default interface` produces exported symbol          | ✓ |
| Value bindings         | `const x = { a: 1 } as const` populates `value_bindings`     | ✓ |
| JSDoc extraction       | Comment text, tags, raw text all populated                   | ✓ summary / description |
| Nested type refs       | `Array<Map<…>>` nests correctly                            | ✓ |
| Import bindings        | Named, default, namespace imports all recorded               | ✓ |

#### 2.2 Rust unit tests for `resolve` — **done**

The resolve layer takes a `ParsedTypeScriptAst` and wires cross-file references.

**Implemented:** `src/tasty/tests/resolve.rs`. Tests build `ParsedTypeScriptAst` with
`extract_ast` on an in-memory `ScannedWorkspace` (same pattern as §2.1) so bindings
match real parser output, then call `resolve_ast`. Covers:

- **Cross-file:** `src/a.ts` exports `Foo`; `src/b.ts` imports `Foo` and `Bar.f: Foo` →
  `target_id == sym:src/a.ts#Foo`.
- **Same file:** `LocalB.a: LocalA` → `target_id == sym:src/one.ts#LocalA`.

Sketch (hand-built AST is optional; we use extract + resolve):

```rust
#[test]
fn resolves_cross_file_import_reference() {
    // File A exports `Foo`
    // File B imports `Foo` from A and uses it in a member type
    // After resolve, the member's TypeRef::Reference has target_id set
    let ast = ParsedTypeScriptAst {
        files: vec![file_a, file_b],
        diagnostics: vec![],
    };
    let graph = resolve_ast(ast);
    let symbol_b = graph.symbols.values()
        .find(|s| s.name == "Bar").unwrap();
    let member_type = &symbol_b.defined_members[0].type_ref;
    assert!(matches!(member_type, Some(TypeRef::Reference { target_id: Some(_), .. })));
}
```

#### 2.3 Rust unit tests for the `TypeRefMap` identity round-trip — **done**

The `TypeRefMap` trait is the backbone of both `resolve` and `instantiate`. An
identity mapper (every hook returns the input unchanged) should produce
structurally identical output for any input `TypeRef`:

**Implemented:** split across two modules under `tests/`:

- **`tests/type_ref_map_identity.rs`** — `IdentityMap` implementing every
  `TypeRefMap` hook in `shared/type_ref_map.rs` (including re-walking
  `type_arguments` in `map_reference`, which `map_type_ref` does not pre-map).
- **`tests/type_ref_map.rs`** — hand-built `TypeRef` union touching all variants,
  then `assert_eq!(input, map_type_ref(&mut IdentityMap, input.clone()))`.

```rust
struct IdentityMap;
impl TypeRefMap for IdentityMap {
    fn map_reference(&mut self, name, target_id, source_module, type_arguments) -> TypeRef {
        TypeRef::Reference { name, target_id, source_module, type_arguments }
    }
    // ... identity for every hook
}

#[test]
fn identity_map_preserves_complex_type_ref() {
    let input = /* deeply nested TypeRef tree */;
    let output = map_type_ref(&mut IdentityMap, input.clone());
    assert_eq!(input, output);
}
```

This is the precursor to property testing. Once the identity assertion works for
hand-crafted inputs, add `proptest` to generate random `TypeRef` trees.

### Phase 3: Composition and edge-case coverage (targeted effort)

#### 3.1 Nested TypeRef composition tests

Add case fixtures that exercise _nesting_, not just individual variants:

| New case        | What it exercises                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| `nested_types`  | `Array<Union<Conditional, Mapped>>`, `Function` returning `TemplateLiteral`, `Intersection` of `Object` and `Mapped` |
| `deeply_nested` | 4+ levels of nesting: `Record<string, Array<[Tuple, ...Rest]>>`, `Conditional` where both branches are `Mapped`      |

These are the tests that catch off-by-one errors in recursive emission,
incorrect indentation in the JS output, or missing type-argument propagation
through nested references.

#### 3.2 Comment attachment edge cases

**Done.** `#[cfg(test)]` in `src/tasty/ast/extract/comments/leading.rs` parses
TypeScript with Oxc, takes the top-level `interface` span, runs
`leading_comment_for_span` → `parse_comment_metadata`, and asserts:

| Scenario          | Input                                      | Expected                                   |
| ----------------- | ------------------------------------------ | ------------------------------------------ |
| No gap            | `/** doc */\ninterface X {}`               | Comment attaches to X                      |
| Statement between | `/** doc */\nconst y = 1;\ninterface X {}` | Comment does NOT attach to X               |
| Multiple comments | `// line 1\n// line 2\ninterface X {}`     | Both lines merged                          |
| JSDoc + plain     | `/** jsdoc */\n// plain\ninterface X {}`   | JSDoc wins, both included                  |
| Empty comment     | `/** */\ninterface X {}`                   | No description (empty after normalization) |

#### 3.3 Import resolution stress tests

**Done.** Extended `src/tasty/scanner/packages/tests.rs`:

| Scenario                       | What it tests                                          |
| ------------------------------ | ------------------------------------------------------ |
| Scoped package (`@scope/pkg`)  | `split_package_specifier` handles scope correctly      |
| Subpath with deep nesting      | `pkg/a/b/c` resolves through `exports` map             |
| Package with only `main` field | Fallback when no `types` or `exports`                  |
| Symlinked node_modules         | `follow_links(true)` in globwalk works                 |
| Missing index file             | `resolve_package_root_entry` returns `None` gracefully |

- **Scoped / subpath:** `split_package_specifier_handles_scoped_package_and_subpath`.
- **Deep exports:** `deep-lib` with `"exports": { "./a/b/c": { "types": … } }`, assert `resolve_external_import(..., "deep-lib/a/b/c")`.
- **Main only:** `main-only-lib` with only `"main": "./lib/index.js"` and `lib/index.d.ts` beside runtime entry.
- **Missing entry:** package.json lists `types`/`main` paths that do not exist on disk → `resolve_external_import` is `None` (same failure mode as an unresolved root entry).
- **Symlinks (unix):** `scan_workspace_discovers_symlinked_source_under_glob` exercises `GlobWalkerBuilder::follow_links(true)`; `external_import_resolves_scoped_package_via_symlinked_node_modules_path` resolves `@scope/pkg` through a symlink under `node_modules/@scope/`.

### Phase 4: Property tests and fuzzing (high effort, highest return)

#### 4.1 TypeRef property tests with proptest

**Done.** `src/tasty/tests/type_ref_proptest.rs` — dev-dependency `proptest`, recursive
`type_ref_strategy()` (depth 4) covering every `TypeRef` variant including
`Reference` (with nested `type_arguments`), `Object`/`Tuple`/`Function`/`Constructor`,
`IndexedAccess`, `Conditional`, `Mapped`, `TemplateLiteral`, etc. The test runs
64 cases per `cargo test` (see `ProptestConfig::with_cases(64)`).

Sketch (actual file has full `prop_oneof!` arms):

```rust
use proptest::prelude::*;

fn arbitrary_type_ref() -> impl Strategy<Value = TypeRef> {
    let leaf = prop_oneof![
        any::<String>().prop_map(|name| TypeRef::Intrinsic { name }),
        any::<String>().prop_map(|value| TypeRef::Literal { value }),
    ];
    leaf.prop_recursive(4, 64, 8, |inner| {
        prop_oneof![
            prop::collection::vec(inner.clone(), 1..4)
                .prop_map(|types| TypeRef::Union { types }),
            inner.clone().prop_map(|element| TypeRef::Array {
                element: Box::new(element),
            }),
            // ... other variants
        ]
    })
}

proptest! {
    #[test]
    fn identity_map_is_identity(type_ref in arbitrary_type_ref()) {
        let mapped = map_type_ref(&mut IdentityMap, type_ref.clone());
        prop_assert_eq!(type_ref, mapped);
    }
}
```

#### 4.2 Import-path property tests

```rust
proptest! {
    #[test]
    fn normalize_relative_path_is_idempotent(path in "[a-z/]{1,30}") {
        let p = Path::new(&path);
        let once = normalize_relative_path(p);
        let twice = normalize_relative_path(&once);
        prop_assert_eq!(once, twice);
    }
}
```

#### 4.3 Scanner fuzz testing

Feed `extract_module_specifiers` random strings to ensure it never panics:

```rust
proptest! {
    #[test]
    fn extract_module_specifiers_never_panics(source in ".*") {
        let _ = extract_module_specifiers("fuzz.ts", &source);
    }
}
```

This alone would have caught at least two real bugs in Oxc integration over the
project's history.

### Phase 5: Performance baselines (optional but recommended)

#### 5.1 Read `perf-metrics.txt` in CI

Add a Vitest test that reads every `perf-metrics.txt` and asserts the scan time
is under a threshold:

```typescript
it.each(scenarioFolders)('scenario %s scans in under 500ms', scenario => {
  const metrics = readFileSync(
    join(casesDir, scenario, 'output', 'perf-metrics.txt'),
    'utf-8'
  )
  const ms = parseFloat(metrics.match(/rust_api_ms: ([\d.]+)/)?.[1] ?? '0')
  expect(ms).toBeLessThan(500)
})
```

This won't catch slow drifts over months, but it will catch catastrophic
regressions immediately.

#### 5.2 Criterion benchmarks (Rust)

For the scanner and resolver hot paths:

```rust
fn bench_scan_kitchen_sink(c: &mut Criterion) {
    let request = ScanRequest { ... };
    ensure_fixture_dependencies_installed();
    c.bench_function("scan_kitchen_sink", |b| {
        b.iter(|| scan_typescript_bundle(&request).unwrap())
    });
}
```

---

## Execution order

| #   | What                              | Effort | Risk                | Value                                                 |
| --- | --------------------------------- | ------ | ------------------- | ----------------------------------------------------- |
| 1   | Golden-file snapshots (§1.1)      | Low    | None                | Catches silent generator drift                        |
| 2   | Error-path tests (§1.2)           | Low    | None                | Proves the system doesn't panic on bad input          |
| 3   | Extract unit tests (§2.1)         | Medium | None                | Tests the hardest code directly                       |
| 4   | Comment attachment tests (§3.2)   | Low    | None                | Hardens the most fragile subsystem                    |
| 5   | Import resolution stress (§3.3)   | Low    | None                | Fills gaps in package edge cases                      |
| 6   | Resolve unit tests (§2.2)         | Medium | None                | Proves cross-file wiring without integration overhead |
| 7   | TypeRefMap identity test (§2.3)   | Low    | None                | Foundation for property tests                         |
| 8   | Diagnostic Vitest coverage (§1.3) | Low    | New fixture         | Closes the error-reporting loop                       |
| 9   | Nested TypeRef cases (§3.1)       | Medium | New fixture         | Catches composition bugs                              |
| 10  | Property tests (§4.1–4.3)         | Medium | proptest in use     | §4.1 TypeRef identity done; §4.2–4.3 still open        |
| 11  | Perf baselines (§5.1)             | Low    | None                | Prevents silent perf regression                       |
| 12  | Criterion benchmarks (§5.2)       | Medium | New dep (criterion) | Enables performance-driven work                       |

---

## Shared test infrastructure improvements

### Extract the `TempDir` helper

`scanner/packages/tests.rs` and `scanner/workspace/tests.rs` each define their
own `TempDir` struct with identical code. Extract it to a shared test utility:

```rust
// src/tasty/tests/fixtures.rs (or a test-support crate)
pub(crate) struct TempDir { ... }
```

### Standardize Vitest case helpers

Every `api.test.ts` file uses the same pattern:

```typescript
const api = createCaseApi('case_name')
const symbol = await api.loadSymbolByName('Name')
```

Consider adding a `describeCaseSymbol` helper that bundles the common setup:

```typescript
function describeCaseSymbol(
  caseName: string,
  symbolName: string,
  fn: (ctx: CaseContext) => void
) {
  describe(`${caseName}/${symbolName}`, () => {
    addCaseRuntimeSmokeTests(caseName, symbolName)
    const ctx = { api: createCaseApi(caseName), symbolName }
    fn(ctx)
  })
}
```

---

## What this plan does NOT ask for

- **100% line coverage.** Coverage is a compass, not a destination. We want
  every _behavior_ tested, not every _line_ exercised.

- **Mocking the Oxc parser.** The parser is a dependency we trust. Testing
  against real parse output is more valuable than testing against mocked ASTs.
  The `ScannedFile` → `ParsedFileAst` boundary is where mocking makes sense.

- **Rewriting the implementation to be testable.** The implementation is already
  well-structured for testing: pure functions, clear data boundaries, minimal
  side effects. The gap is that we haven't _written the tests_, not that the
  code is untestable.

- **Making the AST code pretty.** We said it at the top. We mean it. The 16-arm
  `match` in `emit_type_ref` will never look like poetry. It doesn't need to.
  It needs to be _correct_, and the tests are how we prove that. Beauty lives
  in the contract, not in the implementation. Let the engine room be loud.

---

_Tests are not proof that the code works._
_Tests are proof that you understood what "works" means._
_Write the tests that describe the system you want,_
_and the implementation will have no choice but to follow._
