# S1 done-gate — Panda v1 atomic sweep vs Neo's 134 green cases

Oracle question (PLAN §10.1): which Panda v1 atomic style-system edge cases
(`vendor/panda-v1/packages/*/__tests__/`) are still unproven by Neo's 134
green cases and the N1 stations (ATM-SITE-17 / ATM-LAYER-09 / ATM-COND-20)?
Method: re-swept every w4-oracle-a disposition against the 134-case catalog
(`ls -d tests/cases/*/NEO-* | wc -l` → 134), then hunted what w4 missed
(numerics, globalCss paths, sibling/parent corners) with throwaway probes
`/tmp/s1-sweep/b{1,2,3,4}.mjs` against `packages/reference-rs/dist/atomic.mjs`
`compileSync` (+ `lib-system-spec.json`). No repo files touched but this one.

## 1. Executive summary

1. All 8 w4 Panda-blocked gaps are closed or owned: B1/B3/B4 landed with N1 (COND-05/10, GLOBAL-06, SITE-01/02/03 → done; `site/TESTS.md:5-7`, `cond/TESTS.md:10,15`, `global/TESTS.md:10`); B2/B5 still blocked with RS owners (COND-15/RS-15, TOKEN-13/RS-16).
2. All 10 w4 silent gaps are closed or owned: F1/F4/F8/F9 → PARITY-01 sub-probes (F1/P13/P16/P17); F2/F3/F7/F10 → SPEC absences (TOKEN/LAYER/CSS); F5/F6 → RS-22/RS-23 (`parity/TESTS.md:5,9,10`); each reconfirmed by probe below.
3. New: 3 RS-grade silent-invalid-CSS gaps in `globalCss` — bare numerics (N1), braceless top-level at-rules (N2), breakpoint keys + conditional values printing as descendant selectors (N3) — all zero diagnostics.
4. New: 4 w4-missed census lines — numeric→token divergence (N4), element access/computed keys/template values refused-with-diagnostic (N8/N9), leading-zero + flat-nested token names (N10/N11).
5. Behavior-green but rowless: StyleProp `!` (N6), JSX ternaries (N7), smOnly≡smToMd (N5), single `& ~ &` / `& + &` in globalCss, bare-descendant nests, `:not()` + class-append parents — fold-ins, not RS rows.
6. Unknown-prop policy differs by path: `css()` drops silently (N6-probe O6), `globalCss` prints hyphenated non-properties (H7) — needs one liaison ruling (N12).
7. The PARITY-01 mini-lib touches none of N1/N2/N3 (all-string globalCss, underscore conditions only, at-rules nested in recipes; `NEO-PARITY-01/world/src/theme.ts:9-60`, `app.tsx:30,87`).
8. Stale pointer: RS-16 still says "should become station ATM-LAYER-09" (`token/TESTS.md:19`) but RS-11 took that name — relabel like RS-17.
9. Verdict: **S1 holds, with 15 named follow-ups** (§4) — 3 RS-grade (N1/N2/N3), 7 one-line SPEC dispositions, 5 trivial fold-ins/notes.

## 2. Gap table (panda test → behavior → disposition)

Dispositions: DONE (green case), ABS (SPEC absence), RS-n (filed), ENG (engine-golden, no case),
OUT (not Reference's dialect, recorded), GAP (new, §3), FOLD (works, needs row-or-fold note).

### core/__tests__/

| Panda test | Behavior | Disposition |
|---|---|---|
| `atomic-rule.test.ts:10` important syntax | `!` spellings | DONE CSS-08 |
| `atomic-rule.test.ts:29-55` basic/shorthand | last-wins per slot | DONE CSS-03 |
| `atomic-rule.test.ts:57` `mx: -2` → spacing calc | numeric→token | GAP N4 (Neo: `-2px`) |
| `atomic-rule.test.ts:67-118` responsive arrays/gaps/inner | array→breakpoints | DONE RESP-01/02/03 |
| `atomic-rule.test.ts:119` color mode | light/dark | DONE COND-04 (D1 contrast) |
| `atomic-rule.test.ts:189-315` nesting/parent/media | `input:hover &`, `:focus > &`, `.parent &`, `input &` | DONE COND-05/10 (ATM-COND-20); bare parents FOLD (G1/G2) |
| `atomic-rule.test.ts:316-416` grouped/direct/outlier | comma keys, `&:focus,&:hover` | DONE COND-01/02/03/06/09 |
| `atomic-rule.test.ts:533-671` sort/format/helpers | order, `hideFrom` | ENG / ABS CSS SPEC |
| `rule-processor.test.ts:49-985` simple/hash/css/recipe/cva/sva/mixed/fromJSON | pipelines, hash wire | DONE RECIPE-01..06/08/09/10, MERGE-01; OUT hash/cva/sva/fromJSON |
| `rule-processor.test.ts:1134` `truncate` bool | boolean utility | OUT CSS SPEC |
| `rule-processor.test.ts:1162` cva boolean | boolean variant | DONE RECIPE-03 |
| `rule-processor.test.ts:1205` null holes | null/false/undefined vanish | DONE CSS-05 |
| `rule-processor.test.ts:1215` unitless | `width:42`→px, unitless stay | DONE CSS-04; numeric→token part GAP N4 |
| `rule-processor.test.ts:1244` custom-prop casing | `--testVariable0` | DONE CSS-11 |
| `rule-processor.test.ts:1268` `!important` spellings | incl. `!IMPORTANT`+spaces | DONE CSS-08 |
| `rule-processor.test.ts:1297` color mix | `/40` mix | DONE TOKEN-03 |
| `rule-processor.test.ts:1318-1401` conflicts/order | border/padding/specificity | DONE MERGE-03/04 |
| `rule-processor.test.ts:1530-1978` sorting | pseudo/at-rule/nested sort | DONE COND-08, RESP-06, ORDER stations |
| `rule-processor.test.ts:1928` mixed vs at-rule | `@supports`+container+hover | RS-15 (COND-15 blocked) |
| `rule-processor.test.ts:2103-2126` issue 3462 | custom conditions table | ABS COND SPEC; `& > :where(svg)` shape DONE COND-06 |
| `rule-processor.test.ts:2154+` multi-block `@slot` | cartesian blocks | OUT TOKEN/COND SPECs |
| `style-decoder/encoder.test.ts` | hash wire | ENG/OUT CSS SPEC |
| `utility.test.ts` | token shapes, hideFrom | DONE TOKEN-08/CSS-04; ABS hideFrom |
| `static-css.test.ts:42-2312` rules/recipes/patterns/cq/arbitrary | static pre-emit | DONE STATIC-01/02/03, RECIPE-04, RESP-07; freeform `'.mobile &'` + named `@container` documented-not-proven (STATIC/RESP SPECs) |
| `static-css.test.ts:2355+` caching | cache hits | OUT (no cache surface) |
| `conditions.test.ts` | pseudo sort, themes | DONE COND-08; OUT themes |
| `color-mix.test.ts` main | `/40`, curly refs | DONE TOKEN-03/04 |
| `color-mix.test.ts:89` `red/0.33` | `0.33%` quirk | ABS TOKEN SPEC (D7); probe B2: warns + passthrough |
| `color-mix.test.ts:184` `red/abc` | passthrough | DONE PARITY-01 F1; probe B1 reconfirms |
| `color-mix.test.ts:196-215` `red/0,4`, `red/0..,4` | passthrough | covered-by F1; diagnostics differ (minor note N13-family) |
| `color-mix.test.ts:229` `red/half` | opacity token | ABS TOKEN SPEC; probe B3 |
| `recipe.test.ts` | defaults/hover/responsive | DONE RECIPE-02/08/09 (D1 contrast) |
| `recipe-nesting.test.ts:55` first-child+responsive | same-class media twin | DONE PARITY-01 P13; probe I1 reconfirms |
| `recipe-nesting.test.ts:1-54` recipe numerics | `0`→token, `90`→px, `'4'`→token | GAP N4 (Neo: `0`, `90px`, `4px`) |
| `atomic-recipe/slot-recipe.test.ts` | atoms-vs-class, slots | contrast RECIPE-09 / ABS D9 |
| `global-css.test.ts:13` direct nesting+condvalue | `width:{base,lg}`, `sm:`, `_focus`, `.yyy` bare, `& .aaa` | `_focus`/bare/`&`-nests FOLD (H6/F1/F2/H8); `width:{base,lg}`+`sm:` GAP N3; `divideX` ABS |
| `global-css.test.ts:115` classic | `&.dragging-ew`, `& *`, `#corner right:0` | selectors FOLD (H10); numerics GAP N1; no-autoprefix note N15 |
| `global-css.test.ts:186` autoprefixed | `tabSize` | note N15 (no autoprefixer; unprefixed universal) |
| `global-css.test.ts:202` `&:not(:hover)` | `body > a:not(:hover)` | FOLD (F3: `:is()`-wrapped, equivalent) |
| `global-css.test.ts:220` single `& ~ &` | `p ~ p` | FOLD (E1/H11 selector ✓); numerics GAP N1 |
| `global-css.test.ts:243` comma `& ~ &` + 10 | `:is()` siblings | DONE GLOBAL-06; `marginTop:10`→bare-`10` GAP N1 |
| `global-css.test.ts:266` top-level `@media` | braced media block | GAP N2 (prints braceless) |
| `global-css.test.ts:285` nested at-rules | media→supports→body | DONE GLOBAL-07 (media+container); nested-`@supports` FOLD (H4/H5) |
| `global-fontface.test.ts` | `@font-face` fields | DONE GLOBAL-08 |
| `global-vars/position-try.test.ts` | `:root` vars, `@position-try` | ABS GLOBAL SPEC |
| `serialize.test.ts` refs/media/divide/token-fallbacks | `{ref}` expansion, `{sizes}` query, `token()` | DONE TOKEN-01/12; ABS `{sizes}` (RESP SPEC), `token()` (D15), divide |
| `classname/prefix/breakpoints/sort-*.test.ts` | grammar, epsilon, order | DONE CSS-09/RESP-05/06/MERGE/RECIPE-04/10/LAYER-05; smOnly≡smToMd FOLD N5 (K3) |
| `composition.test.ts` | textStyles | ABS CSS SPEC |
| `gradient.test.ts:23-55` bgGradient | refs/direction | DONE CSS-06 |
| `gradient.test.ts:70` textGradient | clip trio | RS-22 (P14); probe J1 reconfirms |
| `complex-rule/selectors/stringify.test.ts` | nested mq, `:where` wrap, `@scope` | DONE RESP-04 / D1-divergence / ABS `@scope` |
| `custom-utility/file-matcher/import-map/template-literal.test.ts` | registry, matchTag, backticks | ABS/OUT CSS+SITE SPECs |
| helpers/benches/fixture | — | NA |

### parser/__tests__/

| Panda test | Behavior | Disposition |
|---|---|---|
| `output.test.ts:5-641` css/recipes/raw/empty | pipelines | DONE PRIM-02/MERGE-01/SITE-04/RECIPE-05; OUT factory/raw |
| `output.test.ts:679-828` string-literal factory/css | unimported differ | DONE SITE-05 (contrast) |
| `output.test.ts:878` runtime ternary | both arms | DONE SITE-01 (css); JSX-ternary FOLD N7 (N1/N2) |
| `output.test.ts:923` arbitrary selectors | `&[data-x]` | DONE COND-06/09/11 family |
| `output.test.ts:1010-1234,3384` colorPalette | virtual palette | ABS D14 |
| `output.test.ts:1300-2001` patterns/factory/cva/raw/fn-variants | — | OUT SITE SPEC |
| `output.test.ts:2099-2231` import map | remapping | ABS SITE SPEC |
| `output.test.ts:2357-2503,2643` array syntax | JSX responsive arrays | DONE PRIM-04/RESP-01/02 |
| `output.test.ts:2507` FactoryOptions | — | OUT |
| `output.test.ts:2740` grid minChildWidth | not-a-token | ENG (canon owns) |
| `output.test.ts:2800` token fn in at-rules | `token()` | ABS D15 |

> NOTE (captain): the oracle's §3-details/§4 tail was truncated in transit.
> RS-grade N1/N2/N3 were recovered from `/tmp/s1-sweep/` probes and filed as
> RS-26/27/28 (global TESTS lane + §5.3). Remaining dispositions live in
> `s1-panda-sweep-s4.md`, reconstructed from the same probe evidence.