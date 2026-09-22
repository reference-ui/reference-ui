# REPORT: swarm-nameset — plan names-set build diet

## Verdict

**CUT (once-per-process build of 1,391 pre-sorted names: fantasy ceiling ~0.35 ms clears neither the ≥15 ms nor the ≥1.5% LAND prong)**

One line: `plan.rs:203-217` is live on the `!proof` path (gate check passed — unconditional in `finish`, `hosts::resolve`, and `analyze`), but the `BTreeSet` build fires exactly once per process behind `OnceLock` (1 build per sync sample), its inputs are already unique (0.144% dups by construction) and pre-sorted, and the wire consumer pins sorted order — counted by source census + code proof, never built, no lock hold.

## Base / binaries

- Base commit: `5844b24a81a528ace14fab63e908793a6829a874` (verified `git rev-parse HEAD` before any work and after; docs-only filing over wave-1 landing `0a7330c76`, `packages/` tree identical)
- Base `.node` sha256: N/A — never built (fresh worktree ships no `dist/`/`target/`; a from-scratch release build + instrumented counts would burn shared-box CPU for zero information on a ceiling-barred build)
- Candidate `.node` sha256: N/A — CUT before implementation, no candidate built
- `git diff --stat`: empty (zero tracked edits; only this REPORT.md is untracked)
- Bench lock: never held by this crew (counted, never built, no lock hold). No timed or instrumented run of any kind — no `flame.mjs`/agent CLI subprocess, no build, no bench; every number below is source-census arithmetic plus read-verified code plus the filed profile record.

## Mechanism counts (enterprise, seed 7, 7527 css calls)

Census of the `plan.rs:204` names-set build (`build_style_prop_names`: canon + alias + ref-prop inserts into a `BTreeSet`, cached in a `OnceLock`, cloned per call) and its producer/consumer chain. Table sizes parsed from the canon sources (read-only text census, `/tmp/nameset-census.py` — regex over `Property::new`/`Alias::new` first args, multiline-aware):

| quantity | value | basis |
| --- | --- | --- |
| builds per sync | **exactly 1** | `OnceLock::get_or_init` (`plan.rs:199-200`): one build per process; each bench sample is a fresh node process (`.node` swapped per arm between runs — canon report), one `compileNative` per sync (btreeset standing load fact) |
| proof-gated? | **no — live** | all three call sites unconditional in `compile()`: `hosts::resolve` (`lib.rs:222` → `surface.rs:15`), `report_analysis_expectations` (`lib.rs:256` → `analysis/mod.rs:106`), `AssembleCtx::finish` (`assembly.rs:90`); bench is `proof=false` on every sync (asmfmt chain, uncontested) |
| inserts per build | **1,391** | 1073 `CANONICAL_PROPERTIES` + 315 `ALIASES` + 3 `REFERENCE_PROPS` minus `variant`/`colorMode` (`plan.rs:205-215`) |
| output names | **1,389** | union; filed "873" (styletrace-ready-ask1) is stale — canon has since grown to 1073 |
| dup rate in build input | **0.144% by construction** | exactly 2 dups (`r`, `size` already in canon); `canon ∩ alias = ∅`; both inputs strictly sorted + unique (enforced by `can_join` tests) |
| name sizes | 1–35 chars, median 15, mean 15.2, 21,159 bytes total | source census over the 1,389-name union |
| string reallocs in build | **0 data reallocs** | each insert is one exact-size `to_string` alloc + B-tree node allocs; final `into_iter().collect::<Vec>` carries an exact size hint |
| `get_style_prop_names` calls per compile | **3** (1 build + 2 clones) | hosts → analyze → assembly, in `compile()` order; first call builds, the other two clone the cached `Vec` |
| `NativeRuntimeArtifact::default` | error-path only | sole caller is the schema-rejection path (`native.rs:121`), never the bench |

### Consumer patterns (who reads the set and in what order)

| consumer | shape | order observed? |
| --- | --- | --- |
| `assembly.rs:90` → `style_prop_names` → wire `stylePropNames` JSON array | `Vec<String>`, BTreeSet sorted order | **yes — wire-visible, byte-identity load-bearing** (caution (b) holds: order is load-bearing, any diet must preserve exact sorted order) |
| `hosts/surface.rs:15-17` → `BTreeSet` + condition keys → `StyleSurface` → `trace_style_bindings_with_surface` | membership checks during host trace | no (membership-only; set stays sorted but no consumer iterates it) |
| `diagnostics/analysis/mod.rs:106` → `HashSet<String>` (`AnalysisCtx.style_props`) → css/jsx expectation walks | membership checks | no (`HashSet`, order unobservable) |

Insert-order note: the canon loop inserts in already-sorted order (strictly increasing by construction), so ~77% of inserts are append-leaning; the alias loop (sorted among itself, interleaved against canon) and 3 ref inserts complete the set. A presized/exact-capacity diet has nothing to grip: `BTreeSet` takes no capacity, dedupe avoidance saves 2/1391 inserts, and the `OnceLock` already amortizes the build to one per process.

### Filed-profile corroboration (no re-derivation)

`docs/evidence/flamegraph/enterprise-flame3` (weighted, same-run phases — the corrected record), 1349wt ≈ 1230 ms sync wall:

- No `build_style_prop_names`, `get_style_prop_names`, `engine_surface`, or plan-names frame appears anywhere in `callers.md` or `summary.md` — the mechanism holds no distinct frame above the ~1 ms sampling floor. The only "plan" hits are the unrelated stylesheet cascade/emitter frames.
- The build's inserts hide inside the shared whole-compile `BTreeMap<String>` insert budget (self 4wt / incl 13wt — btreeset report), shared across ≥6 user families.

## Why it can't land (ceiling math)

| bound | math | fantasy (100% capture) |
| --- | --- | --- |
| op count (generous) | 1,391 inserts × 250 ns (btreeset's generous short-string B-tree insert number) | **~0.35 ms** |
| op count (absurd) | 1,391 inserts × 1 µs (4× realistic) | **~1.4 ms** |
| whole-mechanism fantasy | build + 3 × 1389-string clones + downstream `BTreeSet` + `HashSet` rebuilds | **~0.9 ms** |

LAND bar on the ~1164 ms post-wave-1 base: ≥15 ms **and** ≥1.5% (≈17.5 ms). The build fantasy misses both prongs by ~40–50× at impossible 100% capture — which impossibly assumes deleting a build whose output three live consumers require (the wire array alone pins the full sorted contents). Threatening the bar would need >10 µs/insert (~40× realistic for 15-char strings into a ≤1389 tree) — no credible parameterization clears either prong, let alone both. Realistic diet capture is ~0.0 ms: the inputs are pre-sorted and pre-unique, the container takes no capacity, and the `OnceLock` already pays the build once. Per the brief, a ceiling clearing neither prong CUTs fast without touching the bench: an 8-pair confirm (≈25 min of exclusive shared lock) cannot resolve a ~0.0 ms expectation from ±20–70 ms machine noise. This CUT follows the wave-1 keys (19wt → CUT, never built), resolvefmt (2.9 ms fantasy → CUT, counted never built), btreeset (~6–9 ms fantasy → CUT, counted never built), and asmfmt (0 calls → CUT, counted never built) precedents; the BANK rule governs implemented sets whose ceilings cleared, not sub-ceiling triage.

## A/B, output hashes, determinism

Not run — no candidate was built (zero tracked diff; there is no alternate artifact to compare). Running an 8-pair A/B on a ~0.0 ms-realistic mechanism would burn the shared bench lock for a foregone CUT (swarm-keys precedent).

Determinism: the mechanism counts are code-logic facts (1 build by `OnceLock` construction, 1391/1389/2 by source-text census, unconditional call sites by control-flow reading, membership-only downstream consumers by use-site grep) plus filed-profile numbers; no runs exist to compare.

## Correctness (rule 1)

- (a) Zero diff: no suites apply. Post-work tree verified byte-clean (`git status` empty, `git diff --stat` empty, pin re-verified `5844b24…`).
- (b)/(c) Vacuous — nothing changed.

## Collision / scope notes (for the captain)

- Untouched per brief + race rule: `serialize_lookup_key` / `LookupKey` (keys2's banked diet ground); `canonical_json_value` sorted maps (serializer ground); `format_entry` subtree (modgraph ground); `NamerTables::for_system` (rebuilt every compile alongside — fasthull-recon-3's piggyback note, different mechanism); builder/extract/resolve (out of scope).
- Order caution (brief): moot — no diet written, no iteration/insertion order touched anywhere. Standing code fact for any future crew: the artifact's `stylePropNames` wire array pins exact sorted order; the two downstream set rebuilds are membership-only and order-free.
- Observed but not pursued (adjacent mechanisms, noted for reseeding, no pivot): the per-compile `Vec<String>` clones (3 × 1389 allocs ≈ 0.1 ms fantasy) and the `engine_surface` per-compile `BTreeSet` rebuild (≈0.35 ms fantasy) — both consumer-side, both ceiling-barred alone and combined (~0.9 ms whole-mechanism fantasy, §ceiling).
- Standing load facts extended (cite without re-deriving): seed-7 enterprise sync = one native compile = one `OnceLock` names build + two clones; names output is currently 1389 (filed 873 is stale); `canon ∩ alias = ∅`, dups exactly {`r`, `size`}.
- Actionable if the captain ever wants a re-census (no re-derivation needed): env-gated `eprintln!` of `names.len()` at `plan.rs:216`, one untimed enterprise run; expected output is one line with value 1389.

## Process note (method)

- Brief's "first commands" (`docs/evidence/README.md`, `flame --inspect` on plan/names frames, `--callers` on the build + consumers) were satisfied by reading the filed `enterprise-flame3` record (`callers.md`/`summary.md`) plus exhaustive source grep and a read-only source-text census script instead of re-deriving via the CLI — identical data source, zero CPU, correct with no lock held.
- No `flame.mjs`/agent CLI subprocess, no build, and no bench run was spawned at any point; every spawned-command gate held vacuously. Census chain closed over: sync driver → N-API → `compile` → `hosts::resolve`/`analyze`/`AssembleCtx::finish` → `get_style_prop_names` → three consumers, plus the canon sources as filed load facts.
- Grounding covered: VOYAGE.md + LOG.md rooms/backlog/dead-ends/process-lessons (read-only, never edited), the btreeset CUT report (absolute path; its live-path gate check, dup-rate-by-construction, and consumer-pattern proof mirrored step for step), the asmfmt precedent (proof-gate method, applied in reverse — this build verified live on `!proof`), wave-1 reserve (exact-capacity precedent — nothing to grip here) and canon (6-pair bench procedure, not needed), and the agent-rs skill.
