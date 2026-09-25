---
date: 2026-09-25
role: chain-oracle-rsmisc
campaign: doom-night-0924
cluster: rsmisc
breaks: [r1-trio-atlas-silence, r1-atomic-bare-attr, g1-emit-recipe-stem, g1-extract-const-important]
verdict: VERIFIED
---

# Chain verdict: rsmisc fortify arc — VERIFIED (commit-ready)

Re-verified the entire fortify arc firsthand. All four blind repros now pass
(exact commands, serially, pristine between runs), all pins are
non-tautological and green, every ruling boundary line holds, suites are
green (one atomic vitest failure proven HEAD-red outside the arc, see §6),
goldens move only by the campaign reshape plus zero fortify-attributable
drift, and both quality gates pass on every fortify-touched file.

No fortify report file exists in the tree; every "stated" boundary item is
satisfied in-tree (code comments, SPEC, READMEs, pin docs) and re-proven
firsthand below. The unary audit probe (§5-D) is recorded here.

## 1. Inputs read

- `.agents/missions/doom-night-0924/ruling-rsmisc.md` (the boundary)
- `.agents/doom/logs/2026-09-24-night-r1-trio.md` (A: atlas package silence)
- `.agents/doom/logs/2026-09-24-night-r1-atomic.md` (B: bare-attr spans)
- `.agents/doom/logs/2026-09-24-night-g1-emit.md` (C: recipe stem collision)
- `.agents/doom/logs/2026-09-24-night-g1-extract.md` (D: const `!` plan keys)
- Both blind-repro scripts read before running (self-cleaning verified).

## 2. Fortify diff attribution

Scope: `git diff` + `git status --short` over
`packages/reference-rs/modules/{atlas,atomic,typegen}/**` plus Neo consumer
surface. `git diff -G` sweep over every fortify-shaped token
(`package_scan_failed`, `DUPLICATE-RECIPE-STEM`, `bare_attr`,
`push_folded_want`, `folded_value_to_json`, `seen_stems`,
`split_important`, `is_printable_recipe`, pin names) closes the file list:
nothing fortify-shaped hides outside the files below.

### 2a. Fortify-rsmisc's hunks (the arc under review)

A — atlas silence (new warning code, shape (i)):

- `modules/atlas/src/analyzer.rs:94-108` — both package guards now push
  `crate::diagnostics::package_scan_failed(&package_name, err)?` instead of
  bare `continue` (lines 97, 104).
- `modules/atlas/src/diagnostics/codes.rs` (untracked, campaign-created dir;
  fortify owns the new-code lines): `PackageScanFailed` variant (26-27) +
  appended table row `ATL-W-PACKAGE-SCAN-FAILED` (47-50) + test listing.
- `modules/atlas/src/diagnostics/mod.rs`: `package_scan_failed` constructor
  (63-74; warning, backticked package, reason carried) following the
  `unresolved_include_package` pattern + wire test
  `package_scan_failures_warn_naming_the_package` (120-127).
- `modules/atlas/src/diagnostics/README.md`: flow step (15-16) + table row
  (44). (Row 44 vs prose "All four" at line 32 — 1-word staleness, §7.)
- `modules/atlas/js/types.ts:19` — TS union gains the code.
- `modules/atlas/tests/package-scan.test.ts` (new, whole file) — the A pin.
- `modules/diagnostics/REGISTRY.md:164` — registry row (committed via
  trivial's `8e667e190`, see §2c).
- `packages/reference-neo/src/native/generated/atlas/.../types.d.ts:19` —
  regen union member (file campaign-generated).

B — bare-attr spans (locating path, attr-name span):

- `modules/atomic/src/extract/jsx/mod.rs:82-92` — bare-attr site mints via
  `ctx.expression_walk(&name, origin, false)` +
  `push_want(Bool(true), smallvec![], false, Some(attr.name.span()))`;
  `ctx.authored.push` intact below; `Want` import removed (zero remaining
  uses in file, verified); `mod bare_attr_tests;` wired.
- `modules/atomic/src/extract/jsx/bare_attr_tests.rs` (new, whole file) —
  the twelfth-shape pin (NOT a DIAG-05 extension).

C — recipe stems (first-stem-wins + mirror + `TGN-W-DUPLICATE-RECIPE-STEM`):

- `modules/typegen/src/emit/recipes.rs:18,26-31` — `seen_stems` guard before
  both `push_type_alias` calls; per-name `recipe_type_stem` guard stays.
- `modules/typegen/src/diagnostics/collect.rs` (dir campaign-created):
  mirror `seen_stems` (50, 63-66, same `list_recipes()` walk, same loser) +
  `is_printable_recipe` gate (75-77) mirroring `variant_props_body`.
- `modules/typegen/src/diagnostics/codes.rs`: `DuplicateRecipeStem`
  variant (34-35) + appended row (71-74) + test listing.
- `modules/typegen/src/diagnostics/mod.rs`: `duplicate_recipe_stem`
  constructor (122-129) + constructor vector (158, 169) + exact wire-bytes
  vector (240-244).
- `modules/typegen/src/diagnostics/README.md`: flow step (20-22) + row (55).
- `modules/typegen/SPEC.md` recipe lane — joint-validity clause
  (first-wins in `list_recipes()` order, loser skipped both aliases).
- `modules/typegen/js/types.ts:27` — TS union gains the code (+
  campaign `TypegenDetailedEmit` interface in the same hunk, not C's:
  `emitDtsDetailed` predates the fortify per the hunt repro).
- `modules/typegen/src/tests/recipes.rs` — `colliding_..._first_wins` pin.
- `modules/typegen/src/tests/diagnostics.rs` (campaign-added 22:18, edited
  09:10): `colliding_..._report_the_loser_...` (132-144) +
  `empty_recipes_claim_no_stem_...` (147-158); rest is campaign's.
- `modules/typegen/src/tests/mod.rs` — `mod diagnostics;` wiring (serves
  the pins; activates campaign collector tests, all green in sweep).
- `modules/typegen/tests/diagnostics.test.ts` (campaign-added, edited):
  `TGN-SEAM-10` (161-182) — colliding spec + `expectTscOk(compile(...))`
  through the `tsc.ts` harness; SEAM-01..09 are campaign's.
- `modules/diagnostics/REGISTRY.md:176` — registry row (via trivial, §2c).
- `packages/reference-neo/src/native/generated/typegen/.../types.d.ts:23` —
  regen union member.

D — const `!` (all five want sites + plan-side twin, per-site reuse):

- `walk/leaf.rs:35` — identifier fallback via `push_folded_want`.
- `walk/member.rs:24,63,114` — static/computed/chain via `push_folded_want`
  (+ its import, line 11).
- `expressions/responsive.rs:94-105` — spliced array slots via inline
  `split_important_flag` (non-strings pass through unchanged).
- `expressions/ast_value.rs` — 8 hunks reusing pre-existing
  `folded_value_to_json` (HEAD-verified, see §5) at `spread_const_json`
  (185) + identifier/member/computed/chain converters
  (394,403,411,482,497,509,524). Plan-side twin, entailed by the ruling's
  own plan-key pin (data flow proven §5); `convert_unary(_values)`
  correctly NOT rerouted (fold values provably non-string, §5).
- `expressions/object/entries.rs` — tests-only append (single hunk): 6 D
  pins adjacent to S5-2 (identifier, static, computed, chain, array-slot,
  plan-key-queryability); production code untouched.
- `handle_unary` (`leaf.rs:94-97`) correctly untouched (probe §5).

### 2b. Foreign hunks (pre-existing campaign work — itemized, never absorbed)

A large HQ-DIAG diagnostics migration + span envelope + pretty-print sits
under the fortify (dir mtimes Sep 24 22:18, predates the ruling). It owns,
by content, everything else in scope:

- New diagnostics dirs' non-fortify lines: atlas/typegen `codes.rs`,
  `mod.rs`, `collect.rs`, READMEs minus the new-code rows/constructors;
  `modules/diagnostics/*` (template crate) minus the 2 rsmisc rows.
- `analyzer.rs` minus the 2 guard hunks: `Result` threading, constructor
  calls, `failed_result` re-shape (local-refusal semantics intact),
  `normalize_diagnostics` rewrite.
- `resolver.rs`, `output.rs`, `lib.rs`, `native.rs`, `js/index.ts`,
  `Cargo.toml`, atlas README 1-liner: import swaps + template wiring.
- Atlas goldens: 12 `analysis.json` (pretty-print only — all 12 proven
  SEMANTIC-SAME firsthand), 3 `diagnostics.json` (template reshape, row
  counts 2/1/1 identical), PROP-01/TYPE-01 spec+README adaptations,
  `helpers.ts` gauge reshape (allowlist now inexhaustive, §7).
- Atomic span envelope: `atom/want.rs` (`ByteSpan` field +
  `with_oxc_span`), `walk/mod.rs` (`.with_oxc_span` + 5 `byte_span`
  hunks), `object/mod.rs`, `diagnostics/site.rs`, `proof/*`,
  `channels/*`, `adapters/*`, `hosts/*`, `harvest/*`, `stream.rs`,
  `extract/mod.rs`, `recipes/mod.rs`, `stylesheet/global/walker.rs`.
- All 36 atomic `diagnostics.json` diffs: purely `span:{start,end}`
  blocks (proven: every non-whitespace diff line is a column-comma or
  span-block line; zero row/code/message/file/line/column changes).
- `ATM-DIAG-12/spec.ts` (span-strip in `keyShape`), `harvest_pool.rs`,
  atomic `diagnostics/codes.rs` (+2 template-conformance tests; ZERO new
  B/D codes, as required), atomic `diagnostics/README.md`.
- Typegen campaign: `lib.rs` detailed-emit twin, `emit/mod.rs`
  visibility, `strict.rs` (`KNOWN_STRICT_CATEGORIES`, behavior-identical
  parse), `tokens.rs` (+2 additive helpers), `ts.rs`, `js/index.ts`,
  `js/runtime.ts`, `native.rs`, `Cargo.toml`; `diagnostics.rs` /
  `diagnostics.test.ts` non-stem tests; `tsc.ts` untouched (shared
  harness, no case table to extend).
- Typegen goldens + atomic `src/goldens`: zero modifications.
- Every tracked `packages/reference-neo` modification (bridge, sync,
  browser, tasty d.ts, CLI cases, tsconfig): campaign — the whole Neo
  tracked diff contains zero new-code mentions (grep-verified); the
  fortify's only Neo footprint is the 2 regen union members.

### 2c. Cross-crew absorption (flagged, not absorbed)

- Trivial's commit `8e667e190` (09:23) added `REGISTRY.md` whole-file,
  including rsmisc's 2 rows (lines 164, 176, written 09:11 with the
  rsmisc code batch; content describes rsmisc's exact emit sites).
  Attribution by content: the rows are fortify-rsmisc's; landing note:
  the rsmisc commit must not duplicate them.
- Tasty `183f1c1e7` / neo `177802e09` contain only their own files
  (stat-verified). No other crew has uncommitted work in rsmisc scope.
- No hunk in scope is unattributed.

## 3. Blind repros — all four PASS, serially, pristine between runs

Exact commands unmodified from the repo root, strictly one at a time:

| Break | Command | Result |
|---|---|---|
| A trio | `bash /tmp/doom-r1-trio-atlas-pkg-silence.sh` | exit 0, 2/2 vitest pass, `tree clean` |
| B bare-attr | `.../tsx /tmp/doom-r1-atomic-bare-attr.mts` | exit 0, `GREEN: all refused bare attrs located` (`probe.tsx:2:29` both) |
| C emit | `.../tsx /tmp/doom-g1-emit-repro.mjs …` | exit 0, `CLEAN`: 1 alias, tsc 0, one `TGN-W-DUPLICATE-RECIPE-STEM` row |
| D extract | `bash /tmp/doom-g1-extract-repro.sh …` | exit 0, 4/4 cargo pass (control + identifier + member + plan-key; non-vacuousness re-proven with test-name output after a `tail`-cut first run) |

Pristine verified after each: A plant path clean (`git status` + `ls`
empty); B/C zero `doom_*` residue (only `doom-night-0924` mission files
match); D script self-verified + re-run. The two ` D` atlas generated
files are pre-existing campaign deletions, not repro residue.

## 4. Pins — bodies read, non-tautological, green

- **A** (`package-scan.test.ts`, `ATL-PKG-SCAN-01`): exactly 1
  `ATL-W-PACKAGE-SCAN-FAILED` row naming `@probe/uilib` + sibling
  `Widget` indexed. Fails pre-fix (0 rows). Green (1 passed).
- **B** (`bare_attr_tests.rs`): `color` + `r` refusals carry
  `probe.tsx:2:24` (= attr-name span; col 24 verified by hand count).
  `hits.len()==1` + file/line/col asserts. Fails pre-fix (all `None`).
  Green (2 passed). Colocated unit tests = ruling-permitted twelfth
  shape; DIAG-05 spec untouched.
- **C-Rust** (`recipes.rs` pin): one `VariantProps` + one
  `CompoundVariant`, winner bodies (`VARIANT_PROPS`/`COMPOUND_VARIANT`
  consts), loser `flavor` absent — fails pre-fix (2 aliases).
  (`diagnostics.rs` pin): codes == `[TGN-W-DUPLICATE-RECIPE-STEM]` +
  one alias + loser absent — fails pre-fix (`[]` + 2 aliases).
  `empty_recipes_claim_no_stem_...` guards the ordering. Green (2+1).
- **C-tsc** (`TGN-SEAM-10`): colliding spec → one row naming `` `Button` ``
  + single alias + `dts == emitDtsSync` + `expectTscOk(compile(...))`
  with consumer source through the `tsc.ts` harness
  (`strict`, `noEmit`, `skipLibCheck:false`). Fails pre-fix (TS2300).
  Green (1 passed; also inside the 48/48 file run). `tsc.ts` is a helper
  module, not a spec table — harness-driven from the diagnostics suite
  is the only implementable reading of the ruling's tsc pin.
- **D** (6 pins in `entries.rs` tests): identifier (+`UnknownColor`
  cleared), static member, computed member, chain, array-slot
  (spliced==inline wants + plans), plan-key queryability (stripped row
  present + no-orphan). All fail pre-fix (raw value + `important:false`).
  Green (6 passed).
- **D plan-pin orphan half — VACUOUS (observation, not a gap):**
  `entries.rs:484` needles `"c_red_\\\\!important"` (file bytes: 4
  backslashes → Rust string holds 2), but the sheet escape is 1
  backslash (`c_red_\!important`, cf. the blind repro's correct
  `"c_red_\\!important"`). The negative half passes regardless. The pin
  as a whole is NOT a tautology (positive stripped-row half fails
  pre-fix; all six pins fail without the fix), and the no-orphan
  property itself is proven firsthand by blind repro D (correct needle,
  green). Recommended 1-line hardening: single-backslash needle to match
  the repro. Read-only oracle — not applied.

Fail-without-fix stands on the evidence chain (pins mirror the blind
repros witnessed red by hunter + reproducer + ruler); the tree was never
stashed, reverted, or mutated.

## 5. Boundary check (ruling line-by-line) — all hold

A:

- New-code choice (i), stated + defended: `ATL-W-PACKAGE-SCAN-FAILED`,
  warning, "the package is skipped, siblings kept" (`codes.rs:26-27`).
  Severity matches keep-siblings; reusing `ATL-E-SCAN-FAILED` would
  contradict its documented "refused with empty components" meaning.
  No third shape.
- Atomic set complete: emit + table + constructor + registry (committed
  via trivial, §2c) + TS union + regen. All present.
- Zero-drift sweep shown: §6 attestation; referenced-package signaling
  rides the same guards with zero drift, satisfying the ruling's
  condition. Minimum bar (included signals) pinned.
- Untouched respected: resolver/scanner (campaign migration only, no
  fortify lines), `failed_result` semantics (still refuses local IO with
  empty components), `normalize_diagnostics` (fortify adds nothing),
  siblings/runtime/`analyze` fallback.

B:

- Locating path + stated span choice: `expression_walk` + `push_want`
  mirroring `handle_attribute_string`, `Some(attr.name.span())` —
  the attr name is the offending sub-expression for a bare attr; choice
  stated in code comment + pin-file header. `authored.push` intact.
- Twelfth shape, no DIAG-05 extension: colocated `bare_attr_tests.rs`;
  DIAG-05 spec unmodified, its golden moves only by the campaign span
  block, rows identical.
- Must-move (emit + pin, nothing else): holds — the `Want` import
  removal is part of the emit edit (zero remaining uses).
- Untouched respected: `proof/render.rs` (campaign test-struct line
  only), string/expr paths, `analysis/jsx_attrs.rs` (unmodified),
  resolve session, `atom/want.rs` (campaign span field), runtime.

C:

- First-stem-wins guard, both aliases, per-name guard stays: yes
  (`recipes.rs:18,26-31`).
- Collector mirror, same loser same order: yes — same `list_recipes()`
  walk; printability gate proven EXACT (`recipe_type_stem` ≡
  `to_pascal_case`+`is_ts_ident`; `variant_props_body` ≡
  any-nonempty-axis; stem-claim after printability in both); loser
  contributes only the dup row on both sides.
- Iteration-order argument stated: `recipes.rs` comment ("first recipe
  in list order wins") + SPEC clause + shared walk; `IndexMap`
  insertion order verified firsthand (`spec.rs:238`, `recipes.rs:40`).
- New code appended + wire vectors + README/SPEC/registry/union/regen:
  all present (§2a).
- tsc pin present: SEAM-10 (§4).
- Untouched respected: `strict.rs`/`tokens.rs` (campaign additive
  helpers; emit behavior identical), `fonts`/`style`/`base-system`
  (absent from diff), `ATM-E-DUPLICATE-RECIPE` gate (test-struct line
  only), runtime.

D:

- All five sites split, no partial: `leaf.rs:35`, `member.rs:24,63,114`,
  `responsive.rs:94-105` — every recorded-leaf push now splits.
- Helper choice stated (preferred shape): per-site reuse of pre-existing
  splitters — `push_folded_want` (want side; splits via
  `split_important_flag`, `branch.rs:104-121`) and `folded_value_to_json`
  (plan side; proven pre-existing at HEAD). No new helpers, no new code
  paths; idempotent on clean values.
- Plan-side twin (`ast_value.rs`): entailed-but-unlisted — firsthand data
  flow: `object/mod.rs:232` + `jsx/mod.rs:201` build
  `AuthoredDeclaration{value,important}` (→ plan rows) from
  `ast_to_json_values`, while the walk sites mint wants. Fixing wants
  without plans would leave the filed raw plan key; the ruling's own
  plan-key pin requires this file. Strict list-exclusivity would
  contradict the ruling's pin — the pin wins. (Side effect, verified
  intended: the wave-1 responsive detector, `responsive.rs:188`, now
  also fires on const-`!` leaves — silent-no-paint becomes loud refusal,
  same diagnosis as inline; detector code untouched.)
- Unary audit probe (shown here): `fold_unary` values are provably
  Number/Bool-only — String/Token arms refuse (`unary.rs:337-339`),
  literal strings refuse (152-156), templates refuse (300-301),
  `typeof`/`delete`/`void` never fold (90-98); only `apply_to_number`
  (352-372) and `apply_to_bool` (384-397) push values.
  `handle_unary` + `convert_unary(_values)` correctly untouched.
- UnknownColor resolved-by-construction, zero code touch: identifier pin
  asserts no `UnknownColor`; `codes.rs` gains no variants.
- Untouched respected: `css.ts` (absent from diff — plan conforms to
  pinned query physics), `literal.rs` (reuse only), resolve session,
  proof, harvest, `entries.rs` production (tests-only hunk), S5-2 spread
  path.

## 6. Suites, goldens, gates — firsthand

Suites:

- Atlas: `v` 61/61 (incl. A pin; indexing/interface/shape green
  unmodified), `c` 23/23.
- Atomic: `v` 301/302 — the single failure is `harvest-census >
  publishes react.mjs bytes`, proven HEAD-red outside the arc: the test
  calls `publishReactBundle` without `recipes` (`harvest-census.test.ts:
  326-330`) while `react.ts:66` feeds `input.recipes` into
  `Object.entries` (`generate.ts:92`); test + `react.ts` + `generate.ts`
  are all byte-identical to HEAD, so the TypeError reproduces on pristine
  HEAD by construction. Fortify files are uninvolved (B/D touch only
  want locations + value splitting, never the spec recipes table).
  `c` 687/687 (673+1+1+7+5). Named green: B pins 2/2, D pins 6/6, S5-2,
  proof-site, responsive refusal, `jsx_attrs`, namer goldens, recipes
  18/18, merge 5/5.
- Typegen: `v` 48/48 (all six files: seam/surface/vocabulary/
  diagnostics/strict/style-05; full tsc harness green), `c` 65/65.
  Named green: colliding pins 2/2, claim-no-stem, forbid 6/6 (incl.
  TYP-FORBID-04), exact-wire-bytes, SEAM-10.
- Neo unit: `src/diagnostics` 101/101 — incl. the committed registry
  self-check (cited ⊆ defined holds WITH the 2 new codes) and
  `repro.test.ts` 61/61 (existing consumers uncontradicted; asserts
  nothing about the new rows, as the ruling requires).
- Neo cases (all PASS): NEO-DIAG-54 (A), NEO-DIAG-02 (B; spec asserts
  code/severity/message only — no unlocated shape), NEO-DIAG-21 (D
  refusal; inline-leaf world), NEO-CSS-08 + NEO-MERGE-07 (D paint;
  inline-`!` worlds), NEO-PGEN-13 + NEO-PGEN-17 (C consumers),
  NEO-RESP-01 (D responsive sanity).

Golden attestation (ruling's expected movements):

- A: none beyond campaign — 12/12 `analysis.json` SEMANTIC-SAME, 3/3
  `diagnostics.json` same row counts with template reshape only, zero
  `PACKAGE-SCAN-FAILED` rows anywhere in fixtures.
- B: DIAG-05 rows identical (single campaign span block); all 36 atomic
  goldens span-only; zero file:line:col gains (no bare-attr fixtures —
  permitted: gains confined to bare-attr, of which there are none).
- C: none — typegen goldens byte-unmodified.
- D: none beyond campaign — zero split rows / zero vanishing
  `UnknownColor` (no `!`-const fixtures); `src/goldens` unmodified.
  Anything else would be a gap; there is nothing else.

Gates:

- `pnpm agentrs q`: typegen 7/7 files clean; atlas 3 files pass with 3
  structural warnings (`analyze_detailed` size/complexity, pre-existing
  scale — fortify's net is 2 small match arms); atomic 7 files pass
  with warnings only on pre-existing functions (zero on fortify lines).
  Zero `#[allow]`/`#[expect]`; zero violations everywhere.
- `pnpm agentneo q` on both regen d.ts: 0 errors, 0 warnings.

## 7. Observations (non-blocking; no GAPS filed)

1. Vacuous orphan half, `entries.rs:484` — see §4. Recommended 1-line
   hardening (single-backslash needle); property proven by repro D.
2. No fortify report file — all "stated" items satisfied in-tree (§5);
   unary probe recorded in this file.
3. `atlas/tests/helpers.ts:35-40` — `VALID_DIAGNOSTIC_CODES` omits
   `ATL-W-PACKAGE-SCAN-FAILED` (inexhaustive allowlist; zero impact —
   no station emits it; not in the ruling's must-move set).
4. Atlas README "All four" (line 32) vs five table rows — 1-word
   staleness. Both READMEs' "one whole-compiler repro per row" is now
   stale for the 2 new codes (ruling requires no Neo repros for them).
5. Registry rows committed via trivial `8e667e190` — landing note (§2c).
6. File lengths (gate passes on SLOC basis; fortify nets minimal and
   boundary-required): `jsx/mod.rs` 501 total lines, `ast_value.rs` 545,
   `entries.rs` 489 (D pins are ruling-mandated tests).
7. `harvest-census` HEAD-red — pre-existing, proven §6.

## 8. Write discipline

This file is the oracle's only tree write. Source is read-only (no
fixes); no stash/revert/mutation; nobody messaged. All repro plants
self-removed and verified absent after every run.

**VERIFIED — the rsmisc fortify arc is commit-ready.**
