# W4 oracle B: matrix (non-chain) behaviors vs Neo's 124 cases

Read-only scout per PLAN §10.1 / D20. Question: which reference-core matrix
test behaviors (all suites except chain) are NOT yet proven by Neo's cases,
and what must the W4 PARITY census cover.

Counts: 18 non-chain matrix suites; 58 spec files; 471 test titles via
`rg -c "^\s*(test|it)\(" matrix --glob '!**/node_modules/**' --glob '!**/test-results/**' --glob '!**/chain/**'`
(530 incl. chain). Neo: 124 case dirs via
`ls -d packages/reference-neo/tests/cases/*/NEO-* | wc -l`
(121 TESTS.md `done` rows + CSS-02 cross-listed + 3 harness cases).

## 1. Executive summary

1. 13 matrix behaviors are unproven by Neo: portaled colorMode island (`matrix/color-mode/tests/e2e/system-contract.spec.ts:96`), sibling `+`/`~` (`matrix/css-selectors/tests/e2e/css-selectors-contract.spec.ts:65`), `:where([data-variant])` scoping (`matrix/primitives/tests/unit/generated-output.test.ts:169`), radius pair shorthands (`matrix/spacing/tests/e2e/system-contract.spec.ts:143`), container+viewport mixing (`matrix/responsive/tests/e2e/viewport-contract.spec.ts:129`), inline-style `var()` probes (`matrix/system/tests/e2e/system-contract.spec.ts:131`), variant-registry augmentation (`matrix/typescript/src/primitive-variants.assertions.tsx:60`), multi-entry `fontFace` arrays (`matrix/font/tests/unit/runtime.test.ts:169`), height queries (`matrix/responsive/tests/e2e/viewport-contract.spec.ts:97`), container names (`matrix/primitives/tests/e2e/primitives-contract.spec.ts:429`), attr+hover composition (`matrix/css-selectors/tests/e2e/css-selectors-contract.spec.ts:118`), display/overflow/letter-spacing breadth (`matrix/primitives/tests/e2e/primitives-contract.spec.ts:330`), strictTokens narrowing (`matrix/typescript/src/strict-tokens.assertions.ts:9`).
2. Three gaps are already blocked on known RS rows: `~` on RS-11 (`packages/reference-neo/tests/cases/global/TESTS.md:10`), mixed queries on RS-15 (`packages/reference-neo/tests/cases/cond/TESTS.md:20`), strictTokens is a D17 approved absence (`packages/reference-neo/PLAN.md:940`).
3. The matrix color-mode contract pins `data-panda-theme='dark'` (`matrix/color-mode/tests/e2e/system-contract.spec.ts:107`), which PARITY-04 forbids (`packages/reference-neo/PLAN.md:955`); Neo must prove the portal repaint without that attribute — a recorded divergence, not a port.
4. Zero-specificity `:where([data-variant])` has zero hits across all Neo specs (`rg -n ":where\(\[data-variant" packages/reference-neo/tests/cases/*/NEO-*/specs/*.spec.ts` → none); PRIM-06 asserts attr+class only (`packages/reference-neo/tests/cases/prim/TESTS.md:12`).
5. No Neo spec uses portals, logical radius props, or height queries (`rg -ln "createPortal|portal|border-start|height"` over resp/prim/token specs → none).
6. Everything else in the 13 paint suites maps to a green Neo case: color-mode nesting/toggle, css/container/viewport basics, recipe axes/compounds, font faces + registry, distro exports, spacing rhythm/shorthands, tokens/renames.
7. Whole suites out of scope with standing reasons: mcp, reference (Tasty), session, virtual, watch, plus chain per D20 (`packages/reference-neo/PLAN.md:212`).
8. The PARITY mini-lib world (`packages/reference-neo/PLAN.md:945`) needs 12 new probes (§4); PARITY-02's family table needs rows for siblings, `:where` variants, logical radius, and mixed queries or approved absences citing RS-11/RS-15.
9. `fontFace` arrays are typed (`packages/reference-neo/src/fragments/api/font.ts:28`) but no world authors two entries for one family — engine-ready, case-missing.
10. Sibling `+` has no RS row at all (only `~` is GLOBAL-06/RS-11); the census must carry `+` or mint the row.

## 2. Inventory table

GAP ids (G1–G13) resolve in §3. "Trivial" = marker/entrypoint/testid boilerplate, covered by harness convention (NEO-SMOKE-01).

| # | Matrix spec | Behavior | Neo case or GAP |
| --- | --- | --- | --- |
| 1 | color-mode e2e | root/heading render | trivial |
| 2 | color-mode e2e:49 | default light token resolution | NEO-TOKEN-05 |
| 3 | color-mode e2e:56 | nested dark island in light scope | NEO-PRIM-07 |
| 4 | color-mode e2e:66 | explicit light preview escapes dark | NEO-PRIM-07 |
| 5 | color-mode e2e:76 | dark island overrides light host | NEO-PRIM-07 |
| 6 | color-mode e2e:86 | descendants follow nearest scope | NEO-PRIM-07, NEO-TOKEN-05 |
| 7 | color-mode e2e:96 | portaled island keeps dark outside host DOM | **G1** (plus `data-panda-theme` divergence) |
| 8 | color-mode e2e:114 | root theme toggle repaints descendants | NEO-COND-04 (attribute flip) |
| 9 | color-mode e2e:131 | nested toggle without touching host | NEO-COND-04, NEO-PRIM-07 |
| 10 | color-mode e2e:159 | multiple islands update in one session | NEO-PRIM-07 (three depths) |
| 11 | color-mode unit | marker, token name, entrypoint | trivial |
| 12 | css-selectors e2e:53 | descendant selector margin | NEO-GLOBAL-03 (nested `&`) |
| 13 | css-selectors e2e:59 | direct child `>` padding | NEO-COND-06 |
| 14 | css-selectors e2e:65 | adjacent sibling `+` margin | **G2** (no RS row) |
| 15 | css-selectors e2e:71 | general sibling `~` padding | **G2** (blocked RS-11) |
| 16 | css-selectors e2e:77 | hover text-decoration | NEO-COND-01 |
| 17 | css-selectors e2e:87 | focus-visible outline | NEO-GLOBAL-01 |
| 18 | css-selectors e2e:98 | top-level selector resolves imported consts | NEO-SITE-07 |
| 19 | css-selectors e2e:108 | self attribute selector scoping | NEO-COND-07 |
| 20 | css-selectors e2e:118 | self attribute + hover composition | **G11** |
| 21 | css-selectors e2e:131 | quoted/stateful self selectors | NEO-COND-07 |
| 22 | css-selectors e2e:143 | recipe base descendant/child selectors | NEO-GLOBAL-03 |
| 23 | css-selectors e2e:156 | recipe variant hover/quoted/compound selectors | NEO-RECIPE-04, NEO-RECIPE-09 |
| 24 | css-selectors unit | runtime classes, recipe classes, sheet hygiene | NEO-CSS-01, NEO-RECIPE-01, NEO-GLOBAL-09 |
| 25 | css-selectors virtual-output | Panda-call neutralization in virtual copy | out of scope (virtual, §5) |
| 26 | css e2e:137 | css() padding/radius/border paint | NEO-CSS-01 |
| 27 | css e2e:165 | attribute-branch baselines incl. hover | NEO-COND-07, NEO-COND-01 |
| 28 | css e2e:192 | hover pseudo on/off | NEO-COND-01 |
| 29 | css e2e:207 | positioned layout + offsets | NEO-CSS-01 (engine breadth) |
| 30 | css e2e:235 | nested descendant margin | NEO-GLOBAL-03 |
| 31 | css e2e:242 | stateful closed-branch border | NEO-COND-03 |
| 32 | css e2e:249 | named container queries narrow/wide | NEO-RESP-01, NEO-RESP-08 |
| 33 | css e2e:277 | viewport media base/branch | NEO-SITE-09 |
| 34 | css e2e:304 | sheet mount + layer order + authored decls | NEO-LAYER-01, NEO-SYNC-01 |
| 35 | css e2e:342 | rebuild keeps sheet stable in browser | out of scope (watch machinery, §5) |
| 36 | css unit | css class exports, layer name, sheet hygiene | NEO-CSS-01, NEO-GLOBAL-09 |
| 37 | distro unit:53 | types entries + exports maps | NEO-SYNC-05, NEO-TYPE-01 |
| 38 | distro unit:88 | stylesheet parses, non-empty, no placeholders | NEO-GLOBAL-09, NEO-SYNC-01 |
| 39 | font e2e:35 | font() families on primitives | NEO-TOKEN-10 |
| 40 | font e2e:45 | font-level css contribution | NEO-TOKEN-10 |
| 41 | font e2e:51 | named + compound weights | NEO-TOKEN-10 (partial; see G12) |
| 42 | font e2e:59 | mounted @font-face + advanced fields | NEO-GLOBAL-08 |
| 43 | font unit:106 | source-backed font prop fixture mirror | out of scope (virtual, §5) |
| 44 | font unit:111 | sheet parses, non-empty, no placeholders | NEO-GLOBAL-09 |
| 45 | font unit:146 | @font-face rules + size-adjust/descent-override | NEO-GLOBAL-08 |
| 46 | font unit:169 | one rule per fontFace array entry (normal+italic) | **G8** (typed, unproven e2e) |
| 47 | font unit:186 | FontProps/FontRegistry/FontName/FontWeightName types + registry decls | NEO-PRIM-10, NEO-TYPE-01 |
| 48 | mcp unit (all 18 files) | MCP tools, projects, registry, paths | out of scope (§5) |
| 49 | playwright e2e/unit | sync exposes packages + browser launches | NEO-SMOKE-01 |
| 50 | primitives e2e:164 | base div semantics + layer identity | NEO-PRIM-01 |
| 51 | primitives e2e:176 | jsxElements custom consumer + style props | NEO-SITE-11 |
| 52 | primitives e2e:195 | style props color/bg/padding/border/radius | NEO-PRIM-01 |
| 53 | primitives e2e:247 | category-prefixed color tokens | NEO-TOKEN-01 |
| 54 | primitives e2e:259 | inline border values | NEO-CSS-07, NEO-MERGE-01 |
| 55 | primitives e2e:288 | inline hex colors + authored padding | NEO-CSS-07 |
| 56 | primitives e2e:309 | border shorthand hex expansion | NEO-TOKEN-01 |
| 57 | primitives e2e:318 | mixed token bg + inline border | NEO-MERGE-01 |
| 58 | primitives e2e:330 | display + overflow families | **G12** |
| 59 | primitives e2e:340 | css prop: no leak, composes class, no stringify, paints | NEO-PRIM-02, NEO-PRIM-08 |
| 60 | primitives e2e:373 | font preset family/weight/tracking incl. token bold | NEO-TOKEN-10 (weight part; tracking → **G12**) |
| 61 | primitives e2e:415 | anonymous container containment | NEO-RESP-07 |
| 62 | primitives e2e:422 | named container containment | NEO-RESP-01 |
| 63 | primitives e2e:429 | named container exposes authored name | **G10** |
| 64 | primitives e2e:436 | responsive primitive below/above threshold | NEO-RESP-01 |
| 65 | primitives unit:97 | expected output artifacts exist | NEO-SYNC-02 |
| 66 | primitives unit:105 | virtual mirror of props fixture | out of scope (virtual, §5) |
| 67 | primitives unit:113 | primitive names in pattern extension bundle | out of scope (Panda patterns forbidden, §5) |
| 68 | primitives unit:119 | sheet parses, non-empty, no placeholders | NEO-GLOBAL-09 |
| 69 | primitives unit:154 | category-prefixed tokens → CSS vars | NEO-TOKEN-01, NEO-TOKEN-06 |
| 70 | primitives unit:169 | `:where([data-variant])`, no bare attr selector | **G3** |
| 71 | primitives unit:189 | virtual mirror updates, CSS stable on resync | out of scope (virtual, §5) |
| 72 | recipe e2e:83 | stable classes for repeated calls | NEO-RECIPE-06 (`${system}__` identity) |
| 73 | recipe e2e:94 | default branch base/variants/default size | NEO-RECIPE-01, NEO-RECIPE-02 |
| 74 | recipe e2e:122 | large size variant | NEO-RECIPE-01 |
| 75 | recipe e2e:129 | outline branch surface/border/weight | NEO-RECIPE-01 |
| 76 | recipe e2e:150 | compound overrides incl. cross-axis capsule | NEO-RECIPE-04 |
| 77 | recipe e2e:178 | boolean capsule branch | NEO-RECIPE-03 |
| 78 | recipe e2e:225 | responsive base viewport fallback/branch | NEO-RECIPE-08, NEO-SITE-09 |
| 79 | recipe e2e:245 | responsive alert variant container fallback/branch | NEO-RECIPE-08 |
| 80 | recipe e2e:265 | viewport + container branches on one class | **G5** |
| 81 | recipe rebuild unit:40 | classes stable across rebuilds, regen on contract change | NEO-SYNC-06 + NEO-SYNC-07 (serial equivalents) |
| 82 | recipe unit | marker, stable classes, entrypoint, sheet hygiene | NEO-RECIPE-01, NEO-GLOBAL-09 |
| 83 | reference e2e/unit (all) | Tasty artifacts, @reference-ui/types, symbol pages | out of scope (§5) |
| 84 | responsive system e2e:49 | primitive `r` prop below/above threshold | NEO-RESP-01, NEO-CSS-02 |
| 85 | responsive system e2e:65 | css() container threshold branches | NEO-RESP-01 |
| 86 | responsive system e2e:82 | recipe() container threshold branches | NEO-RECIPE-08 |
| 87 | responsive system e2e:99 | shared trio base/breakpoint-wins | NEO-RESP-06 (ordering), NEO-RESP-01 |
| 88 | responsive viewport e2e:65 | css() viewport-width base/branch | NEO-SITE-09 |
| 89 | responsive viewport e2e:97 | recipe() viewport-height base/branch | **G9** |
| 90 | responsive viewport e2e:129 | mixed container×viewport four quadrants | **G5** |
| 91 | responsive unit | virtual mirrors, sheet hygiene, no malformed @container | NEO-GLOBAL-09 (mirrors out of scope, §5) |
| 92 | session unit (all) | session.json manifest, lock, observer API | out of scope (§5) |
| 93 | spacing e2e:50 | size custom prop utility class export | NEO-CSS-10 |
| 94 | spacing e2e:54 | `2r` → 8px; shorthand sides; explicit overrides | NEO-CSS-12, NEO-MERGE-03 |
| 95 | spacing e2e:105 | radii `1r`/`2r`/literal/`lg` | NEO-EDGE-02, NEO-CSS-07 |
| 96 | spacing e2e:143 | physical radius pair shorthands | **G4** |
| 97 | spacing e2e:164 | logical radius pairs in LTR | **G4** |
| 98 | spacing e2e:177 | size keeps w=h; explicit w/h override sides | NEO-CSS-10, NEO-MERGE-03 |
| 99 | spacing unit | marker, size class, pattern + style-prop type surfaces | NEO-CSS-10, NEO-TYPE-01 |
| 100 | system e2e:43 | tokens() color/bg/light-dark/nearest-scope/preview | NEO-TOKEN-05, NEO-PRIM-07 |
| 101 | system e2e:96 | tokens() spacing + radii beyond color | NEO-CSS-12, NEO-EDGE-02 |
| 102 | system e2e:110 | globalCss() root var + body reset | NEO-GLOBAL-02, NEO-LAYER-04 |
| 103 | system e2e:124 | keyframes() animation name | NEO-TOKEN-11 |
| 104 | system e2e:131 | global var consumable from runtime style attr | **G6** |
| 105 | system e2e:138 | css() consumes custom token families | NEO-CSS-01, NEO-TOKEN-01 |
| 106 | system e2e:155 | css() nearest-scope + light preview | NEO-TOKEN-05, NEO-PRIM-07 |
| 107 | system e2e:193 | globalCss+recipe+utilities layer order | NEO-LAYER-05, NEO-LAYER-06 |
| 108 | system e2e:212 | sheet layer decl, system block, vars, dark branch, keyframes | NEO-LAYER-01/03, NEO-TOKEN-05/11 |
| 109 | system-font e2e:28 | font() family + weights + @font-face + css contribution | NEO-TOKEN-10, NEO-GLOBAL-08 |
| 110 | system unit | marker, token/css-var/keyframe names, entrypoint | trivial + NEO-TOKEN-11 |
| 111 | tokens e2e:105 | tokens() drives primitive + css() color/bg | NEO-TOKEN-01, NEO-PRIM-01 |
| 112 | tokens e2e:126 | renamed tokens leave output; browser uses replacements | NEO-SYNC-07 |
| 113 | tokens-output unit:52 | panda.config.ts emission + token names | out of scope (forbidden in Neo, §5) |
| 114 | tokens-output unit:63 | CSS vars for configured tokens | NEO-LAYER-06 |
| 115 | tokens-output unit:70 | no stale watch-only output in clean sync | out of scope (no watch, §5) |
| 116 | tokens-output unit:83 | renamed fragment output gone after second sync | NEO-SYNC-07 |
| 117 | tokens unit | marker, token name, css class, entrypoint | trivial + NEO-CSS-01 |
| 118 | typescript strict-tokens | `strict: ['colors','radii']` narrowing + safe keywords | **G13** (D17 approved absence) |
| 119 | typescript primitive-variants | registered variants + arbitrary strings typecheck | NEO-TYPE-01, NEO-PRIM-10 |
| 120 | typescript primitive-variants:60 | `PrimitiveVariantRegistry` module augmentation | **G7** |
| 121 | virtual unit (all) | virtual dir create/mirror/transform | out of scope (§5) |
| 122 | watch e2e/unit (all) | `ref sync --watch` alignment, discovery, deletion | out of scope (§5) |

## 3. Findings by family

### 3.1 Color mode (G1)

- **Input:** `colorMode="dark"` subtree rendered via `createPortal` into
  `document.body`, outside the light host DOM
  (`matrix/color-mode/tests/e2e/system-contract.spec.ts:96`).
  **Expected:** node is a direct body child, carries `data-layer`, resolves
  dark token values. **Actual in Neo:** no case uses portals (rg zero hits);
  PRIM-07/COND-04 prove in-DOM islands and attribute flips only.
- **Divergence:** the matrix test also asserts `data-panda-theme='dark'`
  (`matrix/color-mode/tests/e2e/system-contract.spec.ts:107`). Neo scopes dark
  via `[data-color-mode=dark]` (D1) and PARITY-04 forbids `data-panda-theme`
  (`packages/reference-neo/PLAN.md:955`). The census must prove the repaint and
  record the attribute as an approved divergence.

### 3.2 Selectors (G2, G11)

- **Input:** `& + &` / `& ~ &` keys lowering to adjacent/general sibling rules
  (`matrix/css-selectors/tests/e2e/system-contract.spec.ts:65`).
  **Expected:** following peer(s) paint margin/padding. **Actual in Neo:**
  `>` proven (NEO-COND-06), `~` blocked on RS-11 (NEO-GLOBAL-06,
  `packages/reference-neo/tests/cases/global/TESTS.md:10`), `+` has no case or
  RS row at all.
- **Input:** `&[data-state='open']:hover`-style composition
  (`matrix/css-selectors/tests/e2e/system-contract.spec.ts:118`).
  **Expected:** matching cards paint only while hovered. **Actual in Neo:**
  attr (NEO-COND-07) and hover (NEO-COND-01) proven separately; the composition
  is unproven.

### 3.3 Primitives (G3, G10, G12)

- **Input:** tag recipe variants (`.ref-button` + `variant="primary"`)
  (`matrix/primitives/tests/unit/generated-output.test.ts:169`).
  **Expected:** sheet contains `.ref-button:where([data-variant="primary"])`
  and NO bare `.ref-button[data-variant=` selector. **Actual in Neo:**
  NEO-PRIM-06 asserts DOM attr + class only; no spec greps the sheet for
  `:where([data-variant` (rg zero hits).
- **Input:** named container (`matrix/primitives/tests/e2e/primitives-contract.spec.ts:429`).
  **Expected:** computed `container-name` equals the authored name. **Actual:**
  NEO-RESP-07/RESP-01 prove containment behavior, never the name.
- **Input:** `display`/`overflow` props; `letterSpacing` negative token; compound
  font weights (`matrix/primitives/tests/e2e/primitives-contract.spec.ts:330`).
  **Expected:** each paints. **Actual:** no Neo case paints display, overflow,
  or letter-spacing; NEO-TOKEN-10 paints family+weight only.

### 3.4 Spacing (G4)

- **Input:** physical pair props (top/bottom/left radius pairs) and logical
  start/end pairs (`matrix/spacing/tests/e2e/system-contract.spec.ts:143`).
  **Expected:** both addressed corners resolve to 8px (logical: correct corners
  in LTR). **Actual:** NEO-EDGE-02 paints single md/full/dotted radii only; no
  spec mentions `border-start`/`borderStart` (rg zero hits).

### 3.5 Responsive + recipe mixing (G5, G9)

- **Input:** one node with container AND viewport branches
  (`matrix/responsive/tests/e2e/viewport-contract.spec.ts:129`,
  `matrix/recipe/tests/e2e/system-contract.spec.ts:265`). **Expected:** four
  quadrants (narrow/wide container × below/above viewport) each paint the
  correct branch combination. **Actual:** Neo proves each axis alone
  (NEO-RESP-01, NEO-SITE-09); mixed nesting is NEO-COND-15, blocked on RS-15
  (`packages/reference-neo/tests/cases/cond/TESTS.md:20`).
- **Input:** viewport-height recipe branches
  (`matrix/responsive/tests/e2e/viewport-contract.spec.ts:97`).
  **Expected:** height threshold flips the variant. **Actual:** all Neo
  viewport proofs are width-based (rg "height" over resp specs → none).

### 3.6 System runtime (G6)

- **Input:** `style={{ width: 'var(--global-x)' }}` inline style referencing a
  `globalCss`-emitted root var
  (`matrix/system/tests/e2e/system-contract.spec.ts:131`). **Expected:** width
  paints the var value. **Actual:** NEO-GLOBAL-02 proves `:root` var merge via
  stylesheet rules; no case consumes a global var from an inline style
  attribute.

### 3.7 Font arrays (G8)

- **Input:** one family with a two-entry `fontFace` array (normal + italic
  `src`s) (`matrix/font/tests/unit/runtime.test.ts:169`). **Expected:** two
  `@font-face` rules, style-distinguished. **Actual:** the type admits arrays
  (`packages/reference-neo/src/fragments/api/font.ts:28`) but every GLOBAL-08
  world font uses a single object
  (`packages/reference-neo/tests/cases/global/NEO-GLOBAL-08/world/src/fonts.ts:9`);
  no case asserts two rules for one family.

### 3.8 Types (G7, G13)

- **Input:** consumer augments `PrimitiveVariantRegistry` with a new button
  union member (`matrix/typescript/src/primitive-variants.assertions.tsx:60`).
  **Expected:** `tsc --noEmit` passes with the augmented literal. **Actual:**
  NEO-PRIM-10/NEO-TYPE-01 prove the stock surface; augmentation is unproven.
- **Input:** `strict: ['colors','radii']` config
  (`matrix/typescript/src/strict-tokens.assertions.ts:9`). **Expected (core):**
  token-or-keyword narrowing with `@ts-expect-error` on hex/functional/bare
  values. **Actual (Neo):** open `(string & {})` hatch by design; approved
  absence per D17 (`packages/reference-neo/PLAN.md:940`). Census lists, never
  proves.

## 4. Implications for the PARITY mini-lib world and census

The mini-lib world is one world authored like `packages/reference-lib/src`
(`packages/reference-neo/PLAN.md:945`): tokens with light/dark, `font()`,
`keyframes()`, ~8 `.ref-*` tag recipes, two `recipe()`s, primitives, a
`data-slot` bezel, one `container: true` region. To close the matrix side it
must additionally host these probes (input → assertion):

| Probe | Input in world | PARITY assertion |
| --- | --- | --- |
| P1 portal island | `createPortal(<Div colorMode="dark" …/>, document.body)` | dark values paint; body-child; NO `data-panda-theme` (PARITY-01 + 04) |
| P2 siblings | `& + &` margin, `& ~ &` padding utilities | peers paint (PARITY-01; `~` may cite RS-11 absence) |
| P3 where-variants | `variant="primary"` on a `.ref-*` tag | sheet has `:where([data-variant="primary"])`, zero bare-attr selectors (PARITY-02 family row) |
| P4 radius pairs | physical + logical pair props | both corners 8px; LTR mapping (PARITY-01) |
| P5 mixed query | one node, container + viewport branches | four-quadrant paint (PARITY-01; may cite RS-15 absence) |
| P6 style-attr var | `style={{ width: 'var(--x)' }}` + globalCss `--x` | width paints (PARITY-01) |
| P7 augmentation | world `d.ts` augments `PrimitiveVariantRegistry` | `tsc --noEmit` green (PARITY-03-adjacent) |
| P8 font array | one family, normal+italic `fontFace` entries | two `@font-face` rules (PARITY-01) |
| P9 height query | height-threshold recipe variant | flips on viewport height (PARITY-01) |
| P10 container name | named container region | computed `container-name` (PARITY-01) |
| P11 attr+hover | `[data-state]:hover` utility | paints only when both hold (PARITY-01) |
| P12 breadth props | display/overflow/letter-spacing props | each paints (PARITY-02 family rows) |

PARITY-02's checked-in family table needs new rows (or approved absences with
owner): sibling combinators (RS-11 for `~`; `+` needs an owner — no RS row
exists), `:where` variant scoping, logical radius, mixed queries (RS-15),
height queries, container names. G13 (strictTokens) joins the absence union
citing D17, not the family table (it is type-level). PARITY-04's rg already
covers the `data-panda-theme` divergence — the census spec should name the
matrix pin (`matrix/color-mode/tests/e2e/system-contract.spec.ts:107`) as the
reason the probe asserts absence.

## 5. Out of scope (with reasons)

- **chain (all T1–T13).** Excluded per D20 (`packages/reference-neo/PLAN.md:212`):
  PARITY cartography sources are Panda v1 atomic tests plus matrix minus CHAIN.
- **mcp (18 unit files).** The MCP server (tools, project discovery/switching,
  registry lifecycle, path handling) is developer tooling around the style
  system, not emitted-style behavior; Neo's scope is fragments/publish/runtime
  (`packages/reference-neo/PLAN.md:372` gives PARITY no `src/` ownership at all).
- **reference (Tasty).** `@reference-ui/types` package + symbol pages are the
  deferred Tasty leg; coverage-map note b already marks `types/` unproven →
  approved absence with the SYNC SPEC to carry it
  (`packages/reference-neo/docs/evidence/coverage-map.md:67`).
- **session.** `session.json`/lock/observer API is watch-mode daemon machinery;
  Neo is serial `sync()` (`packages/reference-neo/docs/evidence/coverage-core-neo.md:159`).
- **virtual.** The virtual mirror exists to feed Panda's scanner; Neo has no
  Panda scanner, and the absence assertion rides with NEO-SYNC-02
  (`packages/reference-neo/docs/evidence/coverage-map.md:87`). Covers the
  virtual-output/mirror/transform specs in css-selectors, font, primitives,
  responsive, and virtual suites.
- **watch.** `ref sync --watch` alignment/discovery/deletion is the watch loop
  Neo does not implement; serial equivalents are NEO-SYNC-06/07. Also covers
  the css e2e:342 rebuild-in-browser test and tokens-output watch-only staleness
  rows.
- **tokens-output panda.config emission.** `panda.config.ts` is §4.1-forbidden;
  PARITY-04 asserts its absence, not its content.
- **primitives pattern-bundle row.** Panda pattern extensions are forbidden
  machinery in Neo (D4 data-only styled,
  `packages/reference-neo/docs/evidence/coverage-map.md:35`).
