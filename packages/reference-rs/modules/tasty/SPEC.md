# Tasty SPEC

Current freeze, cases, and proof. Design narrative: [README.md](./README.md). Diagnostic codes and refusal rules: [src/diagnostics/README.md](./src/diagnostics/README.md).

Harness: `pnpm agentrs v tasty` (Vitest: station suite plus `tests/suites/`) | `pnpm agentrs c tasty` (Cargo, not proof; see Legend)

---

## 1. Job of the Crate

`tasty` takes a TypeScript source tree (a root directory and include globs), scans the import graph reachable from it with Oxc without running any user code, lowers each declaration into a `TypeRef` graph, resolves references across files, and emits a manifest-first ESM artifact: `manifest.js` plus one chunk per symbol. Problems inside one file or one name warn and compilation continues. A missing scan root, an invalid glob, or an unreadable file refuses the whole request with a coded throw.

---

## 2. Legend

- `[x]` Proven by a station folder under `tests/cases/` named by the cited ID: its `spec.ts` assertion or its committed golden (`manifest.js` or `chunks.json`). A named suite under `tests/suites/` also counts.
- `[ ]` Unproven at station level. The gap is named after the claim. A Cargo test may exist beside it; Cargo tests in `src/` are not proof, so they are cited only to show what is pinned elsewhere.
- Every station also runs the standing gauges and its goldens (`tests/harness/helpers.ts`). A golden that moves without a deliberate rewrite fails the station.

---

## 3. Claims

### 3.1 Lowering: which `TypeRef` kind each construct becomes

Emitted kinds are the strings the JS API reads: `intrinsic`, `literal`, `object`, `union`, `array`, `tuple`, `intersection`, `function`, `constructor`, `mapped`, `conditional`, `type_operator`, `type_query`, `indexed_access`, `template_literal`, `raw`. A `reference` carries no kind field and is read as one.

- [x] TASTY-1 Each exported declaration is one symbol with a stable id, a chunk, a library, and a kind (`interface`, `typeAlias`). Proof: TST-IMP-01, TST-TSX-01.
- [x] TASTY-2 Keyword types lower to `intrinsic`, and literal types to `literal`. Proof: TST-UNI-01.
- [x] TASTY-3 Object literal types lower to `object`. Proof: TST-GEN-01.
- [x] TASTY-4 Function types lower to `function` with params and a return type, constructor types to `constructor`, and call and construct signatures to `call` and `construct` members. Proof: TST-SIG-01.
- [x] TASTY-5 Unions, intersections, arrays, and tuples lower to `union`, `intersection`, `array`, and `tuple`. Proof: TST-UNI-01, TST-SNK-01, TST-OPR-01, TST-TUP-01.
- [x] TASTY-6 `keyof`, `readonly`, and `unique` lower to `type_operator` with an `operator` field. Proof: TST-OPR-01.
- [x] TASTY-7 `typeof x` lowers to `type_query`, keeping the expression text, and `typeof f<Args>` keeps its type arguments in the expression and resolves no value. Proof: TST-QRY-01, TST-QRY-02.
- [x] TASTY-8 Conditional types lower to `conditional` with check, extends, true, and false types. Proof: TST-CND-01, TST-CND-02, TST-CND-03, TST-CND-04.
- [x] TASTY-9 Mapped types lower to `mapped` with their type parameter, source, and modifiers. Proof: TST-MAP-01.
- [x] TASTY-10 Template literal types lower to `template_literal` with text and type parts. Proof: TST-TMP-01.
- [ ] TASTY-11 Indexed access types lower to `indexed_access` with `object` and `index`. Unproven: no station asserts the kind.
- [x] TASTY-12 A name that refers to another declaration lowers to a `reference` carrying `id`, `name`, and `library`, and resolves to a symbol id when the target is in the scan. Proof: TST-IMP-01.
- [x] TASTY-34 A labeled rest tuple element keeps its label and rest flag. Proof: TST-TUP-03.
- [x] TASTY-35 An interface get/set accessor pair is one property, readonly only without a setter. Proof: TST-SIG-02.

### 3.2 `Raw`: source text kept on purpose

`Raw` is an IR choice for variants without a structured lowering. It keeps the source text as `summary`. Raw is not an error and never produces a diagnostic.

- [x] TASTY-13 `Raw` emits no diagnostic: a module full of raw types has an empty `warnings` array. Proof: TST-AUD-01 (golden).
- [x] TASTY-14 `Raw` is produced for import types (`import('./dep').Widget`), `infer U`, type predicates (`value is User`), and the `this` type. Proof: TST-AUD-01.
- [ ] TASTY-15 JSDoc nullable, non-nullable, and unknown types lower to `Raw`. Unproven: no station; the mapping lives only in `src/ast/extract/types/mod.rs`.
- [ ] TASTY-16 The tuple-element reparse fallback in `lower_tuple_element_type` is unreachable for error-free sources. Unproven: the argument is in the code comment and was checked by probing oxc; no station pins it.

### 3.3 References and modules

- [x] TASTY-17 `export *` and `export { X } from` chains resolve through each barrel to the origin symbol, transitively across two hops. Proof: TST-RXP-02.
- [x] TASTY-18 A reference whose target is not in the scan stays an external `reference` with `library` set to its module specifier (`./missing` or a bare package name) and no symbol. Proof: TST-IMP-02, TST-IMP-04.
- [x] TASTY-19 A relative or absolute module request that names no file on disk warns `TST-W-UNRESOLVED-IMPORT` once per (file, specifier), naming both, and the names it provides stay external. This covers `import`, `export * from`, and `export { x } from`. Proof: TST-IMP-02, TST-IMP-03.
- [ ] TASTY-20 A relative target that exists on disk but is outside the include globs, or is not TypeScript (a stylesheet, a JSON file), does not warn. Unproven at station level: `src/tests/error_paths.rs::existing_target_outside_the_scan_is_not_reported` pins it in Cargo only. Its reference still stays external, silently.
- [x] TASTY-21 A bare package specifier that names no installed package stays silent and external. Proof: TST-IMP-04.
- [ ] TASTY-22 Known gap: `./x.js` does not reach `./x.ts` for user files, because the candidates for a `.js` specifier are `x.d.ts` and `x.js` only. Such an import warns `TST-W-UNRESOLVED-IMPORT`. Unproven: no station pins it, and changing resolution changes output.
- [x] TASTY-36 A type parameter or `infer` name never resolves to a same-named symbol inside its scope, while a reference outside that scope still resolves to the top-level symbol. A reference it binds carries `typeParameter` and is never a user-owned dependency. Proof: TST-GEN-03.
- [x] TASTY-37 `export * as ns from` binds one namespace with no flat names; `ns.Leaf` through a named import or an `export { ns } from` relay resolves to `Leaf`. Proof: TST-EXT-02.

### 3.4 Diagnostics: warnings continue, refusals throw

- [x] TASTY-23 A file that fails to parse warns `TST-W-PARSE-ERROR` once, and the rest of the scan completes. Proof: TST-ERR-01.
- [x] TASTY-24 Two `export *` targets that provide one name with different ids exclude that name from the barrel and warn `TST-W-STAR-AMBIGUITY` once per (barrel, name). Proof: TST-RXP-02 (golden).
- [x] TASTY-25 Two user files that export one name index both, the name warns `TST-W-DUPLICATE-SYMBOL-NAME`, and a bare lookup of it is ambiguous. Proof: TST-DUP-01.
- [ ] TASTY-26 Same-file duplicate declarations warn `TST-W-DUPLICATE-DECLARATION` and keep the last; duplicate members of merged interfaces warn `TST-W-DUPLICATE-MEMBER` and keep the first. Unproven at station level: `src/tests/resolve.rs` pins both in Cargo only.
- [ ] TASTY-27 An unreadable scan root, an invalid glob, or an unreadable file throws `TST-E-SCAN-FAILED` and produces no bundle. Unproven at station level: `src/diagnostics/mod.rs` pins the message prefix only.
- [x] TASTY-28 Warnings reach the manifest `warnings` array with `severity`, `code`, `message`, `file`, and an optional `help`. Proof: TST-IMP-02 (golden).
- [x] TASTY-38 A path-shaped `declare module './x'` augmentation is not merged, and warns `TST-W-UNSUPPORTED-AUGMENTATION` naming the augmenting file and the module. Proof: TST-EXT-03.
- [x] TASTY-39 `declare global`, `import x =`, and `export =` in a user file warn `TST-W-UNSUPPORTED-SYNTAX` naming the construct, and the statement is skipped. Proof: TST-EXT-04.

### 3.5 Output

- [x] TASTY-29 Output is deterministic: the name index is sorted, and each station pins `manifest.js` and `chunks.json`. Proof: TST-IMP-03 (golden), and every other station through the shared goldens.

### 3.6 Type-level evaluation: decide exactly or fail closed

- [x] TASTY-30 A conditional resolves only on concrete checks: a generic, `any`, or `never` check stays unresolved. A union check distributes only as a naked-parameter instantiation, and is otherwise judged as a whole. Proof: TST-CND-02, TST-CND-03.
- [x] TASTY-31 Recursive aliases end unresolved within 50 nested expansions or 10,000 steps, and template-literal unions past 1000 members fail closed. The scan never crashes on them. Proof: TST-CND-04.
- [x] TASTY-32 `keyof` lists the keys of a plain interface, and an interface that `extends` another or has an index signature fails closed. A call signature is never a key. Proof: TST-OPR-02.
- [x] TASTY-33 Indexing a rest tuple yields the item type, and an optional element fails closed. Proof: TST-TUP-02.
- [ ] TASTY-40 `keyof` over an interface with type parameters, or with numeric keys, fails closed. Unproven: TST-OPR-02 covers `extends` and index signatures only; no station pins type-parameter interfaces or numeric keys.

---

## 4. Do Not / Tripwires

- Do not make `Raw` an error or a warning. It is the IR for constructs without a structured lowering.
- Do not warn on a bare package specifier that does not resolve. The package may simply be a type nobody needed installed.
- Do not guess a target. An unresolved name stays external with its specifier; never invent a symbol id or a file.
- Do not rename a diagnostic code once a golden pins it. Append a row to `src/diagnostics/codes.rs` and `modules/diagnostics/REGISTRY.md`.
- Do not reword a warning message a golden pins without rewriting that golden on purpose.
- Do not state a claim without a station or suite behind it. Such a claim is `[ ]` with its gap named.
- Do not claim declarations are kept for a file the parser abandons. The `TST-W-PARSE-ERROR` message says "keeping the recoverable declarations", but oxc drops the whole body on a fatal error.
- Do not give a case folder a label as its name. `case.json` `name` and README line 1 are the one-line claim (AGENTS.md section 7).
