# Jettison READY ask 5 — Namer tables size (measured)

Date: 2026-09-20. Author: MEASURE crew (read-only; prototype in `/tmp`, this file is the only tree write).
Mission: `docs/missions/operation-jettison.md` §3 (tables), §5 (`NamerTables` shape), §6 option A, R10.

## Verdict

- **§3 estimate (~15–20 KB raw) FAILS.** Measured `namer` object for lib: **23,479 B raw / 5,497 B gzip-6**.
  The miss is the aliases row (~8 KB est. vs **12,547 B** actual — long `Webkit*`/`Moz*` names dominate).
- **R10 `react.mjs ≤160 KB raw` HOLDS** with ~23–34 KB headroom (projected ~126–137 KB).
- **R10 `react.mjs ≤26 KB gzip` FAILS in every scenario** (projected ~26.6–29.6 KB; even a rosiest-case
  10 KB/3 KB-gzip namer lands at ~26.6 KB). Recommend bound → 30 KB, or minify `react.mjs`
  (ships unminified today), or re-visit D5 (derive `stylePropNames`).
- **R10 `runtime-data.mjs ≤60 KB raw` HOLDS** (projected ~51.0 KB).

## Measured tables (lib)

Compact JSON, sorted lookup keys, UTF-8 bytes. gzip = `gzip -6` (system binary; python `gzip.compress(level=6)`
agrees within ~25 B — see Repro). Per-table gzip is standalone; whole-object gzip is the shippable number.

| Table | Entries | Raw (B) | gzip-6 (B) | §3 estimate | Notes |
|---|---|---:|---:|---|---|
| `rulesVersion` | 1 | 1 | 21 | — | value `1` |
| `aliases` | 315 | 12,547 | 2,491 | ~8 KB | **56% over**; 315 verified (`Alias::new` count) |
| `prefixes` | 198 | 4,920 | 1,520 | ~150–180 entries, ~4 KB | 193 prefix≠css + 5 underivable-css (finding 1) |
| `lowerings` | 27 keys | 2,775 | 686 | ~30 entries, ~3 KB | 21 shape + flex/size/container/textGradient/variant/colorMode |
| `keywords` | 8 sets | 598 | 315 | — (not estimated) | 7 §5 sets + prototype `weightKeywords` (finding 5) |
| `colorProps` | 71 | 1,323 | 371 | 71 (count ✓) | |
| `breakpoints` | 5 | 27 | 41 | 5 ✓ | `sm md lg xl 2xl` (excl. `base`) |
| `conditions` | 79 | 909 | 413 | "dozens" ✓ | lib 79 ∪ presets 12 = 79 (presets ⊆ lib) |
| `fonts` | 3 | 262 | 119 | per system | lib sans/serif/mono; default weight is keyword `normal` |
| **namer (whole)** | — | **23,479** | **5,497** | ~15–20 KB | **17% over top of range** |
| namer, §5-only (drop `weightKeywords`) | — | 23,386 | 5,417 | — | −93 B raw |
| + `outline:none` procedural (drop its data step) | — | 23,303 | 5,387 | — | −83 B raw further |

`stylePropNames`: **1,389 entries, 25,327 B raw / 5,756 B gzip** — byte-identical to the shipped
`runtime-data.mjs` list (1,073 canon + 315 aliases + `weight`; `r`/`size` already canonical;
`variant`/`colorMode` excluded). All aliases, prefixes, and lowerings keys ⊆ `stylePropNames` ✓.

Combined `namer + stylePropNames`: 48,834 B raw / 10,268 B gzip (cross-compression saves ~1 KB vs summed gzip).
Marginal gzip of the namer given `stylePropNames`: 10,268 − 5,756 = **4,512 B**.
No reading of "§3 ~15–20 KB raw incl. `stylePropNames` overlap" matches: gross namer alone (23.4 KB) already
exceeds the range, and raw bytes don't dedupe.

## R10 projection (measured + simulated)

Current lib artifacts re-verified 2026-09-20 (vs §1 table):

| Artifact | §1 raw/gzip | Measured raw/gzip |
|---|---|---|
| `react.mjs` | 527,226 / 46,714 | 527,253 / 46,720 |
| `runtime-data.mjs` | 419,623 / 32,345 | 419,621 / 32,328 |
| `baseSystem.mjs` | 1,230,874 / 83,973 | 1,230,874 / (not re-gzipped) |
| `styles.css` | 242,953 / 32,046 | 242,953 / (not re-gzipped) |

Decomposition of `runtime-data.mjs`: plans 2,223 × 176.4 B = 392,079 raw / 25,480 gzip;
`stylePropNames` 25,327 / 5,756; recipes (1 key) 2,018 / 377.

Simulation (`/tmp/jettison-react-v2sim.mjs`, disposable): excised the inlined `runtimeData` span from
`react.mjs` (brace-matched; verified by `className` marker count — esbuild re-emits some strings
single-quoted, so the span is JS, not JSON) and inserted compact v2 data
`{schemaVersion: 2, namer, recipes, stylePropNames}`:

- Inlined v1 span: **463,490 B** (vs 419,621 B file — esbuild respace **+44,004 raw / +1,359 gzip**).
- Code-only `react.mjs`: 63,765 raw / 13,669 gzip.
- **Simulated v2 `react.mjs` (no namer JS yet): 114,644 raw / 24,096 gzip.**
- **Simulated v2 `runtime-data.mjs`: ~51,022 raw / ~10,710 gzip** → R10 ≤60 KB raw **HOLDS** (~9 KB headroom).

Adjustments to reach Slice 3 reality:

| Adjustment | Raw | gzip-6 | Method |
|---|---:|---:|---|
| esbuild respace of v2 data | +3,169 | +98 | token-proportional (3,018 v2 seps × 1.05 B/sep from measured v1) |
| Deleted index code (5 fns, 75 lines, comments stripped) | −1,922 | −628 | `serializeLookupKey`, `createStylePlanIndex`, `resolveScoredDeclarations`, `resolveStyleDeclarations`, `findStylePlanMisses` in `neo/src/runtime/css/plans.ts` |
| Namer JS (9 procedures + interpreter + 5 lexical + `miss.ts`) | +10,000…21,000 | +3,000…6,000 | Range: R10's 10 KB at bottom; top from ~1,737 Rust lines mirrored at ~0.35× density and ~23 B/line bundled (bundle is **unminified** — JSDoc stripped, banners kept) |

Projected Slice-3 `react.mjs`:

- **Raw: ~125.9–137.0 KB → R10 ≤160 KB HOLDS** (~23–34 KB headroom).
- **gzip: ~26.6–29.6 KB → R10 ≤26 KB FAILS** (rosiest case over by ~0.6 KB, realistic by ~2.5–3.5 KB).

R10's own arithmetic ("527 − 420 plans + ~15–20 tables + ~10 namer" = 132–137 KB) omits that
`stylePropNames` (~25 KB) and recipes (~2 KB) stay: 107 + 18 + 25.3 + 2 + 10 ≈ 162 KB even on §3's
own inputs. The raw bound survives anyway (measured code-only is smaller than the arithmetic assumes);
the gzip bound does not. Cheapest fixes: raise gzip bound to 30 KB; or minify `react.mjs`
(typical −15–20% gzip → ~24–25 KB); or D5-revisit (derive `stylePropNames`, −5.8 KB gzip).

## Findings for Slice 1 / ask 8 (measurement-adjacent, not estimates)

1. **Prefix fallback must be vendor-aware kebab, and `prefixes` = 198 entries.**
   Naive `kebab(canonical)` misspells 293 vendor props (`-moz-*`, `-webkit-*`, `-ms-*`).
   With a vendor rule (leading `moz`/`webkit`/`ms`/`o` + uppercase → `-` prefix), all are derivable
   **except 5**: `msScrollLimitXMax/XMin/YMax/YMin` (`xmax`, not `x-max`) and
   `msScrollbar3dlightColor` (`3dlight`, not `3-dlight`). So `prefixes` = 193 (prefix≠css) + 5 = 198,
   not ~150–180. (Bytes still ≈ §3's ~4 KB: 4,920.)
2. **Trio props = 12**, incl. `columnRule` (named in §3) and `rowRule` (not named in §3 but same family):
   `border`, `borderTop/Right/Bottom/Left`, `borderBlockStart/End`, `borderInlineStart/End`,
   `outline`, `columnRule`, `rowRule`.
3. **Shape entries = 21** (3 trbl + 12 trio + 6 pair); **lowering keys = 27** with
   flex/size/container/textGradient/variant/colorMode. §3's "~30 entries" fits the 27-key total best.
4. **`container` canon longhands order `[containerName, containerType]` ≠ macro emit order**
   `[containerType, containerName]` (`container.rs`). Lowerings must be built from the macros, not
   from `native_longhands_for_prop`. (Same caution: `SIZE`/`FONT` canon longhands are never consulted —
   `lower_macro` intercepts first.)
5. **Weight keywords have no §5 home.** `keywords` values are `string[]`, but `weight` needs 6 pairs
   (`thin=100 … black=900`, `weight.rs`). Prototype added `weightKeywords` (+93 B raw); ask 8 must place it.
6. **`outline: 'none'` is inexpressible in §5 `LowerStep`.** It needs a value-match guard plus a 2-declaration
   emit; `Guard` has neither. Prototype used `on: 'none'` (+83 B raw); ask 8 must add the guard or make it
   procedure #6's job (finding: the byte difference is negligible either way).
7. **`font`/`weight` are correctly NOT lowering entries** — they read the `fonts` table + weight keywords
   (system data). Lib fonts carry default weight `normal` (the keyword from `css.fontWeight`, not a number)
   plus ordered `css` pairs; the weight duplicates the first `css` pair.
8. **No table needed for unrealizable (28) under D4** — refused props construct misses (R4 allows
   "nothing or a class absent from the sheet"). Note `textGradient` is listed unrealizable but the macro
   claims it first, so it lowers rather than refuses.
9. **`r` needs no lowering entry** — `r`-objects are pre-lowered in JS (`lowerResponsiveStyles`) before lookup.
10. Refusal inputs check out: unknown prop via `stylePropNames` set, unknown `_` condition via `conditions`
    (79), runtime-owned via `keywords.runtimeOwned`, `null`/bool/empty-string via procedure guards. ✓

## Repro (exactly)

Prototype (disposable, kept in `/tmp` for audit, never in the tree):

```bash
python3 /tmp/jettison_emit_tables.py
# reads (read-only): modules/canon/src/{css/{properties,longhands,color},dialect,conditions}.rs,
#   modules/base-system/src/{conditions.rs,lib_fixture/lib.json},
#   modules/atomic/src/resolve/conditions/pseudoprops/mod.rs,
#   packages/reference-lib/.reference-ui/{react/react,styled/runtime-data}.mjs
# writes: /tmp/jettison-namer-tables.json  (the emitted v2 NamerTables for lib, compact JSON)
#         /tmp/jettison-react-v2sim.mjs    (react.mjs with v2 data spliced in, no namer JS)
#         /tmp/jettison-ask05-report.txt   (number table; also appended to /tmp/jettison-ask05.log)
gzip -6 -c /tmp/jettison-namer-tables.json | wc -c   # 5497
gzip -6 -c /tmp/jettison-react-v2sim.mjs | wc -c     # 24096
```

Serialization: `json.dumps(separators=(",", ":"), ensure_ascii=False)` per table with sorted keys for
`aliases`/`prefixes`/`lowerings`; arrays in spec order (breakpoints scale order, conditions sorted,
fonts lib.json order, longhands canon order, keywords source order). Lowerings per §5 `LowerStep` except
findings 5–6 (flagged prototype-only fields). Anyone re-running the script against the same tree gets
byte-identical tables; counts are asserted in-script (1,073 props, 315 aliases, 71 colorProps,
79 conditions, 12 presets, 12 trio props, 1,389 `stylePropNames` == shipped list).
