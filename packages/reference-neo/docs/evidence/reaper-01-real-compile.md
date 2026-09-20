# Reaper Slice 1 — real compile and census (R1–R3)

Date: 2026-09-20. Operation Reaper, Slice 1 (research, commits evidence).
Mission: `docs/missions/operation-reaper.md` Part I. Fixture:
`packages/reference-rs/modules/atomic/tests/fixtures/harvest-enterprise/`.
Readers: `tests/harvest_pool.rs` (Rust) + `tests/harvest-census.test.ts`
(TypeScript, with `tests/harvest-model.ts`). Every number below is pinned in
one of those two tests; re-run with `pnpm agentrs c atomic -t harvest` and
`pnpm agentrs v modules/atomic/tests/harvest-census.test.ts`.

Naming note (HQ directive, effective 2026-09-20): the operation codename
does not enter the `reference-rs` codebase, so the mission-prescribed
`reaper-*` code paths were built as `harvest-*` domain language instead
(fixture dir, both readers, the model helper). Evidence filenames here keep
the `reaper-*` mission-record convention. No `reaper` token remains under
`packages/reference-rs` (content or paths, including build cache).

Env: x86_64 macOS, Node v24.16.0, headless Chromium via `pnpm agentneo`
(localhost only). Timings are wall on this machine, medians of 7.

## Headline

A messy-enterprise fixture — 32 sinks across five kinds, a 340-string pool,
135 static leaves — compiles to **4,938 classes**: `styles.css` **341,037 raw
/ 41,496 gzip-6 / 21,057 brotli-11** (69.1 B/class), `react.mjs` **148,379 /
32,543 gzip** (re-verify after Jettison acceptance). Net-new harvest 4,803
vs gross 4,938 (135 twin-skipped, one per static leaf). Pool triple totals
**(|P−L|, |P∩L|, |P|) = (207, 133, 340)**. The compile sits between M300 and
M500, rest-shaped, well under the fat bound.

| Sheet | Classes | Raw | gzip-6 | brotli-11 | B/class |
|---|---:|---:|---:|---:|---:|
| M300 (bound) | 22,468 | 1,561,214 | 165,455 | 89,987 | 69.5 |
| **Fixture (compile)** | **4,938** | **341,037** | **41,496** | **21,057** | **69.1** |
| M500 (bound) | 33,806 | 2,395,791 | 249,341 | 130,121 | 70.9 |

~70 B/class at rest holds for the real compile (69.1), not just the model.
`stylePlans.length` is 4,938 = 4,803 harvest + 135 static: refused holes
contribute zero plans.

## Sink census (prop, when, kind, offered → minted)

Offered (gross) comes from the real `mint()` over the closed-world sink list
(Rust reader); minted (net-new) from the backchannel infos (TS reader). Twins
= offered − minted; every twin is a static leaf on the same canonical prop.

| Prop | when | Kind | Offered | Minted | Twins |
|---|---|---|---:|---:|---:|
| backgroundColor | rest | color | 154 | 137 | 17 |
| backgroundImage | rest | url | 13 | 11 | 2 |
| bg | rest | color | 162 | 160 | 2 |
| borderBottomColor | rest | color | 154 | 147 | 7 |
| borderColor | rest | color | 154 | 141 | 13 |
| color | rest | color | 154 | 128 | 26 |
| color | _hover | color | 154 | 154 | 0 |
| display | rest | keyword | 6 | 5 | 1 |
| fill | rest | color | 155 | 151 | 4 |
| fontSize | rest | length | 175 | 171 | 4 |
| height | rest | length | 176 | 172 | 4 |
| margin | rest | length | 176 | 173 | 3 |
| marginBlock | rest | length | 175 | 172 | 3 |
| marginBottom | rest | length | 176 | 175 | 1 |
| marginInline | rest | length | 175 | 174 | 1 |
| marginLeft | rest | length | 176 | 174 | 2 |
| marginRight | rest | length | 176 | 175 | 1 |
| marginTop | rest | length | 176 | 175 | 1 |
| maxWidth | rest | length | 176 | 172 | 4 |
| minWidth | rest | length | 176 | 172 | 4 |
| outlineColor | rest | color | 155 | 150 | 5 |
| padding | rest | length | 175 | 168 | 7 |
| paddingBlock | rest | length | 175 | 173 | 2 |
| paddingBottom | rest | length | 175 | 173 | 2 |
| paddingInline | rest | length | 175 | 173 | 2 |
| paddingLeft | rest | length | 175 | 173 | 2 |
| paddingRight | rest | length | 175 | 173 | 2 |
| paddingTop | rest | length | 175 | 173 | 2 |
| stroke | rest | color | 155 | 151 | 4 |
| transform | rest | transform | 12 | 10 | 2 |
| width | rest | length | 176 | 171 | 5 |
| width | md | length | 176 | 176 | 0 |
| **Total** | | | **4,938** | **4,803** | **135** |

Notes:

- The two conditioned sinks mint exactly their rest twins' offered counts
  (154 / 176) with zero twins: `when` copies per-sink, never multiplies.
- No cross-sink twins: every sink pair differs in canonical prop or `when`,
  so each of the 135 static leaves twins exactly one pair.
- `gap` warns (33rd `ATM-W-DYNAMIC-IDENTIFIER`) but emits no info: the
  record-time filter holds. Backchannel histogram is pinned in-test:
  EXPECTED-LOOKUP 135 / DYNAMIC-SLOT 33 / warnings 33 / HARVEST-SINK 32.
- Sinks that mint nothing report no fact; every sink here mints, so the
  census is the full sink set.

## Pool census by kind: the D1 bound

`P` from the Rust reader (the classifier), `L` from site-want strings (TS).
Definitely-unbound `P−L` is exact; ambiguous `P∩L` is the upper bound on
leaf-only (ready-03).

| Kind | \|P−L\| | \|P∩L\| | \|P\| |
|---|---:|---:|---:|
| color | 75 | 74 | 149 |
| keyword | 3 | 4 | 7 |
| length | 119 | 51 | 170 |
| math | 0 | 0 | 0 |
| transform | 4 | 2 | 6 |
| url | 6 | 2 | 8 |
| **Total** | **207** | **133** | **340** |

Construction (for D1 calibration): the 74 ambiguous colors are the 30 shared
hexes + 7 shared named + 20 shared rgba + 17 shared oklch; the 51 ambiguous
lengths include 10 px values (`121px`–`130px`) that occur ONLY as static
leaves. So the true leaf-only population is between 10 (constructed) and 133
(measured bound).

Slice-2 prize bracket, read-only + construction: removing leaf-only values
from the pool can only remove pairs whose value is ambiguous. Per-kind
ambiguous × accepting sinks: color 74×8 + length 51×19 + keyword
(2×32 + auto 9 + none 5) + url 2×2 + transform 2×1 = **≤1,645 classes**
(~114 KB raw). Floor from construction: the 10 leaf-only px values each twin
one of 19 length sinks, so each saves 18 → **≥180 classes** (~12 KB). The
exact prize needs Slice 2's span reporting; D1 weighs doctrine cost against
180–1,645 classes on a 4,938-class sheet.

## Parse times (R2)

Rule counts are CSS style rules on both sides (css-tree `Rule` nodes outside
`@keyframes` = CSSOM `STYLE_RULE`; the fixture's 70 keyframe selectors are
excluded from both — see Surprises).

| Sheet | Rules | css-tree median (cold) | Chromium linked-load median (cold) |
|---|---:|---|---|
| Fixture (341 KB) | 4,941 | ~9–12 ms (~13 ms) | ~10.5 ms (~73 ms loop-first) |
| M500 (2.40 MB) | 33,806 | ~57–66 ms (~65–84 ms) | ~53–54 ms (~56 ms) |

Method: Node `css-tree` parse, median of 7; Chromium `goto`→`load` wall over
localhost, median of 7, sheets served by a temp serve-only world
(`NEO-TMP-REAPER`, the pre-directive temp id, deleted after two green runs
plus `.artifacts/` and the run-log entry, per the jettison probe hygiene).
m500 ran first so its cold
sample is genuinely cold; the fixture loop-first ran after seven m500 loads
and is not a true cold. Limits carry over from the probe: localhost only,
Chromium only, JIT spread. Both sheets are regenerable (fixture compile; M500
from the mission Method recipe via `tests/harvest-model.ts`, whose M300/M500
cells the committed test pins byte-exact), so the temp world is scratch, not
a citation.

## `react.mjs` (re-verify after Jettison acceptance)

148,379 raw / 32,543 gzip-6, via the exact lib-sync sequence
(`publishRuntimeBundle` + `publishReactBundle` over the fixture compile with
`LIB_SYSTEM_SPEC`). Against lib's post-cutover 169,257 / 35,273
(`jettison-03-sizes.md`): same tables, minus recipes and plus nothing per
atom — O(1) in atoms as designed. Jettison acceptance could still move namer
bytes by kilobytes; Slice 1's sheet numbers need no re-verify.

## Surprises and corrections

1. **Null holes do not sink.** `css({ color: null })` binds a Null want; it
   never refuses, never warns, never records a sink. Ready-01's SEAM-07
   precedent was a misread: SEAM-07's +500 comes from its 500 static leaves,
   not its null hole. All 30 fixture holes are identifier-authored
   (HARVEST-01 pattern). Any future "hole" vocabulary should say identifier,
   not null.
2. **Keyframe counting splits css-tree from CSSOM by exactly 70.** The
   fixture sheet carries 31 `@keyframes` (lib motion tokens) with 70
   selectors; css-tree calls them `Rule`, CSSOM calls them keyframe rules.
   Both readers count style rules only (4,941); the raw css-tree `Rule`
   count is 5,011.
3. **`md` and `_hover` mint exactly their rest offered counts** (176 / 154),
   first try — the per-sink `when` copy (ATM-HARVEST-03) holds under a real
   pool, including through the responsive-object authoring
   (`width: { md: w }`).
4. **No math in the pool.** Nothing authored `calc()`; the Math channel sits
   empty and every length sink's gross is pure Length + keywords.

## Repro

- `pnpm agentrs c atomic -t harvest` — pool by kind, sink offered/gross,
  rewrites `pool-census.json` when it moves.
- `pnpm agentrs v modules/atomic/tests/harvest-census.test.ts` — M-cells,
  sink census + kinds + histogram, pool triple, byte cells, react bundle,
  css-tree timing. ~6 s.
- `pnpm agentrs q` on `tests/harvest_pool.rs`, `tests/harvest-model.ts`,
  `tests/harvest-census.test.ts` — all clean.
- Full slice gate: `pnpm agentrs t`.
