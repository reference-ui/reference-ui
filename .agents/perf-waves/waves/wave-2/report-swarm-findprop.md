# swarm-findprop REPORT: `find_property` dispatch diet (PHF/match dispatch)

## Mechanism (one, attempted then killed)

Future-work note from swarm-canon2's filed verdict: "`find_property`
PHF/match dispatch (different mechanism, future work)". The candidate:
replace the binary search over the 1073-entry `CANONICAL_PROPERTIES`
table in `canon::css::find_property`
(`packages/reference-rs/modules/canon/src/css/mod.rs`) with a
perfect-dispatch shape (PHF hash + verify, emitter-derived length/bucket
dispatch, or a `match` decision tree) that decides identically with
fewer probes.

Killed on the ceiling before building any dispatch: the exact census
plus criterion per-call costs plus the filed flame bounds agree that no
dispatch shape can clear either LAND prong. No candidate was built; no
timed pairs were run.

## Diff

Base: `5844b24a81a528ace14fab63e908793a6829a874`
(`git rev-parse HEAD` verified at start and at close; tree = wave-1
landing `0a7330c76` plus a docs-only filing).

```
zero diff — census instrumentation reverted, bench byproducts reverted, tree clean
```

Final `git status`: clean except this untracked REPORT.md. (`dist/*.mjs`
wrappers were missing in the fresh worktree; ran `build:js` once,
gitignored, not in diff.)

## Artifacts

- No base/cand `.node` pair: CUT before the timed bench per protocol (no A/B to arm).
- Count build (temporary call/probe-census instrumentation, reverted after one run):
  `8808e13258fba95e07f93e6540fce5048bd9166bbd261fe1ccb0a0f0b7e12847`
  (`/tmp/findprop-count.node`, loaded via `REFERENCE_UI_NATIVE_PATH` override,
  sha256 verified before and after the count run).
- Bench lock held once for the count block (install + build:js + count build +
  one untimed enterprise run + criterion on the clean tree), released immediately
  after in two steps.

## Correctness

- (a) `pnpm agentrs c canon` on the final (reverted, base-identical) tree: **PASSED**.
  `pnpm agentrs q`: nothing to check — zero touched files in the final tree.
- (b) Byte-identity: no code change, so no 4-scale proof is owed. Side evidence the
  census run itself was output-clean: the instrumented run emitted
  `cssBytes = 2,867,925` / `dataBytes = 214,466`, exactly the wave-1 filed
  enterprise byte counts (instrumentation wrote only to the
  `/tmp/findprop-census.txt` side channel; the manual census binary search
  decides identically to `binary_search_by_key` by construction).
- (c) Determinism: the census is an exact counter, not a sample — every call
  counted via atomics on the frozen seed-7 load; no sampling variance exists.

## Mechanism counts (the whole case)

One untimed enterprise run (`--scale enterprise --runs 1 --keep --json`, seed 7),
verbatim census line:

```
calls=353517 hits=353517 misses=0 probes=3285252 hit_probes=3285252 miss_probes=0
```

- 353,517 calls, **100% hits, 0 misses**, 3,285,252 str compares (avg **9.29
  probes/call** — exactly the binary-search-over-1073 shape).
- Zero misses is structural, not luck: host gates filter DOM attrs before canon
  (`extract/jsx/mod.rs:492`), and the frozen app load authors only valid style
  props, so `is_known_style_prop`'s `find_property` leg never sees an unknown
  name on this load.

Criterion `canon/benches/property.rs` on the clean tree, same lock hold:

| bench | mean | note |
| --- | --- | --- |
| property/hit_head (`accentColor`) | 34.13 ns | |
| property/hit_mid (`marginBottom`) | 45.69 ns | deepest probe |
| property/hit_tail (`zoom`) | 30.57 ns | |
| property/hit_hot (`color`) | 36.15 ns | |
| property/miss | 28.73 ns | 0 calls on-load |
| property/alias_miss (`mt`) | 30.18 ns | 0 calls on-load |
| property/mixed (10 words) | 369.73 ns | **36.97 ns/call** |

### Ceiling (three independent legs, all bar)

LAND bar on the ~1160 ms base: ≥15 ms **and** ≥1.5% (≈17.4 ms effective).

1. **Micro leg (exact counts × measured cost):** 353,517 calls × 36.97 ns
   (mixed) ≈ **13.1 ms** total addressable — 100% elimination already bars
   the 15 ms prong.
2. **Flame leg (filed `enterprise-flame3`):** `find_property` self 12 /
   incl 21 wt, with 9 wt memcmp directly below (callers: `is_known_style_prop`
   9, `native_longhands_for_prop` 6, `property_cascade_rank` 3,
   `to_css_declaration_property` 2, `class_prefix_for_prop` 1). Fantasy 100%
   capture ≈ 21 ms clears the bar on paper — but a dispatch replacement
   cannot capture 100%: it must still read the input name and verify one
   full compare. A PHF hit costs hash (~8–11 ns Fx over ~11 bytes) + slot
   index + verify (~3–5 ns) ≈ 15–18 ns vs 37 ns now (~45% of current);
   length/bucket dispatch ≈ 23 ns (~60%). Realistic capture ≤55% × 21 ≈
   **11–12 ms < 15 ms**, ≈1.0% < 1.5%. Bars both prongs.
3. **Heroic-bound leg:** even a 10 ns/call replacement (below the Fx-hash
   floor — impossible) saves (37−10) × 353,517 ≈ **9.5 ms**, still 5.5 ms
   short of the ms bar and 0.8% vs the 1.5% bar. The ceiling bars with
   ~2× margin; no dispatch shape survives it.

Why the per-call cost is already near-floor: each of the ~9.3 probes is a
first-byte-early-out compare (~4 ns); the table (1073 × ~64 B ≈ 68 KiB)
sits in L2. Hashing trades 9 cheap L1/L2 compares for a full input scan
plus a verify — the same reason wave-1 canon rejected HashMap memo
(SipHash cost), and Fx/no-hash shapes still floor at ~40–60% of current.

## Dispatch-equivalence section

Not applicable — no dispatch was built, so no equivalence proof is owed.
For the record, had the ceiling cleared, the plan was: emitter-derived PHF
(seed/slot tables computed in `generate/emit/css.ts`, `CANONICAL_PROPERTIES`
order untouched), a `find_property` member-contract test mirroring
`alias_prefilter_table_contract` (every table member resolves to itself),
and a differential corpus (every member × lower/UPPER/Mixed + near-misses +
non-ASCII adversaries, 0 divergences vs binary search). None of it was needed.

## Enterprise A/B

None — CUT before the timed bench per the brief ("the ceiling clears
neither prong → CUT fast"). No pair table, no medians; the instrumented
count run's syncMs (1559, cold + counting overhead) is not a verdict number.

## 4-scale output-hash table

Not applicable — zero code change, nothing to prove identical. (Count-run
bundle bytes matched the filed enterprise bytes exactly; see §Correctness (b).)

## Collision

No code changed, so no textual or behavioral collision with anyone is possible.

- Adjacent, cited not relitigated: canon2's banked value-classify (same canon
  chain, different functions); swarm-hashers' banked full-stack Fx conversion
  (different mechanism — HashMap hashers, not lookup dispatch); swarm-extend's
  resolve ground (shares `find_property` callers, different mechanism).
- Out-of-scope shape deliberately not pursued: fusing `resolve_alias` +
  `find_property` at callers (`is_known_style_prop`, `class_prefix_for_prop`)
  is caller fusion, not dispatch diet — belongs to extend's resolve ground or
  canon2's "caller-side memo" future work, and inherits this census as its
  starting count (353,517 calls, all hits).

## Verdict

**CUT (ceiling bars both prongs: exact census 353,517 calls × ~37 ns ≈ 13.1 ms
addressable < 15 ms; heroic-bound 9.5 ms; realistic PHF/bucket capture 5–8 ms
vs the ≈17.4 ms effective bar — counted, never built, no timed bench)**
