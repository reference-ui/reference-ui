# swarm-extract REPORT: per-file JSX-host merge → borrowed union (M1)

## Mechanism (one)

`extract_parsed_program` (`lib.rs`) merged the file-local and
compile-global JSX host sets into a fresh `HashSet<String>` **per
extracted file**: clone the local set, then clone every global host
into it. The merged set answers exactly two queries — `contains` (tag
gating in `allows_jsx_tag`) and `is_empty` (missing-graph report in
`report_dropped_tag`) — and on the seed-7 load it is never queried at
all: zero `<` bytes in 3123 extracted files, so zero JSX openings.

Fix: a borrowed union view `JsxHosts { local, global }` answering the
same two queries over the two borrowed sets. Per-file host setup now
allocates nothing. Union membership and union emptiness are exactly the
merged set's semantics (no iteration order is ever observed — only
`contains`/`is_empty` read the set), so output cannot change. On
JSX-bearing loads the only added work is one extra hash lookup per
element on local-miss.

## Diff

Base: `5844b24a81a528ace14fab63e908793a6829a874` (verified `git rev-parse HEAD` at start).

```
.../modules/atomic/src/extract/bindings.rs      |  8 +++--
.../modules/atomic/src/extract/gating_tests.rs  | 35 +++++++++++++++++++
.../modules/atomic/src/extract/mod.rs           | 40 +++++++++++++++++++---
packages/reference-rs/modules/atomic/src/lib.rs |  8 +++--
4 files changed, 80 insertions(+), 11 deletions(-)
```

- `bindings.rs`: `jsx_hosts()` clone → `jsx_hosts_ref()` borrow.
- `extract/mod.rs`: new `JsxHosts` union view (`contains`, `is_empty`);
  `ExtractConfig`/`ExtractContext`/`ExtractVisitor` carry the view;
  standalone `extract()` pairs local with an (allocation-free) empty global.
- `lib.rs`: per-file merge replaced by view construction (3 lines).
- `gating_tests.rs`: `test_jsx_host_union_matches_merged_set` pins the union
  truth table (member-either-side, empty-iff-both-empty).

Notes: `dist/*.mjs` wrappers were missing in the fresh worktree; ran
`build:js` once (gitignored, not in diff). Bench-report noise
(`benchmark/reports/latest/*`) reverted out of the diff.

## Artifacts

- base `.node`: `ce2a2dfbbb51d7dbc7cd8cde1bfdff5ae4beb6bcaafb93d387ec7443c3139cda`
- cand `.node`: `27a915ec7bab20c24e36b5f311d3acf645a2a76f0288badc673b8ca916631280`
- Both binaries `cp`-saved aside (`/tmp/swarm-extract/{base,cand}.node`);
  arms swapped by file copy, never rebuilt mid-set. `.node` sha256
  verified before AND after every one of 26 pinned-binary runs (20
  enterprise + 6 cross-scale): 26/26 match the arm's pinned hash.

## Correctness

- (a) `pnpm agentrs c atomic`: **568 passed, 0 failed** (incl. the new
  union test). `pnpm agentrs q` on all 4 touched files: **0 code
  violations** (3 pre-existing soft-limit warnings: `mod.rs`/`lib.rs`
  file length, `run_parse_phase` length — all over limit at HEAD).
  No wrappers touched, so no `agentrs v` needed. The union's truth
  table is additionally covered end to end by existing tests: local arm
  (`test_untraced_tag_is_skipped_when_a_host_is_known`), global arm
  (`test_explicit_hosts_admit_unimported_tags`), both-empty gate
  (`test_hostless_styles_emit_missing_graph_error`), None-vs-empty
  equivalence (`test_empty_hosts_match_legacy_fields`).
- (b) Byte-identical outputs base vs cand on all four scales (§4-scale
  table below; `cmp`-verified per scale plus full sha256).
- (c) Determinism: all 19 hashed enterprise runs (8 base pairs +
  8 cand pairs + 3 warmups) produced identical output hashes; the
  shakedown run matched on byte counts.

## Extract census (seed-7 enterprise)

Static census from the generator templates + kept-repo grep, crossed
with filed flame3/callers weights. Volumes:

| stage | volume (seed-7) | filed wt | diet verdict |
| --- | --- | --- | --- |
| scope/collect (3 walks/file + table) | 3123 files, ~19k bindings | CallInitPass 4, clear 1 | 0 — names semantic, walks unfusable (clear/strip need the complete table; attach/call_init need the stripped table); compute-dominated |
| bindings + identity | 3123 × ~2 imports + traces | ~0 (cold) | 0 — no weight |
| **host merge (M1)** | **3123 files × 101 hosts, 0 queries** | hash_one/insert share | **IMPLEMENTED — 315,423 dead clones + 3123 set builds + ~19k regrows eliminated** |
| visit dispatch (per call) | 7527 css + ~440 recipe + ~900 selection + ~3000 join | 46 via visit_call_expression | surveyed — origin/binding Strings ~16k allocs ≈ ~2ms heroic; second mechanism, not stacked (clean attribution) |
| object walks + push_want | ~35k wants | push_want memmove 5, walk_style_object malloc 6 | 0 — wants reserve is realloc's claimed `w:stage`/`w:want` site (YIELD by race); per-want Strings semantic (Want shape is assembly/harvest ground) |
| LineIndex | 3123 builds | — | 0 — semantic (want line/col) |
| recipes + selection resolve | ~900 selections | ~0 (cold) | 0 — no weight |
| canon per-prop | per declaration | find_property 21, alias 33 (shared) | FENCED (d) — canon2's ground, untouched |
| harvest classify/sinks | per refused position | classify 11 | FENCED (a) — harvest's ground, untouched |
| diagnostics warn/info | per diagnostic | diag 76 incl | diag crew's ground, untouched |
| resolve_file_imports | per file | 44 (42 extend) | extend's ground (neighbor), untouched |

Generator facts behind the census (all static, verified on the kept
repo): component files hold 1–4 `css()` calls of static literals, no
JSX; recipe files hold ~3.67 `recipe()` calls, no JSX; dead files hold
no `import`/`css`/`recipe`/`<`/quote bytes, so all 12,000 stream-skip
extract entirely. Extracted files = 3123 exactly (3000 components +
120 recipes + `ui.config.ts` + `theme/tokens.ts` + `theme/global.ts`;
kept-repo grep confirms 3123 files carry a style signal and 0 carry a
`<` byte). Global hosts = 101 exactly (`M1COUNT` counter run:
traced 0 + configured 101 primitives). Local host sets are empty on
every file (only `css`/`recipe`/non-Reference imports), so the
eliminated work is purely the global side: 3123 × 101 = **315,423**
dead `String` clones + 3123 `HashSet` builds (~6 regrows each,
≈ 653k rehashes) + matching frees — queried zero times.

## Mechanism counts

| count | value | source |
| --- | --- | --- |
| extracted files | 3123 | kept-repo grep (style-signal files) |
| global hosts per file | 101 | M1COUNT counter run (traced 0 + configured 101) |
| dead String clones eliminated | 315,423 | 3123 × 101 |
| dead HashSet builds eliminated | 3123 | one per file |
| table regrows eliminated | ~19k | ~6 per 101-extend |
| merged-set queries on this load | 0 | 0 `<` bytes → 0 JSX openings |
| added work on this load | 0 | no queries take the second lookup |

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. 2 unscored warmups per arm (base:
1478.37 shakedown + 1175.92; cand: 1223.90 + 1174.65). Pair start arms
alternated (B,C / C,B). Lock held once for the whole block
(builds + suites + 26 timed runs + 1 untimed count run), released
immediately after.

| pair | base syncMs | cand syncMs | pair Δ (b−c) | order |
| --- | --- | --- | --- | --- |
| 1 | 1206.30 | 1176.26 | +30.03 | B,C |
| 2 | 1191.15 | 1179.41 | +11.73 | C,B |
| 3 | 1189.86 | 1173.34 | +16.52 | B,C |
| 4 | 1180.15 | 1264.30 | −84.15 | C,B |
| 5 | 1175.48 | 1172.51 | +2.96 | B,C |
| 6 | 1124.16 | 1165.43 | −41.26 | C,B |
| 7 | 1186.42 | 1115.77 | +70.65 | B,C |
| 8 | 1193.52 | 1184.77 | +8.75 | C,B |

- Base median 1188.14 | Cand median 1174.80
- **Delta (medians): −13.34 ms (−1.12%)** — 6/8 pairs favor candidate.
- Excluding run 1: base median 1186.42, cand median 1173.34 →
  **−13.08 ms (−1.10%)** — verdict stands.
- Paired median +10.24 (noted, not claimed); paired mean +1.90
  (outlier-driven: p4c 1264.3 high, p6b 1124.2 low, p7c 1115.8 low —
  symmetric machine noise across both arms).
- RSS guardrail: base mean 327.5 MiB vs cand mean 330.3 MiB — inside
  the ±15 MiB allocator spread; the mechanism removes transients only
  and cannot regress RSS. Bundle bytes identical every run.

## Output hashes (byte-identical base vs cand, all four scales)

Full sha256, both arms, `cmp`-verified per scale:

| scale | styles.css | runtime-data.mjs |
| --- | --- | --- |
| enterprise | `7ec827fb…e10dcea` (2,867,925 B) | `718d19e4…78918` (214,466 B) |
| small | `ecdec1e8…bda2973` (92,651 B) | `ad9194f4…994d41` (91,030 B) |
| medium | `37f2ef5b…4819fe` (348,780 B) | `54735e4d…cfe7ce` (110,241 B) |
| churn | `1aad4978…10ec05` (8,289,806 B) | `e1349305…f18cdb` (103,709 B) |

Enterprise hashes match the wave-1 filed values exactly. (Full 64-char
hashes verified; prefixes shown.)

Cross-scale single-sample syncMs (directional only, not claimed):
small 148.4→89.3, medium 221.8→165.5, churn 2531.9→2573.9.

## Collision

- swarm-extend (resolver): `resolve_file_imports` and its memo
  semantics untouched — different file, different function; their
  42 wt `HashMap::extend` site is intact for their diet.
- swarm-realloc (alloc census/site guards): wants-vec reserve
  explicitly NOT touched (their `w:want`/`w:stage` site); no site
  overlap — my merge site was unclaimed in `/tmp/swarm-claims.md`
  (site line filed 23:56, no duplicates).
- swarm-diag, swarm-harvest, swarm-canon2, swarm-parse: no diagnostic,
  harvest, canon, or parse/AST file touched; parse's banked program
  reuse feeds my inputs unchanged (coherent downstream diet).
- swarm-collect, swarm-marshal, swarm-cascade, swarm-keys2,
  swarm-modgraph: disjoint files/functions.

## Verdict

**BANK (−13.3 ms / −1.12% medians; ex-run-1 −13.1/−1.10%; 6/8 favor;
identity 4/4; determinism 19/19)**

Sub-bar on both prongs (bar ≥15 ms + ≥1.5%), but a proven-identical
diet with exact mechanism counts: 315,423 dead clones + 3123 set
builds + ~19k regrows eliminated with zero added work, zero queries
lost, byte-identical output on all four scales, suites green, and
`q` clean. Per the standing rule, sub-bar proven-identical diet BANKs;
the captain combines.
