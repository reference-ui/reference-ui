# REPORT: swarm-tokenphase — format_entry + token remainder under the per-phase bar

## Verdict

**CUT (measured two-mechanism stack saves 3.49–3.52 ms / 38.5% of the isolated
phase — the 25% share prong clears, the 5 ms absolute prong fails by 1.5 ms /
30%; no third sound mechanism closes the gap without slot-justification
stacking)**

One line: the phase is real and isolated cleanly (legacy 9.0–9.1 ms vs the
7–9wt flame band, 62,429 calls ×3-identical, `format_entry` split exactly
modgraph's 43,870/1,456) — but the only sound diets (F1 exact-push format,
measured 3.39 ms, plus L1b dead-probe gate, measured 0.36 ms) stack to 3.5 ms,
and even a predicted invasive third mechanism (composite-index fuse ≈ 1.2 ms)
reaches only ≈ 4.7 ms. CUT with bank-grade filler: both shapes are specified
exactly, parity-proven over the full corpus, and liftable into a future sum.

## Base / binaries

- Base commit: `ddce131e7ab9a627500b5caa3d24bce81204dfe4` (verified
  `git rev-parse HEAD` before any work and after revert; post cloneplasma-LAND
  tip, 13 diets landed).
- Census `.node` sha256:
  `e187d894ec8677e3b2b9064b81f4a6eafdd895bf381256c6fe46c59a25273538`
  (`/tmp/swarm-tokenphase/census.node`, 8,909,048 B; counts only, never timed;
  release build of the instrumented tree).
- Candidate `.node`: N/A — CUT before implementation, no candidate built
  (modgraph precedent: no 8-pair A/B against a hypothesis whose measured stack
  sits below the bar).
- `git status`: exactly one untracked file (this REPORT.md); `git diff` empty;
  reverted sources byte-identical to pristine asides (`cmp` clean); pin OK;
  stash stack untouched (2 pre-existing, never used — file asides only per the
  shared-stack WARNSWARM); no commits, no pushes — the captain lands.

## Topic & fences (repro2 T8, LAST numbered topic)

- Ground: `resolve/tokens/*` — `format_entry` 6/3 + `lookup_entry` 5/3 +
  `TokenDictionary::get_in_category` 1–3 ≈ 7–9wt (`report-swarm-repro2.md` T8
  row + resolve flame table, captures 3a/3b on the pre-cloneplasma tip).
- Whole-sync CUT STANDS and is never relitigated here
  (`report-swarm-modgraph.md`: `format_entry` 45,326 calls ≈ 176 ns/call,
  generous ~7 ms ceiling at 100% fantasy < ≥15 ms + ≥1.5% LAND bar on both
  prongs).
- ONLY track taken: PER-PHASE-bank on the keys2 precedent.
- Fences, all honored (cited, never touched): modgraph's CUT whole-sync ground
  (per-phase bar only — no whole-sync LAND claim is made); canon2's landed
  classify functions (`canon::classify_css_value` family behind the
  `is_whole_css_value` leg, different function family); rhythm's
  `resolve_rhythm`/`resolve_single_rhythm` (tiny); cloneplasma's landed resolve
  lines (R1/R2/R3/U1/B1/E1 in `resolve/mod.rs`, `resolve/normalize.rs`,
  `resolve/unit.rs`, `runtime/builder.rs`, `extract/expressions/object/mod.rs`
  — all disjoint from `resolve/tokens/*`, composed around); sortshape bar
  (zero order changes — nothing built).

## Per-phase bar (keys2 precedent)

BANK-per-phase requires ALL FOUR prongs (brief-explicit; any failure → CUT):

1. Phase effect ≥ 5 ms absolute on the isolated phase.
2. Phase share ≥ 25% of the isolated phase.
3. Differential proof (byte-parity over the full corpus + identity/suites).
4. A method reproducing the flame (keys2: legacy path over corpus within ~6%
   of the filed flame weight, 20.1–20.5 ms vs 19 wt).

Keys2's method, mirrored here (`report-swarm-keys2.md`, bank mechanics in
`integrate-bank.md`): drive the REAL functions over the REAL enterprise corpus
in call order (their preserved site-tagged dump, 106,278 tuples; 2 unscored
warmups + scored interleaved rounds, medians, ≥2 process runs). Whole-sync A/B
is directional only and NEVER the verdict basis.

## Phase definition & isolation method

**Phase:** the resolve-path token format+lookup sub-phase of one enterprise
compile = all `lookup_entry` + `format_entry` calls from `resolve_token_value`'s
pathed/negated paths (incl. nested `TokenDictionary::{get, get_unique,
get_in_category}` probes) + `interpolate.rs`'s direct `token()` probes and
their `format_entry` calls. Excluded by scope: `system_layers`/`global` direct
`token()` calls (emission-phase, not resolve); the `is_whole_css_value` leg
(canon2 landed ground); rhythm (fenced). The phase is session-free
(`lookup_entry(prop, path, system)` and `format_entry(entry, opacity)` are pure
given the dictionary), which makes isolation exact.

**Corpus:** site-tagged dump from the live enterprise load (pin stream, NO
`--seed` per the cloneplasma stream correction): per-`lookup_entry` `TP_O`
(site + opacity, at the 3 callers) + `TP_Q` (leg + prop + path, inside),
strictly O/Q-adjacent (0 violations ×3); per-`format_entry` `TP_FE` (opacity +
css/out lens); per-interpolate-probe `TP_IT`; `TP_DICT[E]` full dictionary
dump (once per process); `TP_RTV/SP/PAT/PATE/FB/IX` denominator-audit legs.
All `SWARM_TOKENPHASE_DUMP`-gated `eprintln!`, fully reverted after counts
(2 files +203/−10, 25 TEMP tags, parse-checked pre-build).

**Harness:** temporary in-crate `#[ignore]` test (reverted after numbers),
`cargo test --release -p atomic`, driving `lookup_entry` + `format_entry` over
the dumped corpus in call order against a `TokenDictionary` rebuilt via
`insert_leaf` from the dumped keys (insertion-order + per-key css_var asserts).
Harness-fidelity proof: every dumped Q-leg replays identically (leg assert per
row over all 62,429 rows) and the rebuilt dictionary iterates the dumped key
order exactly. Arms: legacy / diet-F1 (harness-local exact-push spelling) /
lookup-only / format-only (decomposition) / L1b gate / combined stack;
2 warmups + 25 scored interleaved rounds with rotated arm order; medians +
paired median-of-diffs; FNV checksums + per-row parity asserts; 3 process runs.
Census code was present but gate-OFF during the bench (perturbation ≈ one
OnceLock check per call, ~0.1 ms on the phase, disclosed; identical on all
arms, so marginals are unaffected).

**Ceiling math (the CUT gate):** verdict ceiling = measured F1 savings (the
only sound format shape) + 100% of the measured lookup slice (fantasy — no
sound lookup diet assumed). Result: 3.39 + 4.55 = 7.94 ms clears the ceiling,
so the two real shapes (F1 + L1b) were measured as a stack; the stack's
measured 3.50 ms rules the bar (below). No tree diet was built.

## Phase census (exact counts ×3, pin stream)

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, 3 runs.
Stream sha `ad73f0df35a06e2976456033060d4d6480d71946375c1a7e638f416498b83232`
×3; 402,454 TP lines/run; `.err` files byte-identical ×3 (7,074,637 B);
O/Q adjacency 0 violations; all 7 aggregator cross-checks OK ×3
(O==Q, SP==RTV-early, PAT==pathed, PATE+FB==PATmiss, FE==Qhit+IThit,
DICT n==entries, adjacency). Raw dumps:
`/tmp/swarm-tokenphase/count{1,2,3}.{err,json}` (+`.corpus/.dict/.it.tsv`);
aggregator `/tmp/swarm-tokenphase-agg.py`; census patch
`/tmp/swarm-tokenphase-census.patch`.

| site | calls | split |
| --- | --- | --- |
| `resolve_token_value` entries | 89,944 | pathed 62,429; whole_css 27,515; empty/var 0; special_hit 0; negated_hit 0 |
| special (`TP_SP`) | 62,429 | font_hit 0; keyword_hit 0 (f=0 k=- 35,317 non-color; f=0 k=0 27,112 color-miss) |
| `lookup_entry` (all `pathed` site; neg/negb 0) | 62,429 | cat 40,467; fallback_hit 4,859; miss_nofb 3,937; miss_nocat 13,166; **direct 0; unique 0** |
| pathed outcome | 62,429 | hit 45,326; miss 17,103; malformed 0 |
| miss fallback | 17,103 | all `silent_noncolor` (braced_err/path_warn/color_warn/silent_css all 0) |
| interpolate probes (`TP_IT`) | 0 | no brace segments on this load (`TP_IX` 0) |
| `format_entry` | 45,326 | op0 43,870; op1 1,456 — **exactly modgraph's split** |
| dictionary | 364 entries | all keys dotted (0 bare keys) |

Histograms: prop_len mean 8.6 (p50 8, max 23); path_len mean 6.0 (p50 6,
max 17); css_var_len mean 15.7 (p50 17, max 20); format_out_len mean 21.8
(p50 22, p99/max 52, the color-mix tail). Dotted paths: 1,444/62,429
(legs: cat 837, fallback_hit 319, miss_nocat 154, miss_nofb 134 — direct 0);
dotless: 60,985 (direct 0 — provably dead: no bare keys in dict).

Outputs pin-exact ×3 (instrumentation perturbed nothing): cssCalls 7527,
cssBytes 2,867,925 (`7ec827fb0c0c…` full-64 match), dataBytes 214,466
(`718d19e47017…` full-64 match). Count-run syncMs (3.30/2.88/2.88 s,
instrumented + 7 MB stderr) is untimed and discarded per protocol.

Structural findings: (1) the direct full-key probe is 0/62,429 on this load
AND provably dead for dotless paths on this dictionary (0 bare keys) — the
L1b gate below; (2) the resolve_token_value load is JUST pathed lookups plus
the fenced whole_css leg — negated/special/interpolate/malformed/warn paths
are all vacuous; (3) RTV entries exceed cloneplasma's 89,904 wants by 40
(+0.04%, expansion pairs — disclosed, corpus self-consistent);
(4) `format_entry` volume/split reproduces modgraph exactly on the new tip.

## Phase bench & bar ruling

3 process runs, 2 warmups + 25 scored interleaved rounds each, all parity
asserts pass, all four arm checksums identical per run
(`0431f7da8d18515a` ×4 arms ×3 runs):

| arm | run 1 | run 2 | run 3 |
| --- | --- | --- | --- |
| legacy (phase) | 8.998 | 9.105 | 9.046 |
| diet-F1 | 5.755 | 5.717 | 5.658 |
| lookup-only | 4.579 | 4.572 | 4.551 |
| format-only | 4.317 | 4.278 | 4.264 |
| L1b gate | — | 8.738 | 8.693 |
| combined (F1+L1b) | — | 5.590 | 5.561 |
| **F1 savings (median-diff / paired)** | 3.244 / 3.250 (36.0%) | 3.389 / 3.384 (37.2%) | 3.388 / 3.411 (37.5%) |
| **L1b savings** | — | 0.367 (4.0%) | 0.353 (3.9%) |
| **STACK savings (median-diff / paired)** | — | 3.515 / 3.470 (38.6%) | 3.485 / 3.510 (38.5%) |

Decomposition coherence: lookup+format = 8.90/8.85/8.82 vs legacy
9.00/9.11/9.05 (within 2.5% — the residual is per-row branch/loop overhead).
Per-call units: legacy 145 ns; format-legacy 95 ns → F1-format ≈ 24 ns
(75% of format captured; the ≈ 1.1 ms remainder is allocs + memcpy floor);
lookup 73 ns; L1b net ≈ 6 ns/gated row (the direct FxHash probe on the
364-entry table costs only ≈ 7 ns — far below the ≈ 20 ns estimate, which is
why L1b measures 0.36 ms and not ≈ 1.1 ms).

**Method validation (prong 4 — PASS):** legacy 9.00–9.11 ms sits inside the
filed 7–9wt band (top edge; the two captures straddle it — 3a ≈ 11, 3b ≈ 6–9
— exactly repro2's documented ±5–8 jitter). The corpus method reproduces the
independent instrument within capture noise (lineindex "inside the band"
precedent).

**Bar ruling:**

1. ≥5 ms absolute: STACK 3.49–3.52 ms → **FAIL by 1.5 ms / 30%**.
2. ≥25% share: 38.5% → PASS.
3. Differential proof: per-row byte-parity (F1: 45,326/45,326 rows; L1b:
   60,985/60,985 gated-row outcomes + checksums ×3 runs) → PASS (as evidence;
   no tree diet to identity-check since nothing was built).
4. Flame-reproducing method → PASS (above).

One prong fails → **CUT**, per the brief. The losing math is measured, not
predicted: the two-mechanism stack (exact-push format + dead-probe gate)
saves 3.50 ms of a 9.05 ms phase. The remainder (≈ 5.55 ms: ≈ 4.2 lookup +
≈ 1.1 format floor) needs ≥1.5 ms from a third mechanism to reach 5 — the
only sketched shape (composite-index fuse, ≈ 1.2 ms predicted, invasive
base-system index change) stacks to only ≈ 4.7 ms predicted. Clearing the bar
would take 3–4 mechanisms, one invasive, to graze it — unambiguous
slot-justification stacking (keys2's "never ship a bundle on faith"
discipline). No tree diet built; no whole-sync A/B run (foregone CUT —
modgraph precedent).

## Mechanism / losing math + filler (bank-grade)

**F1 — exact-push `format_entry`** (`atomic/src/resolve/tokens/mod.rs:463`,
measured 3.39 ms / 37.5%, parity 45,326/45,326 + checksums ×3): replace the
two `format!`s with capacity-exact pushes — no-opacity:
`with_capacity(5 + css.len())` + `var(` + css + `)`; opacity: single
`with_capacity(39 + css.len() + op.len() + pct_extra)` +
`color-mix(in srgb, var(` + css + `) ` + op + [`%`] + `, transparent)`
(capacity math: 19 + 5 + 1 + 14 statics = 39; byte-content identical to the
legacy concatenation — proven per row). Captures 75% of the format slice;
the ≈ 1.1 ms remainder is alloc + memcpy floor (only an interned/Cow return
contract — an API change, not a diet — goes further).

**L1b — dead-probe gate on `lookup_entry`** (measured 0.36 ms / 4.0%, outcome
parity 60,985/60,985 + checksums ×3): precompute `has_bare_keys` once in
`TokenStore::rebuild_indexes` (any full key without `.`); expose via
`TokenDictionary`/`BaseSystem`; in `lookup_entry`, when `!has_bare &&
!path.contains('.')`, skip the `system.token(path)` probe and run the
unique/cat/fallback chain verbatim (sound: a dotless path cannot equal a
dotted full key, and no bare keys exist). Fires on 60,985/62,429 rows here
(97.7%); dotted rows take the full path unchanged. Small, sound, general
(the flag, not the load, carries soundness).

**Bank conditions** (for a future sum-captain lifting F1+L1b ≈ 3.5 ms /
38.5%): re-census the phase on the landing base (counts shift with dict/load
— the O/Q corpus method above replays verbatim); re-run the harness
(`/tmp/swarm-tokenphase-harness-final.rs`, corpus + dict dumps in
`/tmp/swarm-tokenphase/`); 4-scale byte-identity vs sealed pins;
determinism; `cargo test -p atomic`; `pnpm agentrs q`; combined-set LOO for
the in-situ contribution. Pin tests to add: F1 opacity/percent edge table
(`50` vs `50%`, empty css) and L1b bare-key presence/absence legs (dict with
and without a bare key, dotted + dotless paths).

**Fuse sketch (NOT recommended, third mechanism):** composite
`(category, rest)` single-probe index in `TokenStore` replacing the
category-then-rest double hash (≈ 49k cat + 9k fallback double probes;
predicted ≈ 1.0–1.2 ms). Invasive (index build + memory in base-system),
still stacks to only ≈ 4.7 ms predicted with F1+L1b — filed for completeness,
not as a build license.

**Follow-up notes:** the `silent_noncolor` miss stream (17,103 bare values on
non-color props) and the `whole_css` leg (27,515) are the only other
resolve_token_value volume — both fenced (canon2/rhythm) or passthrough by
design; no diet surface there. A lookup memo was considered and rejected
without building (keys2 asymmetry: 73 ns lookup vs ≈ 50 ns hash+verify —
same verdict, same discipline).

## Housekeeping

- Never wrote LOG.md (captain-only). No commits, no pushes — the captain lands.
- Bench lock: one held block (install + build:js + census build + 3 count runs
  + 3 phase-bench process runs), two-step release
  (`rm -f owner && rmdir`), no foreign PIDs, no overlapping runs.
- File asides only (`/tmp/swarm-tokenphase-aside/`); stash stack untouched.
- Tree at hand-off: this REPORT.md only (CUT — zero diet files, zero builds).
- Evidence: `/tmp/swarm-tokenphase/` (census .node + sha, 3× .err/.json,
  3× corpus/dict tsv, aggregator, count script, pincheck, final harness).
