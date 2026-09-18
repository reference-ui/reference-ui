# Panda v2 cross-file resolution corpus

Corpus: `vendor/panda` (v2 beta tree, read-only) — `design-notes/cross-file-resolution.md`
plus `crates/pandacss_extractor/tests/{cross_file,imports,token_calls}.rs`
(51 + 18 + 21 tests). Compared against Neo SITE (`packages/reference-neo/tests/cases/site/`)
and Atomic stations (`packages/reference-rs/modules/atomic/`). Contrast; do not port.

---

## 1. Executive summary

v2 resolves `import { x } from './tokens'` for real: `oxc_resolver` (relative +
extension probing + tsconfig paths + package exports), a hash-validated
`path → exports` cache with dep provenance, per-batch sessions, watch-hash
inversion in `Project`, a `(path, export)` cycle guard, and silent drops on
read failure. Same-file `Resolver` hands named specifiers to
`CrossFileResolver`; default/namespace specifiers return `None`.

Reference has no resolver at all. `collect_project_constants`
(`modules/atomic/src/lib.rs:175-191`) parses every included source and merges
**all** `const` declarators at every depth into one project-wide
`LocalConstants` namespace (`extract/constants/index.rs:88-98`: scalar leaves
union, existing object keys win). The collector ignores imports, functions,
and spreads (`extract/constants/collect.rs:1-5`). Cross-file "resolution" is
therefore **merge, not resolve**: ATM-SITE-16's `App.tsx` uses
`theme.primary` with no import of `theme` whatsoever, and it compiles.
Re-export statements are inert; cycles are inexpressible; there is no cache
to invalidate because Neo re-globs and re-reads `include` on every sync
(`packages/reference-neo/src/sync/compile-files.ts`).

Consequence for the parity table: most v2 *observables* (the value resolves)
hold trivially whenever the origin `const` is scanned; most v2 *mechanisms*
(aliases, re-export chains, pure helpers, tsconfig paths, watch hashes) are
absent. The five genuinely missing shapes are the verdicts that matter, and
the lib/Book grep below says authors write none of them — so every missing
shape below carries a build-or-absence recommendation, not just a gap.

Reality check (2026-09-18, `packages/reference-lib/src/components/`):
zero re-exported style consts consumed at `css()` sites (barrels re-export
components/hooks/utils only, e.g. `Accordion/index.ts` = `export * from
'./Accordion'`); zero tsconfig-alias imports (`@/`/`~/`/`#`); zero Book
cross-file style imports; the only cross-file style-ish values are
`Toast/toastStyles.ts` (`TOAST_HOST_STYLES`, a raw CSS string, direct
single-hop import — not a `css()` object) and
`Reference/theme/tokens.ts` (`referenceBrowserTokenConfig`, a runtime token
config, not extract input). No imported helper is ever called inside
`css({})` in lib.

---

## 2. File map

Line counts from the vendored files. Family tags: RESOLVE | REEXPORT |
CACHE-SESSION | CYCLE | PUREFN-XFILE | FACTORY-XFILE | IMPORT-SCAN |
TOKEN-CALL.

| Path | Lines | Tests | Coverage | Family |
|---|---:|---:|---|---|
| `design-notes/cross-file-resolution.md` | 165 | 0 | Cache shape, watch inversion, fold/refuse lists, hand-off, cycle guard, I/O failures, StyleTree hand-off | — |
| `crates/pandacss_extractor/tests/cross_file.rs` | 1635 | 51 | Real resolver: literals, aliases, re-exports, cycles, cache/session/watch hashes, pure-fn + factory folds | RESOLVE, REEXPORT, CACHE-SESSION, CYCLE, PUREFN-XFILE, FACTORY-XFILE |
| `crates/pandacss_extractor/tests/imports.rs` | 591 | 18 | Import scan: named/alias/namespace/default/type-only/side-effect/string-literal/re-export-opt-in | IMPORT-SCAN |
| `crates/pandacss_extractor/tests/token_calls.rs` | 629 | 21 | `token()`→hex / `token.var()`→var at parse, modifiers, fallbacks, templates | TOKEN-CALL |

---

## 3. Parity table by shape

Verdicts: **HAVE** (cite) / **IN-DIALECT-MISSING** (gap, with recommendation) /
**ABSENCE** (deliberate or architectural — do not port). "Via merge" means the
observable holds because every scanned file's consts share one namespace, not
because any import was followed.

### RESOLVE — value resolution across files

| # | Shape (v2 test) | Verdict | Ours |
|---|---|---|---|
| R1 | Scalar const from sibling file (`named_const_import_resolves_to_value`) | **HAVE** | NEO-SITE-07 / ATM-SITE-16, via merge — the import statement itself is not even required |
| R2 | Object const + member select (`imported_object_folds_member_access`) | **HAVE** | ATM-SITE-16 (`theme.primary`); `get_object_prop` over the merged index |
| R3 | Exported object referencing file-local or imported consts (`exported_object_can_reference_file_local_const`, `..._imported_const`: `{...base, padding}`, `{color: brand}`) | **IN-DIALECT-MISSING** | `record_object_entry` (`collect.rs`) records literal props only; identifier values and spreads inside const objects are unindexed. Same-file gap too — owned by the **fold-table agent**, surfacing here |
| R4 | File-local alias chain (`exported_alias_chain_resolves_whole_object`: `const button = base; export const primary = button`) | **IN-DIALECT-MISSING** | `literal_leaf` returns `None` for identifier inits. Same-file gap — fold-table owns |
| R5 | Imported object spreads, top-level and under condition (`imported_object_spreads_under_condition`) | **HAVE** (mechanism, unpinned) | ATM-SITE-11 unpack × SITE-16 merge; no station pins the cross-file instance — see proposed row P1 |
| R6 | Aliased value import (`aliased_import_resolves_by_exported_name`: `import { brand as primary }`, use `primary`) | **IN-DIALECT-MISSING** | Merge keys by **declared** name (`brand`); the consumer's local alias (`primary`) resolves to nothing → dynamic warning + drop. `bindings.rs` maps aliases for `css` identity only (ATM-SITE-15), never for values. **Recommend: build** (P2) — the one shape authors plausibly write |
| R7 | `export let` unmutated folds (`export_let_currently_folds_too`) | **HAVE** (unpinned, laxer) | `visit_variable_declarator` has no kind check — `let`/`var` inits are collected with no mutation analysis. Laxer than v2's unmutated-only rule; pin or tighten at HQ's call |
| R8 | Unresolvable specifier / missing export drops the call (`unresolvable_specifier_drops_outer_call`, `missing_export_drops_outer_call`) | **HAVE** (with diagnostic) | Unknown identifier → `Dynamic non-literal identifier` warning + no ghost (fail-closed-*plus*-diagnostic vs v2's silent drop; NEO-SITE-06 precedent for dynamics) |
| R9 | Imported conditional object keeps both arms (`imported_conditional_object_keeps_encode_branches`) | **HAVE** (mechanism, unpinned) | RS-37 branching leaves (every depth) × merge; same-file arm fan-out pinned by ATM-SITE-23 — see proposed row P4 |

### REEXPORT — barrels and chains

| # | Shape (v2 test) | Verdict | Ours |
|---|---|---|---|
| X1 | 1/2/3-hop `export { x } from` chains, incl. through barrels (`deep_import_chain_resolves_through_re_export`, `cache_reloads_exports_through_{a_re_export,an_imported_alias,a_three_hop_re_export}`, `session_reads_a_shared_re_export_chain_once`, `cache_reloads_exports_through_a_re_export` dep provenance) | **IN-DIALECT-MISSING** as mechanism; observable holds **only when the origin const is scanned** | `export … from` adds nothing to the merge — the barrel is inert. Value resolves iff the origin file is in `include`, with or without the barrel. v2's semantic (barrel suffices; dep-hash busts on origin change) has no counterpart. **Recommend: ABSENCE** — lib writes zero re-exported style consts (grep §1); if HQ disagrees, one probe-first row (P3, likely green via merge, documents origin-must-be-scanned) |

### CACHE-SESSION / CYCLE / resolver machinery

| # | Shape (v2 tests) | Verdict | Ours |
|---|---|---|---|
| C1 | tsconfig `paths` aliases for style imports (`tsconfig_path_alias_import_is_matched`) | **ABSENCE** (architectural) | No module resolution exists; zero `@/`-style imports in lib |
| C2 | Extension probing (`extensionless_import_resolves_through_probed_extensions`) | **ABSENCE** (architectural) | Same — file set comes from `include` globs, never from specifiers |
| C3 | Cache reuse / reload-on-change / drop-removed / delete-recreate / missing-appears / unrelated-importer-stable (7 tests) | **ABSENCE** (architectural) | No cache; every sync re-reads every file. Staleness is impossible by construction |
| C4 | Session pinning, read-once chains, unresolved/unreadable stickiness (4 tests) | **ABSENCE** (architectural) | No sessions; single-shot compile per sync |
| C5 | Watch-hash inversion, dep→importer invalidation (`cache_reloads_exports_through_a_re_export` deps; design-notes §Watch) | **ABSENCE** (architectural) | `watch.ts` re-syncs whole on parcel events; no dep graph, no hash comparison, no `affectedFiles` cascade |
| C6 | Cycle drop + guard reset (`cyclic_imports_drop_safely_without_panic`, `cycle_guard_is_reset_between_extractions_in_one_session`) | **ABSENCE** (architectural, free) | Merge is non-recursive — there is no edge to cycle on. Nothing to guard, nothing to test |
| C7 | No-resolver-no-folding, Send+Sync, memory-fs isolation, fs-mutation visibility (4 tests) | **ABSENCE** (harness/infra) | No resolver type; multi-file inputs ride the frozen `NativeCompileRequest` sources array |

### PUREFN-XFILE — imported pure helpers

| # | Shape (v2 test) | Verdict | Ours |
|---|---|---|---|
| F1 | Imported arrow / function-decl call folds; computed-key helper; object-return spread; re-exported pure fn (5 tests) | **IN-DIALECT-MISSING** | Functions are ignored by the collector → call values warn-and-skip (NEO-SITE-06). **Do not build here** — pending the HQ pure-helper dialect decision (mission brief residue #1); the same-file fold/drop table comes first |
| F2 | Bare imported fn value / aliased pure-fn export do NOT fold (2 tests) | **HAVE** (trivially) | Bare function values fold nowhere in our dialect |

### FACTORY-XFILE — keyframes / positionTry / viewTransition consts

| # | Shape (v2 tests) | Verdict | Ours |
|---|---|---|---|
| K1 | Imported `keyframes()` / `positionTry()` consts fold (incl. prefix, barrel, alias, multi, joint); `viewTransition()` does not fold as a value (8 tests) | **ABSENCE** (product) | Keyframes are config-level blocks (ATM-LAYER-10/14), not imported factory consts; no `positionTry`/`viewTransition` language exists |

### IMPORT-SCAN — `imports.rs` (18 tests)

Ours scans imports for **site identity only** (`bindings.rs:79-110`: Reference
packages only; named+local recorded; namespace recorded; default ignored;
type-only ignored). It never follows a specifier to a file.

| # | Shape (v2 tests) | Verdict | Ours |
|---|---|---|---|
| I1 | Named / aliased / namespace / default / type-only (decl + specifier) / default+combos / multi-decl / non-import-ignore / tsx (12 tests) | **HAVE** | ATM-SITE-15 (namespace + internal alias extract; type-only + default don't) + NEO-SITE-04 (alias + namespace paint) |
| I2 | String-literal specifiers (`import { "foo-bar" as x }`) | **ABSENCE** | No author writes this for `css`; the 4 identity rules suffice |
| I3 | Side-effect imports | **ABSENCE** | No binding, nothing to gate |
| I4 | Re-export scan opt-in (`export { C } from`, `export *`) | **ABSENCE** | Barrels carry components, never style consts (§1 grep) |
| I5 | Parse-error diagnostic + span coverage (2 tests) | **HAVE** (analogue) | Parse errors → `Diagnostic::error` with file location (`lib.rs` `parse_and_extract`); byte spans are not a contracted surface |
| I6 | JS-parity anchors (3 tests) | **ABSENCE** (n/a) | No JS extractor to match; the Rust scan is the only implementation |

### TOKEN-CALL — `token_calls.rs` (21 tests): contrast, not a gap

v2 folds `token('colors.red.500')` to `#ef4444` **at parse time** against a
`TokenDictionary` (with `token.var()`→`var()`, `/opacity`→`color-mix`,
fallbacks, template interpolation, shadowing, and unknown-path drops). SITE
SPEC lists `token()` inlining as an **approved absence**: Reference authors
write `{path}` refs, resolved at emit — ATM-TOKEN-11 prints
`--x: var(--colors-…)` aliases in `@layer tokens`. The 21 tests map to no
Reference shape and propose no rows; the one correspondence worth keeping is
*unknown path + fallback → fallback / without fallback → drop*, which is our
`{path}` miss behavior's problem, not this corpus's.

---

## 4. Proposed rows (none filed — ledger untouched)

Atomic stations first, per the mission; no Neo rows — SITE-07 covers the
browser half, and new Neo rows wait for stations to land. IDs are tentative
(next free: ATM-SITE-24+).

| ID (proposed) | README first line | Input | Assertion | v2 evidence |
|---|---|---|---|---|
| **ATM-SITE-24** | Cross-file const object spreads, top level and under condition | `styles.ts`: `export const hover = { color: 'red' }`; `App.tsx`: `css({ ...hover, bg: 'blue' })` + `css({ _hover: { ...hover } })` | Both spreads land with plans; zero diagnostics | `cross_file.rs` `imported_object_spreads_under_condition` — pin only, mechanism exists (R5) |
| **ATM-SITE-25** | Aliased value import resolves by exported name | `tokens.ts`: `export const brand = 'red'`; `App.tsx`: `import { brand as primary }`; `css({ color: primary })` | Utility + plan; zero diagnostics | `aliased_import_resolves_by_exported_name` — **build** (R6); local-alias→declared-name map at collect or walk time |
| **ATM-SITE-26** | Barrel re-export resolves when the origin is scanned (probe) | `tokens.ts`: const; `barrel.ts`: `export { brand } from './tokens'`; `App.tsx` imports from barrel | Likely green via merge — documents origin-must-be-scanned; if red, decides X1 build-vs-absence | `deep_import_chain_resolves_through_re_export` — probe only, and only if HQ rejects the X1 absence recommendation |
| **ATM-SITE-27** | Imported conditional object compiles both arms | `tokens.ts`: `export const c = { color: flag ? 'red' : 'blue' }`; `App.tsx`: `css({ ...c })` | Both arm utilities + plans | `imported_conditional_object_keeps_encode_branches` — pin only (R9) |

Explicitly **not** proposed here: R3/R4 (fold-table agent owns const-object
identifier values and alias chains — same-file gaps); F1 (HQ pure-helper
dialect decision first); K1, C1–C7, I2–I4, I6 (absences §5).

---

## 5. Out of scope (do not mint cases)

| Topic | v2 source | Why |
|---|---|---|
| `oxc_resolver`, tsconfig paths, extension probing, package exports | `cross_file.rs` C1–C2; design-notes §Summary | No resolver; file set is `include` globs |
| Export cache, source hashes, dep provenance, sessions, read-once | `cross_file.rs` C3–C4; design-notes §Cache/§Lifecycle | Single-shot compile; reread every sync |
| Watch-hash inversion, `affectedFiles` cascade | design-notes §Watch invalidation | `watch.ts` re-syncs whole |
| Cycle guard | `cross_file.rs` C6; design-notes §Cycle guard | Merge is non-recursive; cycles inexpressible |
| `css.raw` / `cva.raw` / pattern-raw folds across files | 3 `css_raw` tests; design-notes §What folds | SITE SPEC approved absence (`css.object()` + plain objects) |
| Imported/re-exported pure helpers | `cross_file.rs` F1 | HQ dialect decision first; same-file table first |
| `keyframes()` / `positionTry()` / `viewTransition()` factory consts | `cross_file.rs` K1 (8 tests) | Config-level keyframes only (ATM-LAYER-10/14); no factory language |
| `token()`→hex / `token.var()` parse-time fold | `token_calls.rs` (21 tests) | SITE SPEC approved absence; `{path}` refs + ATM-TOKEN-11 |
| `export default`, namespace/default value imports | design-notes §What doesn't fold | v2 itself refuses; ours ignores non-const bindings likewise |
| String-literal specifiers, side-effect imports, re-export scanning | `imports.rs` I2–I4 | Identity needs 4 rules only; barrels carry no style consts |
| Send+Sync, memory-fs isolation | `cross_file.rs` C7 | Harness properties, not language |

---

## Appendix — verdict counts

23 shapes from 90 v2 tests: **HAVE 10** (R1, R2, R5, R7, R8, R9, F2, I1, I5 +
R8's diagnostic upgrade), **IN-DIALECT-MISSING 5** (R3, R4, R6, X1, F1),
**ABSENCE 8** (C1–C7 as one architectural family counted once each above;
K1, I2–I4, I6, TOKEN-CALL). Top-5 missing = the five MISSING verdicts, in
§3 order: aliased value import (build), re-export chains (absence recommended),
imported pure helpers (HQ first), const-object identifier values (fold-table),
alias chains (fold-table).
