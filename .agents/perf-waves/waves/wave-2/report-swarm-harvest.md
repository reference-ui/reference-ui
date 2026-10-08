# swarm-harvest REPORT: harvest pool + mint serial diet

## Verdict

**CUT (diet-addressable ceiling ~12.5 ms / ~1.08% bars both LAND prongs;
proven with mechanism counts, diet never built)**

## Mechanism (one)

The harvest chain (Forge Slice 4) on the scored load does measurable work
that a serial diet could remove without touching doctrine: `mint()` seeds a
twin-suppression `seen` set from **every site want** and `collect_pool()`
builds one pool fragment per file plus a merge — while the seed-7 enterprise
load is fully static, so the mint loop it feeds runs **zero iterations**.
Candidate diet (designed, never built): D1 skip the provably-unused seed
when sinks are empty, D2 borrowed dedup keys in `ordered_unique`, D4 single
global pool instead of per-file fragment + merge. Census first, per brief:
the fantasy ceiling (100% capture of all three) is ~12.5 ms / ~1.08%,
below the ≥15 ms + ≥1.5% bar on both prongs. CUT with numbers.

## Base / binaries

- Base: `5844b24a81a528ace14fab63e908793a6829a874` (verified `git rev-parse
  HEAD` before work; tree clean at file time).
- Candidate `.node`: **none — diet never built** (ceiling CUT, keys-style).
- Count `.node`: instrumented base build (temporary counters + stage
  timers, reverted after; never scored, hash not filed).
- Bench lock: one hold, 23:26–23:31 (~5 min: `build:js`, count build,
  `cargo`, 3 count runs), two-step release, confirmed free.

## Diff

Zero. Tree is base-clean (`git status` empty apart from this REPORT):

```
M (none) — instrumentation reverted file-by-file after the count block,
bench-report noise (`benchmark/reports/latest/*`) reverted.
```

## Mechanism counts (harvest-chain census, seed-7 enterprise)

Temporary `Relaxed` counters + `Instant` stage timers in the harvest phase,
env-gated dump (`HARVEST_COUNT=1`), 3 runs. **Every counter bit-identical
across all 3 runs** (warmup + 2 scored); walls stable.

| counter | ×3 runs | meaning |
| --- | --- | --- |
| parsed / visited / masked / panicked | 3122 / 3122 / 0 / 0 | retained programs; mask skips none (every file has quotes) |
| str / tmpl / holefree | 95894 / 0 / 0 | string literals visited; zero template literals on load |
| inserts / classify hits | 95894 / 24861 | `classify_harvest_value` calls; 25.9% accept rate |
| perfile sum / merges / moved | 17693 / 3122 / 17693 | per-file distinct values merged file-by-file |
| pool distinct | 657 | final global pool (Color ~256 + Length ~48 + tail) |
| sinks raw / unique | **0 / 0** | **zero dynamic value positions — static load** |
| seed wants | 48566 | site wants cloned into the twin set, then dropped unused |
| accepts / offered / twin-skip / minted / reports | 0 / 0 / 0 / 0 / 0 | mint loop entirely vacuous |

Stage walls (ms, scored runs 2–3; run 1 warmup agrees):

| stage | run 2 | run 3 | diet-addressable? |
| --- | --- | --- | --- |
| pool walk + classify + insert (`t_visit`) | 23.25 | 23.29 | **no** — oxc walk (parse ground) + classify (canon2 ground) + inserts |
| pool merge (`t_merge`) | 1.21 | 1.24 | **yes (D4)** — single pool kills merge (~1.0 net of deeper inserts) |
| mint seed build (`t_seed`) | 9.96 | 8.84 | **yes (D1)** — 48,566 wants × ~205 ns, skipped whole |
| mint loop (`t_loop`) | 0.00 | 0.00 | vacuous (sinks = 0) |
| mint total incl. seed-set drop (`t_mint`) | 11.50 | 10.26 | **yes (D1)** — drop (~1.5) dies with the seed |
| string-delimiter mask scan (`t_mask`) | — | 0.07 | no — floor (quote in every file's first lines) |

Why sinks = 0 (static proof, census-confirmed): the app seeder emits
static literals only — `style.ts` ("Every value is a static literal"),
`component.ts` (`css({...})` literals; `props.tone` only in `.join`),
`recipe.ts` (literal variants/compounds), `flat/global/dead/config.ts`
verified. No identifier/member/template/binary/unary ever lands in value
position, so no `Dynamic*` refusal fires and `warn_dynamic` records no
sink. The six `Dynamic*` codes are the only sink source (`is_sink_code`).

## Ceiling math (the verdict core)

Fantasy = 100% capture of every sound diet stage (skip-diets capture
~fully, so realistic ≈ fantasy):

| diet | removes | fantasy |
| --- | --- | --- |
| D1: skip seed when sinks empty | `t_mint` max | 11.50 ms |
| D4: single pool, no merge | `t_merge` − deeper-insert delta (~0.2) | ~1.0 ms |
| D2: borrowed dedup keys | per-sink clones × 0 sinks | 0.00 ms |
| **total** | | **~12.5 ms ≈ 1.08%** (of ~1160 ms base) |

Bar: ≥15 ms **and** ≥1.5% (≈17.4 ms). Fantasy clears **neither**
(12.5 < 15; 1.08% < 1.5%). LAND impossible solo; the ceiling itself bars,
so per brief this is a CUT, not a BANK — BANK is for built diets, and
building cannot move the verdict. Precedents: sortshape (14 wt), lowermemo
(4.3 ms fantasy), resolvefmt (2.9 ms fantasy) — all counted, never built.

Considered and rejected (does not change the verdict):

- Mask-scan removal: theorized ~3 ms, **measured 0.07 ms** — floor, and
  removing it would regress string-free-heavy inputs (full AST walks for
  files the mask provably skips), violating the no-regressions land rule.
- `harvest_accepts` hoisting (per-value → per-sink-kind `prop_accepts`):
  exact-same decisions, but vacuous on the scored load (0 calls).
- Twin-tuple clone diet: already at floor (2 value owners: offering +
  key) with 0 pairs on load.
- Wants-vec reserve (`push_want` regrow): realloc-crew ground (RACE);
  census only here (`w:want 38212` filed by realloc, consistent).
- Hasher (Fx) on pool maps: hashers-crew ground; ~0.2 ms shape anyway.
- Pool-empty early-out: **wrong** — zero-offer reports are output bytes.

## Doctrine preservation (harvest doctrine is load-bearing)

Zero-diff CUT: twin-skip `seen` semantics, pool merge order, and want
generation are byte-for-byte the base — nothing was changed to preserve.
The census instrumentation itself was doctrine-neutral: additive counters
outside every decision, one control-flow-neutral split (`panicked ||
skip` → two identical `continue` branches), and one explicit `drop(state)`
that only moves an inevitable local drop inside the timer wall. Sanity:
instrumented run 1 emitted `cssBytes 2867925` = the wave-1 exact byte
count, and all census counters reproduced bit-identically ×3.

For a future per-phase-bar revival, the D1/D2/D4 identity arguments:
D1 — all mint effects live inside the sink loop, so empty sinks means the
seed is built and dropped with zero observable effects; skipping it is
identical on every input (pool-empty + sinks>0 still runs: zero-offer
reports are bytes). D2 — borrowed dedup keys compare the same values and
`seen` is never iterated; order/first-kept unchanged. D4 — `BTreeSet`s
are insertion-order-free; one visitor over all programs yields identical
final sets, and mint reads only `KIND_ORDER` + sorted sets. Revive only
under a per-phase bar: on dynamic-heavy inputs D1 stops triggering and
the prize shrinks to D4's ~1 ms.

## Collision / adjacencies (for the captain)

- swarm-parse (BANKed reuse): reuse maps feed harvest inputs; coherent,
  no code overlap. Pool walk (23.3 ms with classify) is their ground.
- swarm-realloc (active): alloc census overlaps my stages numerically,
  not textually — no shared edits (I touched nothing that stays).
- swarm-canon2 (LAND, integrating): `classify_harvest_value` rides their
  dieted canon path; I never touched classify.
- swarm-hashers (active): pool-map SipHash is their ground; my draft
  kept std hashers deliberately.
- Filed leads: `t_visit` 23.3 ms split (walk vs classify vs insert) for
  parse/canon2 follow-ups; `is_css_keyword` `to_ascii_lowercase` alloc
  still live in base classify path.

## Rule checks

1. One mechanism, counts first, no pivot; zero diff so no suites apply
   to a candidate (`pnpm agentrs c atomic` 567+1 green ran on the
   instrumented tree as a compile check; `q` never needed — nothing
   stays). No diagnostics/harvest-doctrine change exists to weaken.
2. Bench lock: one hold with builds inside (rhythm precedent), two-step
   release; every spawned run gated (counts ran only while holding).
3. No A/B: ceiling-barred CUT needs none (keys/sortshape precedent).
   Count determinism ×3 instead of output determinism ×2 (no candidate).
4. Hypothesis died on ceiling math with full stage proof — CUT, no pivot.
5. This file. No commits, no pushes. Worktree = REPORT only.
