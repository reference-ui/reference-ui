# INTEGRATE.md — swarm-canon2 LAND claim (no-alloc case-insensitive classify)

Integrator: swarm-intcanon2. Base pin `5844b24a81a528ace14fab63e908793a6829a874`
verified at start and end; integration branch `reference-system` tip == base at
both checks (no wave-2 landings during this integrate). Patch
`docs/perf/waves/wave-2/canon2.patch` applied with `git apply --check` then
`git apply`, all clean: 4 files, +105/−13, exactly as claimed.

## Per-change paragraph

One mechanism at three call sites: fold ASCII case during the search instead of
`to_ascii_lowercase()` per call, deleting two `String` allocs per
`classify_css_value` call (plus a third on paren-values). `values/mod.rs`
adds the shared `cmp_lower_probe` comparator (new, +24). `named_colors.rs`
switches `is_named_color` from `binary_search` on a lowered copy to
`binary_search_by` with that comparator over the unchanged 150-entry table.
`classify.rs` switches `is_css_keyword` from lowercase-then-`binary_search` to
a linear `eq_ignore_ascii_case` scan over the unchanged 7-entry table.
`functions.rs` passes the raw name into `function_kind`, which uses the same
`binary_search_by` comparator over the five unchanged kind tables. No table
changed; three permanent member-contract tests (lower/UPPER/Mixed per entry)
live next to the tables. Deliberately untouched: `has_non_length_unit`,
`is_css_color_keyword`, `find_property` dispatch (other mechanisms/rare paths).

## Collision analysis

(1) same-function-twice: the 4 patched files diffed against the integration
tip (== base, confirmed above) are exactly the patch hunks — no other wave-2
work is in the tree. File-set disjointness across pending wave-2 patches,
verified mechanically from the `diff --git` headers: canon2 touches only
`modules/canon/src/css/values/{classify.rs, functions.rs, mod.rs,
named_colors.rs}`; diag touches only
`modules/atomic/src/diagnostics/channels/mod.rs`; cascade touches only
`modules/atomic/src/stylesheet/cascade/mod.rs`; parse touches
`modules/atomic/src/extract/{identity.rs, identity_map.rs, identity_tests.rs}`,
`modules/atomic/src/{hosts/mod.rs, lib.rs}`, and
`modules/styletrace/src/{analysis/{analyzer.rs, mod.rs, parser/mod.rs,
surface.rs}, lib.rs, tests/{owned_props.rs, trace_gate.rs}}`. Zero file
overlaps: canon2 is the only patch in `modules/canon`, the other three live
entirely in `modules/atomic` / `modules/styletrace`.

(2) shared-state/ordering: re-verified from the code, not the report.
`cmp_lower_probe` ([mod.rs](/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c59e-e36c-7f83-b1df-781f527ec8ac-01a0c5de-0270-7983-8320-f52c94cfde84/packages/reference-rs/modules/canon/src/css/values/mod.rs:147))
compares probe bytes against `input.bytes()` folded per-byte with
`u8::to_ascii_lowercase`, prefix → shorter-is-Less. `str::to_ascii_lowercase`
is exactly that per-byte map, length-preserving, so the comparator returns
bit-identically the ordering the old `probe.cmp(&lowered)` byte-compare
returned; over the lowercase-sorted tables (`table_is_sorted_for_binary_search`
and `tables_are_sorted_for_binary_search` tests pin the order)
`binary_search_by` finds `Equal` exactly where the old `binary_search` did.
`eq_ignore_ascii_case` over the 7-entry lowercase table: ASCII folds coincide
with lower-then-compare, and non-ASCII bytes (≥0x80, incl. multi-byte UTF-8)
pass through unfolded on both sides — identical decisions. Kind tables,
`CSS_KEYWORDS`, and `NAMED_COLORS` are byte-unchanged by the patch (hunks
touch only function bodies, doc comments, and tests). Callers cannot observe
the change: `function_kind` ([functions.rs](/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c59e-e36c-7f83-b1df-781f527ec8ac-01a0c5de-0270-7983-8320-f52c94cfde84/packages/reference-rs/modules/canon/src/css/values/functions.rs:68))
is private with the single caller `classify_function` in the same file;
`is_css_keyword` ([classify.rs](/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c59e-e36c-7f83-b1df-781f527ec8ac-01a0c5de-0270-7983-8320-f52c94cfde84/packages/reference-rs/modules/canon/src/css/values/classify.rs:176))
is private with the single caller `classify_css_value`; `is_named_color` keeps
its signature and is consumed only through `classify_css_value`
([classify.rs](/Users/ryn/Developer/reference-ui/.muse/worktrees/subagent-v2-01a0c59e-e36c-7f83-b1df-781f527ec8ac-01a0c5de-0270-7983-8320-f52c94cfde84/packages/reference-rs/modules/canon/src/css/values/classify.rs:121)),
whose public contract (return type, `None` conditions) is untouched.

(3) regen/tests: none of the 4 files carries `@generated` (the marker exists
only in sibling emitter-owned files: `dialect.rs`, `html.rs`, `css/mod.rs`,
etc.) and no emitter covers `css/values/` — all hand-written, no regen step,
no drift question. The 3 new permanent member-contract tests were run
explicitly by name: `keywords_match_in_any_ascii_case`,
`every_table_member_matches_in_any_ascii_case`,
`every_member_matches_in_any_ascii_case` — all pass.

(4) soundness re-verification: my own temporary differential
(`canon/tests/intcanon2_diff.rs`, deleted after its run) with old
lower-then-search logic inline: 848 inputs (all 150 colors × lower/UPPER/Title/
aLtErNaTe, all 7 keywords × 4 cases, all 40 function names × 4 cases,
near-misses, token paths, empties, padding, 300-char input, 20 non-ASCII
adversaries incl. Turkish İ, ß, combining marks, zero-width space, emoji) —
**0 divergences** across `is_named_color`, the `classify_css_value` Keyword
channel, and `classify_function` (×2 body shapes), plus a probe×corpus
cross-check that the documented fold ordering equals `to_ascii_lowercase`
byte comparison on every probe of every table. (One initial harness artifact:
my old-keyword replica forgot `classify_css_value`'s trim; fixed in the temp
test, both sides trim identically in real code.)

(5) LOG.md prior art: wave-1 islen (`is_length` no-alloc, `lengths.rs` +19/−3,
landed in `0a7330c76`, −16.0/−1.26%) is cited in the crew report as the same
chain's prior art; this claim is on top of the new base `5844b24a8`, touches
different files (`classify.rs`/`functions.rs`/`named_colors.rs`, not
`lengths.rs`), and LOG.md explicitly scoped the wave-2 canon remainder to
swarm-canon2 — a follow-up, not a re-landing. Single canon crew: no race.

## Quality + correctness

- `pnpm agentrs c canon`: 58 passed, 0 failed (55 pre-existing + 3 new).
- `pnpm agentrs c atomic` (consumer): 567 + 1 passed, 0 failed.
- `pnpm agentrs q` on `modules/canon/src/css/values`: green, zero violations
  (5 files, no complexity/args/header/clippy findings).
- Final tree is exactly the 4-file diff; temp differential deleted;
  bench-dirtied tracked `reports/latest/*` restored via `git checkout`;
  `dist/*` wrappers gitignored; pre-existing stashes untouched (stash
  round-trip verified byte-identical via `cmp`).

## Confirm protocol (the number)

Rebuilt base + cand `.node` in this tree (cand `331e5a08…`, base `ffa826e3…`,
distinct; `shasum -c` OK before and after all timed runs; harness never
rebuilt mid-set). Native-path override proven engaging (bogus path fails hard
with `Searched paths:` listing, no silent fallback). 2 unscored warmups per
arm (base 1134.26/1128.27, cand 1301.46/1115.35 — first cand warmup noisy,
unscored), then 8 interleaved pairs alternating lead order, `.node` swapped
per arm, sample `scales[0].samples[0].syncMs`:

| pair | order | base syncMs | cand syncMs | Δ ms | Δ % |
| ---- | ----- | ----------- | ----------- | ---- | --- |
| 1 | B,C | 1129.94 | 1104.34 | −25.60 | −2.3% |
| 2 | C,B | 1131.98 | 1121.25 | −10.74 | −0.9% |
| 3 | B,C | 1124.21 | 1116.96 | −7.25 | −0.6% |
| 4 | C,B | 1125.40 | 1111.44 | −13.96 | −1.2% |
| 5 | B,C | 1131.70 | 1113.66 | −18.04 | −1.6% |
| 6 | C,B | 1124.39 | 1112.60 | −11.79 | −1.0% |
| 7 | B,C | 1129.78 | 1111.89 | −17.89 | −1.6% |
| 8 | C,B | 1116.11 | 1102.73 | −13.39 | −1.2% |

- Base median 1127.59, cand median 1112.25 → **−15.34 ms (−1.36%)**, 8/8
  pairs favor candidate.
- Ex-run-1: base 1125.40, cand 1112.60 → **−12.80 ms (−1.14%)** — stands.
- No crew-style noise shape: no outlier (base range 15.9, cand range 18.5),
  no inversion, no flat pair; B-first vs C-first splits both negative, no
  lead/lag pattern. Smaller than the crew's −23.4/−2.04% (their base arm
  carried the −140 pair-1 outlier), but cleaner: every pair agrees.

Output hashes (enterprise, seed 7): styles.css
`7ec827fb0c0cf6856f12fe9557f977505ec745b57ef8d8a62ed46df05e10dcea`
(2867925 B) and runtime-data.mjs
`718d19e470176b97350c576ef79566f659d6db85253b66b0bb7a2b19b7378918`
(214466 B, total 3082391) — identical across base arm, cand arm, and the
sealed seed-7 outputs. Determinism: candidate enterprise run twice →
identical css+rtm hashes.

## Verdict

**LAND — confirmed −15.3 ms / −1.36% enterprise median (−12.8 ms / −1.14%
run-1-excluded); rules 1–3 green, 8/8 pairs, byte-identity + determinism green.**
