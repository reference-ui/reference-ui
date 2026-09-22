# swarm-collect REPORT: sources collect-path serial diet (D1+D2+D4)

## Mechanism (one)

`Sources::collect` on the seed-7 enterprise load evaluates ~30k include-scope
matches and ~185k path comparisons per compile, almost all of it transient
staging: per-file root re-normalization, per-call candidate `String`s, one
`Vec<char>` per glob match, component-wise path sorts, and ~15k union-walk
path strings that are all dropped (the JS list is already complete). Three
diets, one mechanism (per-item CPU of work that already happens), zero
retention/match semantic change:

- **D1 — dir-sort compare diet** (`sources::sorted_entries`): sort by
  `file_name` (byte compare) instead of full `path` (component walk), and
  `sort_by` → `sort_unstable_by` (merge scratch gone). Entries from one
  `read_dir` share the parent, so file-name order EQUALS full-path order
  (decision always falls to the final `Normal` component); names are unique,
  so unstable emits the same sequence the stable sort did.
- **D2 — zero-alloc scope matching** (`includes::{FileMatcher,glob}`):
  `FileMatcher` binds the scope to one pre-normalized root (normalize once
  per compile, not 30k times); clean paths borrow through matching (owned
  fallback runs legacy normalization byte-for-byte); `glob::matches` walks
  byte-indexed chars with zero allocation (char-exact: `?`/classes decode
  full UTF-8 units; positions stay on char boundaries). Candidate order
  (relative-then-raw), positive/negative polarity, and short-circuiting are
  unchanged; `matches_file` keeps its signature as a one-shot wrapper.
- **D4 — fused union walk** (`sources::union_sources`): the known-check moves
  inside the backfill walk, so already-listed paths cost a hash probe and
  never a transient path string. Same traversal, gates, checks, reads, and
  walk-order appends as the two-phase walk; `collect_candidate_paths` is gone.

Deliberately untouched: `known` stays `HashSet<String>` (hasher choice is
swarm-hashers' ground — see §Collision), content clones stay (owned return
from a borrowed request; ~1–1.5 ms, marshal-adjacent), the final
path sort stays (deterministic extraction order), the union walk itself stays
(backfill semantics; Shot 2 #17).

## Diff

Base: `5844b24a81a528ace14fab63e908793a6829a874`
(`git rev-parse HEAD` verified at start; `packages/` tree = wave-1 landing
`0a7330c76`, docs-only delta on top).

```
.../modules/atomic/src/includes/glob.rs            |  75 +++++++++-----
.../modules/atomic/src/includes/mod.rs             | 105 ++++++++++-----
.../reference-rs/modules/atomic/src/sources.rs     | 112 +++++++-------
3 files changed, 180 insertions(+), 112 deletions(-)
```

Notes:

- `dist/` wrappers + native addon were missing in the fresh worktree; ran
  `pnpm install` + the full build once for bench harness resolution
  (gitignored, not in diff). Bench-regenerated `reports/latest/*` reverted;
  tree is exactly 3 files + this REPORT.
- No commits, no pushes — the captain lands.

## Artifacts

- base `.node`: `e62c5ec83d089c313b0c7bb8d1381793d4e2587aa089e206c9cdedb45bc8862c`
- cand `.node`: `55c02dfd08a05d13aa4005162b92a2773fd8d54c883a2c51086a5784164fc79b`
- Harness never rebuilt mid-set: both arm sha256 verified identical
  before the first and after the last of all 26 timed runs
  (4 warmup + 16 pair + 6 scale runs); only the file in
  `dist/native/` was swapped per arm.

## Correctness (rule 1)

- (a) `pnpm agentrs c atomic`: 569+1 passed, 0 failed (incl. new
  `multibyte_chars_match_as_single_units` +
  `backslash_and_ragged_roots_match_forward_slashes`; all 4
  `sources::` retention tests + all 18 `includes::` tests green).
  `pnpm agentrs q` on all three touched files: 0 code violations
  (1 pre-existing soft warning: `sources.rs` 399 lines vs the 365
  soft limit — the file was 404 before this change, net −5).
  No wrappers touched.
- (b) Byte-identical outputs base vs cand on all four scales
  (full sha256 on kept outputs):

| scale      | styles.css (sha256, both arms) | runtime-data.mjs (sha256, both arms) |
| ---------- | ------------------------------ | ------------------------------------ |
| enterprise | `7ec827fb…10dcea`              | `718d19e4…8918`                      |
| small      | `ecdec1e8…a2973`               | `ad9194f4…4d41`                      |
| medium     | `37f2ef5b…19fe`                | `54735e4d…fe7ce`                     |
| churn      | `1aad4978…ec05`                | `e1349305…8cdb`                      |

  Prefixes match the wave-1 canon report's filed hashes exactly —
  same load, same outputs, independent cross-check.
- (c) Determinism: all 10 candidate enterprise runs (8 pair + 2
  warmup) and all 10 base runs produced identical output hashes
  (full-sha256 verified on pair 1 of each arm, 16-char verified
  on all 16 pair runs).

## Semantics preservation (retention/match differential)

- The retained set cannot shift: D1 preserves walk order
  (file-name order = full-path order within one `read_dir`,
  proven in code comment; unstable sort over unique names emits
  the same sequence), D2 preserves every match verdict
  (same candidates in the same order, same polarity, char-exact
  glob), D4 preserves the union set (same traversal, checks,
  reads, walk-order appends).
- Differential corpus (existing suite, all green on the new code):
  tricky set (live + dotfile + `.d.ts` kept; `dist/`,
  `node_modules/`, non-source ext dropped),
  provided-union-matches-disk-scan (full + subset backfill),
  symlinks (linked dir/file kept with target bytes, dangling
  dropped, both walks), files-without-root legacy filter,
  braces/negation/negation-only/root-relative scopes, open
  scope, plus new unicode glob pins and backslash/ragged-root
  pins.
- No open is skipped, added, or reordered by this change: the
  same files are read in the same walk order (D4 fuses the
  check into the walk; reads happen at the same visit). This is
  pure per-item diet, not Shot 2 territory — no pre-open signal,
  no deadness concept, no threading.

## Mechanism counts (collect census, seed-7 enterprise)

Static census from the seeder + code paths (no sampling):

| item | count |
| --- | --- |
| Provided files in (JS list) | 15,122 |
| Disk files walked (15,122 + root `ui.config.ts`) | 15,123 |
| Dirs walked (`root/theme/src` + 30 `ui` + `recipes` + `util`) | 35 |
| `matches_file` calls (filter 15,122 + walk 15,123) | 30,245 |
| `glob::matches` calls (~1/file + theme 3 + config 6) | ~30,258 |
| Legacy allocs per match (7 candidate/root + 1–3 `Vec<char>`) | ~8–10 |
| Legacy match-subtree allocs removed (D2) | ~270k + ~60–90k growth reallocs |
| Union-walk transient path strings removed (D4) | ~15,122 (all dropped on this load) |
| Retained out (all in scope) | 15,122 |
| Path compares in dir sorts (`util` 12k ≈ 163k of ~185k) | ~185k |
| `known` probes (unchanged semantics) | ~15k inserts + ~15k lookups |

Filed CPU attribution (shipped `.node`, `enterprise-flame3`):
`matches_file` 8 wt malloc (+ <3 wt self, 1 wt memmove);
`compare_components` 13 wt incl + `Components::next` 6 wt self
(D1's site; shared with styletrace `BTreeMap<PathBuf>`, the
minority share); collect phase 51.0 ms trace-leg / ~38 ms
span-basis (`enterprise-alloc3`, 424k blocks). Fantasy ceiling
(sort ~13–19 + matches ~8–12 + D4/clones ~2–4) clears both
prongs — counted, could not CUT, built and measured.

## Enterprise A/B: 8 interleaved pairs, `.node` swapped per arm

`pnpm bench:neo -- --scale enterprise --runs 1 --keep --json`, sample =
`scales[0].samples[0].syncMs`. 2 unscored warmups per arm
(base 1509.5/1183.1, cand 1176.3/1160.5 — hashes identical).
Pair order alternated (B/C, C/B, …). Lock held once for the
whole block (builds + suites + 26 timed runs), released
immediately after.

| pair | base syncMs | cand syncMs | Δ ms   | Δ %    |
| ---- | ----------- | ----------- | ------ | ------ |
| 1    | 1189.86     | 1173.38     | −16.48 | −1.38% |
| 2    | 1185.25     | 1173.54     | −11.71 | −0.99% |
| 3    | 1177.88     | 1155.23     | −22.65 | −1.92% |
| 4    | 1163.26     | 1173.97     | +10.71 | +0.92% |
| 5    | 1232.91     | 1162.09     | −70.82 | −5.74% |
| 6    | 1192.91     | 1205.72     | +12.81 | +1.07% |
| 7    | 1179.11     | 1162.02     | −17.09 | −1.45% |
| 8    | 1163.58     | 1159.27     | −4.31  | −0.37% |

- base median: **1182.18 ms**; cand median: **1167.73 ms**
- median Δ: **−14.45 ms (−1.22%)**, 6/8 pairs favor candidate.
- Excluding pair 1: median Δ −17.02 ms (−1.44%) — direction
  stands, % prong still short.
- Outliers both directions (p5b 1232.9 base-side, p6c 1205.7
  cand-side); the medians are robust to either.

Other scales, single samples each (directional only, high noise):

| scale  | base syncMs | cand syncMs | Δ            |
| ------ | ----------- | ----------- | ------------ |
| small  | 148.34      | 95.47       | −52.9 (−36%) |
| medium | 166.01      | 219.45      | +53.4 (+32%) |
| churn  | 2450.07     | 2488.48     | +38.4 (+1.6%)|

Caveat: small/medium single-sample deltas are startup/scan noise
(opposite signs); reported for completeness, not claimed. Churn
is within its noise band. Enterprise medians are the verdict
metric; all scales are byte-identical, which is the claim.

## Verdict

**BANK (delta −14.5 ms / −1.22% full, −17.0/−1.44% ex-run-1,
rules 1–2 green, rule-3 bar missed on both prongs full /
on % ex-run-1)**

Sub-bar proven-identical diet: 569+1 green, 0 violations,
4-scale byte-identity, determinism green, 6/8 pairs favor.
BANK is the rule here, not CUT. No bisect ran (others queued;
each sub-arm costs a build + 8 pairs) — the integrator may
sub-bisect D1/D2/D4 if the combined set wants it; all three
diets carry independent filed-weight attribution.

## Collision

- **swarm-realloc** (RACE on `glob::matches` `Vec<char>` +
  normalize allocs): their site census (`s:glob` 60,516,
  `s:normpath` 37,728, `c:walk`/`c:filter` reallocs) counts the
  same allocs D2 removes entirely (no-alloc subsumes
  exact-capacity here). First sound LAND wins the site; if
  realloc lands first with capacity guards, D2 must rebase to
  whatever alloc shape remains (likely still a win: borrow >
  presize) or YIELD the overlap and keep D1+D4.
- **swarm-hashers**: `known` left as `HashSet<String>` + same
  probe sequence deliberately — their Fx conversion applies
  cleanly on top of (or under) this diff; no textual conflict
  unless they restructure `union_sources` itself.
- **swarm-marshal / swarm-extend**: untouched seams (N-API
  marshal downstream of staging; resolve `extend` downstream of
  collect). Content-clone removal (~1–1.5 ms, needs an owned
  request handoff) left as a follow-up lead, marshal-adjacent.
- Prior art: wave-1 `reserve` deliberately left "one-shot
  lib.rs collects" alone — D4's fused walk now covers the
  union `candidates` one-shot (removal, not reserve).