# swarm-emit: stylesheet emission diet — REPORT

## Verdict

`LAND (delta>=15ms + >=1.5% + rules 1-3 green)` — with one warmup caveat, see §5.

## Base / artifacts

- Base commit: `1a57b1e80daaa6b062a2a02e6ad4cc66e56d5402` (verified `git rev-parse HEAD` first command)
- Base .node sha256: `8447769e1a3e2c40f938f075e6b0e81b2d7f1a59491dfe31206a2df56d237f57`
- Candidate .node sha256: `ceaa084f8dd6d2ef47a2df5eb9d7215ecefa913faf16e84ff5286b271b29c2ed`
- Both binaries `cp`-saved aside (`/tmp/swarm-emit/base.node`, `/tmp/swarm-emit/cand.node`); arms swapped by file copy, never rebuilt mid-set.
- Current tree `.node` = candidate build.

```
git diff --stat
 .../modules/atomic/src/resolve/lexical.rs          | 13 +++--
 .../modules/atomic/src/stylesheet/cascade/mod.rs   | 53 +++++++++++------
 .../modules/atomic/src/stylesheet/emitter/mod.rs   | 23 ++++++--
 .../modules/atomic/src/stylesheet/name/escape.rs   | 44 +++++++++++++-
 .../modules/atomic/src/stylesheet/name/mod.rs      | 67 +++++++++++++++++++---
 5 files changed, 164 insertions(+), 36 deletions(-)
```

## 1. Mechanism (ONE): direct-push rule emission, zero intermediate Strings

Flame: `build_stylesheets_with` 62 incl → `write_utilities` 51 incl → `selector_with_system`
20 wt, sort 14 wt, `Vec::from_iter`/`CascadeKey::from_atom` 7 wt, `format!` 3+3 wt.
The sort/key half was deliberately left untouched (cascade-order risk; canon lookups are
sibling swarm-canon's topic). Everything below only reshapes allocation, never bytes.

Per-atom hot path before → after (common case: no selector conditions):

| Layer (per atom) | Before | After |
|---|---|---|
| `class_name` chain (sanitize + base `format!` + cond `Vec`/`join`/`format!` + system `format!`) | 4–6 allocs | 0 (new `EscapeCursor` escapes pieces straight into the buffer, leading-char rule preserved positionally) |
| selector escape + `".{escaped}"` `format!` | 2 allocs | 0 |
| `format_declaration` (value `to_string` + `format!`) | 2 allocs | 0 (`push_declaration`/`push_escaped_value`; control-char scan semantics identical) |
| final rule `format!("{indent}{sel} {{ {decl} }}")` | 1 alloc | 0 (direct pushes) |
| wrap open/close `format!` + `"  ".repeat` | per wrap/group | 0 (`push_indent`) |
| shared layers buffer | `String::new()` (~17 regrows to ~3 MB) | `with_capacity(n·128+1024)` |
| sheet `inner`/`portable_inner` before `push_str(&shared)` | regrow | `reserve(shared.len())`, exact |
| **Total per atom** | **~6–11 heap allocs** | **0** |

`format!` counts: cascade 5→0, emitter 3→2 (remaining two are single-alloc cold
recipe paths), name 5→4 (remaining four are the untouched runtime `class_name` path).
Runtime plan path (`class_name*`, `sanitize_value` bodies) intentionally unmodified —
byte- and alloc-identical there.

Selector-conditioned atoms (minority) keep exact old behavior: escape base once, then
`nest_selector_condition` chain unchanged.

## 2. Correctness (rule 1)

- (a) `pnpm agentrs c atomic`: **567 passed, 0 failed**. `pnpm agentrs q`: 0 violations
  (1 pre-existing soft-limit warning: `lexical.rs` was already 367 lines at HEAD).
  `pnpm agentrs v atomic` (not required — wrappers untouched): 296/297 pass with the
  SAME 2 failures on base and candidate binaries (verified by .node swap):
  `harvest-census` suite (missing `@reference-ui/rust/namer` TS dist at this commit)
  and `ATM-SITE-54` (pre-existing gauge failure). Both pre-existing, unrelated.
- (b) `styles.css` + `runtime-data.mjs` **byte-identical (`cmp`) base-vs-candidate on
  all four scales** — enterprise, small, medium, churn.
- (c) Determinism: all 12 enterprise kept repos `cmp`-identical to each other
  (6 base + 6 candidate runs); per-scale base==cand everywhere.

Enterprise output hashes (both arms, all runs):
- `styles.css`: `7ec827fb0c0cf6856f12fe9557f977505ec745b57ef8d8a62ed46df05e10dcea` (2,867,925 B)
- `runtime-data.mjs`: `718d19e470176b97350c576ef79566f659d6db85253b66b0bb7a2b19b7378918`

Other scales (base==cand, `css`/`rt` 16-char prefixes): small `ecdec1e80f8e71a8` /
`ad9194f41181aaee` (92,651 B); medium `37f2ef5b43f8b7cb` / `54735e4d5a51c567`
(348,780 B); churn `1aad4978ffdc1ba1` / `e134930586eb56a5` (8,289,806 B).
`cssCalls` constant per scale (7527 / 171 / 635 / 43956) — same seed, same bytes.

## 3. Measurement (rules 2–3)

- 6 interleaved A/B pairs, enterprise, `--runs 1 --keep --json`, pair start arms
  alternated (B/C, C/B, …) to balance drift; `.node` file swapped between arms.
- `.node` sha256 verified unchanged after every run: **18/18 `ok`** (harness never rebuilds).
- Bench lock held once for the full matrix, released immediately after; one earlier
  hold was released to build the missing `@reference-ui/rust` JS `dist` (bench worker
  prerequisite — builds are not allowed while holding the lock).

| Pair | Base syncMs | Cand syncMs | Δ |
|---|---|---|---|
| p1 (B,C) | 1464.3 | 1246.9 | 217.4 |
| p2 (C,B) | 1256.8 | 1234.7 | 22.1 |
| p3 (B,C) | 1281.1 | 1241.1 | 40.0 |
| p4 (C,B) | 1251.7 | 1241.9 | 9.8 |
| p5 (B,C) | 1275.5 | 1233.7 | 41.8 |
| p6 (C,B) | 1253.8 | 1249.2 | 4.6 |
| **median** | **1266.16** | **1241.52** | **24.64 (1.95%)** |

Complete arm separation: every candidate sample < every base sample.

## 4. Cross-scale timing (hash runs, not verdict runs)

small 154.3→87.6, medium 231.1→168.6, churn 2860.4→2784.8 (single samples; direction
consistent,enterprise pairs are the measurement).

## 5. Caveats (honest)

- p1-base (1464.3) is a first-run warmup outlier. Excluding run 1, the remaining
  base median is 1256.83 → Δ ≈ 15.3 ms / 1.22%, below the 1.5% bar. The 6-pair
  median verdict above follows the protocol (no exclusions) and arm separation is
  complete, but the effect is modest (~25 ms on a ~1260 ms sync) and warmup-sensitive.
- One `cargo test` run briefly overlapped sibling swarm-keys' bench window (lock
  appeared between my check and the run starting); no further overlap after that.
- Overlap note: sibling swarm-reserve claims "reserve-once at growth sites", which
  intersects my 3-line buffer pre-size. My mechanism is the `format!`-collapse
  (pre-size is integral to the emission-diet brief); cleanest wins ties.
- `CascadeKey::from_atom` / sort comparator / canon alias resolution intentionally
  out of scope (ordering risk + sibling topic); ~14 wt sort + 7 wt key-build remain
  for a follow-up with its own byte-identity proof.
