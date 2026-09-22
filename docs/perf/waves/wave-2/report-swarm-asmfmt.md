# REPORT: swarm-asmfmt — assembly key `format!` diet

## Verdict

**CUT (all five assembly/plan key-`format!` sites are unreachable on the sync path: 0 calls × any per-call cost = 0.00 ms fantasy ceiling clears neither the ≥15 ms nor the ≥1.5% LAND prong)**

One line: `assembly.rs:252,255` sit in proof-gated `build_css_runtime` (bench `proof` is unconditionally false — the bench config carries no `logs`, and `LogChannel` forbids `'proof'` on sync entirely); the plan/key `derive_slot` sites (`builder.rs:54,58`) are skipped on the diet path every `!proof` compile takes; the fifth site (duplicate-recipe diagnostic) is an aborting error that never fires on a completing load. Counted by gate proof + filed-profile absence, never built, no lock hold.

## Base / binaries

- Base commit: `5844b24a81a528ace14fab63e908793a6829a874` (verified `git rev-parse HEAD` before any work and after; docs-only filing over wave-1 landing `0a7330c76`, `packages/` tree identical)
- Base `.node` sha256: N/A — never built (fresh worktree ships no `dist/`/`target/`; a from-scratch release build + instrumented counts would burn shared-box CPU for zero information on gate-dead code)
- Candidate `.node` sha256: N/A — CUT before implementation, no candidate built
- `git diff --stat`: empty (zero tracked edits; only this REPORT.md is untracked)
- Bench lock: never held by this crew (counted, never built, no lock hold). All work was read-only while siblings held the lock (realloc → rhythm → intdiag); no spawned run of any kind, timed or untimed.

## Mechanism counts (enterprise, seed 7, 7527 css calls)

Census of every `format!` in `assembly.rs` + the plan/key path (`runtime/builder.rs`), with the gate that decides its load count:

| site | gate | load calls | basis |
| --- | --- | --- | --- |
| `css_key_plain` (assembly.rs:252 `"{prop}:{val}"`) | proof-only `build_css_runtime` (assembly.rs:94 `proof.then(...)`) | **0** | bench request has `logs: undefined` (§chain); `wants_proof()` false |
| `css_key_cond` (assembly.rs:255 `"{conds}:{prop}:{val}"`, incl. `conds.join`) | same | **0** | same |
| `slot_cond` (builder.rs:54 `"{conds}:{canonical}"`, incl. `cond_parts.join`) | diet-skipped: all 3 `derive_slot` call sites (builder.rs:249,296,346) are in `diet=true` bypassed branches | **0** | `!proof` → `build_diet` → `build_keyed(decls, true)` |
| `slot_bp` (builder.rs:58 `"{base}@{bp}"`) | same | **0** | same |
| `dup_recipe` (assembly.rs:224 diagnostic) | error path | **0** | `ATM-E-DUPLICATE-RECIPE` is severity `error`; `throwOnErrorDiagnostics` aborts sync — every completed bench run on the load proves 0 fires |

Key-shape / arg census: vacuous — zero calls, zero shapes observed, zero args to census.

### The `proof=false` chain on the bench load (read-verified end to end)

1. `benchmark/measure/worker.ts:45` drives the real `sync(args.dir)` — no separate bench request path.
2. `benchmark/generate/templates/config.ts` (the template that emits the load's `ui.config.ts`) sets no `logs` key → `config.logs === undefined`.
3. `sync/index.ts:108-117` builds the request with `logs: config.logs` (undefined drops from the serialized request per `sync/native.ts:29`); `compileNative` passes it through untouched (`sync/native.ts:75-78`).
4. N-API `compile_system` passes `logs: req.logs` through untouched (`native.rs:70`); `wants_proof` needs the literal `"proof"` (`native.rs:81-85`, `types.rs:58-62`).
5. `lib.rs:129` → `proof: request.wants_proof()` → false → `build_css_runtime` never runs, `build_plans` takes `build_diet`.

Belt and braces: even a hand-written config cannot pass `'proof'` — `LogChannel = 'compiler'` (`config/types.ts:24`) and `validate.ts:70-71` throws on anything else. The sites are unreachable on **every** sync invocation, and specifically on the seed-7 bench load.

### Independent corroboration (filed record, no re-derivation)

`docs/evidence/flamegraph/enterprise-flame3` (weighted, same-run phases — the corrected record) `callers.md` + `summary.md`: `PlanBuilder::build_keyed` is live (83 incl wt), while `build_css_runtime`, `derive_slot`, `CssRuntime`, and `DuplicateRecipe` have **zero mentions** — the independent instrument agrees the sites never fire on the load. (`build`/`build_with_keys`/`build_runtime_style_plans` non-diet entry points are likewise proof-branch- or test-only: assembly.rs:160, `proof/plans.rs` tests, `runtime/tests.rs`.)

## Why it can't land (ceiling math)

| site | diet (never written) | ceiling basis | generous ceiling |
| --- | --- | --- | --- |
| `css_key_plain` + `css_key_cond` | `format!` → exact-capacity pushes | 0 calls | 0.00 ms |
| `slot_cond` + `slot_bp` | `format!`+`join` → exact pushes | 0 calls | 0.00 ms |
| `dup_recipe` | error-path diet (not a key) | 0 calls | 0.00 ms |
| **total** | | | **0.00 ms fantasy** |

LAND bar on the ~1164 ms post-wave-1 base: ≥15 ms **and** ≥1.5% (≈17.5 ms). The ceiling misses both prongs by 100% — at fantasy capture, which impossibly assumes saving the entire call cost of calls that never happen. Realistic capture is identically 0.00 ms. Per the brief, a ceiling clearing neither prong CUTs fast without touching the bench: an 8-pair confirm (≈25 min of exclusive shared lock) cannot resolve a 0.0 ms expectation from ±20–70 ms machine noise. This CUT follows the wave-1 keys (19 wt → CUT, never built), modgraph (11–12 ms → CUT, never built), and resolvefmt (2.9 ms fantasy → CUT, counted never built) precedents; the BANK rule governs implemented sets whose ceilings cleared, not sub-ceiling triage — and a zero-call diet has no bytes to bank.

## A/B, output hashes, determinism

Not run — no candidate was built (zero tracked diff; there is no alternate artifact to compare). Running an 8-pair A/B against unreachable code would burn the shared bench lock for a foregone CUT (swarm-keys precedent).

Determinism: the mechanism counts are gate-logic facts (0 by construction on every sync input), corroborated by the filed profile; no runs exist to compare.

## Correctness (rule 1)

- (a) Zero diff: no suites apply. Post-work tree verified byte-clean (`git status` empty, `git diff --stat` empty, pin re-verified `5844b24…`).
- (b)/(c) Vacuous — nothing changed.

## Collision / scope notes (for the captain)

- Untouched per brief + race rule: `serialize_lookup_key` / `LookupKey` (keys2's banked diet ground — the only LIVE key construction on the `!proof` path: `build_keyed` decl loop + `Proof::collect_exact` exact loop, 19 wt filed); `format_entry` subtree (modgraph ground); `lower_when` memo (lowermemo ground); canon lookups (canon2 ground); `CascadeKey`/sort (cascade ground); builder/extract/resolve (out of scope).
- `seen_keys` first-wins / plan-order caution (brief): moot — no diet written, no iteration/insertion order touched anywhere.
- Observed but not pursued (second mechanisms, noted for reseeding, no pivot): `runtime/tables/mod.rs:185,196` (`_{name}`/`twin_key` over PRESETS+conditions in once-per-compile `build_conditions` — bounded by source constants to ~dozens of tiny formats, ≈10 µs fantasy; runtime-tables ground, not key construction); `runtime/values.rs:78,81` (`{n}r` renders for `$r` plan objects — resolvefmt's load census found zero rhythm values, and swarm-rhythm owns rhythm ground, already CUT with counts); `assembly.rs:163` `keys.into_iter().collect::<BTreeSet<String>>` (a collection, not a `format!` — different mechanism).
- Actionable if the captain ever wants a re-census (no re-derivation needed): env-gated `eprintln!` tags at assembly.rs:224/252/255 + builder.rs:54/58, one untimed enterprise run; expected output is zero tag lines. The `proof` field + `build_css_runtime`/`derive_slot` deadness on sync also stands as a standing load fact for any future crew eyeing those functions.
- Seed-load finding (extends resolvefmt's): the enterprise bench exercises the `!proof` path exclusively — `build_css_runtime`, full (non-diet) plans, and slot/class materialization never execute. Any future crew dieting `proof`-gated or non-diet-only code must re-census first; these zeros are sync-path facts, not code facts.

## Process note (method)

- Brief's "first commands" (`flame --inspect` on build_keyed/assembly frames, `--callers` on key-format sites) were satisfied by grepping the filed `enterprise-flame3` record (`callers.md`/`summary.md`) instead of re-deriving via the CLI — identical data source, zero CPU, correct while siblings held the lock.
- No `flame.mjs`/agent CLI subprocess was spawned at any point; every spawned-command gate held vacuously. Static chain closed over: bench worker → sync → native seam → N-API → `CompileRequest::wants_proof` → `AssembleCtx::finish`/`build_plans`, plus the config template, `LogChannel` type, and validator.
