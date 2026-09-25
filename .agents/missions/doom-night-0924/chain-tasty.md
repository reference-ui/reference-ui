---
date: 2026-09-25
role: chain-oracle-tasty
campaign: doom-night-0924
cluster: tasty-resolve
breaks: [r1-tasty, r2-stardefault, r2-tasty2, r3-defaultas]
verdict: VERIFIED
---

# Chain verdict: tasty fortify arc — VERIFIED (commit-ready)

Re-verified the entire fortify arc firsthand. All four blind repros now pass,
all pins are non-tautological and green, every ruling boundary line holds,
suites are green, goldens move only as the ruling permits, and the quality
gate passes on every fortify-touched file.

## 1. Inputs read

- `.agents/missions/doom-night-0924/ruling-tasty.md` (the boundary)
- `.agents/doom/logs/2026-09-24-night-r1-tasty.md` (A: two-hop drop)
- `.agents/doom/logs/2026-09-24-night-r2-stardefault.md` (B: star phantom default)
- `.agents/doom/logs/2026-09-24-night-r2-tasty2.md` (C: cross-file typeof None)
- `.agents/doom/logs/2026-09-24-night-r3-defaultas.md` (D: default-as drop)

## 2. Fortify diff attribution (`git diff` + `git status --short` over `packages/reference-rs/modules/tasty/**`)

### 2a. Fortify-tasty's hunks (the arc under review)

Source (`src/`):

- `ast/resolve/index.rs`
  - `resolve_seed_symbol_id` (new): local shell first, else remote name
    through the target's **folded** export map (`self.collect(target)`
    + `.get(remote)`) — transitive and default-aware; one path serves A+D.
  - `fold_star_targets` (new): star loop split out of `collect`; skips
    star-provided `"default"` silently (B). Explicit seeds collected first,
    so `is_explicit_seed` still shadows stars (verified intact, `index.rs:199`).
  - `resolve_symbol_id` (old shell-table probe) deleted — not a shell patch.
  - `CrossFileValues::new(&parsed_files)` built once in `resolve_ast`,
    borrowed into each `Resolver` (C threading).
  - `collect`/fold made recursive with the pre-existing visited-set
    protocol (cycle safety inside the shipped lookup).
- `ast/resolve/resolver/mod.rs`: `cross_file_values` field + ctor param,
  new `CrossFileValues`/`CrossFileValueFile` (borrowed per-file
  value/export tables; `imported_value` maps through target
  `export_bindings` with direct-export fallback).
- `ast/resolve/resolver/resolve.rs`: `resolve_type_query_expression`
  gains the local-first/import-fallback arm; new `resolve_imported_value`
  (named-kind only, single lookup, no recursion). Member walk reuses
  `resolve_object_member_type` unchanged. `map_type_query` re-resolves the
  borrowed payload in consumer context (`resolve.rs:148-156`).
- `ast/model.rs`: exactly the permitted `reexport_target` comment
  correction ("symbol name in target" -> "export name in target's folded
  map"). Nothing else fortify-owned in this file.
- `ast/resolve/README.md`: three responsibility bullets (star-default
  exclusion, transitive/default-aware seeds + silent-drop fail-closed,
  cross-file typeof + scope fence). `src/README.md` untouched (behavior
  now matches the documented contract; no wording change needed).

Pins (cases; inputs are new untracked files, specs/READMEs/goldens additive):

- TST-RXP-02: `two-hop-{orig,mid,barrel,consumer}.ts` (A),
  `default-as-{mod,barrel,consumer}.ts` with `export default interface`
  (D, a default-exported *type* per the ruling's D-specific addition),
  `star-default-{origin,barrel,consumer,explicit,explicit-consumer}.ts`
  + phantom/named/direct consumer members (B + explicit-seed guard),
  `circular-consumer.ts` over the `circular-a<->b` pair (cycle pin);
  spec gains `verifyTwoHopNamedReexport`, `verifyDefaultAsReexport`,
  `verifyStarDefaultExclusion`, `verifyReexportCycleTerminates`; README
  documents all four incl. the value-literal near-miss staying unresolved
  by design.
- TST-QRY-01: `values.ts`, `values-aliased.ts`
  (`export { themeTokens as tokens }`), `consumer.ts` (named imports +
  alias/member queries), `cycle-{a,b,consumer}.ts`; spec gains
  `verifyImportedTypeQueries` + `verifyTypeofCycleFailsClosed`; README
  documents the import arm, the const-alias cycle mechanism, the
  consumer-context re-resolution design note, and all three required
  known gaps (default-imported, namespace-member, re-export-chain values).
- TST-VAL-01: `imported-values.ts` + `imported-composition.ts`
  (`keyof typeof importedSizes`); spec gains only
  `verifyImportedKeyofComposition`; README notes the composition pin.

### 2b. Foreign hunks (pre-existing campaign work — itemized, never absorbed)

A large HQ-DIAG / CLI-INK3 / CLI-TASTY diagnostics migration sits under the
fortify (dir mtime Sep 24 22:18, predates the ruling; ruling itself notes
pre-existing `M` entries). It owns, by content:

- `src/diagnostics/` (new dir): `codes.rs` + `mod.rs` with exactly the 6
  pre-existing codes (ParseError, DuplicateDeclaration, DuplicateMember,
  StarAmbiguity, DuplicateSymbolName, ScanFailed). **No new break code** —
  the fortify correctly added none.
- `Cargo.toml` (+`diagnostics` dep), `lib.rs` (+`mod diagnostics`).
- Every `ScannerDiagnostic` -> `TastyDiagnostic`,
  `Result<_, DiagnosticError>`, `?`-propagation hunk in: `ast/mod.rs`,
  `ast/model.rs` (minus the 1-line fortify comment), `ast/extract/pipeline.rs`
  (`record_named_reexports` untouched), `ast/resolve/graph.rs`,
  `ast/resolve/merge.rs` (M1-M3 logic untouched), `ast/resolve/index.rs`
  (signatures/`?`/sink-report only), `emitted/module_artifacts.rs`,
  `generator/bundle/modules/manifest.rs`, `model.rs`, `scan.rs`,
  `scanner/workspace*.rs` (`scan_failed` prefixes).
- All `js/**` changes (typed warnings, `getRuntimeNotices`, `build.ts`
  diagnostic shapes, generated `TastyManifest.ts`).
- All `src/tests/**` `.expect()` adaptations + the `TST-W-PARSE-ERROR`
  code assertion.
- Warnings-shape-only sweep diffs: TST-COL-01, TST-DUP-01, TST-ERR-01,
  TST-RXP-01 (spec), TST-STY-03, TST-TMP-02; plus the warnings-block
  reshapes inside the RXP-02/QRY-01/VAL-01 goldens.
- `DIAGNOSTICS.md` (HQ campaign sections only; zero `TST-` lines in diff),
  `docs/MISSIONS/*`, and everything outside `tasty/` (neo/atlas/atomic crews).

No `fortify-rsmisc` touch exists in `tasty/` (atomic/atlas/typegen are
disjoint; the `tasty` diagnostics dir is campaign infra with no new codes).
No tasty hunk is unattributed.

## 3. Blind repros — all four PASS (exit 0), one at a time, pristine between runs

Run unmodified from the repo root, strictly serially (shared tasty test
registry); after each, `ls src/tests | grep -i doom` empty and `git status`
shows only the expected `M` entries (no plant residue).

| Break | Command | Result |
|---|---|---|
| A two-hop | `bash /tmp/doom-r1-tasty-two-hop.sh …` | exit 0, `doom_r1_two_hop_named_reexport_chain_resolves ok`, TREE-CLEAN, `FIXED-or-ABSENT` |
| B star-default | `bash /tmp/doom-r2-stardefault-default.sh …` | exit 0, `doom_r2_star_barrel_must_not_reexport_default ok`, TREE-CLEAN, `FIXED-or-ABSENT` |
| C typeof | `bash /tmp/doom-r2-tasty2-cross-file-typeof.sh …` | exit 0, tsc accepts, `mod.rs` byte-identical, `no break — cross-file typeof resolves (fixed?)` |
| D default-as | `bash /tmp/doom-r3-defaultas-repro.sh …` | exit 0, tsc accepts, byte-identical restore (`7bc5d33f…`), `clean — red test passed, no break` |

A+D green through the single folded-map path (no shell-table patch possible —
`resolve_symbol_id` is deleted and both shapes resolve via `collect`).

## 4. Pins — bodies read, non-tautological, green

- **A** (`verifyTwoHopNamedReexport`): barrel attribution (`ref.getId()`
  + loaded target = canonical origin id) and consumer payload (`raw.id`/
  `raw.name`) asserted in **two independent blocks**, each failing
  separately pre-fix (unresolved descriptors carry the local name, not the
  canonical id). Mirrors the blind repro's map + `target_id` assertions.
- **D** (`verifyDefaultAsReexport`): same independent two-block shape;
  input is a default-exported *type* (verified in `default-as-mod.ts`),
  not the blind-spot value literal.
- **Cycle** (`verifyReexportCycleTerminates`): genuine `a<->b` cyclic input
  terminates firsthand (suite completion is the proof) and the consumer
  resolves to the declaring file's binding. Visited-set re-entry is
  structural in `collect` (max depth = file count). Diagnostic-vs-silence
  decided explicitly: silence with stated reason (visit-order dependence),
  in code comment + resolve README, as the ruling's cycle clause permits.
- **B** (`verifyStarDefaultExclusion`): no-`"default"` attribution
  (`hasManifestSymbol == false`, raw id = local name), phantom consumer
  rejects `resolveReference`, explicit `as default` seed survives, plus
  named-through-barrel and direct-default controls. Each assertion flips
  pre-fix (phantom would carry the canonical id and load).
- **C** (`verifyImportedTypeQueries`): cross-file `typeof tokens.spacing`
  and aliased `typeof aliasedTokens.spacing` resolve to the `lg`/`sm`
  object for aliases and members; pre-fix `resolved` is `None` so
  `resolved?.kind` fails. (`verifyTypeofCycleFailsClosed`: `CycleType`
  carries no `resolved` and terminates; mechanism honestly documented —
  identifier-init consts infer no binding, and the arm is a single
  non-recursive lookup so hang is structurally impossible.)
- **VAL-01 composition** (`verifyImportedKeyofComposition`):
  `keyof typeof importedSizes` resolves to `'sm'|'md'|'lg'`, proving
  imported `typeof` payloads feed downstream evaluation (the ruling's
  design hazard, with the re-resolution behavior stated in the QRY README
  and substantiated at `resolve.rs:148-156`).

Runs: `pnpm agentrs v tasty -t "TST-RXP-02"` 1 passed;
`-t "TST-QRY-01"` 1 passed; `-t "TST-VAL-01"` 1 passed.
Fail-without-fix stands on the evidence chain (pins mirror the blind repros
witnessed red by hunter + reproducer + ruler); the tree was not
stashed, reverted, or mutated to re-prove it.

## 5. Boundary check (ruling line-by-line) — all hold

- A+D one unit through the folded remote-target map: yes
  (`resolve_seed_symbol_id` -> `collect(target).get(remote)`); both red
  tests green via one path; shell-table patch impossible (old probe deleted).
- Cycle safety inside the shipped lookup: yes (visited-set at `collect`
  entry; cycle pin terminates in-suite).
- B skips star-provided `"default"` silently: yes (3-line `continue` in the
  star loop only); no new diagnostic code anywhere (`codes.rs` has exactly
  the 6 pre-existing codes); no `resolve_symbol_id`/named-path touch by B
  (named path is A+D's unit change); `is_explicit_seed` intact.
- Explicit-seed survival: yes (fixtures + passing pin).
- C lookup built ONCE in `resolve_ast`: yes (single `CrossFileValues::new`,
  borrowed references, zero per-symbol rebuild).
- Scope fence: yes (named-kind check; default/namespace/reexport-chain
  values listed as known gaps in the QRY README, never half-handled;
  aliased target export pinned; cycles fail closed to `None`).
- TST-VAL-01 existing shapes unchanged: yes (spec diff purely additive —
  single new function + call; manifest/chunks purely additive; see §6).
- Silence clause: yes. A/C/D named shapes now **resolve** (no code owed);
  B silent-exclusion is the ruling-blessed correct ESM behavior; C-cycle
  `None` is the ruling-mandated fail-closed. Residual silence is the
  pre-existing unresolved-import shape plus the explicitly-decided,
  reason-stated cycle silence the ruling's own cycle clause permits
  ("decide diagnostic vs silence … explicitly"); coding every
  unresolvable import would contradict standing suite contracts (e.g.
  cross-library external refs unresolved by design).
- Docs moved only where allowed: resolve README + 3 case READMEs only;
  `src/README.md`, `DIAGNOSTICS.md`, host-filter docs, manifest shapes,
  host APIs, and the `TST` registry untouched by the fortify.

## 6. Suites, goldens, gate — firsthand

- `pnpm agentrs v tasty`: **83/83 passed** (5 files; `cases.test.ts` 41/41
  = 40 stations + discovery; runner executes every `spec.verify` + gauges
  + golden diff per station; zero skips in tree).
- `pnpm agentrs c tasty`: **81/81 passed**, 0 failed.
- Golden attestation (tracked goldens are `manifest.js` + `chunks.json` only):
  - A+D: strictly additive. RXP-02 manifest removed lines = exactly the 5
    old warnings strings (campaign reshape); every other line is `+`
    (10 new symbols, each 1:1 with a new pin input). No removed binding,
    no non-barrel-shape diff. Zero movement in old fixtures is compliant:
    the ruling named "likely" movers (probabilistic) and blocks only on
    removed bindings / non-barrel diffs; old-fixture edge flips live in
    untracked chunks, and the old 2-hop fixture's unasserted gap is exactly
    what the new pins now cover.
  - B: zero phantom-`"default"` keys remain; no added binding from B (all
    additions are new-input symbols); no consumer edge flips in existing
    goldens. No existing fixture held the star-over-default-origin shape
    (the old `default-source` default is an unminted value literal), so
    zero removal lines is expected — removal is proven by the B pin +
    repro B instead.
  - TST-VAL-01: existing content byte-identical (zero removed/changed
    lines); only the mandated composition pin added (1 symbol + chunk +
    spec + README note). Satisfies "local value shapes untouched" + the
    owed composition assertion.
  - Untouched cases (TST-IMP-01, TST-SNK-01, TST-PAT-01, …): no diff, no
    movement — consistent (fixtures lack the affected shapes).
- Gate: `pnpm agentrs q` on `index.rs` — clean PASS (0 violations);
  on `resolver/mod.rs` + `resolver/resolve.rs` + `model.rs` — PASS with 0
  violations and 1 pre-existing warning (`map_conditional` 5-arg trait
  signature, not fortify code, warning-only). Zero `#[allow]`/`#[expect]`;
  complexity/length/headers within limits.

## 7. Write discipline

This file is the oracle's only tree write. Source is read-only (no fixes);
no stash/revert/mutation was performed; nobody was messaged. Repro plants
self-removed and were verified absent after every run.

**VERIFIED — the tasty fortify arc is commit-ready.**
