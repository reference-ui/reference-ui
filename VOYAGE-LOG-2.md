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

### Oracle O3 — Slice-1 review verdict + Slice 2 dispatch (2026-09-20)

Review oracle re-ran every Slice-1 claim firsthand (2 nested workers on
disjoint runners + lead inline diff review, golden audit, quarantine
adjudication). **Verdict: S1 CLEAR.** All O1/O2 done-rules met. Four
findings (F1–F4, none blocking) + one S0-shell erratum (E8, owned by
S5) recorded below. No rework crew.

**V1. Stations — VERIFIED (nested worker, `pnpm agentrs` only).**
`v cases.test.ts -t ATM-DIAG-04` PASS (1 passed/235 skipped);
`-t ATM-DIAG-06` PASS; full `v cases.test.ts` **228 passed / 8
failed**; full `v atomic` **275 passed / 8 failed (283)**. The 8 red
are exactly `ATM-DIAG-07–14`, each for its O2/S1-landing reason: 07
12 channel items on default; 08 `compilerDiags` undefined; 09
`miss.message` must name `color`/`red.500` (location pins now pass);
10 dynamic+harvest on default; 11 8 unknown-values on default; 12/14
`compilerDiagnostics` undefined; 13 spec fully passes, fails only the
`cssIsValid` gauge (passthrough `background: ui.missing.path` +
`Unexpected input` — S3 owns it, deliberately NOT quarantined).

**V2. Cargo + quality — VERIFIED (nested worker + lead).** `pnpm
agentrs c atomic`: **356 passed / 0 failed**, no warnings. `pnpm
agentrs q` (smart, 15 files): exit 0, clean. Lead additionally ran
`pnpm agentrs q …/src/diagnostics` firsthand: all 20 files pass
(closes the untracked-file coverage question).

**V3. Golden drift — VERIFIED (lead audit script, not eyeball).** 22
changed files under `tests/cases/`, ALL `output/diagnostics.json`;
severity/code/message/count/order byte-identical; no pre-existing
location value altered; 36 diagnostics gained `file` (+line/column).
Zero `styles.css`/`css.json` bytes changed (plus 2 NEW 04/06
`output/` dirs). Matches the landing's 22/36 claim exactly.

**V4. Split review — VERIFIED (line-by-line).** `mod.rs` is the seam
(`Diagnostic` struct untouched, new serde-shape pin test);
`DiagnosticLocation::{error,warning,info}` share one
`with_severity` identical to the old `error` (file-gated attach);
`line_col` moved to `site.rs` byte-verbatim; `codes.rs`/`render.rs`
untouched (git status + mtime); the 3 pre-existing `location.error`
call sites (`tokens/mod.rs:114`, `interpolate.rs:96`, `lib.rs:309`)
keep exact semantics — no `ATM-E-*` change. Resolve/token/unit
warnings attach the want's location; global walker threads the
fragment source (file at 1:1, honest for span-less JSON); keyframe
caller passes default into a discarded sink. New
site/facts/session/policy/channels + analysis/adapters/proof match
the doc's responsibilities; `analyze()` chains the four empty S2
seams; `missing_keys` has incidental-coverage tests. No
`hosts/entries.rs` touch, no second parse, no `css.ts` (Q1/Q3
honored). All external importers use root re-exports (unchanged
paths).

**V5. Quarantine — RULED IN-SCOPE (captain's 00:40 watch item).**
Both entries are intended 04/06 fallout, not drift. Evidence: (a) 04
entry is byte-identical to `ATM-TOKEN-14`'s committed line-25 entry
for the same `caret-color: ui.missing.path` passthrough text, which
is present in 04's emitted utilities layer (warn-and-paint engine
behavior); (b) 06 entry pins the exact emitted `content: 😀` from
the committed S0 probe input (`content: '😀'` unquoted, verbatim
string policy); (c) S1 touched NO station input/spec (only new
`output/` dirs) — the gauge need comes from S0 inputs, not S1
weakening; (d) the meta-test passes (04/06 green in full suite).

**V6. E7 + SPEC — VERIFIED.** Ledger pointer now
`runtime/builder.rs:198` + `:212-220`; lead confirmed
`resolve_entry` at `:198` and the want rebuild at `:212-220`. SPEC:
04/06 `[x]` + matrix rows, counts DIAG `14/6/8`, Total `198/186/12`,
remaining 10, stations 219/8-red, cargo 356; DIAG-05 "stays open"
line closed.

**V7. Neo exposure — SAFE by inspection.** `sync.test.ts` diagnostics
assertions are `toContain` on code/message (location-insensitive);
the printer (`sync/index.ts:28-31`) handles all location combos; no
snapshots, no `toEqual` on diagnostics, no file-undefined assertions
found. Neo suite stays S6's gate.

**Findings (not gaps):** F1. `docs/ATOMIC.md` (+111/−27, harvest
walkthrough + domain glossary + worked-example-3 rewrite) is
UNDECLARED — outside the S1 dispatch files-in-play and landed
mid-review (mtime 00:46:34, after this oracle's first stat).
Docs-only, zero behavioral effect; content spot-checked accurate
(`p_`/`c_` abbreviations pinned by `name/mod.rs` tests, six sink
codes, warn-still-warns). Recommend captain KEEP (optionally as a
separate commit) but log the process drift. F2. "26 new Rust tests"
counts 5 moved tests as new; genuinely-new = 22 (33 − 11
pre-existing). Cargo 356 total verified; log-only erratum. F3 (S3
watch). `HostReport`(warning) converts into
`DiagnosticFact::ExistingError` — severity preserved, behavior
identical, but the variant name is stretched; S3 policy work should
confirm the vocabulary. F4 (endorse landing carry-forward).
`sync.test.ts` "unlocated warnings such as display:true" test NAME is
now stale (R7 located; test passes) — S6 hygiene.

**E8 — S0-shell erratum (new, oracle-found): `ATM-DIAG-11`'s guard
contradicts its hinge.** `spec.ts` asserts `diagnostics.some(
isUnknownValue)` is `true` (guard) AND the same filter
`toHaveLength(0)` (hinge) on the same default array — logically
unsatisfiable as written: today the hinge fails (8 leaked), after
any S5 channel move the guard fails instead. The guard's intent
(non-vacuity) is valid but it must read the opt-in compiler channel
once S5 lands it. S5 owns the correction (re-point guard at
`compilerDiagnostics`), NOT a weakening — recorded here so no crew
"fixes" it early. Related: 08/12/14 hinges assert on
`compilerDiagnostics` (S5's Q2 wire), so they cannot flip green
until S5 exposes S2's facts — the O1 "S2 greens 08/11/12/14" line is
amended below. The O1 S2 *unit/parity* criteria stand.

**SEQUENCE — Slice 2 (independent AST expectations).** No ruling
gates S2 (Q3 GRANDFATHERED already in log — honored as: no touching
`hosts/entries.rs`, no re-parse, StyleTrace parse stays a
dependency-boundary parse). Single implementor crew (one coupled
analysis; may fan nested workers over disjoint surfaces
css/jsx/conditions/values + parity tests only). Scope per doc Slice
2 + map §C: construct `AnalysisInput` from borrowed `&parsed` + host
surface after `hosts::resolve` (`lib.rs:129`); implement `css()` +
traced-JSX analysis emitting `ExactLookupExpected` (every key
component statically known) vs `DynamicSlot` (+ conditions/values
helpers); share ONLY `canonical_json_value` /
`serialize_lookup_key` / canon prop / `lower_when` (+ const
values) — never extraction wants/success. Done-criteria (AMENDED
per E8): cargo unit tests pin exact/unknown classification +
key-parity (Rust key bytes == neo `serializeLookupKey` bytes on
fixtures incl. nested conditions, responsive array/object,
important, aliases); no source reparsed; FULL atomic suite shows
ZERO golden drift (analysis runs, renders nothing yet — 04/06 stay
green, 07–14 red for the same V1 reasons); `agentrs q` clean; the
08/12/14 pins stay green as the regression net while their hinges
flip in S5 (when the channel exposes S2's facts), and 11 flips in
S5 with the E8 guard correction. Must-not-touch (map §D + Q3):
`hosts/entries.rs`, no re-parse, no wire fields (`logs` /
`compilerDiagnostics` threading stays S5-owned per Q2), no producer
migration (S3), no `css.ts` (Q1 DEFER), no default-output change.
Oracle reviews the landing firsthand (unit tests + zero-drift
suite re-run + diff review), then sequences Slice 3 (needs Q5b
spread-site rule — already in log: funnel iff mintable value
position, else codify exclusion + pin).

### Oracle O4 — Slice-2 review verdict + Slice 3 dispatch (2026-09-20)

Review oracle reproduced every Slice-2 claim firsthand (inline, no
nested workers: cargo + suite + parity + quality re-runs, full
line-by-line diff review against engine + neo runtime sources).
**Verdict: GAPS — one gap (G1), narrowly scoped.** All O3-amended
checkable criteria pass (V1–V8 below); G1 is a semantic
over-prediction in S2's core deliverable that breaks S4's premise and
must be fixed in a rework crew before S2 clears. The Slice 3 dispatch
spec is fully written below so the captain can launch S3 the moment
the rework clears (write-sets are disjoint — captain may parallelize
at discretion, but the rework lands first in commit order).

**V1. Cargo — VERIFIED.** `pnpm agentrs c atomic`: **394 passed / 0
failed** (356 S1 + 38 S2), no warnings. 71 diagnostics tests, all ok:
classification pins (exact/unknown/hole/dynamic across
css/jsx/conditions/values/object/block/structured/const/imports),
`lookup_key_*` five-tuple/canonical/nested-when tests, parity test
`nested_conditions_responsive_values_important_and_aliases`
(nested whens, responsive array-nulls, responsive object-sort,
important-bang/word, authored alias).

**V2. Key parity — VERIFIED (crew probe re-run + own probe vs REAL
neo source).** `/tmp/s2-parity/check.mjs` re-runs 13/13 byte-equal;
the /tmp `plans.mjs` copy was eyeballed line-identical to
`neo/src/runtime/css/plans.ts:17-70`, so the oracle additionally ran
its own `/tmp/s2-oracle-parity/check.ts` via the repo `tsx` importing
the REAL `serializeLookupKey`: 10/10 byte-equal (the 6 Rust-pinned
shapes + nested-object-value, array-of-objects, empty-when,
quoted-unicode extras). Rust side shares the one authority
(`facts.rs:lookup_key` → `serialize_lookup_key`, `canonical_json_value`
recursive BTreeMap sort).

**V3. Atomic suite — VERIFIED.** `pnpm agentrs v atomic`: **275
passed / 8 failed (283)** — byte-identical totals to the O3-V1
record. The 8 red are exactly `ATM-DIAG-07–14`, each for its recorded
reason (07: 12 on default; 08: `compilerDiags` undef @ hinge :38,
pins pass; 09: `miss.message` must name color @ hinge-2, location
pins pass; 10: dynamic+harvest on default; 11: 8 on default @ E8
guard/hinge, spec untouched — E8 stands; 12/14:
`compilerDiagnostics` undef @ hinges :53/:64, pins pass; 13:
`cssIsValid` gauge `Unexpected input`, spec passes). `ATM-DIAG-04/06`
re-verified green in isolation (1 passed / 235 skipped each).

**V4. Zero drift — VERIFIED.** `git status` before/after all suite
runs: identical (S2's 7 tracked + 8 new analysis files + log; peer
files `operation-seize.md`, `missions/README.md`, `ATOMIC.md`
untouched per orders). No golden/input/spec file modified by any run.

**V5. No re-parse + wiring — VERIFIED.** `AnalysisInput::for_compile`
(`mod.rs:51-74`) zips borrowed `&sources`/`&parsed`, filters panicked,
adds no parse; `lib.rs` constructs it post-`hosts::resolve` from
borrowed parse + `&resolved_hosts` + `&project_constants` + system
name; `analyze()` facts drop in an unrendered session. Only `Parser`
uses: test-only `support.rs` + one `mod.rs` test fn. No
`hosts/entries.rs` touch (Q3 honored), no wire fields, no producer
migration, no `css.ts` (neg-grep over added lines: zero
`compilerDiagnostics`/`logs`/`warn_dynamic`/`.warn(`/`DiagnosticCode`
hits; tracked files exactly the 7 S2 files).

**V6. Sharing discipline — VERIFIED.** Analysis imports ONLY:
`serialize_lookup_key` (via `facts.rs`), canon prop
(`is_condition_prop`/`is_known_style_prop`), `get_style_prop_names`,
const values (`LocalConstants`/`ConstObject`/`ConstArrayElement`/
`canonical_numeric_key`), `AtomValue` (value spelling, not extraction
success). `lower_when` deliberately unused — oracle verified the
raw-when rule firsthand at every `AuthoredDeclaration` construction
site (`entries.rs:83-88`, `object/mod.rs:203-208`,
`call_lower.rs:185-190`, `jsx/mod.rs:86/149/199`, `mint/mod.rs:128`,
`static_css.rs:207` — all push authored `when` verbatim) and neo
`collectEntries` (`css.ts:153-168`, pushes raw segments). Using
`lower_when` would DIVERGE from both key authorities; the crew's
decision is correct and documented (`conditions.rs:1-10`).

**V7. Surface parity — VERIFIED (spot).** css gating mirrors
`extract/bindings.rs` exactly (reserved `__reference_ui_css` w/o
shadow check, `ns.css`, `css.object`); package allowlist identical
two-string match w/ drift watch; `split_important` byte-mirrors
`split_important_flag` (incl. `strip_important_suffix`);
`number_to_json` identical 1e-9/i64 spelling to `ast_value.rs:34-38`;
JSX tag formatter duplicated w/ drift watch; native `style`,
`variant`/`colorMode`, host-owned props excluded (pinned by unit
tests + 12's native pins).

**V8. Quality — VERIFIED.** `pnpm agentrs q` on `diagnostics/` +
`lib.rs`: **ALL 29 FILES PASS**, zero warnings, zero complexity/file
violations, zero clippy allows.

**G1 — GAP (blocking): const-folded holes predict Exact where runtime
queries nothing.** `walk_leaf` gates syntactic holes (`object.rs:251-258`:
`null`, `undefined`, `void`, literal `false` — pinned by
`holes_emit_no_fact`), but the const/unary paths bypass it:
`const C = false; css({v: C})` → `const_class` →
`atom_to_json(Bool(false))` → `Exact{false}` (`values.rs:148-153`,
`const_values.rs:103-114`; const recording confirmed at
`constants/collect.rs:241`); `const N = null` → `Exact{Null}`
(same path; engine itself strips const-null silently,
`resolve/unit.rs:172-174`); `css({v: !true})` → `Exact{false}`
(`values.rs:186-194`); const-object/merge/bag entries with false/null
leaves → Exact (`const_leaf_value`, `walk_const_flat_object`).
Runtime truth (`neo/src/runtime/css/css.ts:129-131`): `isHole`
skips `null`/`undefined`/`false` — NO query. Expected: no fact
(Hole). Actual: `ExactLookupExpected`. Consequence: S4 proof would
emit false userspace warnings ("this lookup will emit no class" for a
lookup that never happens); violates the code's own invariant
(`object.rs:107-109` "Holes … emit no fact: runtime skips them").
Note the asymmetry is load-bearing: `true` MUST stay Exact (runtime
queries it, resolve R7 drops it → genuine miss); only `false`→Hole.
Rework (new crew, S2 files only): centralize hole mapping for
const/unary `false`+`Null` (suggest `atom_to_class` in
`const_values.rs` used by `const_class`, `const_leaf_value`,
`walk_const_flat_object`; `unary_not`-false→Hole), plus pins for
const-false, const-null, `!true`, const-object-false-entry, and a
`true`-stays-Exact regression pin. Re-verify: `agentrs c atomic` +
`v atomic` (still 275/8, same reasons) + `q`. No station changes.

**Findings (not gaps):** F1. `lib.rs` moves `pub mod atom;` below
`mod assembly;` — unclaimed cosmetic reorder, harmless. F2. Const-array
spread: object position stays dynamic (`object.rs:150-152`) but JSX
bag/merge positions vanish (`jsx.rs:183-185`, `jsx_attrs.rs:173-176`,
`block.rs:127-131`) — inconsistent, both silence-valid; suggest
unifying on vanish with a comment. F3. Duplicated truth
(`split_important`, tag formatter, package allowlist) is deliberate
independence with drift watches — accepted, S6 re-audit. F4
(pre-existing, exotic): Rust `BTreeMap` sorts keys byte-wise, neo
`sort()` UTF-16-wise — agree on ASCII, may diverge on non-BMP keys;
S6 watch, not S2's to fix. F5 (Obj-3 doom fodder, oracle-verified):
engine `convert_object` (`ast_value.rs:208-222`) strips `!` recursively
via `ast_to_json_value`, runtime `cleanResponsiveObject` only at top
level — `padding: ['1!']`-style nested-`!` shapes mint unreachable
plans; S2 correctly follows runtime (`nested_shapes_stay_raw`). F6
(S3 policy carry-forward): ledger R7-userspace needs a value split —
Bool-`true` drops are userspace-provable (queried + unminted),
Bool-`false` drops can NEVER be userspace (no query exists); S3
adapters must carry the value so policy splits by (code, value).

**E9 — ledger erratum (log-only, S3 owns):** R7 row says Bool drops
are userspace unconditionally; per F6 it must read "`true` →
userspace, `false` → compiler-at-most". No verdict changes today.

**SEQUENCE — Slice 3 (producer protocol).** Launches when G1 rework
clears (or parallel at captain's discretion — disjoint write-sets:
rework = `analysis/{values,const_values,block,jsx_attrs}.rs` + tests;
S3 = adapters/producers/policy + `ATM-DIAG-13`). Single implementor
crew (one coupled protocol; may fan nested workers over disjoint
producer families ONLY: extract / harvest / resolve / hosts — policy
+ 13 stay with the lead). Scope per doc Slice 3 + map §C, one family
at a time: extract FIRST (`ExpressionWalk::warn_dynamic` →
sink+fact first, wording/audience out), then harvest, resolve, hosts
(`hosts/diagnostics.rs` → typed fact); prose+audience move to policy;
`ATM-E-*` passthrough byte-unchanged (8 codes, §A3). Q5b spread-site
rule (already in log): funnel `spread.rs:90` through the sink hook
iff the refused fragment is a mintable value position, else codify
an explicit exclusion + repair the invariant comment — either outcome
gets a pin. Q5a `MutatedBinding` no-sink stays intentional (fact
records no sink). Done-criteria (checkable): `ATM-DIAG-13` GREEN
(one site identity, deterministic order, stable codes, no dupes —
INCL. the Obj-1 ×2 double-emit regression: unknown-token under
`_hover` warns once); zero non-diagnostic drift on existing goldens
(full `v atomic` still 275-pass with 07–12/14 red for the same
reasons — 13 flips green); `agentrs q` clean; `agentrs c atomic`
green. Must-not-touch (map §D): `ATM-E-*` behavior, stable wire
codes, extraction/harvest/resolve/stylesheet semantics (goldens are
the drift net), `hosts/entries.rs`, no second parse, no `logs` /
`compilerDiagnostics` threading (S5 owns per Q2), no `css.ts` (Q1
DEFER), no default-output change beyond 13's contract, no blanket
golden updates, no weakened tests. Carry F6 into policy design
(R7 true/false split). Oracle reviews the landing firsthand (13
green + drift-net suite re-run + diff review), then sequences Slice
4 (needs G1-closed analysis + S3 facts as its join inputs).

### Oracle O5 — G1 rework review verdict (2026-09-20)

Rework oracle reproduced every G1 claim firsthand (inline: full
line-by-line review of the 4 files against engine + neo runtime
sources, cargo + suite + pin + quality re-runs, scope audit).
**Verdict: G1 CLEAR.** No gaps. S2 clears with G1 folded in; S3
dispatch (O4) stands as written.

**W1. Hole mapping complete — VERIFIED.** `atom_to_class`
(`const_values.rs:104-112`) is the single mapping (`Bool(false)`/
`Null`→Hole, `true`→Exact via `atom_to_json(_, true)`) and every
const leaf path funnels through it: identifier + member scalars via
`const_class` (`values.rs:150-152`, call sites `:76`/`:142`); const
object style/condition entries via `const_leaf_value`
(`block.rs:245-250`, call sites `:205`/`:219`); merge-flat entries
via `walk_const_flat_object` (`block.rs:150-164`, `:162`); JSX bag
r/condition/style entries (`jsx_attrs.rs:240/256/270`, `r` keeps
`UnknownWhen`). Unary leaves via `leaf_unary` (`values.rs:188-196`,
folded `Exact{false}`→Hole, `!false`→`Exact{true}`). Syntactic holes
still gate in `is_hole` (`object.rs:251-258`, untouched). Full
`.expect(` census: all 6 Exact sites route through a hole-mapped
classifier or a non-hole shape (bare-attr `true`, text strings,
structured whole-values). No const/unary `false`/`Null` path left
predicting Exact.

**W2. `true` stays Exact — VERIFIED.** Literal (`plain_literal` +
`is_hole` excludes `true`), const scalar (`atom_to_class` falls to
`atom_to_json`), member chain, `!false` (`leaf_unary` passthrough),
const-object + merge + bag entries (`const_leaf_value`/
`walk_const_flat_object`), bare attrs — all predict; pinned in all
4 pin tests.

**W3. `atom_to_json` untouched rationale — VERIFIED.** Still the raw
baker for compounds only (`structured.rs:72/146/233`,
`classify_unary` at `:93` — compounds never see `leaf_unary` or
`atom_to_class`). Runtime truth read firsthand: `isHole` skips
`null`/`undefined`/`false` with no query (`css.ts:129-131`,
`collectEntries` `:164-166`), while `cleanResponsiveObject`
(`:139-145`) passes `false` through raw inside queried whole
objects — so leaf-Hole + compound-raw is exactly right. The
`leaf_unary`-not-`unary_not` deviation is endorsed: hole-mapping in
`unary_not` would have baked `null` where runtime queries `false`.

**W4. Suites — VERIFIED (`pnpm agentrs` only).** `c atomic`: **397
passed / 0 failed** (394 + 3 new; the 4th pin updates an existing
test). `v atomic`: **275 passed / 8 failed (283)** — the 8 red are
exactly `ATM-DIAG-07–14`, each for its O4-V3 reason (07: 12 on
default; 08: `compilerDiags` undef; 09: message must name color;
10: dynamic+harvest on default; 11: 8 on default, E8 intact; 12/14:
`compilerDiagnostics` undef; 13: `cssIsValid` gauge `Unexpected
input`). `q` on all 4 touched files: **ALL PASS**, zero warnings,
zero complexity/file violations, zero clippy allows.

**W5. Pins — VERIFIED (all 4 cargo tests re-run by name, all ok).**
`const_values.rs:197` const-false + const-null + member-false +
true-Exact; `values.rs:331` `!true`→Hole + `!false`→`Exact{true}`;
`block.rs:339` object/condition/merge-flat false + true-Exact +
null-dynamic; `jsx_attrs.rs:356` bag false/true. The 5 claimed pins
(const-false, const-null, `!true`, const-object-false-entry,
true-stays-Exact) all exist and pass.

**W6. Scope — VERIFIED.** `git status` byte-identical before/after
all runs; zero changes under `modules/atomic/tests/` (no
station/input/spec/golden touches); only the 4 G1 files postdate S2
in `analysis/` (02:10–02:16 vs 01:41–01:47); adapters/policy/session
still S1-era (S3 crew has written nothing — no exclusions needed);
peer files ignored per orders. Symbol confinement confirms the
footprint: `atom_to_class` used only in values+block,
`walk_leaf_class` only in block+jsx_attrs, `leaf_unary` private to
values. (No git baseline exists for S2-vs-G1 — S2 uncommitted — so
the diff was reviewed as current-content-vs-O4-gap-spec, not
commit-vs-commit.)

**Findings (not gaps, inherited from landing, oracle-confirmed):**
F-G1a HOLDS (`entries.rs:273-279` records no Null leaf, unlike
scalar `collect.rs:242` — null const-object entries stay dynamic,
silence-valid). F-G1b HOLDS structurally (`css.rs:148-150`,
`jsx.rs:204-206` + `mod.rs:141-153/119-121`: every declared const
self-shadows end-to-end — S4 watch: no const-driven Exact can arise
end-to-end until fixed; walker-level pins are the only coverage).
Pre-existing oddity (S2, untouched by G1, log-only): BigInt leaves
predict `Exact{Null}` (`values.rs:127-130`) — S4's problem, not
this rework's.

### Oracle O6 — Slice-3 review verdict + Slice 4 dispatch (2026-09-20)

Review oracle reproduced every Slice-3 claim firsthand (2 nested
workers on disjoint runners — vitest + cargo/quality — lead inline
for the full line-by-line diff review against the 04e0c2779 baseline,
byte-equivalence audit, and scope audit; peer files ignored per
orders). **Verdict: S3 CLEAR.** No gaps. All O4 done-criteria met.

**V1. Stations — VERIFIED (nested worker, `pnpm agentrs` only).**
`v cases.test.ts -t ATM-DIAG-13` PASS (1 passed / 235 skipped).
Full `v atomic`: **276 passed / 7 failed (283)** — 13 flips green,
07–12/14 red each for its recorded reason (07: 12 channel items on
default; 08/12/14: `compilerDiagnostics` undefined @ hinges
:38/:53/:64; 09: `miss.message` must name color; 10: dynamic+harvest
on default; 11: 8 on default @ E8-guard :36, spec untouched — E8
stands). 13's golden pins the Obj-1 ×2 regression closed: two
`ATM-W-UNKNOWN-TOKEN-PATH` lines, same message, distinct sites
(`hover.ts:4:17` `_hover` vs `5:17` `_focus`) — the unknown token
under `_hover` warns exactly once.

**V2. Cargo + quality — VERIFIED (nested worker).** `pnpm agentrs c
atomic`: **415 passed / 0 failed** (397 + 18 S3), zero warnings.
`pnpm agentrs q` smart: exit 0, 0 violations; the 15 warnings are
all grandfathered pre-existing complexity/file-length in old
`extract/*` files, none in S3-authored code. `q` on
`diagnostics/`: **ALL 32 FILES PASS**, zero warnings, zero
complexity/file violations, zero clippy allows.

**V3. Extract funnel — VERIFIED.** `warn_dynamic` is sink+fact
first: sink hook identical (`is_sink_code` untouched —
`harvest/sinks.rs` not in the diff), then `ExtractReport` →
session fact + `Policy::render_extract` line pushed at the same
site (order-safe while unmigrated families push direct). All 12
production call sites migrated (member 3, leaf 6, call 2, literal
1 — firsthand census); `DynamicRefusal.message` is gone, callers
pass `ExtractDetail` data only. Byte-equivalence: every policy
template matches its removed builder verbatim (unary/binary/
template-part/whole, call-argument, all 5 element arms,
generic/identifier leaves — compared string-by-string against the
deleted `message()` fns); location construction is identical
(`with_severity` file-gated attach = old `warn`'s unconditional
file attach, file always present). Session threading complete:
`ExtractSinks`/`ExtractContext`/`ExtractVisitor` + `ObjectWalk`
passthrough + visitor merge-back in source order.

**V4. Harvest/resolve/hosts — VERIFIED.** Harvest: `harvest_info`
moved verbatim into `policy/harvest.rs` (same join/noun/format/
location); unlowerable-`when` sinks still skip silently with no
fact; M1 pin asserts fact + legacy line. Resolve: R1/R2/R4/R5/R7
Rejected, R3 Advisory, R8–R11 Passthrough, each with structured
detail + exact key when a want context is in hand; all 10
sentences match legacy strings (Bool `{val}` Display == new
`b.to_string()` — verified at `atom/value.rs:89`); re-resolve
echoes report no facts (`sink: None`, `is_duplicate` untouched —
the 13 warns-once regression pins it); keyframe/global callers
threaded with `sink: None`. Hosts: `render_trace_diagnostic` →
`convert_trace_diagnostic` + `Policy::render_host`, byte-identical
file-only wrap; `hosts::resolve` takes the compile session (only
caller: `lib.rs:132`); `collect_hosts` uses a throwaway session.

**V5. ATM-E-* passthrough — VERIFIED (all 8 codes).** `native.rs`,
`extract/recipes/*`, `recipes/spec.rs`, `hosts/entries.rs`:
untouched (zero diff). Token E×2 (`tokens/mod.rs:124/128`,
`interpolate.rs:111/115`): outside all diff hunks, byte-identical.
`extract/mod.rs` E: diff is plumbing-only (zero `DiagnosticCode`
lines). `DuplicateRecipe` + `build_atom_set` + `build_css_runtime`:
moved `lib.rs`→`assembly.rs` verbatim (only `+sink` params and the
`HashSet` import fold). `report_parse_errors`: untouched.

**V6. Q5b/Q5a/F6/E9 — VERIFIED, all PINNED.** Q5b EXCLUSION:
codified (`spread.rs` comment + repaired sink-hook invariant in
`walk/mod.rs:107-115`) + integration pin
(`test_spread_call_refusal_warns_without_sink` — O4 message
present, folded entries lower, sinks empty). Q5a preserved:
`is_sink_code` gate + `sink_recorded: false` fact + direct funnel
pin (`mutated_binding_warns_without_sink_and_records_no_sink`).
F6: resolve facts carry value spellings; policy R7 render matches
(code, value) with the S4 split comment;
`bool_refusals_report_distinct_spellings_with_keys` pins
true/false distinctly with keys. E9: ledger R7 row now reads
"`true` → userspace, `false` → compiler-at-most". No gaps.

**V7. Zero drift + must-not-touch — VERIFIED.** No golden file
modified (only NEW `13/output/` + 1-line quarantine entry, same
passthrough-policy shape as DIAG-04; 13 spec/input committed and
untouched — no weakened tests). No `styles.css`/`css.json` drift
(full suite greens byte-identical). Forbidden-touch sweep: zero
`hosts/entries.rs` / `css.ts` / wire / `compilerDiagnostics` /
`logs` hits in the src diff; the 2 `Parser::new` hits are both
`#[cfg(test)]` pins (no re-parse); `ExistingError`→
`ExistingDiagnostic` rename contained in `diagnostics/` (F3
closed). Resolve has zero remaining direct pushes outside
`emit`/advisory/E paths; extract's remaining directs are exactly
the documented deferral (plain-warn/info compiler sites + E
sites) — in-scope per the O4 dispatch parenthetical, S5 handoff
below.

**Findings (not gaps):** F-S3a (S6 hygiene). SPEC `Cargo #[test]
356` + `Named [x] proven 212` lines not bumped (cargo now 415,
total now 187) — pre-existing maintenance pattern (S2 also left
the cargo line), S6 audit owns it. F-S3b (S4 ruling queued,
endorse landing). R6 CORRECTION HOLDS: old code verified
`return None` at S0 baseline — R6 always dropped, no R4/R6
asymmetry ever existed; fact honestly Rejected; ledger corrected.
Drop-with-key ⇒ R6 is userspace-shaped like R4 (ATM-DIAG-09
witness by R4's logic) — S4 oracle rules whether the ledger R6
row moves to userspace; S3 correctly keeps the compiler cell
pending that ruling. (The O2 "R6–R11 paint" line needs the same
R6 asterisk.) F-S3c (S5 handoff). ObjectWalk/ExtractContext +
plain-warn extract sites stay direct (all compiler-per-ledger);
S5 migrates that block as one when it moves channels — S5 must
not re-audit them as S3 scope escape.

**SEQUENCE — Slice 4 (final-plan proof).** No ruling gates S4
(except F-S3b's R6 verdict, which the S4 oracle rules — S4
implementation proceeds regardless: facts stay honest either
way). Single implementor crew (one coupled proof join; may fan
nested workers over disjoint pieces ONLY: key-type/serializer
authority vs proof-join vs station wiring — policy + 08/09/10
stay with the lead). Scope per doc Slice 4 + map §C: expose one
owned runtime lookup-key type + one serializer authority (reuse
`serialize_lookup_key`/`canonical_json_value` — no second
canonicalizer); build the final emitted-key set from
`RuntimeStylePlan` after assembly; join G1-closed analysis
expectations (Exact vs DynamicSlot/Hole) against that set; emit
one located non-fatal userspace warning ONLY for an absent exact
key (names the exact declaration; actionable reason iff a
resolver fact proves the cause — never syntax guesses);
incidental-coverage rule (exact key from any file/site/harvest
counts as present). Join inputs = S2 analysis facts + S3
producer facts from the compile-long session (currently dropped
at end of `compile()` — S4 owns session rendering). Done-criteria
(checkable): `ATM-DIAG-08/09/10` GREEN (present/absent/
incidental); R7 true/false policy split honored (`false` never
userspace); zero non-diagnostic drift on existing goldens (full
`v atomic` still 276-pass with 07/11/12/14 red for the same
reasons — 08/09/10 flip green); `agentrs q` clean; `agentrs c
atomic` green. Must-not-touch (map §D): `ATM-E-*` behavior,
stable wire codes, extraction/harvest/resolve/stylesheet
semantics (goldens are the drift net), `hosts/entries.rs`, no
second parse, no `logs`/`compilerDiagnostics` threading (S5 owns
per Q2 — 08's hinge reads the opt-in channel, so if S4's proof
renders userspace-only, 08's compiler-channel hinge stays red
until S5 exposes it; oracle will adjudicate), no `css.ts` (Q1
DEFER), no blanket golden updates, no weakened tests. Carry
F-G1b (no const-driven Exact end-to-end until visitor shadowing
fixed — S4 decides: fix visitor or document the silence gap),
BigInt-`Exact{Null}` oddity, and F-S3b (R6 ruling). Oracle
reviews the landing firsthand (08/09/10 green + drift-net suite
re-run + diff review), then sequences Slice 5 (needs Q2 EXTEND
shape — already in log: additive-optional, no schema bump).

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

_(landed 2026-09-20 — slice1 crew, single crew inline, no nested workers.
Module split + 04/06 green + SPEC flips + ledger E7. No commits.)_

**Module shape** (`diagnostics/`, per doc Slice 1): `mod.rs` is the seam
(`Diagnostic`, `DiagnosticSeverity`, re-exports, serde-shape pin test);
`site.rs` (`SourceId`, `StyleSurfaceKind`, `SourceSite`, owned
`DiagnosticLocation` + new `warning`/`info` constructors, moved `line_col`
with its UTF-16 tests); `facts.rs` (`OwnedLookupKey`, `DynamicShape`,
`ExtractOutcome`, `ResolveOutcome`, `DiagnosticFact`, `DiagnosticSink` +
`Vec` impl); `session.rs` (`DiagnosticsSession`); `policy.rs`
(`Audience`, `Policy::classify` pinning today's uniform default channel);
`channels.rs` (`DiagnosticChannels`); `analysis/` (`AnalysisInput` +
`analyze` chaining `css`/`jsx`/`conditions`/`values` empty-until-S2
seams); `adapters/` (`Extract`/`Harvest`/`Resolve`/`Host` report structs
with `From`→`DiagnosticFact`, incl. file-only host conversion mirroring
`hosts/diagnostics.rs`); `proof/plans.rs` (real `missing_keys` set join
with incidental-coverage semantics, tested). `codes.rs`/`render.rs`
untouched; serialization byte-compatible (new pin test). 26 new Rust
unit tests, all colocated.

**04 mechanism**: every resolve warning attaches the want's location —
`resolve/mod.rs` R1/R2, `tokens/mod.rs` R8/R9/R10, `interpolate.rs` R11,
`unit.rs` R4/R5/R6/R7 (new `location` param; keyframe caller passes
default). Located first emission wins via the existing
`(severity,message)` plan-rebuild dedup. R3 (`MissingContainerRoot`)
stays unlocated: aggregate advisory, no single site, no station pins it.
Static-CSS warnings (S1/S2) stay unlocated: `BaseSystem` carries no
source identity and frozen contracts are S5's business — no station
pins them either.

**06 mechanism**: `GlobalWalker::walk_rules` takes the fragment source;
walker + `ValueSession` (G1–G7) locate at `<source>:1:1` (fragments are
deserialized JSON without spans — file origin is the honest position);
global-surface token resolve inherits the fragment location. UTF-16 was
already green (`line_col` + unit test); 06's hinge was global
file-lessness only.

**04/06 GREEN evidence** (`pnpm agentrs v`, native rebuilt via
`ensure-native` first): 04 golden pins resolve `5:15` (value position)
+ extract `4:11` + blanket; 06 golden pins extract `3:61` (UTF-16) +
`_bogus` at `input/baseSystem.json:1:1` + blanket. Both pass spec,
gauges, and goldens in isolation and in full suite.

**Quarantine (captain's 00:40 watch item — in-scope, not drift):**
`tests/css-quarantine.ts` +2 entries, both assert-fresh under the
meta-test (which passes): 04 mirrors `ATM-TOKEN-14`'s existing entry
for the same `caret-color: ui.missing.path` passthrough (deferred
token-passthrough policy); 06 pins the probe input's unquoted
`content: 😀` (verbatim string policy keeps author text as-is, cf.
`ATM-LEAF-10` where the author includes quotes — validity of content
quoting is out of scope for a diagnostics station). No input/spec
changes, no weakening.

**Drift report**: full atomic suite `228 passed / 8 failed` — failures
are exactly `ATM-DIAG-07–14`. 22 green stations gained locations (36
diagnostics, audit: 144+/36−, every hunk = `file`+`line`+`column`
gain on an unchanged message; zero `styles.css`/`css.json` bytes
changed; zero count/order/code/severity changes):
COND-12/13/17/21, GHOST-04, LAYER-12/13, SHORT-03, SITE-18/20/33/38/43/45,
TOKEN-02/05/06/08/14/16, UNIT-02, VALID-03. Goldens rewritten only via
targeted per-station `--update-goldens` (two batches, no blanket run).
Full atomic vitest: 275 passed, same 8 red. Cargo: 356 passed, 0
failed, 0 warnings.

**Red-shell hinge progressions (still red, S-owned)**: 09 now passes
its location pins and fails on the S4 message-content assertion
(`miss.message` must name `color`/`red.500`) — intended. 13's spec now
fully passes (S1 site identity satisfies hinge-1: `_hover`/`_focus`
lines distinct) and it fails only on the standing CSS-validity gauge
(incidental passthrough CSS) — stays red, NOT quarantined (S3 owns it).
07/08/10/11/12/14 fail for their O2-documented reasons unchanged.

**Docs**: SPEC 04/06 rows `[x]` (+matrix rows, counts: DIAG `14/6/8`,
Total `198/186/12`, remaining 10, stations 219/8-red, cargo 356 —
prior 251 was stale pre-S1); DIAG-05 "stays open" line closed. Ledger
E7 fixed (`resolve_entry` `runtime/builder.rs:198`, want-rebuild
`:212-220`).

**Must-not-touch audit**: no `ATM-E-*`/wire-code/semantics/hosts
changes (`rustc` + drift net confirm); no second parse; no `css.ts`
(Q1 DEFER honored); no blanket golden update; no weakened tests.
Neo exposure swept: zero snapshots, zero `toEqual` on diagnostics,
zero file-undefined assertions; neo pins messages/counts/codes only —
all preserved. Carry-forwards: (1) matrix suites not run (out of S1
scope per O2 — S6/oracle downstream); (2) neo `sync.test.ts`
"unlocated warnings such as display:true" test NAME now stale
(R7 located; test still passes — S6 hygiene, untouched).

### S2 expectations

_(slice2 replacement crew, live 2026-09-20 — single crew inline, no nested
workers spawned: one coupled analysis, disjoint fan-out not worth the
coherence risk. Phase: READ→BUILD; design locked, implementing.)_

- Read: O3 dispatch (E8-amended criteria) + Q3 GRANDFATHERED + Q1 DEFER +
  Q5b rule; Slice-2 contract; agent-rs gates; S1 `diagnostics/` shape
  (`AnalysisInput`/`analyze` seams, facts, session, proof join).
- Key-authority findings (firsthand): plans key on AUTHORED prop + RAW
  whens (`builder.rs:31-39`, `entries.rs:83-88`); neo queries identical
  five-tuples (`plans.ts:55-70`, `css.ts:153-162` verbatim nesting);
  `base` stays raw in whens (extract tests); `style_prop_names` on the
  real artifact = `get_style_prop_names()` (`assembly.rs:58`); system =
  `system.name` (`assembly.rs:51`).
- Design locked: `AnalysisInput` = borrowed `&parsed` + host surface
  (traced ∪ configured + owned_props, built post-`hosts::resolve`) +
  shared `&LocalConstants` + system name. No BaseSystem (keys never
  lower), no re-parse, no wire fields. `analyze()` runs in `compile()`,
  facts stored in a dropped `DiagnosticsSession` (renders nothing →
  zero drift). Static-but-unlowerable conditions (`_hovr`) yield EXACT
  keys (ledger R2, witness P1a); `lower_when` genuinely unused for key
  prediction — raw-when rule documented, not imported. Conservative
  everywhere else: holes → no fact; conditionals/calls/binary/members
  (unresolved) → DynamicSlot; `r` subtrees → DynamicSlot(UnknownWhen)
  until `r`-parity is proven; `css(styles)`/spread-bags via shared
  `ConstObject` iff cheap, else DynamicSlot + gap note.
- Hinge shapes covered: 08 literal, 09 `_hovr` exact, 10 param-dynamic +
  exacts, 11 seven dynamics + spread + static, 12 css/jsx parity +
  native-`style` exclusion, 14 per-mode + panicked-file skip.
- Files to touch (planned): `diagnostics/analysis/{mod,css,jsx,
  conditions,values}.rs`, `diagnostics/facts.rs` (`OwnedLookupKey`
  serializer — shares `serialize_lookup_key`), `lib.rs` (construct
  input + run `analyze`, drop session). Nothing else.
- Vitals 01:0x: READ done, BUILD starting. Blocked on nothing. No
  nested workers (inline by design).
- Vitals 02:xx: BUILD done, VERIFY in flight. `analysis/` implemented
  (11 modules incl. test-only `support`): `css()` + traced-JSX walks,
  shared object/block walkers, conditions/values/structured/const/gate/
  imports helpers. `AnalysisInput::for_compile` (borrowed parse + host
  surface + consts + system, panicked filtered, zero re-parse) wired
  into `compile()` post-`hosts::resolve`; session drops unrendered.
  Cargo: 394/0 (356 S1 + 38 S2). `agentrs q`: ALL 15 FILES PASS, zero
  warnings. Clippy: zero hits in S2 files. Parity probe (`/tmp/
  s2-parity/check.mjs` vs real neo `serializeLookupKey`): 13/13 byte-
  equal (nested whens, responsive array/object, important x2, aliases,
  unknown-condition exact, holes-adjacent zero). Semantic cross-read of
  neo `css.test.ts`: all overlapping shapes agree (multi-arg/merge,
  whens, all 5 important spellings, holes incl. scalar args, numbers,
  miss-nesting); `r`-lowering confirmed as the ONE conservative gap
  (DynamicSlot(UnknownWhen), silence-valid). Engine/runtime divergence
  found (doom fodder, NOT S2's to fix): engine strips `!` recursively
  in arrays/nested objects, runtime only at top level — `padding:
  ['1!']` mints an unreachable plan. Next: full atomic Vitest suite
  (zero-drift proof), then evidence + return.
- Vitals 03:xx: VERIFY done — S2 COMPLETE, return filed.
  - Full `v atomic`: **275 passed / 8 failed (283)** — byte-identical
    totals to the O3-V1 record; the 8 red are exactly 07–14, each for
    its recorded reason (07: 12 on default; 08: compilerDiags undef @
    hinge :38, pins pass; 09: message must name color @ hinge-2 :42,
    location pins pass; 10: dynamic+harvest on default; 11: 8 on
    default @ E8 guard :36, stays red per E8; 12/14: compiler
    Diagnostics undef @ hinges :53/:64, pins pass; 13: cssIsValid
    gauge `Unexpected input`, spec passes). 08/12/14 pins green as
    the regression net; 04/06 (+01/02/03/05) green.
  - Zero drift proof: suite run wrote zero files (diffstat before/
    after identical modulo this log); output path untouched by
    construction (analysis borrows, session drops).
  - Self-inflicted incident + repair: `pnpm agentrs f` (cargo fmt +
    prettier --write, newer toolchain) reformatted 330 files at
    01:46, breaking goldens repo-wide. Detected via 234-failure
    triage, all 330 reverted (mtime-window + normalized-compare;
    only pre-existing `docs/*.md` dirt kept). Lesson: never run bare
    `agentrs f` in this voyage — check-only or scoped formatting.
  - Cargo 394/0 (38 new S2 tests). `agentrs q` whole `diagnostics/`:
    ALL 28 FILES PASS, zero warnings. Clippy: zero hits in S2 files.
  - Touched (16 + log): `analysis/{mod,block,object,css,jsx,
    jsx_attrs,gate,imports,conditions,values,structured,
    const_values,support}.rs` (7 new: block/gate/imports/jsx_attrs/
    structured/const_values/support... +object — 8 new, 5 rewritten),
    `diagnostics/facts.rs` (`lookup_key`), `lib.rs` (wiring).
    Untouched per orders: hosts/entries.rs, css.ts, wire, producers.
  - Handoff notes for S4/S5: facts carry `SourceId` = source index +
    real spans; use-site spans on const facts; `Site` bundles
    span/prop/when. Known gaps (all silence-valid): `r` lowering,
    computed keys, template-with-holes, call/binary/conditional
    folding, member blocks, multi-leaf consts, re-export-traced
    imports, nested-const-object values, exotic-number formatting.

### S2-G1 rework

_(G1 rework crew, landed 2026-09-20 — single crew inline, no helpers.
Fixes O4-G1: const/unary-folded holes predicted Exact where runtime
queries nothing. No commits.)_

**Fix** (4 files, all `diagnostics/analysis/`):
- `const_values.rs`: new `atom_to_class` — the single hole mapping for
  every const leaf path. `Bool(false)`/`Null` → `Hole` (runtime `isHole`
  skips them, no query); `true` stays `Exact` (queried, resolve R7
  drops it → genuine miss); everything else converts like a literal.
  `atom_to_json` untouched — compound positions must keep `false` raw
  (runtime `cleanResponsiveObject` passes it through).
- `values.rs`: `const_class` delegates to `atom_to_class` (covers
  identifier + member paths); new `leaf_unary` maps folded `Exact{false}`
  (`!true`) → `Hole` at the leaf call site. Deliberate deviation from
  the brief's suggested `unary_not` location: `classify_unary` is shared
  with `structured_fold`, which must keep baking folded `false` raw in
  compounds — hole-mapping inside `unary_not` would have predicted
  `null` where runtime queries `false`. `!false` → `Exact{true}`.
- `block.rs`: `const_leaf_value` now returns `ValueClass` (was
  `Option<(Value, bool)>` — `None` meant dynamic, which would have been
  wrong for holes); `walk_const_flat_object` uses `atom_to_class`; new
  shared `walk_leaf_class` lowering (`Exact`→expect, `Hole`→no fact,
  `Unknown`→dynamic) used by all three const-entry sites.
- `jsx_attrs.rs`: the three `const_leaf_value` call sites (css/r/
  condition/style bag entries) use `walk_leaf_class`, preserving
  `UnknownWhen` for `r`.

**Pins** (3 new tests, 1 updated — cargo 394→397):
- `const_holes_emit_no_fact_and_true_stays_exact` (`const_values.rs`):
  `const C = false` → Hole, `const N = null` → Hole, `t.v = false`
  member → Hole, `const T = true` → Exact (regression).
- `unary_folds_literals_only` (`values.rs`, updated — the old `!true`→
  Exact assertion pinned the bug): `!true` → Hole, `!false` →
  Exact{true} (regression).
- `const_hole_entries_emit_no_fact_and_true_stays_exact` (`block.rs`):
  `{color: false}` / `{_hover: false}` / merge-flat `[{color: false}]`
  → zero facts; `{color: true}` → 1 exact; `{color: null}` → 0 exact +
  1 dynamic (see finding F-G1a).
- `const_bag_hole_entries_emit_no_fact_and_true_stays_exact`
  (`jsx_attrs.rs`, new tests module, walker-level): bag `mt: false` →
  zero facts, `mt: true` → 1 exact (see finding F-G1b for why not
  end-to-end; bag-null-dynamic rides on the shared `const_leaf_value`
  pin in `block.rs`).

**Re-verify** (`pnpm agentrs` only): `c atomic` **397 passed / 0
failed**; `v atomic` **275 passed / 8 failed (283)** — the 8 red are
exactly `ATM-DIAG-07–14`, each for its O4-V3 reason (07: 12 on
default; 08: `compilerDiags` undef; 09: message must name color; 10:
dynamic+harvest on default; 11: 8 on default, E8 intact; 12/14:
`compilerDiagnostics` undef; 13: `cssIsValid` gauge `Unexpected
input`); `q` on all 4 touched files: **0 violations, 0 warnings**.

**Findings for oracle/S4 (not gaps, out of rework scope):**
- F-G1a. Null leaves in const *objects* stay dynamic, not Hole: the
  const recorder (`extract/constants/entries.rs::literal_leaf`) records
  String/Number/Bool but no Null, so `{color: null}` records an empty
  entry indistinguishable from dynamic. Silence-valid (only Exact
  joins warn in S4); fixing the recorder is extraction-scope, untouched.
  Scalar `const N = null` records Null fine → Hole (pinned).
- F-G1b. End-to-end const resolution never fires at top level (both
  surfaces, pre-existing S2): the visitors record every declarator as a
  shadow after walking it, so `const C = 'red'; css({v: C})` yields
  DynamicSlot end-to-end (probed firsthand) while walker-level tests
  with empty shadows resolve fine. Silence-valid (dynamic, never wrong
  Exact), but S4 should know no const-driven Exact fact can arise
  end-to-end until the visitor shadowing is fixed. Visitor-scope fix,
  not G1.
- F-G1c. `walk_leaf_class` keeps the `r`-entry `UnknownWhen` vs
  elsewhere `UnknownValue` shape split intact.

**Scope audit**: touched ONLY `analysis/{values,const_values,block,
jsx_attrs}.rs` + this section. No station/input/spec/golden touches
(`git status`: no `tests/cases` modifications from my runs), no
producer/adapter/policy files, no wire fields, no `css.ts`, peer files
(`operation-seize.md`, missions README, `ATOMIC.md`) untouched.

### S3 producers

_(slice3 crew lead, live 2026-09-20 — single crew; nested workers over
harvest / resolve / hosts only, policy + 13 with the lead. Phase: DESIGN
locked, building shared API first.)_

- Design locked (firsthand inventory of all 4 families): narrow-but-real
  scope per O4 parentheticals — extract migrates the `warn_dynamic`
  funnel + its 12 call sites (D1,D3-D7,D9,D10,D13,D15,D17,D19);
  ObjectWalk/ExtractContext/plain-warn sites stay direct (all
  compiler-per-ledger, ride with S5's channel move — documented
  handoff, not a gap). Harvest (M1), resolve (R1-R11, E passthrough
  untouched), hosts (H1) migrate fully. Static/global (S/G) out of
  scope per dispatch.
- Render model: inline (fact → session side-channel + policy-rendered
  line pushed at the same site) — the only order-safe shape while
  unmigrated families still push direct. `Policy::classify` stays
  uniform Userspace (S5 moves channels); per-family total render fns
  (no unwrap). Re-resolve echoes report no facts (`sink: None`,
  `is_duplicate` untouched) — the 13 warns-once regression pins it.
- Facts carry `DiagnosticLocation` (the honest position each phase
  holds), not fabricated `SourceId`s — no catalog exists (E5 still
  open); analysis keeps `SourceSite`. `ExistingError` →
  `ExistingDiagnostic` (F3, contained in diagnostics/).
- Q5b DECIDED: exclusion — spread-position call refusals are not
  mintable value positions (no prop in scope; `sinks.rs` header already
  states spreads are never sinks; inventing a prop would mint onto a
  wrong position = semantic drift). Codify + repair `walk/mod.rs`
  invariant comment + snippet pin. Q5a preserved structurally
  (`is_sink_code` gate) + fact records `sink_recorded: false` + pin.
- F6 carried as (code, value) match structure in policy's R7 render +
  value-carrying resolve facts + ledger E9 (lead owns, landing with
  the API).
- Vitals: lead building facts/policy/session API; workers spawn when
  it lands (harvest/resolve/hosts need the shapes to compile against).
- Vitals 2: shared API LANDED + q-clean (facts vocabulary with nested
  Leaf/Fold + Name/Value details, policy/extract|harvest|resolve|hosts
  render arms with byte-pin tests, 4 adapters, session.extend_facts,
  ExistingError→ExistingDiagnostic). 3 workers spawned over disjoint
  families (harvest/hosts/resolve). Lead's extract family done:
  warn_dynamic funnel (sink+fact+policy render), all 12 call sites,
  fold message() removals + detail/parts accessors, session threading
  (ExtractSinks/Context/Visitor+merge, ObjectWalk passthrough),
  Q5b exclusion comment + repaired sink-hook invariant, Q5a direct
  funnel pin. lib.rs/assembly.rs threaded (moved 3 assembly-step fns
  to assembly.rs to hold the 365/80 gates). E9 ledger fix in.
  Harvest + hosts workers LANDED (results filed, diffs in review);
  resolve worker still running. Tree transiently red until resolve
  lands (expected — lead integrates + verifies then).
- **S3 CLEAR 2026-09-20 (lead integrated + verified firsthand):**
  all 3 workers landed, lead reviewed every diff line, fixed 1 worker
  bug-class item (R6 disposition — see below) + 1 five-arg warning.
  - 13 GREEN: quarantine entry (passthrough-policy block, same shape
    as DIAG-04) + new output/ goldens (2 located R9 lines, 4:17/5:17,
    same message, zero dupes, stable codes — the contract). Spec +
    gauges + goldens all pass; quarantine meta-test green (entry live).
  - Drift: ZERO. Full `v atomic` 276/7 — 13 flips, 07–12/14 red for
    the same spec reasons (channel leaks / undefined compiler side —
    S4/S5 work). Only tree adds under tests/: 13/output/ + 1-line
    quarantine. `c atomic` 415/0 zero warnings (394 + 21 S3 tests).
  - q: clean on every S3-authored file. Grandfathered pre-existing
    warnings in old engine files (extract/mod, fold/*, walk_fallback,
    tests length) untouched by design — lead added zero new warnings
    (lib.rs/assembly.rs refactor held 365/80; authored_key bundled to
    4 args; nested Leaf/Fold + Name/Value details hold cog).
  - R6 CORRECTION (S3-found ledger erratum, behavior-level): R6
    (NonCanonicalNumeric String) DROPS (`return None`, verified S0–
    HEAD) — the S0 "passthrough, no return None" read was wrong, so
    no R4/R6 asymmetry exists. Fact records Rejected (lead fixed the
    worker's Passthrough); ledger R6 row + §C note corrected in
    passing. FLAG for S4 oracle: drop-with-key ⇒ R6 is userspace-
    shaped like R4 (ATM-DIAG-09 witness by R4's logic) — S3 keeps the
    compiler cell pending that ruling, facts stay honest either way.
    (The O2 "R6–R11 paint" line needs the same asterisk for R6.)
  - Q5b: EXCLUSION codified (spread.rs comment + repaired sink-hook
    invariant) + integration pin
    (test_spread_call_refusal_warns_without_sink — O4 message present,
    folded entries lower, sinks empty; no station covers O4, probe in
    /tmp/s3-q5b). Q5a: direct funnel pin
    (mutated_binding_warns_without_sink_and_records_no_sink).
  - F6 carried: resolve facts carry value spellings; policy's R7
    render matches (code, value) with the S4 split comment;
    bool_refusals test pins true/false distinctly. E9 ledger fix in.
  - Handoff to S4: compile-long session carries analysis + producer
    facts (dropped at end of compile); re-resolve echoes report no
    facts (is_duplicate untouched); ObjectWalk/ExtractContext +
    plain-warn sites stay direct (documented S5 compiler-block
    migration); S4 owns session rendering + R6 verdict ruling.
  - 47 paths (lead + 3 workers, disjoint): diagnostics/* (facts,
    policy/×5 new, adapters×4, session, mod), extract (walk×4,
    literal, object×2, fold×5, mod, harvest/mint, tests), resolve×8,
    hosts×3, lib, assembly, builder (1 hunk), stylesheet×2 (plumbing),
    recipes tests (2 lines), ledger (E9+R6), SPEC (13 flip), quarantine,
    13/output/, this log. Untouched per orders: analysis/* (G1 crew),
    hosts/entries.rs, E sites (byte-identical), static/global pushes,
    css.ts, default pipe, peer files.

### S4 proof

_(placeholder — slice4 crew)_

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
- 2026-09-20 00:40 tick: S1 alive and building (diagnostics split files 00:33–00:35, 04/06 output/ dirs appearing, resolve + stylesheet/global + system_layers touched; prior vitals ping moot, no re-ping). 8/9 crews terminal, no deadlock. Watch item for oracle review: tests/css-quarantine.ts also modified — confirm in-scope or drift. Next: S1 landing → oracle review → Slice 2.
- 2026-09-20 watch: S1 CLEAR on oracle O3 word (04/06 green; full suite 275/8, red exactly 07–14; cargo 356/0; q clean; drift audit 22 files/36 locations, zero semantic drift; quarantine ruled in-scope; E8 shell erratum → S5 owns guard correction; O1 S2 criteria amended per E8). Kept undeclared docs/ATOMIC.md in a separate commit; process drift logged (F1 — crews must declare all touched files). Committed S1 checkpoint. Dispatched single Slice-2 crew (independent AST expectations, zero-drift, parity tests). Next: oracle review of S2 landing → Slice 3.
- 2026-09-20 01:01 tick: S2 crew ~12 min, zero writes (tree clean, analysis/ mtimes predate dispatch, placeholder untouched), vitals ping outstanding unanswered. Not yet ruled deadlocked (implementor briefs require landing notes only; S2 is read-first) — but threshold set: if still silent at next tick, captain interrupts + rebriefs. 10/11 crews terminal. Next: S2 landing/reply or unstick → oracle review → Slice 3.
- 2026-09-20 watch: S2 crew DIED to infra (model-stream idle timeout mid-turn, was actively reasoning; zero repo writes). No deadlock, no rebrief of the dead — replaced with a fresh S2 crew carrying an interim-writes requirement. Next: oracle review of S2 landing → Slice 3.
- 2026-09-20 01:08 watch: peer session denim-markab is LIVE in this tree (operation-seize.md + missions README + ATOMIC.md line, 01:04) — not S2 drift. Captain's rule: hands off peer files; all voyage commits stay named-file-only; courtesy notification attempted (receipt unverified — protection rule stands regardless). S2 replacement quiet at ~8 min, vitals ping queued with interim-write nudge. Next: S2 signs of life or unstick → oracle review → Slice 3.
- 2026-09-20 01:20 tick: S2 replacement ALIVE (interim note posted: READ→BUILD, design locked, single-crew-inline by choice; values.rs/conditions.rs/facts.rs writing fresh 01:17–01:20). Unstick deadline lifted. Peer files untouched (still their 3). 11/12 crews terminal, no deadlock. Next: S2 landing → oracle review → Slice 3.
- 2026-09-20 01:40 tick: S2 replacement BUILDING (all analysis files fresh 01:35–01:39, 6 new files, lib.rs wired, interim notes growing). Peer files untouched. 11/12 terminal, no deadlock. Next: S2 landing → oracle review → Slice 3.
- 2026-09-20 02:00 tick: S2 review oracle ~15 min, no O4, ping outstanding — holding (matches O3's silent-then-deliver profile); threshold: still silent at next tick → unstick. S2 landing closed with 2 more files (gate.rs, imports.rs — in oracle's diff). Peer active (seize 01:49), boundary holding. 12/13 terminal, no deadlock. Next: O4 verdict → commit S2 → Slice 3.
- 2026-09-20 watch: O4 GAPS — G1 blocking (const/unary-folded false/null predict Exact where runtime queries nothing; true stays Exact). V1–V8 pass; F6 → S3 policy carry-forward (R7 true/false split); E9 ledger erratum → S3 owns; F5 → Obj-3 doom fodder filed. Parallelizing per O4 blessing (disjoint write-sets): fresh G1 rework crew + fresh S3 crew; commit order rework-first. Next: G1 verify → commit S2+G1 → S3 review → Slice 4.
- 2026-09-20 02:20 tick: O5 G1 CLEAR (hole mapping complete, 5 pins, 275/8 + q re-verified) — S2 clears with G1 folded in. Committed S2+G1 checkpoint (ledger E9 excluded — S3's, landed 02:20; peer files excluded). S3 alive (design locked, building shared API first). 15/16 terminal, no deadlock. Next: S3 landing → oracle review → Slice 4.
- 2026-09-20 02:40 tick: S3 BUILDING all 4 families (extract funnel + call sites, harvest, resolve, hosts→typed fact; policy.rs→policy/ split; adapters; interim notes flowing). Peer files untouched. 15/16 terminal, no deadlock. Next: S3 landing → oracle review → Slice 4.
- 2026-09-20 watch: S3 CLEAR on oracle O6 word (13 green incl. x2 regression closed; full suite 276/7; cargo 415/0; q clean; funnel + 3 families migrated, ATM-E-* byte-unchanged, Q5b exclusion pinned, F6/E9 in; F-S3b R6 ruling queued for S4 oracle; F-G1b + BigInt-Null carried). Committed S3 checkpoint (peer files excluded). Dispatched single Slice-4 crew (final-plan proof, 08/09/10). Next: oracle review of S4 landing → Slice 5.

## Useful
