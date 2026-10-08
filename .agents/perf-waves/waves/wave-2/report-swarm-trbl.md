# REPORT: swarm-trbl — trbl token-count pre-pass (D3 lead)

## Verdict

**CUT (counted fantasy ≈ 0.20 ms bars the 1 ms micro-BANK bar by 5×, the 5 ms
per-phase floor by 25×, and the 15 ms LAND bar by 75× — nothing implemented)**

One line: the `expand_dimensional_arm` split site fires **3,964×/sync, ALL
single-token, 0 gate passes** (shorthand's 3,964/0/0/0 reproduced byte-exact),
and each wasted split costs only **~50 ns** (1–4-char values, zero parens) —
the split is already cheap, proven below.

## Base / artifacts

- Base commit: `ddce131e7ab9a627500b5caa3d24bce81204dfe4` (verified
  `git rev-parse HEAD` first act; still equal after revert)
- Count `.node` sha256: `15b7d213ed553a65d51b83b7cbcb1570cda1ec5b059b7d14d26539f8f7368a17`
  (temp `SWARM_TRBL_DUMP` hook, fully reverted, never timed; aside at
  `/tmp/swarm-trbl-count.node`)
- `git diff --stat`: empty; `git status`: clean except this REPORT.md
  (temp hook + temp `[[bench]]` + temp bench file + bench-report noise all
  reverted). No commits, no pushes. Never touched LOG.md.
- Bench lock: one hold for the count+unit block (install + build:js + count
  build + 3 counts + criterion unit), released in two steps.

## Mechanism counts (enterprise, seed 7)

Temp env-gated per-reach `eprintln!` in `expand_dimensional_arm`
(`shorthands/mod.rs:102` split site), fully reverted. 3 runs, **byte-identical
stderr** (sha256 `390a7631…` ×3):

| count | value |
| --- | --- |
| split-site reaches | **3,964** (= shorthand ✓) |
| token histogram | **3,964 × 1-token; 0/2/3/4/5+ all 0** |
| dimensional gate passes (2–4 tok) | **0** |
| value lengths (trimmed) | len1: 790, len2: 1077, len3: 1124, len4: 661, len6: 79, len7: 121, len8: 112 (no len-5; 92% ≤ 4 chars) |
| values containing parens | **0** |
| rawlen ≠ trimlen (surrounding ws) | **0** |
| distinct values | 104; top: `0` ×415, `auto` ×211, `100%` ×103 |

Load identity (same runs): 3000 files, **7527 css() calls** (= resolvefmt ✓),
cssBytes **2867925** + dataBytes **214466** (= shorthand sealed pins ✓).

Scope closure (static): sole live chain is `resolve_want_with`
(`resolve/mod.rs:184`) → `expand_shorthand` → `expand_dimensional_arm` →
this site. The public `expand_dimensional_shorthand` wrapper has **zero
callers**; the border split (`border.rs:118`) is a different site, dead on
load (0 border hits) and fenced out. This census is the complete trbl-split
volume on seed-7.

## Unit cost (criterion, censused shapes)

Temp `trbl_unit` bench (reverted), top censused value per length class,
2 full runs, medians agree within ~3%:

| leg | run 2 median | (run 1) |
| --- | --- | --- |
| 1tok len1 (`0`) | 49.0 ns | — |
| 1tok len2 (`20`) | 49.1 ns | — |
| 1tok len3 (`4px`) | 49.8 ns | — |
| 1tok len4 (`auto`) | 50.2 ns | — |
| 1tok len6 (`screen`) | 51.9 ns | — |
| 1tok len7 (`0.25rem`) | 51.7 ns | (53.1 ns) |
| 1tok len8 (`12.75rem`) | 52.0 ns | (53.3 ns) |
| multi n2 / n3 / n4 (context only, 0 on load) | 76.1 / 103.1 / 128.9 ns | (74.7 / 104.9 / 129.5 ns) |

## Bar ruling (the losing math)

Distribution-weighted unit: **49.7 ns/split**.

- Fantasy (100% capture — impossibly assumes the pre-pass itself is free):
  3,964 × 49.7 ns = **0.197 ms ≈ 0.20 ms**
- Max-leg fantasy (every reach at the slowest leg, 52.0 ns): **0.206 ms**
- 3× cost-model error: **0.59 ms** — still below the 1 ms bar
- Realistic (pre-pass byte scan ~5–10 ns + re-trim ~1–2 ns remain):
  ≈ 3,964 × 40 ns ≈ **0.16 ms**

The 1 ms micro-BANK fantasy bar misses by **5×**; the 5 ms floor by 25×;
15 ms LAND by 75×. Per the brief's falsification bar (count × unit < 1 ms
fantasy → CUT fast), no candidate was built and no 8-pair was run — a timed
confirm cannot resolve ~0.2 ms from ±20–70 ms machine noise (keys precedent).

Why the split is already cheap: every censused value is one 1–8-char token
with no parens, so `split_tokens` does one short char scan + 2 tiny allocs
(String buffer + Vec buffer) and nothing else. There is no fat to cut —
only the ~50 ns floor.

## Correctness (rule 1)

- (a) Zero diff: no suites apply. Post-revert tree verified byte-clean
  (`git status` empty, pin re-verified).
- (b)/(c) Vacuous — nothing changed.

## Exact filler + bank conditions (for the captain)

**Filed diet (NOT implemented — paste-ready, no re-derivation needed):**
new `pub(crate) fn count_tokens(val: &str) -> u8` in
`resolve/shorthands/parser.rs` next to `split_tokens`: byte scan, no alloc,
saturates at 5. `(` → depth+1(sat)/start-token; `)` → depth−1(sat)/
start-token; space/tab/newline → end-token iff depth==0 (no-op inside
parens: invariant depth>0 ⟹ in-token, so the char the splitter would push
never starts a token); every other byte (incl. all ≥0x80 bytes: NBSP,
unicode) and CR → start-token, matching `split_tokens` exactly; 5th token
start returns 5 early (final ≥ 5 ⟹ gate rejects). Byte ≡ char scan (all
classes ASCII-decided). Gate insertion (3 lines, landed lines unmoved,
downstream of the hoist, inside the dimensional gate only):

```rust
if !matches!(parser::count_tokens(raw_val.trim()), 2..=4) {
    return None;
}
```

placed between the `is_dimensional_trbl` gate and the landed split line;
the landed split + len check stay verbatim as defense in depth (pass path
is 0 on this load). Sortshape bar: permanent differential test in
`tests.rs` pinning `min(split_tokens(v).len(), 5) == count_tokens(v)` over
counts 0–5 incl. tab/newline separators, NBSP/CR non-separators,
empty/whitespace-only, unbalanced parens, `calc(…)` interiors.

**Bank conditions (revive only if a re-census shows):** trbl reaches N with
N × ~50 ns ≥ bar — i.e. N ≥ ~20k for the 1 ms fantasy bar, N ≥ ~100k for
the 5 ms floor — or a shape change putting multi-token values at volume
(each 2–4-token pass still pays the full split under this diet, so only
reject-volume counts). Expected effect on today's load: ~0.16 ms, below any
8-pair resolution — bank only as filler inside a sum with full proof.

## Collision / scope notes

- Untouched per fences: shorthand's landed dispatch hoist + trio pre-filter
  (pre-pass composes downstream, never relocates); `expand_shorthand` hit
  paths (0 on load); `resolve_alias` miss path; cloneplasma's landed resolve
  lines; border split site (dead, other crew's ground if revived).
- Seed-load finding: the enterprise bench exercises **zero** multi-token
  trbl values and zero parenthesized trbl values. Any future crew dieting
  the dimensional pass path must re-census first.
