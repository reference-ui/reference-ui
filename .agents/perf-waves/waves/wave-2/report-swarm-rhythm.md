# REPORT: swarm-rhythm — `resolve_rhythm` 'r'-scan elision

## Verdict

**CUT (fantasy ceiling ≈ 3.2 ms at 100% capture clears neither the ≥15 ms nor the ≥1.5% (≈17.5 ms) LAND prong; realistic net ≈ 1.4 ms)**

One line: the scan is real but tiny — 18,368 elidable scans of ~8-byte
single-word values at ~70–176 ns each, and the seed-7 load holds zero rhythm
values, so even perfect elision cannot move the bar.

## Base / binaries

- Base commit: `5844b24a81a528ace14fab63e908793a6829a874` (verified `git rev-parse HEAD` before any work; docs-only filing over wave-1 landing `0a7330c76`, `packages/` tree identical)
- Base `.node` sha256: N/A — CUT before implementation, no base/cand arms built
- Candidate `.node` sha256: N/A — CUT before implementation, no candidate built
- Instrumented `.node` (counts only, never timed): `95a91bd3612686d839991248a1bc6c23b53cad4082b6b449004e19b65a992140`
- `git diff --stat`: empty (1 temp instrumented file reverted; bench-report noise reverted; only this REPORT.md is untracked)
- Bench lock: held once for the count block only (fresh-worktree `pnpm install` + instrumented build + 3 untimed count runs), released immediately after run 3. No timed A/B — a confirm cannot resolve a ~1.4 ms expectation from ±20–70 ms machine noise (swarm-keys precedent).

## Mechanism

`resolve::rhythm::resolve_rhythm` (`packages/reference-rs/modules/atomic/src/resolve/rhythm/mod.rs:81`)
runs on every resolved value at three call sites (`resolve/mod.rs:295`,
`stylesheet/system_layers/mod.rs:209`, `stylesheet/global/value.rs:158`). The
only pre-scan gate is `val.contains('r')`; every value containing the letter
'r' ("red", "border", "transparent", …) then pays a full fragment scan:
`String::with_capacity(len*2)` + `Vec<&str>` allocs in `split_fragments` /
`FragmentScan`, two walks, and a final `resolved == val` memcmp — even though
the seed-7 enterprise load contains ZERO rhythm values (swarm-resolvefmt
§Collision reseed; rhythm `calc` sites 0 calls ×3 runs).

Candidate fix (designed, never built — ceiling bars): replace the
`contains('r')` gate with the sound cheaper gate `scan_may_resolve` — false
only when no `r` in the value can end a word fragment, in which case the
fragment walk is provably identity (see §Gate soundness). Elided values skip
both allocs, both walks, and the memcmp. Flame basis: `resolve_rhythm` is
inlined below filed attribution (absent from `enterprise-flame3` string
table; cost hides in `resolve_want_with` incl 137 wt + malloc/memmove/memcmp
self) — hence mechanism counts, not flame weights, decide.

## Mechanism counts (enterprise, seed 7, 7527 css calls)

Measured with a temporary env-gated dump (`SWARM_RHYTHM_DUMP`, per-call
`RHYTHM len/has_r/elidable/changed/nfrags` on stderr; `elidable` computed by
the actual gate function, `changed` by re-running `resolve_fragments`;
instrumentation fully reverted). Raw dumps preserved at
`/tmp/swarm-rhythm-count{1,2,3}.err`; bench records (untimed) at
`/tmp/swarm-rhythm-count{1,2,3}.json`.

| metric | count | share |
| --- | --- | --- |
| `resolve_rhythm` calls | 89,944 | — |
| scanned (contains 'r') | 20,736 | 23.1% of calls |
| elidable by gate | 18,368 | 88.6% of scanned |
| must-scan (word ends in 'r') | 2,368 | 11.4% of scanned |
| changed (true rhythm values) | **0** | — |

Scanned-value shape: len sum 170,713, mean 8.2 B, p50 8, p90 11, p99 12,
max 17; buckets (8 B): <8: 6,898; 8–15: 13,834; 16+: 4. Fragments:
sum 20,752, mean 1.0 — scanned values are single delimiter-free words.

Counts reproduced **bit-identically** across 3 runs (`cmp` clean on all
89,944 lines ×3) — deterministic mechanism volume. `changed=0` independently
confirms resolvefmt's filed zero-rhythm-values finding on this base.

## Why it can't land (ceiling math)

| term | basis | value |
| --- | --- | --- |
| elidable scans | measured (§counts) | 18,368 |
| per-scan cost, generous | modgraph `format_entry` yardstick 176 ns (this scan does 2 small allocs + ~8 B walks + memcmp vs `format_entry`'s heavier 2-`format!` ~30–60 B work) | 176 ns |
| **fantasy ceiling** | 18,368 × 176 ns, 100% capture, gate cost ignored | **≈ 3.2 ms** |
| realistic gross | ~100 ns/scan (2 nano allocs + walks on 8 B) | ≈ 1.8 ms |
| gate cost | ~90k calls × ~4 ns byte scan | ≈ −0.4 ms |
| **realistic net** | | **≈ 1.4 ms** |

LAND bar on the ~1164 ms post-wave-1 base: ≥15 ms **and** ≥1.5% (≈17.5 ms).
The fantasy ceiling misses the ms prong by ~79% and the pct prong by ~82% —
at 100% capture, which impossibly assumes elision saves the whole scan
including the unavoidable gate pass. Robustness: even at 300 ns/scan (1.7×
the generous yardstick) the ceiling is 5.5 ms — still bars both prongs under
2× cost-model error.

Alloc-volume cross-check: 18,368 × 2 small allocs ≈ 37k allocs is ~0.4% of
the 8.2 M-block compile span — no second-order win hides there either.

Per the brief, a ceiling clearing neither prong CUTs fast without a timed
confirm. On BANK-vs-CUT: the BANK rule governs *implemented* sets whose
ceilings cleared (keys2 diet precedent); sub-ceiling triage CUTs unbuilt —
this follows the wave-1 keys (19 wt → CUT, never built) and wave-2 modgraph
(~11–12 ms → CUT), resolvefmt (~2.9 ms → CUT), and lowermemo (~4.3 ms → CUT)
precedents.

## A/B, output hashes, determinism

Not run — no candidate was built. Running an 8-pair A/B against a hypothesis
whose fantasy ceiling sits below both prongs would burn the shared bench lock
for a foregone CUT.

Determinism: mechanism counts bit-identical across 3 enterprise runs (above).

## Correctness (rule 1)

- (a) Zero diff: no suites apply. Post-revert tree verified byte-clean
  (`git status` shows only untracked REPORT.md, `git diff --stat` empty).
- (b)/(c) Vacuous — nothing changed.

## Gate soundness (for the record; gate designed + census-validated, never shipped)

Gate predicate (was `scan_may_resolve`, reverted with the instrumentation):
scan iff some byte `b'r'` in `val` is at end-of-value or immediately followed
by (a) a byte ≥ 0x80 (conservative: may be a non-ASCII
`char::is_whitespace` delimiter such as U+00A0) or (b) an exact-ASCII
fragment delimiter (space, `\t\n\x0B\x0C\r`, `(`, `)`, `,`, `*` — note
`u8::is_ascii_whitespace` omits 0x0B, which `char::is_whitespace` includes).

Proof sketch: `resolve_word` transforms only word fragments ending in `r`
(`strip_suffix('r')`; uppercase `R` never resolves). Words end exactly at
fragment delimiters or end-of-value. Gate=false ⟹ no `r` is followed by a
delimiter-or-end ⟹ no word ends in `r` ⟹ every fragment pushes verbatim ⟹
output == input ⟹ `resolve_rhythm` returns `Borrowed`, identical to the
un-gated path. Paren/protection bookkeeping only adds passthrough and cannot
change an identity walk. `b'r'` matches only ASCII `r` in valid UTF-8.

Census-validated on the bench load: the gate's `elidable` verdict agreed
with the recomputed `changed` flag on all 20,736 scanned values (18,368
elided, all `changed=0`; the 2,368 must-scans were also all `changed=0` —
gate false positives of the "border" family, zero false negatives possible
by construction). No differential corpus was run: with the ceiling barring,
building the adversarial proof (incl. `1r<U+00A0>`, `1r.png`, `1R`, `var(`
bodies) would not change the verdict. Any future revival must run that
corpus — the bench's zeros are load facts, not code facts.

## Collision / scope notes (for the captain)

- Untouched per brief + race rule: canon2's value-classify chain
  (`canon::css::values::*` — same resolve chain, different functions/files;
  this hypothesis would have touched only `resolve/rhythm/mod.rs`),
  resolvefmt's unit/rhythm `format!` diet ground (dead-on-bench rhythm sites;
  elision is upstream of those `format!`s and fires only when a true rhythm
  value exists — no overlap), lowermemo's conditions ground (CUT; disjoint
  module), builder/assembly/extract (out of scope).
- Actionable if the captain ever wants the gate as sum-confirm filler (no
  re-derivation needed): replace `resolve_rhythm`'s `contains('r')` check
  with the `scan_may_resolve` predicate above (single byte pass, subsumes
  the `contains` scan). Expected effect ~1.4 ms net, below any 8-pair
  resolution — bank only as filler, and only after the adversarial
  differential corpus (§Gate soundness) proves 0 divergences.
- Seed-load finding (confirms resolvefmt): the enterprise bench exercises
  **zero** rhythm values across 89,944 `resolve_rhythm` calls. Any future
  crew working the rhythm path must re-census first.

## Process note (method)

- One count-run launch gate self-aborted cleanly when the lock was found
  freshly taken (swarm-sortshape) between check and spawn — nothing was
  launched; the block was retried after release under a fresh hold.
- Env propagation through the bench harness verified by result (89,944
  tagged lines per run, bit-identical ×3).
- Fresh worktree lacked `dist/` entirely: ran `pnpm install` + `pnpm agentrs b`
  (instrumented) + `build:js` once inside the count-block hold (gitignored,
  not in diff).
