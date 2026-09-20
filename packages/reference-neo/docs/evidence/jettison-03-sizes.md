# Slice 3 sizes — post-cutover lib artifacts and the minify trial

Date: 2026-09-20. Operation Jettison, Slice 3 (`css()` cutover).
Pre-cutover reference is the Slice 0 golden
(`jettison-00-baseline.md`, schema 1, 2,223 per-atom rows shipped);
the mission's §1 table agrees with it within 30 bytes per file.
This file records the post-cutover bytes plus the R10 decision input
(unminified numbers and one minified-`react.mjs` trial). The bound
itself is Slice 4 / HQ territory — this file measures, not decides.

## Lib artifacts (post-cutover, schema 2, no per-atom row)

| Artifact | Raw (B) | gzip-6 (B) | Pre raw → post raw | Pre gzip → post gzip |
|---|---|---:|---:|---|
| `react/react.mjs` | 169,257 | 35,273 | 527,253 → 169,257 (−68%) | 46,730 → 35,273 (−25%) |
| `styled/runtime-data.mjs` | 53,166 | 11,046 | 419,623 → 53,166 (−87%) | 32,345 → 11,046 (−66%) |
| `system/baseSystem.mjs` | 580,792 | 61,907 | 1,230,874 → 580,792 (−53%) | 83,973 → 61,907 (−26%) |
| `styled/styles.css` | 242,953 | 32,046 | unchanged | unchanged |

Measured with `wc -c` and `gzip -6 -c | wc -c` over
`packages/reference-lib/.reference-ui/` after `build:js` (so
`dist/namer.mjs` exists for sync to inline) plus `pnpm sync` in
`packages/reference-lib`. `runtime-data.mjs` parses to
`{ schemaVersion: 2, namer, recipes, stylePropNames }` (no
`stylePlans` key); `react.mjs` contains zero `stylePlans` keys and
zero shipped class rows; the sheet is byte-identical to pre-cutover
(harvest untouched).

`runtime-data.mjs` composition (serialised JSON bytes): namer
tables ~27.2k (`aliases` 13,176 · `prefixes` 5,315 · `lowerings`
4,547 · `keywords` 1,020 · `weightKeywords` 110 · `colorProps`
1,393 · `breakpoints` 39 · `conditions` 987 · `fonts` 602),
`stylePropNames` 26,715 (1,389 names), `recipes` 2,107.
`react.mjs` is that data inlined plus the bundled runtime namer
(`dist/namer.mjs` 44.1k, nearly all live through `name()`), the
`css()`/`recipe()` runtime, and the primitives entry.

## R10 decision input

As-written bound: `react.mjs` ≤ 160,000 raw / ≤ 26,000 gzip;
`runtime-data.mjs` ≤ 60,000 raw.

- `runtime-data.mjs` raw 53,166: UNDER by 6,834. No action.
- `react.mjs` raw 169,257: OVER by 9,257 (+5.8%).
- `react.mjs` gzip 35,273: OVER by 9,273 (+35.7%).

Minified-`react.mjs` trial (esbuild `transform`, `minify: true`,
offline over the synced bundle — not part of sync):

| Variant | Raw (B) | gzip-6 (B) |
|---|---:|---:|
| unminified (as synced) | 169,257 | 35,273 |
| minified trial | 120,519 | 25,680 |

Trial hygiene, all clean: two minify runs are byte-identical; an
external sourcemap generates sane (282,728 B, no inline bloat);
13/13 `css()` probe calls (hits, miss, `!`, responsive array and
object, `_hover`, multi-arg last-wins, `border: true`, `size`,
`flex: '1'`, `r` sugar, holes) return byte-identical strings from
the original and the minified bundle. One known degradation: the
miss call-site regex loses function-name matching under minified
names and keeps the `react.mjs` file marker (the designed fallback).
Disposable driver: `/tmp/jettison-minify-trial.mjs` (audit kept,
never committed).

Recommendation input (numbers only): minified `react.mjs` meets
the as-written bound (raw under by 39,481; gzip under by 320)
while unminified misses both (raw by 9,257; gzip by 9,273).
Against a 30,000-byte gzip bound instead, minified passes with
4,320 headroom and unminified fails by 5,273. The unminified gap
drivers, in order, are the bundled namer text (~44k), the inlined
`stylePropNames` (~27k, cf. the D5 revisit), the inlined namer
tables (~27k), and the primitives/css/recipe runtime (~70k).
