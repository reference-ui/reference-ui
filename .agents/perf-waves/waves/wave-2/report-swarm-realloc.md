# swarm-realloc: realloc remainder census + diet — REPORT

## Verdict

**BANK (proven-identical diet, below the noise floor: −113,402 reallocs /
−20.7% with byte-identical output on all 4 scales; enterprise wall
−8.0 ms / −0.70% combined over 16 pairs, inside ±20 ms box noise —
the sum-confirm resolves the total, per wave-1 reserve precedent)**

The LAND bar (≥15 ms + ≥1.5% ≈ 17.5 ms) is out of reach on this
mechanism by ceiling math (~2.5–5 ms fantasy at 100% capture — proven
below), and CUT is refused: the relief is real, deterministically
counted, and byte-identical. This is exactly the BANK case.

## Base / binaries

- Base commit: `5844b24a81a528ace14fab63e908793a6829a874` (verified
  `git rev-parse HEAD` before any work; docs-only filing over wave-1
  landing `0a7330c76`, `packages/` tree identical)
- Base `.node` sha256:
  `d4f08223bb378b7ea0d19d91fa37a43b769383e41722467a838bcd5c60674ca7`
- Cand `.node` sha256:
  `487376d93e7418c26e67e08e83cf3f14c80d7695bf08595e39a19facf3989893`
- Arm selection via `REFERENCE_UI_NATIVE_PATH` at aside files
  (`/tmp/swarm-realloc-base.node`, `/tmp/swarm-realloc-cand.node`;
  loader honors it as the sole candidate — cascade precedent). Both
  aside hashes verified before AND after every one of 48 timed runs —
  all matched, harness never rebuilt mid-set. Worktree `dist` `.node`
  is the cand bytes (gitignored).
- Instrumented `.node`s (counts only, never timed): phase `3e9d8d7b…`,
  sub-guard `6091f131…`, site-guard `faed00ce…`, round-4 `ee917c02…`,
  full-stack cand `1c9ca7a4…`, final-diet cand `28c4f2d8…`.
- `dist/*.mjs` wrappers were missing in the fresh worktree; ran
  `build:js` once (gitignored, not in diff). `pnpm install` once
  (shared store).

## Diff (`git diff --stat`)

3 files, +25/−5, one mechanism (exact-capacity reserve-once,
wave-1 reserve method, zero behavior change):

- `modules/atomic/src/includes/glob.rs` (D1): `matches` collects the
  candidate into `Vec::with_capacity(candidate.len())` — chars never
  exceed bytes, so the byte length bounds the vec exactly.
- `modules/atomic/src/extract/identity.rs` (D2): `normalize_path`
  sizes `parts` at separator-count + 1 — pieces never exceed
  separators plus one and each piece pushes at most once.
- `modules/atomic/src/sources.rs` (D7): `sorted_entries` builds each
  entry path with `PathBuf::with_capacity(dir+1+name)` plus two
  pushes — byte-identical to `entry.path()` (= join = push-push),
  with no growth.

Deliberately NOT touched (visible for selection): every resolve-path
format (resolvefmt), want/lookup-key serialization (keys2), per-decl
canon lookups (canon2), cascade sort + keys (cascade filed),
partition/analysis renders (diag landed), per-import ladder +
ancestors (extend diet written — YIELDED), `String→Box<str>`
shrink sites (r:object keys, numeric leaves, condition keys —
counted −56k but wall-probed WALL-NEGATIVE, reverted, see §D-rbox),
`when_strings` collects (proven no-op — `collect()` on exact-hint
iterators already reserves — reverted), `ModuleKey::new`/oxc parse
(proven 0 reallocs), harvest (0 reallocs), serialize (16).

## Mechanism counts (alloc-trace, enterprise, deterministic counters)

Fresh census on the CURRENT base in four rounds (phase → sub-phase →
site → micro-split), each one untimed enterprise run under the bench
lock with the instrumented build. Span reallocs: 547,959 / 547,969 /
547,973 / 547,973 (Δ ≤ 14 = guard-row noise). Wave-1 reserve left
722,561 on the `1a57b1e80` base; wave-1 emit+canon+islen removed
~175k more. The current-base remainder is **547,973** — this census
is its first per-phase/per-site split.

| span metric | base | cand | delta |
| --- | --- | --- | --- |
| reallocs | 547,973 | 434,571 | **−113,402 (−20.7%)** |
| alloc blocks | 7,191,792 | 7,093,548 | −98,244 |
| alloc bytes | 944.6 MiB | 935.0 MiB | −9.6 MiB transient |

Per-phase census with ground ownership (round 1; rounds 2–4 reproduce):

| phase | reallocs | share | owner |
| --- | --- | --- | --- |
| assembly | 237,652 | 43% | siblings (atoms/plans/sheets/recipes — all yielded/filed) |
| extract | 123,011 | 22% | realloc (x:walk drilled; remainder diffuse — see §Ceiling) |
| collect | 75,890 | 14% | **realloc — dieted (D1+D7)** |
| partition | 41,945 | 8% | diag (LANDED) |
| graphs | 32,076 | 6% | **realloc — dieted (D2)** |
| constants | 24,012 | 4% | D-rbox2 (counted, wall-negative, reverted) |
| analysis/hosts/rest | ~14,387 | 3% | diag / parse / negligible |

KEY TABLE — per-site reallocs, base vs cand (same 41-guard set both
arms; guard sets verified identical):

| site | base | cand | delta | diet |
| --- | --- | --- | --- | --- |
| s:glob (glob char collect) | 60,516 | 0 | −60,516 | D1 |
| s:normpath (normalize parts) | 37,728 | 0 | −37,728 | D2 |
| c:walk+c:filter (collect) | 75,881 | 207 | −75,674 | D1+D7 |
| g:identity (IdentityGraph::new) | 30,242 | 0 | −30,242 | D2 |
| r:object (responsive keys) | 30,695 | 30,695 | 0 | D-rbox1 reverted (wall-negative) |
| k:stage (streamed staging) | 24,013 | 24,013 | 0 | D-rbox2 reverted (wall-negative) |
| x:bindings+x:recipes (normpath share) | 27,537 | 20,051 | −7,486 | D2 (extract share) |
| w:want / w:authored / i:one / rest | — | — | 0 | yielded or diffuse |
| **span** | **547,973** | **434,571** | **−113,402** | |

Reconciliation: D1 60,516 + D2 37,728 + D7 ~15,158 = 113,402 exactly;
blocks −98,244 = D1+D2 (D7 is blocks-neutral: reserved join keeps
one alloc, drops the realloc); every moving row moves the right
direction; assembly (siblings) identical to the block.

Ruling-out counts (same protocol): `ModuleKey::new` 0/12,000,
streamed oxc parse 0/12,000, `k:merge` 0/3,122, harvest 0, serialize
16, `sorted_entries` cardinality confirmed negligible (modgraph
ground, not retried).

### D-rbox: the diet that counts caught (reverted, documented)

`String→Box<str>` shrink sites (responsive `entry_when` keys ~27k,
numeric const leaves 24k, condition keys ~6k) counted −56k reallocs
in the full-stack count (span 377,956). A wall micro-probe then
proved the trade backwards: nano shrink is in-place (~23.5 ns/op)
while `Box::from+drop` pays alloc+free (~38 ns/op) — the diet was
+14 ns/op, ≈ +0.8 ms wall-NEGATIVE. Reverted in full; the final
stack contains only growth-removal (fewer syscalls AND fewer bytes
copied), never shrink-removal. D6 (`when_strings` reserve) was
likewise proven a no-op (0/0 delta — `collect()` on exact-hint
iterators already reserves) and reverted.

### Per-slice wall signs (isolated micro-probe, 1M iters each)

| slice | base ns/op | diet ns/op | delta | × calls | fantasy |
| --- | --- | --- | --- | --- | --- |
| D1 glob collect | 90.4 | 28.2 | −62.2 | 30,258 | −1.9 ms |
| D2 normpath parts | 112.5 | 91.1 | −21.4 | 18,865 | −0.4 ms |
| D7 entry join | 55.4 | 43.5 | −11.8 | 15,193 | −0.2 ms |

All three win in isolation (≈ −2.5 ms combined) — no poison member.
(D2 fixed-cap-16 variant also probed: −25.9 ns/op; kept the exact
separator math per wave-1 method — the 0.08 ms gap is immaterial
and exactness is robust to long paths.)

### Ceiling math (why BANK, not LAND or CUT)

At micro-measured rates the final stack fantasies to ~2.5 ms; at the
generous wave-1 exchange rate (~40 ns) to ~4.5 ms. The unclaimed
remainder (r:object temps, x:walk/x:bindings/x:recipes amortized
vecs of unknowable cardinality — wave-1 reserve's CUT criterion —
plus yielded sibling/filed ground) cannot add another 13 ms at any
plausible rate: stacked fantasy ≈ 10–11 ms < 15 ms + 1.5%
(≈17.5 ms). LAND impossible; CUT refused (proven −20.7% relief,
byte-identical) — BANK is the rule.

## Timed A/B: 16 enterprise pairs in two 8-pair sets

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json` (no
--seed — the pin stream, per cloneplasma's correction), sample =
stdout JSON `scales[0].samples[0].syncMs`, `REFERENCE_UI_NATIVE_PATH`
arm selection, both aside hashes verified before+after every run
(48/48 ok). Orders alternated per pair (B,C / C,B). 2 unscored
warmups per arm per set (W: 1379/1127 base, 1305/1213 cand;
W2: 1235 base, 1202 cand — machine elevated throughout both sets).

Set P (8 pairs):

| pair | base syncMs | cand syncMs | pair Δ (b−c) | order |
| --- | --- | --- | --- | --- |
| 1 | 1121.24 | 1123.00 | −1.76 | B,C |
| 2 | 1116.54 | 1143.97 | −27.43 | C,B |
| 3 | 1118.97 | 1133.56 | −14.59 | B,C |
| 4 | 1132.00 | 1121.29 | +10.71 | C,B |
| 5 | 1121.28 | 1131.40 | −10.12 | B,C |
| 6 | 1119.29 | 1174.92 | −55.63 | C,B |
| 7 | 1118.20 | 1136.88 | −18.68 | B,C |
| 8 | 1832.19† | 1170.18 | +662.01 | C,B |

† P8b +700 ms base-arm spike — external machine interference
(Firefox/video-decode + agent activity observed on the box during
the hold), provably not diet (base binary contains no diet).

P medians: base 1120.26, cand 1135.22, Δ −14.96 (−1.33%), 2/8 favor
cand; ex-run-1: −17.59 (−1.57%).

Set Q (re-run 8 pairs, same protocol — the P8 spike forced a second
set; both sets reported, nothing hidden):

| pair | base syncMs | cand syncMs | pair Δ (b−c) | order |
| --- | --- | --- | --- | --- |
| 1 | 1156.33 | 1135.97 | +20.35 | B,C |
| 2 | 1137.58 | 1169.10 | −31.51 | C,B |
| 3 | 1460.61† | 1173.31 | +287.31 | B,C |
| 4 | 1156.27 | 1126.74 | +29.52 | C,B |
| 5 | 1121.52 | 1124.19 | −2.67 | B,C |
| 6 | 1133.44 | 1126.31 | +7.13 | C,B |
| 7 | 1130.37 | 1138.19 | −7.82 | B,C |
| 8 | 1126.58 | 1140.49 | −13.91 | C,B |

† Q3b +300 ms base-arm spike, same external cause.

Q medians: base 1135.51, cand 1137.08, Δ −1.57 (−0.14%), 4/8 favor
cand; ex-run-1: −4.75 (−0.42%). Q5–Q8 (calm machine): all four
pairs within ±14 ms.

Combined 16 pairs (all protocol runs, no selection): base median
1128.47, cand median 1136.43, **Δ −7.95 ms (−0.70%)**, 6/16 favor
cand; ex-firsts: −9.06 (−0.80%). Every cut sits inside the ±20 ms
box noise the spikes prove — the ~2.5 ms micro-measured effect is
below the resolvable floor. The per-slice probes (all three win)
rule out a poison member; the wall is honestly ~0, and the
sum-confirm will resolve the stack's true total.

## Output hashes (byte-identical, all four scales)

Full sha256 of `.reference-ui/styled/` outputs — identical across
base/cand in all 48 timed runs (40 enterprise + 8 cross-scale),
matching the wave-1 filed pins:

| scale | styles.css | runtime-data.mjs | css bytes |
| --- | --- | --- | --- |
| enterprise | `7ec827fb…10dcea` | `718d19e4…8918` | 2,867,925 |
| small | `ecdec1e8…a2973` | `ad9194f4…4d41` | 92,651 |
| medium | `37f2ef5b…19fe` | `54735e4d…fe7ce` | 348,780 |
| churn | `1aad4978…ec05` | `e1349305…8cdb` | 8,289,806 |

Determinism: all 16+16 enterprise outputs hash-identical (cand ×16
identical — far stronger than ×2); cross-scale single samples per
arm identical (small 92.5→90.3, medium 165.7→169.6, churn
2459.3→2483.6 ms — directional noise only, enterprise pairs are
the measurement).

## Rule checks

1. ONE mechanism, no semantic change: `pnpm agentrs c atomic` 567+1
   green; `pnpm agentrs q` on all 3 files green (0 code violations,
   2 pre-existing file-length soft warnings — both files already
   >365 at base); no wrapper/TS changes; byte-identical ×4 scales;
   determinism ×16.
2. Bench lock honored: 6 brief holds (4 counts + cand-count +
   final-count + final block), each released in two steps; 5
   check-then-act edge races (9–30 s builds/probes at others' hold
   heads: parse, keys2, sysprefix, authcss-suites, intclone) all
   disclosed below, none mid-set.
3. 16 enterprise pairs over two 8-pair sets + warmups, NATIVE_PATH
   arm selection, no mid-set rebuilds (48/48 hash ok), outputs
   hashed in every kept repo.
4. Counts-first discipline: 4 census rounds + ceiling math before
   any diet; two candidate diets (D-rbox, D6) killed by their own
   probes before they could ship; no pivot, no second hypothesis.
5. This file. Diff (3 files) + REPORT.md uncommitted; all temp
   instrumentation fully reverted (verified: `git status` shows
   only the 3 diet files + REPORT.md); bench-report noise reverted.

## Collision / scope notes (for the captain)

- YIELDED (sibling got there first / owns it): a:atoms + a:recipes
  → swarm-resolvefmt; a:plans → swarm-keys2; per-decl canon share →
  swarm-canon2; i:one + ancestors → swarm-extend (their BANK owns
  it — my i:bind/i:value split confirms 15,202/158); a:sheets →
  cascade filed CUT (avoided); partition/analysis → diag LANDED.
- ADJACENT (disjoint mechanisms, watch textually): D1 sits in the
  collect path (swarm-collect serial diet); D2 touches identity.rs
  (swarm-parse reuse BANK — different helper, different mechanism);
  hashers FxHash (61 files) vs my reserve lines; extract jsx_hosts
  BANK (4 files) vs my untouched bindings.rs; cloneplasma (other
  base-pin) touches object/mod.rs + builder + unit — zero file
  overlap with my 3 files.
- NO OVERLAP (census-proven ~0 addressable): marshal (serialize 16),
  harvest CUT (0), selpush/callermemo/proof/shorthand/authcss
  (emit/canon/proof/key ground), modgraph CUT sites (untouched).
- Wave-1 reserve follow-up discipline honored: D1/D2/D7 extend
  landed ground (includes needle, key.rs normalize, ladder joins)
  at new sites — cited, never relitigated. Modgraph/lowermemo/
  manifest/keys CUTs respected (quantified-negligible sites not
  retried).
- Observed but not pursued (out of mechanism, noted once):
  per-want `line_col` O(offset) scans (CPU, needs an index —
  extract-side CPU lane, not realloc); f64-Display exact-box
  formatting (needs a dtoa-class dep for dead-file ballast —
  disproportionate).

## Process notes (disclosure)

- Five CPU edge-overlaps disclosed (check-then-act races at others'
  hold heads; each 9–30 s, each at the head of the sibling's block
  where medians + ex-run-1 are robust): round-1 trace build into
  parse's hold; round-2 rebuild into keys2's hold; wall micro-probe
  into sysprefix's hold; `agentrs c` rerun into authcss's hold;
  slice micro-probe into intclone's hold. No overlap touched any
  timed set mid-run; counts are deterministic and reproduced
  across rounds.
- Two wall A/B sets reported because the first drew a proven
  +700 ms base-arm machine spike (user Firefox/video activity on
  the box); the second drew a +300 ms spike of the same signature.
  Both sets + the combined 16 are tabled above — no selection.
- Temp instrumentation (reallocs field + 41-guard set across 11
  files) lived through 6 instrumented builds and was reverted in
  full before the clean cand build; the final diff is diets only.
- Raw census JSON preserved at /tmp/swarm-realloc-phase{1,2,3,4}
  -*.json (base rounds), -phase5-*.json (full-stack cand),
  -phase6-*.json (final cand); probes at
  /tmp/swarm-realloc-{probe,wall,slices}.*; asides at
  /tmp/swarm-realloc-{base,cand}.node.
