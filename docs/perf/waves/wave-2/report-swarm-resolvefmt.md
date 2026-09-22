# REPORT: swarm-resolvefmt — resolve-path `format!` diet

## Verdict

**CUT (addressable ceiling ≈ 2.9 ms fantasy / ~0.5–1.0 ms realistic clears neither the ≥15 ms nor the ≥1.5% (≈17.5 ms) LAND prong; two of three named sites are dead on the bench)**

One line: rhythm `calc` (4 sites) and negated calc-wrap (2 sites) fire **0 times** on the seed-7 enterprise load — only unit `px` is live (16,276 tiny calls over 44 distinct 1–3-char spellings), and its 100%-capture ceiling is ~2.9 ms.

## Base / binaries

- Base commit: `5844b24a81a528ace14fab63e908793a6829a874` (verified `git rev-parse HEAD` before any work; docs-only filing over wave-1 landing `0a7330c76`, `packages/` tree identical)
- Base `.node` sha256: `bab0b8c49d2dac2eb6551b32fdd61ce1305aa8cf08a390a5a18c2639d191ac28`
  (`packages/reference-rs/dist/native/virtual-native.darwin-x64.node`; built in-tree via `pnpm agentrs b`, stashed to `/tmp/swarm-resolvefmt-base.node`, hash re-verified after restore over the instrumented build)
- Candidate `.node` sha256: N/A — CUT before implementation, no candidate built
- Instrumented `.node` (counts only, never timed): `24e38f5ad73b0a6632945fdb192bdaba7f567097b61d233fcbf77592c94adc0b`
- `git diff --stat`: empty (7 temp instrumented files reverted; bench-report noise reverted; only this REPORT.md is untracked)
- Bench lock: never held by this crew (counted, never built, no lock hold). One count run self-aborted cleanly when the gate found the lock freshly taken; no timed overlap with any sibling.

## Mechanism counts (enterprise, seed 7, 7527 css calls)

Measured with a temporary env-gated dump (`SWARM_RESOLVEFMT_DUMP`, per-call site-tagged `eprintln!`; instrumentation fully reverted). Raw dumps preserved at `/tmp/swarm-resolvefmt-count{1,2,3}.err`; bench records (untimed) at `/tmp/swarm-resolvefmt-count{1,2,3}.json`.

| site | calls | split |
| --- | --- | --- |
| `unit_px` (unit.rs:116 `{num_str}px`) | 16,276 | 44 distinct spellings, all 1–3 chars (len 1: 3,347; len 2: 7,378; len 3: 5,551); all plain integers except `0.5/1.5/2.5/3.5`; no negatives, no scientific |
| `rhythm_denom_1` / `rhythm_denom_neg1` / `rhythm_denom_num` (rhythm/mod.rs) | **0 / 0 / 0** | dead on bench: no `1/3r`-family values |
| `rhythm_single_num` (rhythm/mod.rs) | **0** | dead on bench: no `2r`-family values |
| `neg_wrap_plain` / `neg_wrap_braced` (tokens/mod.rs:274,295) | **0 / 0** | dead on bench: no `-token` / `-{path}` values |
| `tok_pct` (tokens/mod.rs:360, modgraph-subtree cross-check) | 1,456 | exactly reproduces modgraph's opacity=1 split: every opacity arg lacked a `%` suffix |
| `tok_font` (tokens/mod.rs:231) | **0** | no fontFamily token hits on bench |
| `pseudo_apply_concat` / `pseudo_is_member` / `pseudo_template_key` / `pseudo_class_segment` | **0 / 0 / 0 / 0** | consistent with modgraph's range/atrule/unknown = 0 |
| `bp_media` (conditions/mod.rs:99) | **0** | no globalCss breakpoint queries on bench |
| `r_query` / `r_query_named` (r/query.rs) | **0 / 0** | no `r={{…}}` responsive keys on bench |

Counts reproduced **exactly** across 3 runs (16,276 / 1,456 / 17,732 total lines ×3) — deterministic mechanism volume.

Full unit-spelling set (44): `0.5 1 1.5 10 104 11 112 12 128 14 144 16 160 176 192 2 2.5 20 208 224 24 240 256 28 3 3.5 32 36 4 40 44 48 5 52 56 6 60 64 7 72 8 80 9 96`.

## Why it can't land (ceiling math)

Flame basis: `enterprise-flame3` whole-run `format_inner` = 42 wt incl, of which 35 wt is attributed (modgraph ground 8 + reserve-dieted ladder 16 + emit-dieted 6 + class_name 3 + lower_when 2). Wave-1 removed the ladder + emit shares and class_name is 0 calls on the bench path, leaving ≈ 17 wt current-base of which this hypothesis owns only its live sites below.

| site | diet | ceiling basis | generous ceiling |
| --- | --- | --- | --- |
| `unit_px` | `format!("{s}px")` → exact `with_capacity(len+2)` + 2 pushes | 16,276 calls × 176 ns (modgraph's measured all-in format_entry yardstick — generous: unit outputs are 3–5 bytes vs format_entry's ~30–60) | ~2.9 ms (≈0.25%) |
| rhythm `calc` ×4 | `format!` → push + f64 render | 0 calls | 0.00 ms |
| negated calc-wrap ×2 | `format!("calc(-1 * {inner}")` → exact push | 0 calls | 0.00 ms |
| **total** | | | **≈ 2.9 ms fantasy** |

LAND bar on the ~1164 ms post-wave-1 base: ≥15 ms **and** ≥1.5% (≈17.5 ms). The ceiling misses the ms prong by ~81% and the pct prong by ~83% — at 100% fantasy capture, which impossibly assumes the diet saves the entire call cost including the unavoidable 1 alloc + byte copies. Realistic capture (~30–60 ns diet delta on a 3–5-byte format: fmt machinery + ~1 realloc saved, alloc + memcpy remain) is ≈ 0.5–1.0 ms.

Consistency check: 16,276 calls × ~70 ns ≈ 1.1 wt sits inside the unattributed `format_inner` remainder with no named caller — exactly why the sites were "unmeasured" in the filed attribution, and exactly why they cannot move the bar. `tok_pct` (1,456) belongs to modgraph's `format_entry` subtree, not this hypothesis; it is counted here only as a cross-check and reproduces their split exactly.

Per the brief, a ceiling clearing neither prong CUTs fast without touching the bench: an 8-pair confirm (≈25 min of exclusive shared lock) cannot resolve a ~0.5 ms expectation from ±20–70 ms machine noise. This CUT follows the wave-1 keys (19 wt → CUT, never built) and modgraph (11–12 ms → CUT, never built) precedents; the BANK rule governs implemented sets whose ceilings cleared, not sub-ceiling triage.

## A/B, output hashes, determinism

Not run — no candidate was built. Running an 8-pair A/B against a hypothesis whose ceiling sits below both prongs would burn the shared bench lock for a foregone CUT (swarm-keys precedent).

Determinism: mechanism counts bit-identical across 3 enterprise runs (above).

## Correctness (rule 1)

- (a) Zero diff: no suites apply. Post-revert tree verified byte-clean (`git status` empty, `git diff --stat` empty); base `.node` restored in-tree with hash re-verified (`bab0b8c4…`, gitignored, not in diff).
- (b)/(c) Vacuous — nothing changed.

## Collision / scope notes (for the captain)

- Untouched per brief + race rule: `nest()` + `named_breakpoint` + `format_entry` subtree (modgraph-counted ground), `lower_when` memo shape (swarm-lowermemo ground — a memo, not a diet; no overlap with this diet), per-declaration canon lookups (swarm-canon2 ground; canon crate contains zero `format!`, verified by grep — no collision possible), builder/assembly/extract (out of scope).
- Actionable if the captain wants the unit_px one-liner in a future sum-confirm (no re-derivation needed): `resolve/unit.rs:116` → `let mut s = String::with_capacity(num_str.len() + 2); s.push_str(num_str); s.push_str("px"); s.into_boxed_str()`. Byte-exact for all 44 observed spellings (and all `&str` generally); expected effect ~0.5–1.0 ms, below any 8-pair resolution — bank only as filler.
- Observed but not pursued (second mechanisms, noted for reseeding, no pivot): `resolve_rhythm` scans **every** value containing `'r'` (`"red"`, `"border"`, …) through a fresh `Vec` + `FragmentScan` even though zero rhythm values exist in the load — scan-elision, not diet; `assembly.rs:252,255` key `format!`s sit in the 296 wt assembly bulk (not resolve path, deliberately not counted); the 44-distinct unit spellings suggest a memo/intern shape (different mechanism).
- Seed-load finding: the enterprise bench exercises **no** rhythm values, no negated tokens, no `&`/at-rule conditions, no font tokens, and no `r={{…}}` keys. Any future crew dieting those paths must re-census first — this REPORT's zeros are load facts, not code facts.

## Process note (method)

Count run 2's launch gate found `/tmp/swarm-bench-lock` freshly held (swarm-realloc) and self-aborted before spawning anything; the run was retried after release. All three count runs executed lock-free without holding (untimed, counts-only). Env propagation through the bench harness was verified by construction (`measure/child.ts` spawns with no `env` override; stderr inherited) and by result (17,732 tagged lines per run).
