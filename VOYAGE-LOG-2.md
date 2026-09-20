IN PROGRESS

# Voyage log — Objective 2: Operation Error Correct

Captain and crews append here: cartographer maps, oracle handovers,
architect rulings, implementor landings, surprises, dead ends.
First line becomes `COMPLETE` when stations prove grouped, actionable
miss output and Objective 1's census errors have proper signals
instead of silence.

Plan: `docs/missions/operation-error-correct.md`.

---

## Map

_(cartographer crew lead, live — 4 nested mappers dispatched 2026-09-19: A diagnostics module + emitter ledger; B coordinator + wire contract; C key authority + miss reporter; D stations + SPEC. Sections below fill in as reports land.)_

### Crew notes (pre-map, from carry-forwards + doc read)

- Obj-1 fodder for this objective: hover double-emit diagnostics
  formatting bug (×2 covers all 9 button sites, not just hover —
  oracle N3); `disclosureChrome.ts:44` var mismatch (open, untouched);
  `classify.rs` pinning (noted, not a defect).
- Doc corrections (oracle nits N1/N2): "First blood" says "31 sites" —
  actual is 22 textual sites / 31 warnings; per-leaf commit
  attributions (`fbfc83fca` only button; others `1ee2419e8`,
  `3762068f0`, `3bf2d4da2`, `84a3d8073`).
- Brief-vs-doc discrepancy flagged for architect/captain: dispatch
  brief describes building an "opt-in runtime miss reporter
  (cap/collapse, generated-pattern detection, pool-stats, trimmed
  stacks)"; the READY doc explicitly says "Error Correct does not
  redesign the runtime miss reporter" and "runtime reporting is not
  implemented by this operation." Mapper C is inventorying what the
  runtime miss reporter already does; the map will state which parts
  of the brief are already true vs out of scope per the doc.

### A. What exists

All paths relative to repo root; Rust line numbers from mapper
firsthand reads, lead-verified on the highest-leverage claims
(double `sources::collect`, `is_sink_code`, `serialize_lookup_key`,
`reportedMissDiagnostics`, zero `compilerDiagnostics` hits).

**A1. Diagnostics module (small, flat, shared pipe).**
`packages/reference-rs/modules/atomic/src/diagnostics/` = 4 files,
603 lines: `codes.rs` (339, 42-code `CODE_TABLE`: 32 `ATM-W-*`, 8
`ATM-E-*`, 2 `ATM-I-*`; `TokenCategoryMismatch` retired but kept for
wire stability), `mod.rs` (162, `Diagnostic` type + `line_col`
UTF-16 renderer + location), `render.rs` (76, shared
`{file}:{line}:{col} {code} {message}` format), `README.md` (26).
Default-channel behavior is uniform: every emitter pushes onto one
shared `&mut Vec<Diagnostic>` threaded extract → harvest →
static_css → resolve → plans → stylesheet, returned as
`CompileResult.diagnostics` (`lib.rs:81`). Nothing aborts the
compile; each refusal drops only its item. Two dedup points exist:
portable-sheet throwaway sink (`assembly.rs:71`) and plan re-resolve
(severity,message) dedup (`runtime/builder.rs:142-145`). Extract
diagnostics are all located; resolve/static/global are unlocated
except resolve token-reference errors (want location) — this is the
ATM-DIAG-04 gap.

**A2. Emitter ledger (complete — mapper A).** ~60 emission sites
inventoried. Extract funnel `ExpressionWalk::warn_dynamic`
(`walk/mod.rs:105-125`) records a harvest sink iff `is_sink_code`
(six Dynamic* codes, `harvest/sinks.rs:71-81`) then warns located;
`warn`/`info` variants record no sink. Exact-key knowability: **no**
extract emitter knows the full `(system,when,prop,value,important)`
key (all NO except dead-branch infos = known-but-unminted-by-design
and harvest sink = PARTIAL, carries prop/when/count only). Resolve
has 4 passthrough warnings where the raw value still keys YES
(`MALFORMED-OPACITY`, `UNKNOWN-TOKEN-PATH`, `UNKNOWN-COLOR`,
`UNTERMINATED-BRACE` — `resolve/tokens/*`); everything else is
TRIPLE (authored triple known, no plan minted) or NO. Static/global
surfaces are N/A (no runtime plans). Full ledger table lives in
mapper A's report (`/tmp/obj2-map-A.md` — session-local; re-derive
from the file:line pointers above if stale). Two asymmetries
flagged: `DynamicExpression` from `object/spread.rs:90` bypasses
`warn_dynamic` (no sink, unlike every other Dynamic* site);
`MutatedBinding` via `member.rs:83` records no sink by
`is_sink_code` design.

**A3. Fatal `ATM-E-*` paths (8 codes, all fail-closed per item).**
`ATM-E-MISSING-HOST-GRAPH` (`extract/mod.rs:178`),
`ATM-E-RECIPE-ARG-SHAPE/SPREAD/CLASSNAME`
(`extract/recipes/mod.rs`), `ATM-E-RECIPE-CLASSNAME` empty-spec
(`recipes/spec.rs:25`), `ATM-E-PARSE` (`lib.rs:216`),
`ATM-E-DUPLICATE-RECIPE` (`lib.rs:309`),
`ATM-E-UNKNOWN-TOKEN` (`resolve/tokens/*`, 2 sites),
`ATM-E-INVALID-BASE-SYSTEM` (`native.rs:99`, N-API boundary only —
the sole whole-compile refusal, unreachable from in-crate
`compile()`).

**A4. Single parse + shared programs (doc's architecture premise:
TRUE).** `compile()` (`lib.rs:109-171`) collects sources once,
builds `allocators`/`parsed` once (`:113-118`, alive for the whole
compile), and constants/value-graph/extract/harvest all borrow
`&parsed` — no re-parse downstream. BUT: `hosts/entries.rs:13`
calls `sources::collect(request)` a **second** time (lead-verified)
and keeps only on-disk `is_file()` entries — virtual-only sources
are silently skipped for tracing. Slice 2 must decide whether that
second collect counts as a "second parse" violation (it re-collects,
tracing re-parses inside StyleTrace) or grandfathered host behavior.

**A5. Source positions: renderer exists, catalog does not.** Single
UTF-16 `line_col` (`diagnostics/mod.rs:62`, columns count UTF-16
units); `DiagnosticLocation{file,line,column}` carried Want→resolve.
No `SourceCatalog` type — `(path,content)` tuples threaded as
`(&str file, Option<&str> source)`. Doc's `SourceId`/`SourceSite` is
new vocabulary.

**A6. Host→diagnostics conversion exists.**
`TraceDiagnostic{file,message}` (styletrace `surface.rs:76,99`) →
`hosts/diagnostics.rs:8` → `ATM-W-TRACE-SKIPPED`, file-only, no
line/col. This is the template for the Slice 3 host adapter.

**A7. Runtime key authority (Rust owns it).**
`RuntimeStylePlan{system,when,prop,value,important,declarations}`
(`runtime/plan.rs:21`); `LookupKey` + `serialize_lookup_key`
five-tuple compact JSON (`runtime/serializer.rs:35,62`);
`canonical_json_value` recursive key-sort (`:10`). TS mirrors are
byte-exact copies: neo `runtime/css/plans.ts:39,55,75`, atomic-js
`js/plans.ts:37,53,73`. Compile-side assembly:
`AuthoredDeclaration` + `lookup_key(system)` + `derive_slot`
(`runtime/builder.rs:22,31,43`); responsive arrays/objects
(`:234,:276`); conditions `lower_when`
(`resolve/conditions/mod.rs:26`, unknown drops whole want at
`resolve/mod.rs:117`). Runtime query side: `collectEntries`
(neo `runtime/css/css.ts:153`), `cleanResponsiveObject` (`:139`),
`r`-sugar lowering (`lowerResponsiveStyles.ts:16`).

**A8. Harvest pipeline.** `collect_pool` + `mint` at `lib.rs:152-153`
on the same parse; pool = string literals + hole-free templates
(`harvest/literals.rs:67`); ONE sink hook (`warn_dynamic`,
`walk/mod.rs:105`); mint dedups `(prop,when)`, kind-gates pairs,
emits one located `ATM-I-HARVEST-SINK` per sink counting **net-new**
(`mint/mod.rs:144`).

**A9. Current runtime miss reporter (neo only, modest).**
`findStylePlanMisses` (neo `runtime/css/plans.ts:136`) +
`reportStyleMisses` (neo `runtime/css/css.ts:72`, called post-merge
`:200`). Message names `<when > prop: value>` + single-frame call
site + "Add a static call site or staticCss entry". Dedup =
warn-once per distinct full message (`Set<string>`, `:31,:85`) — no
numeric cap, no cross-site collapse. Generated-pattern detection:
none. Pool stats: none. Stacks: single surviving frame after
internal-frame regex (`:46-49`), else `(unknown call site)`.
Dev-only: `NODE_ENV==='production'` gate (`:33`) + inactive-runtime
guard (`:73`). Tests: `css.test.ts:301` unit + `NEO-MERGE-06`
`miss.spec.ts` e2e. Nothing in reference-core; no miss API in
atomic-js plans; recipe runtime has none.

**A10. Stations + SPEC + Neo print path.** `ATM-DIAG-01/02/03/05`
green with goldens (`diagnostics.json` on every atomic station);
harness = `cases.test.ts` → `testing/runner.ts:52`, auto-discovery
(new station = new dir, no registration); SPEC rows at
`atomic/SPEC.md:807-826`, matrix `:1069-1072`. Neo:
`reportWarningDiagnostics` joins all warnings into ONE
`console.warn` (`sync/index.ts:49-56`, golden `sync.test.ts:380`);
errors throw (`:34-39`). E2E: `NEO-SYNC-11`, `NEO-TOKEN-02`,
`NEO-MERGE-06`, `NEO-SITE-06/14`.

### B. What is missing

**B1. Everything named by Slice 5: zero footprint.** No `logs`
field in neo config (`config/types.ts:19`; `validate.ts` never
reads even `debug` — it is declared-only), no
`compilerDiagnostics` anywhere in reference-rs + reference-neo
(lead-verified zero hits), no `LogChannel`, no `[neo] compiler`
printer (only `[neo] sync warning` at `sync/index.ts:53`). The
diagnostics *pipe* exists end-to-end; the backchannel *contract* is
greenfield across `config/types.ts`, `validate.ts`,
`sync/native.ts`, `sync/index.ts`, and possibly the frozen
`NativeCompileRequest`/`CompileResult` contracts.

**B2. Diagnostics subsystem shape.** No `session.rs/facts.rs/
site.rs/channels.rs/policy.rs/analysis//adapters//proof/`, no
`DiagnosticSink`, no `DiagnosticsSession`, no `SourceSite` /
`OwnedLookupKey`, no producer protocol, no independent AST analysis,
no final-plan proof join. Current module is 3 code files + stub
README (26 lines).

**B3. Stations.** `ATM-DIAG-04` + `06`: SPEC rows exist, **no
shells** (04 = positions beyond extract; 06 = Unicode/UTF-16
columns; 05's README cites 04 as open). `ATM-DIAG-07–14`: neither
SPEC rows nor shells — do not exist as concepts.

**B4. A proven Slice-0 witness is an open question, not an
inventory item.** No extract emitter knows an exact absent key
(§A2); the only YES-key warnings are resolve token passthroughs
that still paint (they warn *and* mint — not misses). Mapper A
found no static declaration that reaches runtime but is omitted
from final plans. Per the doc, that likely means the correct first
release has **zero** new userspace warnings — Slice 0 must confirm
or refute, not assume.

**B5. Runtime-reporter features named in the dispatch brief do not
exist** (numeric cap, cross-site collapse/summary, generated-pattern
detection, pool-stats context, multi-frame trimmed stacks) — and
per the READY doc they are **non-goals** ("No runtime miss-reporter
redesign", doc §Non-goals). See §E + shape question Q1.

### C. Slice decomposition + build order + station/test placement

Adopt the doc's Slices 0–6; the map adjusts content, not order.
Build order is sequential (each slice's contract feeds the next);
only station shells can parallelize.

| Slice | Work | Stations/tests | Placement |
|---|---|---|---|
| 0 — ledger + red stations | Adopt mapper-A ledger (§A2) as the classified inventory; add verdict column (userspace/compiler/drop) per emitter; red shells for 04/06/07–14; hunt the §B4 witness (resolve token passthroughs are the prime suspects — do they ever *not* paint?) | Red shells `ATM-DIAG-04/06/07–14` (README+spec+input, failing) | `modules/atomic/tests/cases/ATM-DIAG-*/` (auto-discovered); no registration needed |
| 1 — module skeleton | Split `diagnostics/` into site/facts/session/policy/channels + adapters/analysis/proof scaffolds; `SourceId/SourceSite`, owned locations, `DiagnosticSink`, `DiagnosticsSession`; land 04 (located resolve/static/global) + 06 (UTF-16); byte-for-byte output preserved | `ATM-DIAG-04/06` green; colocated Rust unit tests for site identity + UTF-16 rendering | Rust unit tests beside logic (`cargo test -p atomic` via `pnpm agentrs c atomic`); stations via `pnpm agentrs v <path>` |
| 2 — independent AST expectations | Feed diagnostics borrowed `&parsed` + host surface after `hosts::resolve` (`lib.rs:129`); implement `css()` + traced-JSX analysis emitting `ExactLookupExpected` vs `DynamicSlot`; share `canonical_json_value`/`serialize_lookup_key`/canon prop + `lower_when` only; rule on the `hosts/entries.rs:13` double-collect (grandfather or fold in) | `ATM-DIAG-08/11/12/14` green; unit tests for exact/unknown classification + key parity | Same as S1; parity tests assert Rust key bytes == neo `serializeLookupKey` bytes on fixtures incl. nested conditions, responsive array/object, important, aliases |
| 3 — producer protocol | One family at a time: extract (`warn_dynamic`→sink+fact first), harvest, resolve, hosts (`hosts/diagnostics.rs`→typed fact); prose+audience move to policy; `ATM-E-*` pass-through untouched | `ATM-DIAG-13` green (one site identity, deterministic order, stable codes, no dupes — this is where the Obj-1 ×2 double-emit formatting bug gets its regression test); zero non-diagnostic artifact drift asserted by existing station goldens | `ATM-DIAG-13` + full atomic station suite as drift net |
| 4 — final-plan proof | Owned key type + serializer authority; final emitted-key set from `RuntimeStylePlan`; join after assembly; incidental-coverage rule (harvest/other-file keys count as present) | `ATM-DIAG-08/09/10` prove present/absent/incidental; unit tests for proof join | If §B4 witness hunt fails: proof engine + unit tests land, userspace gains no new warning (doc explicitly blesses this) |
| 5 — compiler backchannel | `logs?: ['compiler']` config + validator + request plumbing (frozen-contract decision needed — Q2); `compilerDiagnostics` result field; move dynamic/refusal/spread/harvest/dead-branch off default; `[neo] compiler` printer; `debug` untouched | `ATM-DIAG-07` green + new Neo sync cases (config threading, distinct printer, array isolation) | Atomic stations + `packages/reference-neo/tests/cases/sync/NEO-SYNC-*` (new case) + `sync.test.ts` unit |
| 6 — audit + census | Intentional golden rewrites (no blanket update); SPEC rows + README; warning census split Book-scaffolding vs shipped components; Splitter default-silence + opt-in return; full `agent-rs` + targeted `agent-neo` | Census is a procedure, not a station; every default warning must name an exact proof | Runner: `pnpm agentrs t` full loop; neo via `pnpm agentneo run` targeted |

**Recommended dispatch order:** Slice 0 first (it is the only slice
that can run fully parallel: ledger-verdict crew + red-shell crew +
witness-hunt crew, disjoint files). Then 1→2→3→4→5→6 strictly in
order — 2 needs 1's session/site types, 3 needs 2's expectation
shape to align fact vocabulary, 4 needs 3's facts + 2's
expectations, 5 needs 4's policy partition, 6 is the audit.

### D. Must not touch

Per doc Non-goals + mapper findings (violations break wire/station
contracts):

- `ATM-E-*` behavior: no downgrades, no rewording, no audience
  moves (8 codes, §A3). `ATM-E-INVALID-BASE-SYSTEM` stays N-API-only.
- Stable `ATM-*` wire values: no renames; `TokenCategoryMismatch`
  stays retired-but-present.
- Extraction/harvest/resolve/stylesheet semantics: no wants, atoms,
  plans, class names, or CSS bytes change (existing station goldens
  are the drift net — Slice 3/6 assert zero non-diagnostic drift).
- No second parse of compile inputs (rule needed on the
  `hosts/entries.rs:13` double-collect — Q3).
- No sibling diagnostics crate, no standalone N-API `diagnose()`,
  no JS package.
- No `debug: true` alias for compiler logs; `debug` stays
  declared-only infrastructure flag.
- No lib component edits to silence diagnostics (incl. leaving
  `disclosureChrome.ts:44` var mismatch alone — Obj-1 carry-forward,
  still open, not this objective's to fix).
- No blanket golden updates; no weakening tests to pass.
- Runtime miss reporter: no redesign per doc non-goal (pending Q1
  ruling — if the captain overrides, it becomes a new slice, not
  scope drift inside Slices 0–6).
- `classify.rs` unknown-path pinning: noted, not a defect, do not
  "fix".

### E. READY doc: true vs stale against current code

**True (mapper-verified):** one diagnostics subsystem premise (flat
3-file module exists at the doc's path); single Oxc parse with
programs alive for the compile (`lib.rs:113-118`); shared
`{file}:{line}:{col} {code} {message}` render; stable `ATM-*` codes
(42,incl. retired token); `warn_dynamic` funnel as first adapter
seam; harvest net-new semantics of `ATM-I-HARVEST-SINK`; Splitter
`UNFOLDABLE-SPREAD` default warning exists; `debug` unconsumed
infra flag; `ATM-DIAG-01–05` home exists (01/02/03/05 green);
runtime misses emit no class (neo `findStylePlanMisses` +
`NEO-MERGE-06` proof).

**Stale / needs correction:**

- E1. "First blood" says "31 sites" — actual 22 textual sites / 31
  warnings (oracle N1). Also commit attribution: `fbfc83fca` only
  wrote button usages; other leaves via `1ee2419e8`, `3762068f0`,
  `3bf2d4da2`, `84a3d8073` (oracle N2).
- E2. "`ATM-DIAG-01`–`05` already establish the home" — overstates:
  04 has no shell (red, SPEC-row only); home is 01/02/03/05.
- E3. SPEC header counts stale: `SPEC.md:83` says "DIAG: 6 total, 3
  open" — only 2 open (04, 06).
- E4. "Hosts never re-filter one mixed array" as future tense is
  fine, but note current Neo *does* join all warnings into one
  `console.warn` (`sync/index.ts:55`) — Slice 5 printer work must
  preserve that collapsing behavior for userspace while adding the
  distinct compiler printer.
- E5. Doc assumes a source catalog exists to hand diagnostics
  ("the source catalog used to render positions") — no catalog
  type exists; Slice 1 builds `SourceId` mapping from the
  `(path,content)` tuples.
- E6. Brief-vs-doc (not doc-vs-code): the dispatch brief's "opt-in
  runtime miss reporter (cap/collapse, generated-pattern detection,
  pool-stats, trimmed stacks)" contradicts the doc's signed
  non-goal. Current reporter (§A9) has none of those four features.
  Needs a ruling before any Slice 5 crew touches
  `neo/src/runtime/css/css.ts` — Q1.

### Shape questions needing an architect (for the captain)

- Q1. Does Objective 2 build the brief's runtime-reporter features
  (cap/collapse, generated-pattern detection, pool-stats, trimmed
  stacks), or does the doc's "no runtime miss-reporter redesign"
  non-goal stand? If built: new slice after Slice 5 with neo-side
  stations, not scope inside Slices 0–6.
- Q2. Frozen-contract touch: does `logs`/`compilerDiagnostics`
  extend the frozen `NativeCompileRequest`/`CompileResult`
  contracts (schema bump?) or ride alongside them (Neo strips
  `logs` before the native call, Rust reads a side-channel field)?
- Q3. Is the `hosts/entries.rs:13` second `sources::collect` (plus
  StyleTrace's own re-parse) grandfathered host behavior or a
  "second parse" violation Slice 2 must fold into the single-parse
  rule? (Also: virtual-only sources silently skipped for tracing —
  bug or contract?)
- Q4. READY challenge 3 pre-answer: mapper A found no static
  declaration that reaches runtime but is omitted from final plans
  (only resolve token passthroughs warn AND paint). Is zero new
  userspace warnings the expected first release, or does the
  architect know a witness Slice 0 should hunt first?
- Q5. `DynamicExpression` from `object/spread.rs:90` records no
  harvest sink (unlike every other Dynamic* site) — intentional or
  Slice-3 adapter fix? Same for `MutatedBinding` via `warn_dynamic`
  recording no sink by `is_sink_code` design.

## Oracle

_(reviewers and planners — what is done, what is next)_

### Oracle O1 — map verification + Slice 0 dispatch (2026-09-19)

Lead verified the map's highest-leverage claims firsthand (spot-check,
not re-map). All substantive claims HOLD. Two path-shorthand errata noted;
neither changes sequencing.

**Verdicts (V = verified firsthand):**

- V1. `hosts/entries.rs:13` double `sources::collect` — HOLDS.
  `entry_paths` re-collects from the request while `lib.rs:110` already
  collected; `is_file()` filter + "skipped silently" comment confirm the
  virtual-only skip. Feeds Q3.
- V2. Zero `compilerDiagnostics` footprint — HOLDS. Zero hits across
  `packages/reference-rs` + `packages/reference-neo`.
- V3. `ATM-DIAG-04/06` shells missing, `07–14` nonexistent — HOLDS.
  Only `ATM-DIAG-01/02/03/05` dirs exist; SPEC has `[ ]` rows for 04
  (`:818`) and 06 (`:824`), no rows for 07–14 anywhere.
- V4. Emitter-ledger pointers — HOLD (spot-checked):
  `warn_dynamic` funnel + "one sink hook" comment at
  `extract/expressions/walk/mod.rs:105-125` (map's `walk/mod.rs` omits
  the `expressions/` segment — same for `object/spread.rs`,
  `member.rs`; line numbers exact); `is_sink_code` six codes at
  `harvest/sinks.rs:71-81` exact; `line_col` at
  `diagnostics/mod.rs:62` exact with UTF-16 unit test; host adapter
  `hosts/diagnostics.rs` file-only (`None, None`) as claimed;
  `(severity,message)` dedup in `runtime/builder.rs` (`is_duplicate`)
  as claimed.
- V5. Q5 asymmetries — BOTH REAL. `spread.rs:90` emits
  `DynamicExpression` via `ctx.warn`, bypassing `warn_dynamic` (no
  sink); `member.rs` funnels refusals through `warn_dynamic`, so a
  `MutatedBinding` code records no sink by `is_sink_code` design.
  Q5 is a legitimate ruling, not a misread.
- V6. Runtime reporter modesty (§A9) — HOLDS.
  `findStylePlanMisses` at `runtime/css/plans.ts:136`;
  `reportedMissDiagnostics` warn-once `Set` (`css.ts:31,85-89`);
  production gate (`:33-39`) + inactive guard (`:73`); single-frame
  site after internal-frame regex (`:46-58`). No cap, no collapse,
  no generated-pattern detection, no pool stats. §B5/Q1 stand.
- V7. Single-parse premise (`lib.rs:113-118`) — HOLDS. One
  `allocators`/`parsed` build with "One parse per source" comment;
  constants/graph/extract/harvest borrow `&parsed`. The only
  wrinkle is V1 (Q3).
- V8. Slice-5 greenfield (§B1) — HOLDS. No `logs` in
  `config/types.ts`; `validate.ts` reads neither `debug` nor `logs`;
  Neo joins warnings into ONE `console.warn` (`sync/index.ts:49-56`),
  errors throw (`:34-39`). E4's preserve-collapse warning is real.
- V9. SPEC staleness E3 — HOLDS. Header `:83` says DIAG 6/3/3 (3
  open) but only 04 + 06 rows are `[ ]` (2 open).
- V10. Witness-hunt premise (§B4) — LOCATION-CONFIRMED,
  BEHAVIOR-OPEN. `UnknownTokenPath` passthrough exists
  (`resolve/tokens/mod.rs:139`); whether any warn-site ever fails to
  paint is exactly what the Slice 0 witness crew must determine by
  repro, not by reading. NEO-MERGE-06 exists as the runtime-miss
  proof anchor.

**Order: CONFIRMED — Slice 0 now, then 1→2→3→4→5→6 strictly.**

The map's dependency chain is sound (2 needs 1's session/site types;
3 needs 2's expectation vocabulary; 4 needs 3's facts + 2's
expectations; 5 needs 4's policy partition; 6 is the audit). No
reorder. One clarification: Slice 1 lands 04/06 green per the doc —
the red-shell crew must write 04/06 shells to the doc's contract
(located resolve/static/global; UTF-16 columns), not invent new
assertions.

**Slice 0 first dispatch — 3 parallel crews, disjoint write-sets:**

1. `slice0-ledger-verdicts` — Adopt the §A2 ledger; add the verdict
   column (userspace/compiler/drop) per emitter; every userspace row
   names its intended proof witness. Writes ONE new durable file:
   `docs/missions/error-correct-ledger.md` (re-derived from
   file:line pointers, since mapper A's `/tmp/obj2-map-A.md` is
   session-local). Touches nothing else. Does NOT edit the signed
   READY doc (E1/E2 corrections stay log-only until Slice 6).
2. `slice0-red-shells` — Red shells (README+spec+input, failing) for
   `ATM-DIAG-04/06/07–14` under
   `modules/atomic/tests/cases/ATM-DIAG-*/` (auto-discovered, no
   registration) + new SPEC rows for 07–14 + fix the E3 header count
   (`SPEC.md:83`). Touches only those dirs + `SPEC.md`.
3. `slice0-witness-hunt` — READ-ONLY over repo source; repros in
   `/tmp` only. Prime suspects: resolve token passthroughs (do they
   ever NOT paint?); any static declaration reaching runtime but
   omitted from final plans. Returns findings to the oracle; writes
   NO repo files and appends NOTHING to this log (avoids
   concurrent-write collisions — oracle records the verdict).
   Success = confirmed witness OR evidence-backed zero-witness
   conclusion (doc blesses silence).

Convergence: oracle reviews all three, records the ledger verdict +
witness verdict here, then sequences Slice 1.

**Done-criteria per slice (checkable):**

- S0: ledger file has zero unclassified W/I emitters; all 10 red
  shells fail for the documented reason; witness verdict recorded
  (witness + repro, or zero-witness with evidence).
- S1: module shape exists; `ATM-DIAG-04/06` green; full atomic
  station suite byte-identical except intended location/code gains;
  `agentrs q` clean.
- S2: `ATM-DIAG-08/11/12/14` green; key-parity tests assert Rust key
  bytes == neo `serializeLookupKey` bytes on nested fixtures; no
  source reparsed (Q3 ruling honored).
- S3: `ATM-DIAG-13` green (one site identity, deterministic order,
  stable codes, no dupes — incl. Obj-1 ×2 double-emit regression);
  zero non-diagnostic artifact drift on existing goldens.
- S4: `ATM-DIAG-08/09/10` prove present/absent/incidental; if the
  S0 witness hunt failed, proof engine + unit tests land with zero
  new userspace warnings.
- S5: `ATM-DIAG-07` + new `NEO-SYNC-*` case green; default silence,
  opt-in visibility, array isolation; distinct `[neo] compiler`
  printer; `debug` untouched; Q2 contract shape honored.
- S6: every default warning names an exact proof; intentional golden
  rewrites only (no blanket update); SPEC + README current; Splitter
  default-silence + opt-in return confirmed; full `agentrs t` +
  targeted `agentneo run` green.

**Architect-ruling dependencies (Q1–Q5) — wait vs proceed:**

- Q1 (runtime-reporter redesign vs non-goal): PROCEED — no slice
  waits. Ruling affects only a possible NEW slice after S5; S0–S6
  never touch `neo/src/runtime/css/css.ts`. If the captain overrides
  the non-goal, it lands as S7, not scope drift.
- Q2 (frozen `NativeCompileRequest`/`CompileResult` vs
  side-channel): S0–S4 PROCEED; S5 IMPLEMENTATION WAITS. The S0 07
  shell may be written against the doc's conceptual shape but must
  not assume the wire shape; S5 crew does not write plumbing code
  until the ruling lands.
- Q3 (double-collect grandfathered vs violation; virtual-skip bug
  vs contract): S0–S1 PROCEED; S2 WAITS on the ruling before
  touching `hosts/entries.rs` or the analysis-input wiring. S1's
  session/site types are unaffected either way.
- Q4 (zero-new-warnings expected vs architect-known witness): NOT A
  GATE — S0 witness hunt runs regardless. A ruling naming a suspect
  only aims the hunt; absence of a ruling never blocks the
  evidence-backed conclusion. Informs S4 expectations.
- Q5 (spread/member no-sink intentional vs S3 fix): S0–S2 PROCEED;
  S3 holds ONLY those two adapter sites until the ruling, and lands
  the extract-funnel/harvest/resolve/hosts families regardless.

Net: Slice 0 needs NO ruling to launch. S1 needs none. S2 needs Q3,
S3 needs Q5 (partial), S5 needs Q2 — all pursued in parallel with
the build, not before it.

### Oracle O2 — Slice-0 convergence verdict + Slice 1 dispatch (2026-09-20)

Convergence oracle re-ran every Slice-0 claim firsthand. **Verdict:
S0 CLEAR.** All three O1 done-rules met. One log-only ledger erratum
(wrong file pointer, behavior claim holds); no gap, no rework crew.

**C1. Red shells — VERIFIED.** `pnpm agentrs v
modules/atomic/tests/cases.test.ts -t 'ATM-DIAG'` (never raw Vitest):
4 green (`ATM-DIAG-01/02/03/05`), 10 red, each for its documented
reason — 04 `expected '' to contain 'located.ts'`; 06 `expected
undefined to be defined`; 07 `channel items leaked onto default` (12
items); 08 `compiler channel records the exact expected lookup`; 09
`expected '' to contain 'absent.ts'`; 10 `incidental coverage keeps
userspace silent`; 11 `unknown values leaked onto default` (8
warnings); 12 `opt-in compiler channel records expected-key facts`;
13 `duplicate final diagnostic lines` (Obj-1 ×2 reproduced); 14
`opt-in compiler channel records per-mode expectations`. Structure:
all 10 dirs carry README+spec+input with no `output/`; greens keep
`output/`. SPEC: new `[ ]` rows for 07–14 present, E3 header fixed
(`:83` DIAG `14/4/10`, Total `198/184/14`; contract cases `222`,
remaining `[ ]` 12).

**C2. Ledger — VERIFIED.** `docs/missions/error-correct-ledger.md`:
5 userspace / 91 compiler / 0 drop / 0 unclassified (96 W/I rows;
24+50+6+11 = 91). Oracle sweep: every `DiagnosticCode::` token in
`modules/atomic/src` is either a ledger row, an Excluded fatal
(recipe E ×6 incl. `recipes/spec.rs:26`, `lib.rs:216/310`,
`resolve/tokens` E ×2, `native.rs:100`), a documented code-map
(`fold/element.rs:79-80`→D10, `fold/token.rs:63`→D14), a documented
relay/helper, `is_sink_code`/test code, or a test-file hit — **zero
unclassified W/I emitters**. All 5 userspace rows (R1/R2/R4/R5/R7)
name `ATM-DIAG-09` (+`04`) witnesses. Spot-verified firsthand: R1
`resolve/mod.rs:48`→`:51` drop, R2 `:129`→None→`:53-55` empty, R4
`unit.rs:94`→`:97`, R5 `:132`→`:135`, R7 `:164`→`:167`; R2-override
parity (`builder.rs:31-39` raw-when `lookup_key`, `:182-183` plan
gate, `resolve_entry` rebuild `:212-220`) HOLDS.
Erratum E7 (log-only): ledger `:239-240` cites "`resolve_entry`
`:218-222`" in a `resolve/mod.rs` context, but that file is 172 lines
— the function is `runtime/builder.rs:198`, want-rebuild `:212-220`.
Behavior claim true, pointer file wrong. Fix rides with Slice 1 in
passing (docs-only, oracle confirms); no verdict changes.

**C3. Witness — CONFIRMED: `ATM-W-UNKNOWN-CONDITION` → `ATM-DIAG-09`.**
Oracle blind re-ran `sh /tmp/s0witness/run.sh` (exit 0, `RUNTIME HALF
OK`; only diffs vs crew evidence: cargo timing + HashSet plan-print
order — all 14 probe verdicts identical). P1a proves the full chain
through the REAL `atomic::compile` + REAL neo runtime: authored
`_nopeNotACondition: { color: 'green' }` warns `UnknownCondition`
(unlocated) AND drops the whole want (0 atoms, plan MISS); runtime
queries the exact key
`["@reference-ui/lib",["_nopeNotACondition"],"color","green",false]`
with Rust/TS byte parity and MISSES (`class=""` + dev warning).
P1b (`fooDown`) same shape. Controls paint; R6/R8–R11 passthroughs
paint (warn-and-paint, not misses — correctly compiler); P2e/P2g
`{colors.ghost}` are fatal-E paths, out of ledger scope. Repo
untouched by the hunt (`git status`: only ledger + 10 shell dirs +
SPEC + this log). Repro: `/tmp/s0witness/run.sh` (+
`/tmp/s0-oracle-rerun.log` oracle copy).

**SEQUENCE — Slice 1 (diagnostics module skeleton).** No ruling gates
S1 (O1). Single implementor crew (may fan nested workers over
disjoint file groups only — this slice is one coupled module split).
Scope per doc Slice 1 + map §C: split `diagnostics/` into
site/facts/session/policy/channels + analysis/adapters/proof
scaffolds; introduce `SourceId`/`SourceSite`, owned locations,
`DiagnosticSink`, `DiagnosticsSession`; keep code/render
serialization compatible; land `ATM-DIAG-04` (located
resolve/static/global) + `ATM-DIAG-06` (UTF-16) green; fix ledger E7
pointer in passing. Done-criteria (O1, checkable): module shape
exists; 04/06 green; full atomic station suite byte-identical except
intended location/code gains; `agentrs q` clean. Files in play:
`modules/atomic/src/diagnostics/**` (the split),
resolve/static/global/hosts warn sites (04 locations only),
`diagnostics/mod.rs:62` `line_col` (06), `tests/cases/ATM-DIAG-04/` +
`ATM-DIAG-06/` goldens, SPEC 04/06 rows flip to `[x]`. Must-not-touch
(map §D): `ATM-E-*` behavior, stable wire codes, extraction /
harvest / resolve / stylesheet semantics (goldens are the drift net),
`hosts/entries.rs` (Q3 grandfathered — S2 rule pending), no second
parse, no `css.ts` runtime work (Q1 DEFER stands). Oracle reviews the
landing firsthand (suite re-run + diff review), then sequences Slice
2 (needs Q3 ruling before touching analysis-input wiring).

## Landings

_(implementors, per slice)_

### S0 ledger-verdicts

_(slice0-ledger crew, landed 2026-09-20 — lead + 3 nested workers over disjoint
families; static/global/hosts/harvest lead-read inline after a capacity
rejection on the 4th spawn. Wrote ONE file:
`docs/missions/error-correct-ledger.md`. Touched nothing else.)_

- Adopted map §A2, re-derived firsthand from `DiagnosticCode::` token lines
  (mapper `/tmp` report not used). Line convention: code-token line.
- Counts: **userspace 5, compiler 91, drop 0, unclassified 0** (96 W/I rows).
- Userspace (all resolve DROPs, all unlocated → witness pairs `ATM-DIAG-09` +
  `ATM-DIAG-04`): R1 `resolve/mod.rs:48` UnknownProperty, R2
  `resolve/mod.rs:129` UnknownCondition, R4 `resolve/unit.rs:94`
  NonCanonicalNumeric/Number, R5 `resolve/unit.rs:132` InvalidCssValue/empty,
  R7 `resolve/unit.rs:164` InvalidCssValue/Bool.
- Lead override (firsthand): resolve worker suggested compiler for R2
  (unlowered `when` ⇒ no exact key). Overruled — both key authorities use RAW
  whens (`runtime/builder.rs:31-39`, neo `collectEntries`), and plan minting
  is gated on resolve success (`builder.rs:182-183,218-222`). R2 is userspace,
  matching architect Q4's prime suspect; witness-hunt confirms live reachability.
- DeadBranch ×4 + HarvestSink kept compiler (doc seed + `ATM-DIAG-07` opt-in
  contract), not drop. Drop verdict legitimately zero.
- One code, two verdicts confirmed (policy audit): UnknownProperty,
  UnknownCondition, InvalidCssValue, NonCanonicalNumeric each split by site —
  Slice 3 adapters must carry the site, not just the code.
- Silent-drop sweep (informational, not rows): `resolve/unit.rs:161`
  Null-hole strip; `resolve/mod.rs:84-86` runtime-owned (`variant`/`colorMode`)
  whole-want silent drop. Witness-hunt input.
- No emitter defied classification. Q5a/Q5b asymmetries confirmed firsthand
  (D10 no-sink intentional; O4 bypass = Slice-3 fix).
- S0 done-rule for this crew: zero unclassified W/I emitters — MET.

### S0 red-shells

_(landed 2026-09-19 — slice0-shells crew: lead + nested workers A/B; C refused on root capacity, lead built 12/14 inline)_

10 red shells under `packages/reference-rs/modules/atomic/tests/cases/ATM-DIAG-*/`
(README + spec + input, no `output/` — `spec.verify` runs before the golden
diff, so the spec assertion is the fail reason). Root confirmed from the map
(§C): auto-discovered, no registration. 04/06 written to the doc contract per
O1 (no new assertions); 07 honors Q2 as written (additive-optional `logs` /
`compilerDiagnostics`, no schema bump). SPEC rows added for 07–14 + E3 header
fixed (`:83` DIAG `6/3/3` → `14/4/10`; total `190/184/6` → `198/184/14`;
contract cases `214` → `222`, remaining `[ ]` 4 → 12). Touched only the 10
station dirs + atomic `SPEC.md`. No commits, no golden updates, no weakening.

Firsthand `pnpm agentrs v modules/atomic/tests/cases.test.ts -t 'ATM-DIAG'`:
4 green intact (01/02/03/05), 10 red, each for its documented reason:

- 04: `expected '' to contain 'located.ts'` — extract half green (4:11);
  `ATM-W-UNKNOWN-TOKEN-PATH` file-less (resolve positions missing).
- 06: `expected undefined to be defined` (spec `:39`) — extract UTF-16 col
  pin passes (61); global-surface `ATM-W-UNKNOWN-CONDITION` file-less.
- 07: `channel items leaked onto default` (12 items) — dynamic/spread/
  harvest/dead-branch all on default; no `compilerDiagnostics` channel.
- 08: `compiler channel records the exact expected lookup: expected
  undefined to be defined` — presence + silence pins pass; no analysis.
- 09: `expected '' to contain 'absent.ts'` — pins confirm Q4's suspect
  shape (want present, plan omitted, exactly one `ATM-W-UNKNOWN-CONDITION`);
  warning file-less, names only the condition.
- 10: `incidental coverage keeps userspace silent, got:
  ATM-W-DYNAMIC-IDENTIFIER, ATM-I-HARVEST-SINK` — harvest covers the sink
  but the dynamic warning stays default; no coverage proof.
- 11: `unknown values leaked onto default` (8 warnings) — all dynamic
  shapes warn on default today.
- 12: `opt-in compiler channel records expected-key facts: expected
  undefined to be defined` — one plan key + native-style absence pins pass.
- 13: `duplicate final diagnostic lines: expected 1 to be 2` — Obj-1 ×2
  reproduced (unknown-token under `_hover` warns twice); file-lessness
  asserted next as one-site-identity.
- 14: `opt-in compiler channel records per-mode expectations: expected
  undefined to be defined` — 4 modes extract, UTF-16 col-54 + located
  `ATM-E-PARSE` pins pass; no per-mode analysis agreement.

Notes for S1–S5: `compile()` silently ignores the unknown `logs` field
today (no throw), so opt-in assertions fail on the absent field, not on
plumbing errors. 09's pins pre-confirm the witness-hunt prime suspect's
mechanics (warn + drop whole want); the hunt's verdict decides whether 09
greens on UnknownCondition or the proof engine lands warning-free.

### S1 skeleton

_(placeholder — slice1 crew)_

## Architect rulings

_(architect crew, 2026-09-19 — firsthand reads: `docs/missions/operation-error-correct.md`, `docs/missions/operation-error-correct-runtime.md` (`idea`), `VOYAGE-INTO-ABYSS.md` Obj-2 + Law, map §§A–E, plus `atomic/src/lib.rs`, `atomic/native.rs`, `hosts/{mod,entries}.rs`, `extract/expressions/{walk/mod.rs,walk/member.rs,walk/leaf.rs,object/mod.rs,object/spread.rs}`, `extract/{harvest/sinks.rs,fold/element.rs,fold/call.rs}`, `resolve/{mod.rs,conditions/mod.rs,tokens/*}`, `contracts/types.ts`, `neo/src/{sync/index.ts,sync/native.ts,config/types.ts,runtime/css/css.ts,runtime/css/plans.ts}`)_

- **Q1 — brief-vs-doc runtime-reporter contradiction: DEFER (doc stands).** The signed READY doc (HQ 2026-09-19) excludes it three times: signed policy ("Error Correct does not redesign the runtime miss reporter"), channels ("runtime reporting is not implemented by this operation"), and Non-goals. The features' own design authority, `operation-error-correct-runtime.md`, is status `idea` with open parameters (K, flood threshold, pool-stats payload) and self-sequences *after* this operation ("This operation does not implement the channel; it owns the reporter once the flag exists" — i.e. needs Slice 5's `logs` channel first). Standing orders define the mission as "per `docs/missions/operation-error-correct.md`", so the doc's non-goals govern; the brief's parenthetical describes the companion vision, not signed scope. Clearance criterion "grouped, actionable miss output" is met compile-side (ATM-DIAG-09 exact absent-key warning + ATM-DIAG-13 one-site/deduped ordering + existing `NEO-MERGE-06` runtime ground truth). No crew touches `neo/src/runtime/css/css.ts` in this objective. Follow-up: a separate operation promoting the companion doc READY→GO once Slice 5 lands.
- **Q2 — `logs`/`compilerDiagnostics`: EXTEND the frozen contracts (additive-optional, no schema bump).** "Frozen" means versioned additive-only evolution, not immutable — precedent is settled: `include?` (RS-10) on the request and `tracedJsxHosts?` on the result were both added as optional fields without a bump, and the napi `schemaVersion` gate (`atomic/native.rs:64`) rejects only unknown versions. The result side has no alternative: `compilerDiagnostics` must come out of `compile()` (`native.rs:62` serializes `CompileResult` directly), exactly the `tracedJsxHosts` path. A Neo-strips-side-channel split would leave direct `compile()` callers with no way to request the channel and fork the contract across two paths. Shape per doc §Channels: `logs?: LogChannel[]` (`'compiler'` only this operation; `'runtime'` reserved by the companion doc) threaded frozen-TS (`contracts/types.ts`) → napi (`native.rs`, with snake_case alias per house style) → inner `CompileRequest`; `compilerDiagnostics?` populated by Rust only when requested so default bytes are identical for direct callers. Slice 5 owns the threading plus fixtures.
- **Q3 — `hosts/entries.rs:13` double-collect + StyleTrace re-parse: GRANDFATHERED host behavior; virtual-only skip is CONTRACT.** (a) `sources::collect` is collection (glob+I/O), not a parse; the doc's single-parse rule targets Oxc Program parses and their coordinate systems ("a second JSX/TS mode decision; a second parse-error and span coordinate system"). (b) StyleTrace's parse is a pre-existing dependency-boundary parse — it consumes disk paths by design (import-graph walk) and predates this operation; doc §Hosts blesses the boundary ("keeps its own diagnostic type. The Atomic boundary converts it"). Folding it into the single parse would redesign the host surface: out of scope. The single-parse rule binds Atomic's Oxc pipeline plus the *new* Slice-2 analysis (borrow `&parsed`, add no parse — Slice 2 done-rule "no source is reparsed"). Do not touch `entries.rs` in this operation. (c) Virtual-only skip is documented contract, twice: `entries.rs` ("Virtual-only sources carry no import graph and are skipped silently") and `hosts/mod.rs` ("Empty entry sets trace nothing, silently"). Virtual sources have no disk import graph to walk. Preserve; a virtual-tracing feature request is not this operation.
- **Q4 — zero new userspace warnings is the EXPECTED first release, but Slice 0 hunts FIRST.** The doc blesses silence ("better than a release with one warning that cannot carry a proof"; Slice 0: "do not invent one"), and no witness is confirmed — the resolve token passthroughs warn *and* paint (`test_unknown_path_passthrough_warns`, `test_malformed_opacity_warns_and_passes_through`), so they are not misses. But the map did not rule out the prime suspect: `UnknownCondition` (`resolve/mod.rs:lower_conditions`) warns **and drops the whole want** ("so resolve can warn and drop the want", `conditions/mod.rs`), with the exact key (raw `when` + prop + authored value) in hand at the drop site. Slice 0 hunt order: (1) `UnknownCondition` — promote to the ATM-DIAG-09 witness iff runtime actually queries that key (parity check; note the current warning is unlocated, so it also exercises Slice 1's ATM-DIAG-04 work); (2) sweep resolve `?`-drop paths (`resolve/unit.rs:css_value_from_authored` None-paths, `tokens::resolve_token_value` None) for exact-key-knowable drops. The hunt closes by promoting a witness or recording why each suspect fails the proof bar — then zero-new-warnings stands as correct, not assumed.
- **Q5 — split: MutatedBinding INTENTIONAL, spread DynamicExpression is a Slice-3 adapter FIX.** (a) `MutatedBinding` via `member.rs:83` (`warn_dynamic` with `MutatedBase` code, no sink) is intentional, documented twice: `sinks.rs` header ("mutation, spreads, and residue codes are never sinks") and `walk/mod.rs:105` ("Non-dynamic codes (a mutated element base) warn without recording"). Semantics agree: a mutated binding names a stale write, and harvest must not mint pool values onto a site whose declared value is known-stale. Slice 3 preserves it (fact records no sink). (b) `DynamicExpression` from `spread.rs:90` (`ctx.warn` direct, bypassing `warn_dynamic`) is a gap: `DynamicExpression` *is* one of the six sink codes yet this site records nothing, violating the "one sink hook: every Dynamic* call site funnels through here" invariant (`walk/mod.rs:105`) — structurally, `ObjectWalk` has no `warn_dynamic` and carries no `prop`, so the spread site may not even have a (prop,when) identity to mint onto. Slice 3 adapter fix: funnel through the sink hook iff the refused fragment is a mintable value position, else codify an explicit exclusion and repair the invariant comment. Either outcome gets a pin (station or unit test); accidental is not an option.

## Captain's watch

- 2026-09-19 health tick: Obj-1 COMPLETE (committed 50de3366f); Obj-2 map landed (§A–E, slices 0–6, 5 shape questions); live crews: none (both prior crews result_ready, no deadlock); dispatched Obj-2 oracle (verify map + sequence) and architect (Q1–Q5) in parallel; next: Slice 0 crews on their word.
- 2026-09-19 watch: oracle O1 verified map 10/10, order confirmed S0→S6; architect ruled Q1 DEFER, Q2 EXTEND-additive, Q3 GRANDFATHERED, Q4 hunt-first (UnknownCondition prime), Q5 split (MutatedBinding intentional, spread = S3 fix). Captain accepts Q1 DEFER (companion doc is idea-status with open params, needs S5 channel first; follow-up operation after S5). Dispatched 3 Slice-0 crews in parallel (ledger, red-shells, witness-hunt); architect finalizing, substance logged. Next: oracle convergence → Slice 1.
- 2026-09-20 00:24 tick: S0 2/3 landed (ledger 5 userspace/91 compiler/0 unclassified; witness CONFIRMED UnknownCondition → ATM-DIAG-09, repros /tmp/s0witness, repo untouched); shells alive (10 station dirs + SPEC edits on disk, vitals ping queued, landing pending); architect closed, 6/7 crews terminal, no deadlock. Next: convergence oracle on shells landing → Slice 1.
- 2026-09-20 watch: S0 CLEAR on oracle O2 word (4 green + 10 red-for-reason; ledger 5/91/0/0; witness UnknownCondition → ATM-DIAG-09, blind re-run OK). Committed S0 checkpoint. Dispatched single Slice-1 crew (module skeleton, 04/06 green, E7 fix). Next: oracle review of S1 landing → Slice 2.

## Useful
