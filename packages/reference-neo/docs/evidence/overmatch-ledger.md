# Operation Overmatch — evidence ledger (Phase 5)

Mission: `docs/missions/completed/operation-overmatch.md` (concluded).
Successor: `docs/missions/operation-forge.md`. Compiled 2026-09-19 by
role `om-ph5`. This file is the only thing Ph5 writes: the statement
("we extract atomic CSS from your tokens, styles and code — and we do
it better than Panda v2") may be quoted only from here.

Path legend (repo-relative): `A/` =
`packages/reference-rs/modules/atomic/` (stations under
`tests/cases/<ID>/`); `N/` = `packages/reference-neo/tests/cases/`
(cases under `<group>/<ID>/`); `C/` =
`packages/reference-rs/modules/canon/`. Panda paths are relative to
`vendor/panda/crates/` (`pandacss_extractor/tests/` unless noted),
exactly as the mission cites them.

## 0. Gates run (this session, current tree)

| Gate | Command | Result |
|---|---|---|
| ATM vitest (all stations) | `pnpm agentrs v atomic` | 254/255 — every station green; sole red is `token10.test.ts` (pre-existing, §7) |
| ATM cargo | `pnpm agentrs c atomic` | 314/0 |
| ATM Ph4 targeted | `pnpm agentrs v atomic -t ATM-SITE-54/-40/-41/-55` | 4 × PASSED |
| NEO all cases | `pnpm agentneo run` | 165/165 `ok` (`tests/.artifacts/last-run.json`), incl. all 28 `NEO-SITE-*` and 17 `NEO-COND-*` |
| canon vitest + cargo | `pnpm agentrs v canon`, `pnpm agentrs c canon` | 15/15, 35/0 (GAP-04a vendor aliases) |
| tasty vitest / cargo | `pnpm agentrs v tasty`, `pnpm agentrs c tasty` | 43/81 vitest (38 golden reds) / 62/0 cargo |
| virtualrs vitest / cargo | `pnpm agentrs v virtualrs`, `pnpm agentrs c virtualrs` | 6/16 vitest (10 golden reds) / 26/0 cargo |
| typegen vitest / cargo | `pnpm agentrs v typegen`, `pnpm agentrs c typegen` | 21/21 vitest / 32/40 cargo (8 golden reds) |
| Behavior probes | `/tmp/om5-probe*.mts` via `tsx` + `compileSync` (read-only, no repo writes) | Pre-mop-up: V2-14 twins minted 2 classes; `delete` left stale init; null-const warns+skips. Post-mop-up: 14 twins collapse to 1 class (SITE-47), `delete` diagnoses naming the delete (SITE-28 arm) |

Every station cited below was checked to exist on disk AND to pass in
the gate above. Nothing is cited from the mission text alone.

## 1. Counts and downgrades (read first)

§1 holds **81 entries** (01–62, Family Q 63–79, Ph0 80, oracle 81 —
the mission's §6 "79" predates 80/81).

- **Pinned: 81.** 77 clean; 4 pinned with an open carve-out
  (35 poison precision + wording, 39 F3 init-folding, 53 poison
  precision, 55/76 doom seed 1).
- **Open (still TO-BUILD, cannot be pinned): 0.** Entries 14 and 81
  were pinned by the mop-up crew (`om-ph5mop`, this session — see
  their rows); no open §1 entries remain.
- **§3 superiority: 19 pinned, 1 deferred.** S13 (namespace/default
  value imports) is **DEFERRED with cause** per the Ph4 exit log —
  it needs export value tables that do not exist.
- No HAVE or SUPERIOR header was downgraded. Three §1 cites were
  re-pointed per the Ph2 phantom-half-cite flags (01 → `ATM-SITE-06`
  only, 03 → `NEO-CSS-05` + `ATM-LEAF-05`, 18 → `ATM-SITE-05` +
  `ATM-LEAF-04`); the stations that carry those entries are green.

## 2. §1 entry ledger

Ledger statuses: `HAVE` / `SUPERIOR` (pinned this session),
`HAVE*` (pinned with the noted open carve-out), `TO-BUILD`
(open — the claim does not cover it). "Mission" is the §1 header
status. Panda cites are the mission's; every one was kept only
because the paired station is green.

### Family A — literal folds

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 01 scalar const | HAVE → HAVE | `A/tests/cases/ATM-SITE-06/` (`NEO-SITE-02` cite dropped: its README proves member reads = entry 30, Ph2 flag) | `scope.rs:24` |
| 02 unmutated let/var | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-28/` controls | `scope.rs:203`, `:241` |
| 03 null/undefined strip | HAVE → HAVE | `N/css/NEO-CSS-05/` + `A/tests/cases/ATM-LEAF-05/` (`ATM-SITE-21` cite dropped, Ph2 flag + re-cite) | `polish.rs:331` |
| 04 scalar canon + vendor | HAVE → HAVE | `A/tests/cases/ATM-UNIT-02/` + `N/parity/NEO-PARITY-01/` (P18) + `A/tests/cases/ATM-SITE-60/` (GAP-04b) + `C/src/dialect.rs` + `C/src/tests.rs` (GAP-04a aliases, canon 35/0) | `atomic.rs:215`, `:33`, `:265` |

### Family B — unwraps

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 05 value unwraps | HAVE → HAVE | `A/tests/cases/ATM-SITE-61/` (GAP-05a) + `A/src/extract/expressions/walk.rs`, `ast_value.rs`, `collect.rs` refs; GAP-05b `!` transparency via SITE-38 | `calls.rs:1660`, `jsx.rs:1108/1129/1153` |
| 06 call-arg unwraps | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-26/` + `N/site/NEO-SITE-20/` | `calls.rs:1017`, `:1001`, `:1033`, `:2000`, `:1052` |
| 07 `<any>` assertion | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-26/` + `N/site/NEO-SITE-20/` | `calls.rs:1068` |

### Family C — unary / binary

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 08 unary on literals | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-30/` | `calls.rs:1093`, `:1110` |
| 09 non-foldable unary | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-38/` (S15: strings refuse where v2 coerces) | `calls.rs:1126`, `literal-evaluator.md:51` |
| 10 string concat | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-33/` + `N/site/NEO-SITE-25/` | `calls.rs:1148`, `scope.rs:849` |
| 11 arithmetic + NaN drop | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-33/` + `N/site/NEO-SITE-25/` | `calls.rs:1168`, `:1394` |
| 12 comparisons as values | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-33/` + `N/site/NEO-SITE-25/` (Ph3 fix: `<=`/`!==`/ident-operand arms) | `calls.rs:1535`, `:1560`, `:1588`, `:1614` |

### Family D — templates

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 13 static backticks | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-30/` arm | ``calls.rs:1194`` |
| 14 whitespace collapse | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-47/` + `A/src/resolve/normalize.rs` (collapse) + `A/src/resolve/unit.rs` (resolve hook) + `A/src/extract/fold/template.rs` (join trim) | `calls.rs:156`, `:179` |

### Family E — ternary

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 15 open-test ternary | HAVE → HAVE | `A/tests/cases/ATM-SITE-05/` + `-17/` + `-23/` + `N/site/NEO-SITE-01/` (+ JSX `N/site/NEO-SITE-15/`) + `A/tests/cases/ATM-SITE-64/` arms | `conditional_output.rs:25`, `atomic.rs:1528`, `encode.rs:452` |
| 16 nested/equal/partial | HAVE → HAVE | `A/tests/cases/ATM-SITE-05/` + `-21/` + `-23/` + `A/tests/cases/ATM-SITE-63/` (GAP-16) + `-64/` | `conditional_output.rs:487`, `:69`, `:110` |
| 17 object-valued arms | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-27/` (S3 mirrors inside) | `conditional_output.rs:631` |

### Family F — logical

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 18 logical, guard/unresolvable | SUPERIOR → SUPERIOR | `A/tests/cases/ATM-SITE-05/` + `A/tests/cases/ATM-LEAF-04/` (`NEO-SITE-08` cite dropped: its README proves entry-21 logical spreads, Ph2 flag) | `conditional_output.rs:251`, `:155`, `:513`, `:531`, `atomic.rs:1553/1575` |
| 19 all-literal short-circuit | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-33/` + `N/site/NEO-SITE-25/` | `calls.rs:1499` |

### Family G — spreads

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 20 object spreads | HAVE → HAVE | `A/tests/cases/ATM-SITE-05/` + `-11/` + `N/site/NEO-SITE-03/` | `scope.rs:651`, `calls.rs:1241` |
| 21 dynamic spreads | HAVE → HAVE | `A/tests/cases/ATM-SITE-05/` + `N/site/NEO-SITE-08/` + `N/site/NEO-SITE-22/` (paint pin) + `A/tests/cases/ATM-SITE-66/` (GAP-21) | `conditional_output.rs:315`, `:274`, `calls.rs:638`, `atomic.rs:1651` |
| 22 colliding union | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-24/` + `N/site/NEO-SITE-18/` | `conditional_output.rs:363`, `:389` |
| 23 dup keys / last-wins | HAVE → HAVE | `N/merge/NEO-MERGE-01/` + `-02/` + `A/tests/cases/ATM-SITE-67/` (GAP-23) | `calls.rs:1736`, `:131` |
| 24 nested-const spread | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-29/` | `conditional_output.rs:655` |

### Family H — arrays

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 25 responsive arrays | HAVE → HAVE | `A/tests/cases/ATM-LEAF-05/` + `N/resp/NEO-RESP-01..09/` | `calls.rs:444` |
| 26 null/dynamic slots | HAVE → HAVE | `N/css/NEO-CSS-05/` + `N/prim/NEO-PRIM-04/` + `A/tests/cases/ATM-SITE-69/` (GAP-26, our warning asserted) | `calls.rs:1893`, `:1922` |
| 27 mid-array ternary | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-27/` (incl. top-level `css(c?a:b)` = S1) | `conditional_output.rs:683`, `calls.rs:1946`, `:556` |
| 28 array spreads | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-37/` (Ph1 refuse + Ph3 flatten) + `N/site/NEO-SITE-23/` (flatten arm); S5 | `calls.rs:1265`, `literal-evaluator.md:47-48` |
| 29 merge-list call form | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-25/` + `N/site/NEO-SITE-19/` | `atomic.rs:1474`, `:1680`, `:1711` |

### Family I — member / destructure

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 30 single-hop member | HAVE → HAVE | `A/tests/cases/ATM-SITE-06/` + `N/site/NEO-SITE-02/` (this is what SITE-02 actually proves; exceeds v2 — no single-hop member test exists there) | `scope.rs:762` (catalog erratum noted in §1) |
| 31 member depth | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-29/` + `N/site/NEO-SITE-25/` (multi-hop arm) | `scope.rs:286`, `conditional_output.rs:707`, `calls.rs:2024` |
| 32 destructure binds | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-42/` — NUMBERING COLLISION: §1 files 32 under `ATM-SITE-35` (does not exist) and §1 files 55 under `ATM-SITE-42`; disk + §5-Ph3 give 42 to destructure (see §8 errata) | `scope.rs:547`, `:567`, `:587`, `:629`, `polish.rs:269` |

### Family J — const-graph

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 33 param shadows css | HAVE → HAVE | `A/tests/cases/ATM-SITE-10/` + `N/site/NEO-SITE-05/` + `A/tests/cases/ATM-SITE-72/` (arrow arm) | `scope.rs:690`, `:707`, `:737` |
| 34 const-graph depth | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-29/` (chains) + `A/tests/cases/ATM-SITE-28/` (Ph3 object half) | `scope.rs:1349`, `:1369`, `cross_file.rs:265`, `:242`, `:291` |
| 35 mutated let drops | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-28/` (same-file arms) + `A/tests/cases/ATM-SITE-84/` (cross-file precision: import folds `#f59e0b` despite a same-named write elsewhere; the written file's own use names its write) | `scope.rs:224` |
| 36 micro-fold bundle | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-30/` arms | `scope.rs:262`, `calls.rs:224`, `:1697`, `:679`, `:1687` |
| 37 callee/drop micros | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-36/` | `calls.rs:965`, `:981`, `scope.rs:720`, `:832`, `:1403`, `:305` |
| 38 discovery + multi-arg | HAVE → HAVE | `A/tests/cases/ATM-SITE-02/` + `-04/` + `-12/` + `N/site/NEO-SITE-04/` + `A/tests/cases/ATM-SITE-73/` (discovery) + tagged-diagnose via SITE-12/SITE-50 | `calls.rs:480`, `:657`, `:702`, `:523`, `:2040`, `atomic.rs:1449/1596/1626` |
| 81 `delete` as write | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-28/` delete arm (`input/src/delete.ts`) + `A/src/extract/constants/` (`collect.rs` delete visit, `index.rs` Deleted kind + `write_phrase`, `mutate/mod.rs` root walk) + bare-`extract()` bag wiring (`A/src/extract/mod.rs`) | (no v2 test cited; filed at `scope.rs` neighborhood) |

### Family K — helpers + refusals

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 39 pure-helper folds | TO-BUILD → HAVE* | `A/tests/cases/ATM-SITE-31/` + `N/site/NEO-SITE-21/` (pure paint arm landed per 39-F1 fix; README confirms) — carve-out: 39-F3 pure calls in const inits refuse-with-diagnostic where v2 folds (behavior pinned, init-folding pass open, §6) | `scope.rs:908`, `:927`, `:945`, `:1073`, `:1030` |
| 40 helper-key integration | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-49/` helper-key arm (`[gh('cool')]`) | `scope.rs:966` |
| 41 refuse net (blanket) | HAVE → HAVE | `A/tests/cases/ATM-SITE-04/` + `-23/`, `ATM-LEAF-07/`, `ATM-FORBID-02/`, `ATM-DIAG-02/` + `N/site/NEO-SITE-06/` | `scope.rs:1020`, `:1112`, `:1164`, `:1281`, `polish.rs:125/162` |
| 42 per-shape refuse pins | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-32/` + `N/site/NEO-SITE-21/` (impure arm; destructured-params tripwire added per fix) | `scope.rs:1112`, `:1020`, `:1249`, `:1123`, `:1153`, `:1143` |

### Family L — optional chain

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 43 `?.` known base | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-34/` | `optional_chaining.rs:19`, `:72` |
| 44 `?.` unresolvable drop | HAVE → HAVE | `A/tests/cases/ATM-SITE-23/` control + `ATM-DIAG-02/` + `A/tests/cases/ATM-SITE-74/` | `optional_chaining.rs:58` |

### Family M — enum / type-literal

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 45 enum fence | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-43/` (computed inits fold via empty-scope evaluators, per fix) | `polish.rs:47`, `:66`, `:85` |
| 46 type-literal fence | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-44/` (per-name leniency for rest/defaulted params, per fix) | `polish.rs:104`, `:142` |

### Family N — nesting

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 47 core `&` | HAVE → HAVE | `N/cond/NEO-COND-01/03/06/07/08/09/` + `A/tests/cases/ATM-COND-02/09/10/14/20/` + `ATM-UNIT-03/` + `ATM-LAYER-09/` + `N/parity/NEO-PARITY-01/` (P2) + `A/tests/cases/ATM-COND-30/` (utility half) | `nested_selector_parity.rs:26`, `:37`, `:70`, `:92`, `:125`, `:180`, `:202` |
| 48 pseudo-element sort | HAVE → HAVE | `N/cond/NEO-COND-08/` + `A/tests/cases/ATM-COND-09/14/` + `A/tests/cases/ATM-COND-31/` (raw `&::` arm) | `nested_selector_parity.rs:433`, `:455`, `:466`, `:477` |
| 49 `:where(:has())` nested | TO-BUILD → HAVE | `A/tests/cases/ATM-COND-22/` + `N/cond/NEO-COND-16/` | `nested_selector_parity.rs:389`, `:224` |
| 80 stacked pseudo reorder | TO-BUILD → HAVE | `A/tests/cases/ATM-COND-29/` | `nested_selector_parity.rs:455`, `:466` |

### Family O — cross-file / imports

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 50 xfile const+member | HAVE → HAVE | `N/site/NEO-SITE-07/` + `A/tests/cases/ATM-SITE-16/` (observable kept under the new binding mechanism, SITE-77) | `cross_file.rs:200`, `:219` |
| 51 imported spreads | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-39/` | `cross_file.rs:316` |
| 52 aliased import | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-40/` (targeted gate PASSED) | `cross_file.rs:421` |
| 53 `export let` folds | HAVE → HAVE | `A/tests/cases/ATM-SITE-28/` cross-file arm + `A/tests/cases/ATM-SITE-84/` (unmutated `export let` folds across files under a same-named write elsewhere) | `cross_file.rs:502` |
| 54 unresolvable import | SUPERIOR → SUPERIOR | `N/site/NEO-SITE-06/` precedent + `A/tests/cases/ATM-SITE-75/` | `cross_file.rs:465`, `:488` (both silent) |
| 55 imported conditional | TO-BUILD → HAVE* | `A/tests/cases/ATM-SITE-77/` (Ph3 fold + Ph4 crew-B alias/barrel/cycle ext) — carve-out: doom seed 1 nested-imported-spread silence (§6); NOTE §1's `ATM-SITE-42` cite is the collision — 42 on disk is entry 32 | `cross_file.rs:1368` |
| 56 barrels | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-41/` (probe→build; targeted gate PASSED) + SITE-77 barrel arms | `cross_file.rs:1194`, `:751`, `:962`, `:995`, `:1038` |

### Family P — token() / factory consts

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 57 imported pure helpers | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-31/` cross-file arm (re-implemented on the binding walk, bag fallback deleted) | `cross_file.rs:1220`, `:1262`, `:1344` |
| 58 bare imported fn | HAVE → HAVE | collector behavior + `A/tests/cases/ATM-SITE-75/` twin | `cross_file.rs:1310`, `:1325` |
| 59 import identity | HAVE → HAVE | `A/tests/cases/ATM-SITE-15/` + `N/site/NEO-SITE-04/` + `A/tests/cases/ATM-SITE-76/` (alias + I2 string-literal arms) | `imports.rs:34`, `:63`, `:100`, `:12`, `calls.rs:463`, `:862` |
| 60 parse-error diag | HAVE → HAVE | `A/tests/cases/ATM-DIAG-03/` (analogue) | `imports.rs:518`, `:527`, `calls.rs:749` |
| 61 token() surface | TO-BUILD → HAVE (EQUIVALENT-or-better) | `A/tests/cases/ATM-SITE-45/` (theme-live `var()`, S11) | `token_calls.rs:92`, `:202`, `:268` |
| 62 factory consts | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-46/` (`viewTransition()`-as-value refuses WITH diagnostic) | `cross_file.rs:1437`, `:1460`, `:1506`, `:1526`, `:1550`, `:1571`, `:1598`, `:1481` |

### Family Q — promoted rows

| Entry | Mission → ledger | Pin station(s) + paths | Panda side |
|---|---|---|---|
| 63 foldable index | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-48/` + `N/site/NEO-SITE-23/` (binary + interpolated index arms, nested chains) | `scope.rs:321`, `:340`, `:393`, `:412`, `:430`, `:449`, `:468`, `:486`, `:505`, `optional_chaining.rs:38` |
| 64 computed keys | HAVE-split → HAVE both | `A/tests/cases/ATM-SITE-49/` (static + folded + concat-key arms; S4 refuse side) | `calls.rs:1288`, `:1304`, `:1320`, `scope.rs:360`, `:375` |
| 65 non-object args | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-50/` (Ph1 sweep + Ph3 resolve; alias-chain + rest-arg arms) + `N/site/NEO-SITE-24/`; S7 | `scope.rs:43`, `:63`, `:671`, `calls.rs:548`, `:1719`, `atomic.rs:1626` |
| 66 dead-arm fold | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-33/` + `N/site/NEO-SITE-25/`; S8 | `conditional_output.rs:47`, `:449`, `:467`, `calls.rs:1443/1635/1867`, `scope.rs:1328` |
| 67 interpolated templates | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-51/` + `N/site/NEO-SITE-26/`; S9 | `scope.rs:868`, `:887`, `calls.rs:1214/1420/1972` |
| 68 comma-member scope | TO-BUILD → HAVE | `A/tests/cases/ATM-COND-23/` + `N/cond/NEO-COND-17/`; S17 | `nested_selector_parity.rs:642`, `:653`, `:664` |
| 69 `:is()` armour | TO-BUILD → HAVE | `A/tests/cases/ATM-COND-24/` | `nested_selector_parity.rs:675`, `:686` |
| 70 self-`&` in functionals | HAVE → HAVE | `A/tests/cases/ATM-COND-25/` (note: spelling-sensitive per Ph2 — station text governs) | `nested_selector_parity.rs:169/224/301/312/334/356/411/422` |
| 71 compound/multi-`&` | HAVE → HAVE | `A/tests/cases/ATM-COND-26/` | `nested_selector_parity.rs:235/257/268/323/345/367/400` |
| 72 tag/BEM/tails/bare | HAVE → HAVE | `A/tests/cases/ATM-COND-27/` (v2 `:631` mints WITH segment per Ph2 — station text governs) | `nested_selector_parity.rs:48/59/103/279/290/378/532/587/598/609/620/631` |
| 73 placements + stacks | HAVE → HAVE | `A/tests/cases/ATM-COND-28/` | `nested_selector_parity.rs:444/488/499/510/543/554/565` |
| 74 shadow pins | HAVE → HAVE | `A/tests/cases/ATM-SITE-52/` (EQUIVALENT on the `undefined` half) | `scope.rs:803`, `polish.rs:352` |
| 75 scope-aware resolve | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-53/` + `N/site/NEO-SITE-27/` | `scope.rs:1349`, `:1369` |
| 76 binding resolution | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-54/` + `-40/` + `-41/` + `-55/` + `N/site/NEO-SITE-28/` (S12; S13 rider deferred) | `cross_file.rs:421/1194/545/569/146/442`, `cross-file-resolution.md:102-129` |
| 77 diagnostic precision | TO-BUILD → HAVE | `A/tests/cases/ATM-DIAG-05/`; S16 | `imports.rs:518`, `:527`, `calls.rs:749` |
| 78 unary sign preserve | TO-BUILD → HAVE | `A/tests/cases/ATM-SITE-38/` | `literal-evaluator.md:51`, `:57-59` |
| 79 numeric strings | TO-BUILD → HAVE | `A/tests/cases/ATM-UNIT-02/` ext (incl. `''` → `ATM-W-INVALID-CSS-VALUE`); S20 | `atomic.rs:239-261` |

## 3. §3 superiority ledger (both citations)

Each row: Panda's side (file:line) + our green pin. All pins verified
in §0 gates.

| # | Shape | Panda v2 (drops/silent/narrows) | Reference (green pin) | Entry |
|---|---|---|---|---|
| S1 | `css(cond ? a : b)` | drops the call (`calls.rs:556`, `calls: []`) | extracts both arms — `A/tests/cases/ATM-SITE-27/` (SPEC text names S1; §3's `ATM-SITE-05` cite is the same conditional machinery) | 27 |
| S2 | `dyn && 'red'`, `'red' && dyn` | right operand, silent on dropped left | static operand + diagnostic on the dynamic side — `A/tests/cases/ATM-SITE-05/` (+ `NEO-SITE-08` per §3; Ph2 re-cite adds `ATM-LEAF-04/`) | 18 |
| S3 | open ternary, one unfoldable arm | drops whole conditional (`literal-evaluator.md:75-76`) | keeps resolvable arm + exactly one warning (both mirrors) — `A/tests/cases/ATM-SITE-27/` | 17 |
| S4 | unfoldable computed key | drops WHOLE call (`computed_keys_skip_extraction`) | drops the member, keeps siblings, diagnoses — `A/tests/cases/ATM-SITE-49/` | 41, 64 |
| S5 | unresolvable array spread | drops whole array, silently (`literal-evaluator.md:47-48`) | located diagnostic, arity honest — `A/tests/cases/ATM-SITE-37/` | 28 |
| S6 | unresolvable import / missing export | drops silently (`cross_file.rs:465`, `:488`) | located diagnostic — `N/site/NEO-SITE-06/` precedent + `A/tests/cases/ATM-SITE-75/` | 54 |
| S7 | positional unresolvable arg | silent `None` slot (`calls.rs:1719`) | positional diagnostic, siblings kept — `A/tests/cases/ATM-SITE-50/` | 65 |
| S8 | literal-test dead arm | picks one, says nothing | picks one, `info` names the dead arm — `A/tests/cases/ATM-SITE-33/` | 66 |
| S9 | unfoldable template part | staged drop, silent | diagnostic naming the `${…}` part — `A/tests/cases/ATM-SITE-51/` | 67 |
| S10 | mutated `let` then extract | drops silently (`literal-evaluator.md:79`) | diagnostic naming the mutation site — `A/tests/cases/ATM-SITE-28/` (wording/precision carve-outs §6, station itself green) | 35 |
| S11 | `token('colors.red')` | parse-time hex, frozen under theme switch | theme-live `var(--colors-red)` — `A/tests/cases/ATM-SITE-45/` | 61 |
| S12 | identity via consumer re-export | requires `importMap` config | follows the binding, zero config — `A/tests/cases/ATM-SITE-55/` + `N/site/NEO-SITE-28/` | 76 rider |
| S13 | namespace/default VALUE imports | refuses (`cross-file-resolution.md:95-96`) | **DEFERRED with cause** — needs export value tables (§6); no station, not claimed | 76 rider |
| S14 | JSX tag that is a param | no v2 JSX shadow test (v1 corpus) | fail-closed — `A/tests/cases/ATM-SITE-52/` (silent skip pinned per §1-74 correction) | 74 |
| S15 | `! - ~ +` on non-numeric leaf | folds via JS coercion | refuses with diagnostic, no `NaN` atoms — `A/tests/cases/ATM-SITE-38/` | 09 |
| S16 | diagnostics | byte spans, kinds, no code table | `file:line:col` + stable codes — `A/tests/cases/ATM-DIAG-05/` | 77 |
| S17 | `&`-less comma member | scopes to parent (parity) | scopes to parent AND one atom per condition — `A/tests/cases/ATM-COND-23/` + `N/cond/NEO-COND-17/` | 68 |
| S18 | JSX StyleProps as sites | config name arrays / PascalCase guessing | styletrace hosts, import-bound; `r`-props → `--r` atoms — `A/tests/cases/ATM-SITE-01..04/` (pre-existing, green) | arch |
| S19 | merge-list holes | (fold table) | holes skip silently, arity honest — `A/tests/cases/ATM-MERGE-03/` + entry-27 stations | 27 |
| S20 | numeric strings | keeps `'01'`/`' 1'` (leading-zero guard, no trim); invalid CSS for the rest | numerifies `'01'`/`' 1'`, refuses the rest with a diagnostic — `A/tests/cases/ATM-UNIT-02/` | 79 |

## 4. §6 coverage placement (every corpus row)

Inverted from the §1 source-rows and checked against the §6
arithmetic (81 extractor rows + 61 nesting + 16 skim + 5 encode +
27 xfile shapes = 374 source tests + 21 reference).

### Extractor rows (81 = 80 catalog + 1 out-of-axis)

| Corpus row | Lands in |
|---|---|
| ex-1 | 01 + 36 (shorthand) |
| ex-2 | 02 |
| ex-3 | 03 |
| ex-4 | 30 |
| ex-5, ex-6, ex-7 | 31 |
| ex-8, ex-56 | 63 |
| ex-9 | 64 |
| ex-10 | 32 |
| ex-11 | 33 |
| ex-12 | 37 |
| ex-13 | 34 |
| ex-14 | 74 |
| ex-15 | 05 |
| ex-16 | 06 |
| ex-17 | 07 |
| ex-18, ex-19 | 08 + 78 (const arm) |
| ex-20 | 09 |
| ex-21 | 10 |
| ex-22, ex-23 | 11 |
| ex-24 | 12 |
| ex-25 | 13 |
| ex-26 | 67 |
| ex-27, ex-28 | 18 |
| ex-29 | 19 |
| ex-30 | 15 |
| ex-31, ex-42 | 66 |
| ex-32, ex-33, ex-34 | 16 |
| ex-35 | 17 |
| ex-36, ex-37 | 20 |
| ex-38, ex-39, ex-40 | 21 |
| ex-41 | 22 |
| ex-43 | 23 |
| ex-44 | 24 |
| ex-45 | 25 |
| ex-46 | 26 (null/dynamic) + 27 (elision) |
| ex-47 | 27 |
| ex-48 | 28 |
| ex-49 | 29 |
| ex-50 | 39 |
| ex-51 | 40 |
| ex-52 | 41 (net) + 42 (pins) |
| ex-53 | 37 |
| ex-54 | 43 |
| ex-55 | 44 |
| ex-57 | 45 |
| ex-58 | 46 |
| ex-59 | 41 |
| ex-60 | 36 (Ms) + 38 (HAVE) |
| ex-61 | 38 + 59 |
| ex-62 | 37 |
| ex-63 | 38 |
| ex-64 | 36 |
| ex-65 | 60 + 77 |
| ex-66 | 36 |
| ex-67 | 38 |
| ex-68 | 14 (**open** — the row is placed but unbuilt) |
| ex-D1, D3, D6, D12 | 41 |
| ex-D2 | 35 (mutation) + 37 (no-init) + 02/53 controls |
| ex-D4 | 16 |
| ex-D5 | 21 |
| ex-D7 | 37 |
| ex-D8 | 09 (`typeof` part) + 41 (rest) |
| ex-D9 | 37 |
| ex-D10 | 34 |
| ex-D11 | 74 |
| ex-D13 (source transform) | **out-of-axis** (§4 bundler output; Neo runtime lookup) |
| App. A whole-object | 65; `css.raw`/`cva`/v2-gating → §4 |

### Nesting (61) + atomic skim (16) + encode (5)

| Corpus slice | Lands in |
|---|---|
| ne-§3.1/3.3(H)/3.4(H)/3.5/3.6/3.7 (17 HAVE) | 47 |
| ne-§3.14(H) 4 tests (`:433/:455/:466/:477`) | 48 (stacked `:455/:466` gap → 80, pinned) |
| ne-§3.10 `:389` | 49 |
| ne-§3B `:642/:653/:664` | 68 |
| ne-§3B `:675/:686` | 69 |
| ne-§3B 8 self-`&` | 70 |
| ne-§3B 7 compound/multi-`&` | 71 |
| ne-§3B 12 tag/BEM/tail/bare | 72 |
| ne-§3B 7 placements/stacks | 73 |
| skim 13 HAVE | 04 / 15 / 18 / 21 / 27 / 29 / 38 |
| skim 1 (`:239-261`) | 79 |
| skim 3 pointers | 22 / 29 |
| skim cousin (`configured_condition_…`) | 47 |
| encode 5 (IR contract) | inside 15 (no separate row) |

### Cross-file shapes (27 = 20 catalog + 7 out-of-axis)

| Shape | Lands in |
|---|---|
| R1/R2 | 50 |
| R3/R4 | 34 (+ R3b resolved at SITE-28 per Ph4 disposition; R4 alias chains bonus) |
| R5 | 51 |
| R6 | 52 (+ 76 mechanism) |
| R7 | 53 |
| R8 | 54 |
| R9 | 55 |
| X1 | 56 (+ 76 mechanism) |
| F1 | 57 (+ 76 mechanism) |
| F2 | 58 |
| I1 | 59 |
| I2 string-literal names | 59 (SITE-76 arm) |
| I5 | 60 |
| K1-fold | 62 |
| K1-viewTransition-as-value | 62 (refuse WITH diagnostic) |
| C1/C2/C6 | 76 |
| I4 re-export scanning | 76 rider (S12) |
| TOKEN-hex | 61 (EQUIVALENT-or-better) |
| C3/C4/C5/C7 tooling, I3 side-effect imports, I6 JS-parity anchors, default/namespace-as-v2-refusal | **out-of-axis** (§4; ours is the deferred 76 rider S13) |

Grand total: 223 + 61 + 90 = **374 placed** (+16 skim + 5
encode = 395 consulted). The single placed-but-unbuilt row is
ex-68 (entry 14); everything else placed is pinned.

## 5. Deferred and open items (not claimed)

- **S13** (namespace/default value imports): **STRUCK — Forge §6
  verdict: permanently match v2.** Named imports are the dialect;
  namespace/default *value* reads refuse with
  `ATM-W-DYNAMIC-MEMBER` / `ATM-W-NON-OBJECT-CSS-ARG`, which is the
  contract — not a gap, so no export value tables get built for it.
  The values still paint: harvest (Forge Part I) mints every
  complete CSS/rhythm literal onto every compatible sink. No
  station. Not quoted, nothing further to build.
- **39-F3 follow-up** (pure calls in const inits): v2 folds, we
  refuse with a diagnostic. Current behavior is pinned
  (`A/tests/cases/ATM-SITE-31/`); the post-attach init-folding pass
  is scoped but unbuilt. Entry 39 is HAVE* until it lands.
- **Poison precision** (35/53): **SIGNED — Forge Slice 3.**
  Cross-file mutation poison is precise to the origin binding:
  `A/tests/cases/ATM-SITE-84/` folds an import from its unmutated
  export despite a same-named write in another file, and the
  written file's own use still names its write. `§8` finding (ii)
  is closed; rows 35/53 are HAVE.
- **Ph1 mutation wording**: **SIGNED — Forge §8 verdict** (same-file
  arms) **+ Forge Slice 3** (cross-file clause). The §8 sentence,
  quoted verbatim from `docs/missions/operation-forge.md` §8:

  > A tracked write to a binding — assignment, compound assignment,
  > update, `for-of` / `for-in` head, `delete` — poisons that binding in
  > its own file: uses drop with a located `ATM-W-MUTATED-BINDING` naming
  > the write, never a stale value. A write through a member path
  > (`theme.primary = …`) poisons the root binding (`theme`), not the
  > path. Across files, poison is precise to the origin binding: a
  > same-named write in another file never blocks an import that resolves
  > to an unmutated export. Unmutated `let` / `var` / `export let` fold
  > like `const`.

  `A/tests/cases/ATM-SITE-28/` (same-file) and
  `A/tests/cases/ATM-SITE-84/` (cross-file precision) are green;
  the wording quarantine is lifted in full.
- **`__proto__` verdict**: **CLOSED — Forge §7: out of axis.** Panda
  `mergeProps` drops `__proto__` so a spread cannot pollute
  `Object.prototype`; neo merges cascade slots, not objects, and
  the outcome stays covered by MERGE-01/02/05. No key-ban, no
  station. The voyage-log line closes with this sentence.
- **null-const slice**: open and otherwise undefined — the name
  appears only in the voyage log (Ph3/Ph4 close lines); no owning
  entry, no station. Observed (probe, NOT a pin):
  `const n = null; css({ color: n })` warns
  `Dynamic non-literal identifier 'n'` and skips with siblings
  kept — fail-closed; whether a const null should strip silently
  like a literal null (entry 03) is the open question.
- **Doom seed 1** (nested imported-object spread drops silently
  cross-file): filed with a repro at
  `docs/missions/doom-agent-protocol.md` §8 (reproduced 2026-09-19:
  `css(button)` over a re-exported spread keeps `padding`, drops
  `color`, zero diagnostics; same-file resolves). Attaches to
  55/76 territory; entries stay HAVE* until a doom cycle fortifies
  it. This is silence on idiomatic code — the one open hole in the
  no-silence rule.
- **Runtime-table coincidence** (refused leaves can paint when
  another site mints the same atom): **SIGNED — Forge §2 verdict
  (accepted).** Extraction refusal is about the *site*, not the
  *value*. A site the walk cannot read mints nothing and says so.
  The values the program wrote are still information: the harvest
  mints every complete CSS or rhythm literal in the compile inputs
  onto every sink that could ask for it. Runtime paints any
  `(prop, value, when)` the sheet holds and nothing else. A value
  the program never wrote never paints. Not a station gap; the
  floor under this sentence is Forge Part I (Slice 4).
- **Entries 14 and 81**: pinned by the mop-up crew (SITE-47, SITE-28 arm); removed from the open list.

## 6. Pre-existing reds (out of mission scope, untouched)

All re-verified this session; none is an overmatch regression.

- **token10** (`A/tests/token10.test.ts`, "accepts
  string-serialized specs like typegen"): 1 fail — diagnostic
  vector grew from 1 to 6 identical category warnings. Red since
  before Ph3 close (`v 251/252 (token10 known-red)`); fails
  identically now (254/255). Unrelated to extraction language
  (spec-rejection seam).
- **tasty vitest**: 38 failed / 43 passed (golden drift); **cargo
  62/0 green**. Zero atomic dependency (direct or transitive).
- **virtualrs vitest**: 10 failed / 6 passed (golden drift);
  **cargo 26/0 green** — its own Rust tests contradict its vitest
  goldens, per `§8`. Zero atomic dependency.
- **typegen cargo**: 8 failed / 32 passed
  (`tests::goldens::*_matches_committed_golden`); vitest 21/21
  green. Zero atomic dependency.

No-atomic-dependency proof (read this session):
`tasty/Cargo.toml` deps = `shared` + oxc + serde;
`virtualrs/Cargo.toml` = `shared` + oxc + serde;
`typegen/Cargo.toml` = `base_system` + `canon`;
`shared` = `base_system` + oxc; `base_system` = indexmap +
rustc-hash + serde; `canon` = no `[dependencies]` at all. The
word "atomic" appears in none of these manifests; the three
suites cannot observe atomic behavior changes.

## 7. Ph2 HQ catalog-amendment action list (applied 2026-09-19)

Quoted from `§8`; HQ applied 2026-09-19. Mission catalog statuses,
cites, IDs, and counts now match this ledger. The quoted list is
the list that was applied:

> promote 02, 06, 07, 08, 09, 13, 17, 22, 27, 28-half, 29, 35,
> 36, 37, 42 to HAVE; drop unpinned qualifiers 49/51/53; re-cite
> 03 → LEAF-05 + positional note, 18 + LEAF-04 − NEO-SITE-08,
> 38 + SITE-73, 44 + SITE-74; fix cites 57/58/62; amend the 70
> note to spelling-sensitive and the 72 note (v2 `:631` mints
> WITH segment).

Related: 28-half is now whole (Ph3 flatten landed); 55 and
GAP-04a were refiled to Ph3 and both landed (SITE-77, canon
aliases). Remaining ledger-HAVE rows beyond this minimum list
were flipped in the same paperwork pass.

## 8. Ph5 errata for HQ (new findings)

1. **`ATM-SITE-42` collision.** §1 assigns 42 to entry 55;
   §5-Ph3 assigns 42 to entry 32 (destructure); disk has 42 =
   destructure and 55 = `ATM-SITE-77`. The station README
   (`A/tests/cases/ATM-SITE-42/README.md`) already flags this and
   keeps the landed name. Recommend: §1 32 → `ATM-SITE-42`,
   §1 55 → `ATM-SITE-77`, delete the phantom `ATM-SITE-35`.
2. **`ATM-SITE-35` does not exist** (its content lives at 42, see
   1). `ATM-SITE-47` has since been filed for entry 14 by the
   mop-up crew — that half of this erratum is closed.
3. **S1 pin.** §3 cites `ATM-SITE-05`; the explicit
   top-level-`css(c?a:b)` pin is `ATM-SITE-27` (its SPEC text
   names S1). Both green; cite 27.
4. **`NEO-SITE-21` TESTS.md line** (`N/site/TESTS.md:28`)
   describes only the impure-refusal half; the 39-F1 pure paint
   arm is landed and described in the case README. TESTS.md needs
   one clause.
5. **Entry count.** §6's "79 entries" predates entries 80 (Ph0
   GAP-48) and 81 (oracle follow-up). The catalog holds 81.

## 9. The statement, as quotable from this file

> We extract atomic CSS from your tokens, styles and code — and
> on the extraction language we match Panda v2 everywhere it
> resolves (81 of 81 catalog entries pinned by green stations,
> 4 with stated carve-outs) and exceed it in 19 pinned
> superiority rows — except: the S13 value-import rider and the
> four carve-outs (poison precision, 39-F3 init-folding, Ph1
> mutation wording, doom seed 1), which are open and listed in
> §5 with their reasons.

