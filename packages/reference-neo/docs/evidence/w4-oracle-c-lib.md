# W4 oracle C — lib census: the small Panda slice, the PARITY-02 family table, absence-union reconciliation

Read-only scout per PLAN §10.1 (`packages/reference-neo/PLAN.md:985`). Question: what exact minimal API surface does reference-lib use, what family table must PARITY-02 census, and does the union of group SPEC approved absences already equal the PARITY absence list?

## 1. Executive summary

1. Lib imports 3 generated packages: `@reference-ui/react` (89 files), `@reference-ui/system` (31), `@reference-ui/types` (11); `@reference-ui/styled` has 0 lib-src importers (`evidence/generated-folder-shape.md:84`, `evidence/coverage-lib.md:24`; re-verified by rg, §5).
2. The system slice is 4 functions in 31 statements: `globalCss` 18, `tokens` 6, `keyframes` 6, `font` 1 — no `getRhythm`, no `token()`, no `sva`/`cva` in lib src (`evidence/generated-folder-shape.md:121`; rg §5).
3. The react slice is 101 tag primitives (`Div` 77, `Span` 45, `Button` 25) + `PrimitiveProps`/`StyleProps` + rare `recipe`; no `css`, no `Box`, no `as` in lib (`evidence/generated-folder-shape.md:110`, `:119`).
4. The sheet slice is 27,472 lines: 4 populated layers (empty `base`/`recipes` rank-only), 90 `.ref-*` tag recipes with `[data-variant]`/`[data-slot]`/`:is()` twins, 373 token vars + 98+98 theme vars, ~6,162 utilities (`evidence/lib-sheet-styles-css.md:9`, `:11`, `:12`, `:46`).
5. PARITY-02's census table must have one row per §3 family of both lib-sheet reports: ~35 families from `lib-sheet-styles-css.md:50` plus 5 author→output traces from `lib-sheet-global-css.md:106` (§2 below).
6. No `tests/cases/parity/` SPEC exists yet (verified: dir absent), so "the PARITY absence list" today is only the PLAN corpus: D2/D3/D7/D8/D9/D14/D15/D16/D17/D19, §4.1 forbidden paths, PARITY-04 strings (`PLAN.md:193`, `:227`, `:955`).
7. Union direction PLAN→groups holds: every PLAN-corpus absence is claimed by ≥1 group SPEC (§3, mapping table).
8. Union direction groups→PLAN adds ~45 Panda-corpus absences beyond PLAN — lawful, since PARITY-02 defines the list as equal to the union (`PLAN.md:953`).
9. Equality still fails on 5 stragglers from the lib-sheet §3 inventory named in neither PLAN nor any SPEC: forced-colors/`@supports` MQs, zero-count pseudos, `@font-face` size-adjust, boolean-utility leaks + dotted passthroughs, `_file` (`§3` DELTA-1..5; zero-mention proof §5).
10. DELTA-3 (`size-adjust`) and DELTA-5 (`_file`) touch lib-used families, so under `PLAN.md:221` they are human-escalation candidates; DELTA-1/2/4 are zero-count/defect families (auto-§3).
11. The §8.15 mini-lib scope (tokens, font, keyframes, ~8 tag recipes, 2 recipes, primitives, bezel, container region) exercises all present families except vendor range/meter pseudos and static cardinality — pick tags and a static map to close that (§4).
12. Counts below re-verified with `rg` against the live tree; two importer counts drifted −2 vs the 2026-09-16 evidence (89 vs 91 react, 11 vs 13 types) (§5).

## 2. Inventory table: lib family → Neo presence or approved absence

Census input is exactly `lib-sheet-styles-css.md` §3 (`evidence/lib-sheet-styles-css.md:50`, table lines 54–85, pseudo counts 89–102) and `lib-sheet-global-css.md` §3 (`evidence/lib-sheet-global-css.md:106`, Traces A–E lines 108–310). "Present" cites the SPEC dialect/station section that claims it; the parity author must still cite the TESTS.md row (not surveyed here).

### 2a. Stylesheet families (`lib-sheet-styles-css.md` §3)

| # | Lib family (lib-sheet ref) | Lib count | Neo verdict + owner |
| --- | --- | ---: | --- |
| F1 | `@layer` order stmt + 4 bodies (`:54`) | 6 names, 4 bodies | PRESENT rank, bodies diverged: order incl. empty `base`/`recipes` proven by LAYER (layer SPEC dialect cites lib L70); omission deliberate (layer/SPEC.md:56) |
| F2 | Reset + reduced-motion `!important` (`:55`) | ~12 rules, 1 media | PRESENT: LAYER-04/ATM-LAYER-08 (global/SPEC.md:13, layer SPEC stations) |
| F3 | `:where(:root,:host)` token vars (`:56`) | 373 decls | PRESENT: TOKEN islands (token/SPEC.md:47 absence section contrasts; token dialect) |
| F4 | Semantic `--colors-ui/design/reference/text-*` (`:57`) | ~123 | PRESENT: TOKEN (`{light,dark}` leaves, token SPEC dialect) |
| F5 | `[data-panda-theme=light\|dark]` islands (`:58`) | 2 rules, 98+98 vars | PRESENT-as-retarget `[data-color-mode=…]` (TOKEN-05/COND-04/PRIM-07, D1 `PLAN.md:193`); `data-panda-theme` ABSENT (prim/SPEC.md:41; `PLAN.md:955`) |
| F6 | `--fonts-*` + 17 `--font-weights-*` (`:59`) | 5 + 17 | PRESENT: TOKEN font macro (token SPEC dialect); `font-registry.json` file ABSENT (sync/SPEC.md:42) |
| F7 | Rhythm scale `Nr`/`1/2r` (`:60`) | 19 vars | PRESENT: TOKEN RHYTHM stations + CSS-12; `getRhythm` SYNC-12/TYPE-05 (sync, type SPEC decisions) |
| F8 | Radii 4; no shadows/sizes/blurs/z tokens (`:61`) | 4 radii | PRESENT radii (EDGE-02/TOKEN); composite/shadow/asset tokens ABSENT (token/SPEC.md:47); `{sizes.x}` in queries ABSENT (resp/SPEC.md:60) |
| F9 | `@media` total = reduced-motion only (`:62`) | 1 | PRESENT (F2); viewport `sm:`/`min-width` ABSENT (resp/SPEC.md:60, D8 `PLAN.md:200`) |
| F10 | `@container` rules (`:63`) | 0 | PRESENT as Neo superset: engine emits, RESP proves (resp SPEC dialect); lib has none, nothing to absent |
| F11 | print / hover-MQ / forced-colors / `@supports` (`:64`) | 0 except F2 | `_print`/`_motionReduce`/`_osDark` PRESENT (cond SPEC dialect + COND-11); **forced-colors / `@supports` / `(hover:hover)` → DELTA-1** |
| F12 | Used pseudos `:is/:hover/:focus-visible/:has` etc. (`:65`) | `:is(` 75, `:has(` 8 | PRESENT: COND catalog (COND-02/10) + GLOBAL `:has()` compounds |
| F13 | Zero-count pseudos `:nth-child/:empty/:invalid/:visited/:indeterminate` (`:102`) | 0 | **→ DELTA-2** (COND catalog is positive-only; no explicit absence) |
| F14 | Pseudo-elements + vendor range/progress/meter/file pseudos (`:66`, `:82`) | `::marker` 3 etc.; `-webkit-` 29 | PRESENT: GLOBAL "vendor pseudos pass through" (global SPEC dialect) |
| F15 | Attribute twins `[data-hover]/[aria-*]/[data-variant]` (`:67`) | e.g. data-hover 31 | PRESENT: COND dual-bind + GLOBAL |
| F16 | `[data-reference-field]` 40 + `[data-slot]` (`:68`) | 40 + slots | PRESENT: GLOBAL Trace C; bezel in parity world (`PLAN.md:948`) |
| F17 | group/peer 0; child `>` 14; sibling `+` 0; `[&…]` escaped (`:69`) | 0 / 14 / 0 / ~10 | group/peer PRESENT superset (cond SPEC dialect `_groupHover`/`_peerFocus` + COND-09/14); `>` PRESENT (Trace C); `+` emitters (`divideX/Y`) ABSENT (css/SPEC.md:47, global/SPEC.md:41); `[&…]` PRESENT (COND-14, CSS-07/09) |
| F18 | `!important` reset-only (`:70`) | 4 | PRESENT reset (F2); utility `!` PRESENT superset (CSS-08, MERGE-07) |
| F19 | Class grammar + escaping (`:71`) | e.g. `\.` 5418 | PRESENT: CSS-07/09 (NAME/LEAF stations) |
| F20 | Resolved `{path}` refs (`:72`) | 3 | PRESENT: CSS-06, TOKEN-01/12 |
| F21 | `{…}` leftover class L27410 (`:72`) | 1 | ABSENT: D7 (`PLAN.md:199`); global/SPEC.md:41; sync/SPEC.md:42 |
| F22 | `color-mix(in oklch,…)` (`:73`) | 25 | PRESENT: GLOBAL dialect + TOKEN-03/06 |
| F23 | Shorthand expansion `px_/bdr_/d_/size_/ring-` (`:74`) | — | PRESENT: CSS SHORT stations; MERGE-03/04 |
| F24 | `.size_md{width:md}`, `.bdr_none`, `.ls_tight` (`:74`) | 3+ | ABSENT: D7 (`PLAN.md:199`); css SPEC decisions; global/SPEC.md:41; token SPEC decisions |
| F25 | 0 recipe rules; 90 `.ref-*` + `[data-variant]` (`:75`) | 90 stems | `.ref-*` PRESENT: GLOBAL; `[data-variant]` PRESENT: PRIM (`variant` stamps); `recipe()` PRESENT: RECIPE; `cva` ABSENT (recipe/SPEC.md:50, D3); `sva`/slots ABSENT (recipe/SPEC.md:50, D9 + 4 more SPECs) |
| F26 | `d_flex` etc.; no truncate/srOnly/textStyle (`:76`) | 4 display | PRESENT display atoms (CSS); `truncate` ABSENT (css/SPEC.md:47); text/layer/animation styles ABSENT (css/layer/static/token/type SPECs); srOnly covered by patterns-pack absence (site/SPEC.md:41, type/SPEC.md:52) |
| F27 | 31 `@keyframes` in tokens layer (`:77`) | 31 | PRESENT relocated to `global` (LAYER-03/TOKEN-11 split, layer SPEC); tokens-layer placement ABSENT, deliberate (global/SPEC.md:41) |
| F28 | 3 `@font-face` in global (`:78`) | 3 | PRESENT (LAYER-03/GLOBAL, LAYER-06); **size-adjust/descent-override extras → DELTA-3** |
| F29 | staticCss colour atoms + spacing incl. negatives (`:79`) | ~5,099 + full negatives | PRESENT real-token-only (STATIC-01/02, D7/D14 static SPEC decisions); `colorPalette.*` 1,683 ABSENT (D14 `PLAN.md:206`; token/static/layer/type SPECs) |
| F30 | `colorPalette` vars referenced-undefined (`:80`) | 153×11 | ABSENT: same as F29 |
| F31 | Condition-prefixed utilities (`:81`) | hover 13, fV 11… | PRESENT: COND |
| F32 | `container-type: inline-size` on body, no query rules (`:55`,`:63`) | 2 decls | PRESENT: globalCss body + `container: true` macro (resp SPEC dialect, COND-16) |
| F33 | `*` transform/filter var dump (`:83`) | 1 rule | ABSENT: D7 (`PLAN.md:199`); global/SPEC.md:41; layer/SPEC.md:56; sync/SPEC.md:42 |
| F34 | Boolean leaks `focus_true/isolation_true/…` (`:84`) | 4 | **→ DELTA-4** (D7-spirit, unenumerated) |
| F35 | Dotted passthroughs `background: ui.panel.background` (`:85`) | ~15 | **→ DELTA-4** (same) |
| F36 | `--made-with-panda` (`:127`) | 1 | ABSENT: D7; global/layer/sync SPECs; `PLAN.md:955` |
| F37 | Dark-leaning default block semantics (`:57`) | — | ABSENT: D7 "duplicated dark semantics" (`PLAN.md:199`); global/SPEC.md:41 |

### 2b. Global-css author→output traces (`lib-sheet-global-css.md` §3)

| # | Trace (global-css ref) | Lib behaviour | Neo verdict + owner |
| --- | --- | --- | --- |
| T-A | Literal `:focus-visible` + `{colors}` (`:108`) | no `:is()` expansion for literal pseudos | PRESENT: GLOBAL "selectors are literal" (global SPEC dialect) |
| T-B | Rhythm alias + `containerType` + `:root` merge + comma-merge (`:129`) | `4r`→var, Panda merges `body,.ref-div` | PRESENT except comma-merge ABSENT, deliberate cascade-equal divergence (global/SPEC.md:41) |
| T-C | Nested `&` + `_disabled/_hover/_focusVisible` + brace `color-mix` (`:170`) | `:is()` twins, `:where(variant)` | PRESENT: GLOBAL |
| T-D | `_before/_after` + token color (`:231`) | `::before/::after` split | PRESENT: GLOBAL/COND |
| T-E | `undefined`-strip + `_placeholder` dual + `_file` + token-vs-calc (`:268`) | `::placeholder,[data-placeholder]`; `3.5r`→calc | PRESENT except **`_file` → `::file-selector-button` → DELTA-5** (3 lib uses, no row or absence); `undefined`-drop PRESENT (frozen contract, CSS-05) |
| T-F | Bonus `fontWeight: 'sans.bold'` alias (`:310`) | → `var(--font-weights-sans-bold)` | PRESENT: font/weight macros (COND-05, token SPEC dialect) |

PARITY-02's checked-in family table = F1–F37 + T-A–T-F (43 rows). Stylesheet §2/§4/§5 are analysis, not census input — PARITY-02 cites §3 only (`PLAN.md:953`).

## 3. Absence-union reconciliation

### 3a. PLAN→groups: every PLAN-corpus absence is claimed (equality holds this way)

| PLAN absence item | Claimed by group SPEC(s) |
| --- | --- |
| D7 six bugs (`PLAN.md:199`) | global/SPEC.md:41 (all six); layer/SPEC.md:56 (banner, var dump, colorPalette); sync/SPEC.md:42 (four); token SPEC decisions (three); static SPEC decisions (colorPalette); css SPEC decisions (extends to `bdr_none`/`ls_tight`) |
| D9 slots/`sva` (`PLAN.md:201`) | recipe/SPEC.md:50; global/SPEC.md:41; merge/SPEC.md:46; prim/SPEC.md:41; static/SPEC.md:51 |
| D14 colorPalette (`PLAN.md:206`) | token/SPEC.md:47; static/SPEC.md:51 + decisions; layer/SPEC.md:56; type/SPEC.md:52; global/SPEC.md:41 |
| D15 `token()` (`PLAN.md:207`) | css/SPEC.md:47; global, merge, site, token, type SPECs (6/13 groups) |
| D16 `css.raw` (`PLAN.md:208`) | site/SPEC.md:41; sync/SPEC.md:56; type/SPEC.md:71; recipe SPEC decisions |
| D3 `cva` (`PLAN.md:195`) | recipe/SPEC.md:50; site, sync, type SPECs |
| D8 no `@media screen` (`PLAN.md:200`) | resp/SPEC.md:60; global/SPEC.md:41; recipe SPEC decisions; type SPEC decisions |
| D17 strict/layers deferred (`PLAN.md:209`) | type/SPEC.md:52 + decisions; site/SPEC.md:41; token/SPEC.md:65 |
| D19 `types/` deferred (`PLAN.md:211`) | sync/SPEC.md:42 (with 13-importer caveat) |
| D2 no `styled/global.css` (`PLAN.md:194`) | global/SPEC.md:41; layer/SPEC.md:56; sync/SPEC.md:42 + decisions |
| D4 styled data-only (`PLAN.md:196`) | sync SPEC decisions + SYNC-13; type coverage note |
| §4.1 forbidden paths (`PLAN.md:245`) | sync/SPEC.md:42 + :56 (all: global.css, css/jsx/patterns/recipes/helpers, panda.config, virtual, tmp); prim/site SPECs (factory/patterns) |
| PARITY-04 strings (`PLAN.md:955`) | banner: global/layer/sync; `data-panda-theme`: prim/SPEC.md:41; `@pandacss`: type/SPEC.md:52 (TYPE-06) |

No PLAN-corpus item is orphaned: 13/13 claimed, most by ≥2 groups.

### 3b. Groups→PLAN: union adds ~45 Panda-corpus absences (lawful surplus)

Grouped; each lives in the cited SPEC's approved-absence or out-of-scope table: conditional (`_ltr/_rtl`, `@slot` cartesian, custom conditions table — cond/SPEC.md:36); css (`hideFrom/HideBelow`, shared-class custom utilities, `@scope`, prefix/hash/`toHash`, encoder `fromJSON`, template-literal `css` — css/SPEC.md:47); global (Panda `themes` JSON, `:where(html)` vars/`@property`, `@position-try`, Panda preflight — global/SPEC.md:41); layer (custom layer names, `recipes._base`/`slots` inner layers, `compositions` layer — layer/SPEC.md:56); merge (sort comparators, `mergeProps`/`walkObject` internals — merge/SPEC.md:46); prim (`Box`/`Flex`/`Grid`, polymorphic `as`, `cx`/`splitCssProps`, Liquid/`forwardRef` — prim/SPEC.md:41); recipe (static recipe expansion, `staticCss.recipes`, const-bound indirection — recipe/SPEC.md:50); resp (`@breakpoint` macro, `mdDown` rem epsilon, named `@container pb`, sort-mq, `{sizes.x}` — resp/SPEC.md:60); site (Vue/Svelte, tagged templates, `importMap`, `matchTag`, compiled JSX runtimes, `token()` inlining, `css.raw` — site/SPEC.md:41); static (cache/memo internals, freeform condition strings, named container statics — static/SPEC.md:51); sync (`virtual/`, watch/Vite/Webpack/CLI, `strict/layers/mcp` config — sync/SPEC.md:56); token (`semanticTokens`, `@slot` blocks, `DEFAULT`, `token.var`, asset tokens, circular refs — token/SPEC.md:47); type (bare `sm` keys, `ConditionalValue` recipe variants, `csstype` dump, atomic names in d.ts — type/SPEC.md:52). Surplus is expected: PARITY-02 defines the parity list as the union (`PLAN.md:953`).

### 3c. Deltas: 5 stragglers in neither corpus (equality fails here)

Zero-mention in all 13 SPECs verified by `rg -l '<pat>' --glob 'SPEC.md'` (§5):

- **DELTA-1** — `forced-colors`, `@supports`, `(hover: hover)` MQs: 0 in sheet (`evidence/lib-sheet-styles-css.md:64`); `_print/_motionReduce/_osDark` are covered (cond SPEC dialect) but these three have no row or absence. Propose: one COND absence line (zero-count family).
- **DELTA-2** — zero-count pseudos `:nth-child/:empty/:invalid/:visited/:indeterminate`: 0 in sheet (`evidence/lib-sheet-styles-css.md:102`); COND catalog is positive-only. Propose: one COND absence line.
- **DELTA-3** — `@font-face` `size-adjust: 104%` / `descent-override: 47%`: live on 2 of 3 lib faces (`evidence/lib-sheet-styles-css.md:78`; `evidence/lib-sheet-global-css.md:364`); LAYER-03/GLOBAL cover placement only. Touches painted lib behaviour → human-escalation candidate per `PLAN.md:221`.
- **DELTA-4** — D7-spirit defects D7 never enumerates: boolean leaks (`.focus_true { focus: true }` etc., `evidence/lib-sheet-styles-css.md:84`) and dotted passthroughs (`background: ui.panel.background`, `evidence/lib-sheet-styles-css.md:85`). Propose: extend the D7 enumeration in the parity list (auto-§3: pure defects).
- **DELTA-5** — `_file` → `::file-selector-button` (3 lib uses: `evidence/lib-sheet-styles-css.md:96`; trace `evidence/lib-sheet-global-css.md:303`): no COND/GLOBAL row names it and no SPEC absents it. Touches lib-used behaviour → human-escalation candidate (row or absence).

Net: union ⊃ PLAN corpus, but union ∪ PLAN ⊉ lib-sheet §3 inventory. The parity SPEC author must add DELTA-1..5 (absent or row) for PARITY-02's equality to hold; until then the census cannot pass with "union only".

## 4. Implications for the mini-lib world authoring (§8.15)

World scope (`PLAN.md:945`): tokens with light/dark, `font()`, `keyframes()`, ~8 `.ref-*` tag recipes via `globalCss()`, two `recipe()`s, primitives, a field bezel with `data-slot`, one `container: true` region. PARITY-01 adds: six components paint in light and dark with a `data-color-mode` flip (`PLAN.md:952`).

- **Tokens + islands** → F3–F7: needs `{light,dark}` leaves on ≥1 colour, rhythm keys incl. a fraction (`1/2r`) and a non-token decimal (`3.5r`→calc per T-E), radii, and a `font: 'sans'`/weight macro (T-F). Flip via `data-color-mode` only — never `data-panda-theme` (PARITY-04, `PLAN.md:955`).
- **~8 tag recipes** → F25/F12/F14–F16/T-A–T-E: to span the census, include (a) button with `[data-variant]` × `:is(:hover,[data-hover])` + icon `:has()` (T-C), (b) input + field bezel `:has(:focus)`/`aria-invalid` (F16), (c) file or range input — required to force DELTA-5 and vendor pseudos (F14) into present-or-absent, (d) details/summary disclosure (`_focusVisible` twin), (e) table with row `_hover`, (f) link/list for `::marker` + `_before/_after` (T-D), (g) `q` or select/textarea for placeholder dual (T-E). A progress/meter tag would additionally pin vendor pseudos; without one, F14 needs a partial-absence line.
- **Two `recipe()`s** → F25 + RECIPE rows: one with boolean axis + `defaultVariants`, one with compounds + `_hover` leaf; proves closed classes in `@layer recipes` and utilities-beat-recipes without touching Panda's static-expansion absence (recipe/SPEC.md:50).
- **Primitives** → PRIM: six PARITY-01 components should span `data-layer` stamping, `data-variant` selection, `colorMode` prop, `css=` + `_hover` StyleProps, and DOM passthrough (`id`/`aria-*`/`ref`).
- **Bezel + `data-slot`** → F16/T-C: field surface with `[data-reference-field]:has(...)` + `> [data-slot]` children; pairs with recipe absences (D9: slots are global CSS, not `sva`).
- **`container: true` region** → F32/F10: one ancestor with the macro + a `@container` utility inside (RESP), plus the body `container-type` from `globalCss` (T-B). This is a Neo superset of the lib sheet (F10 = 0) — census marks present, not absent.
- **Static cardinality** (F29) is NOT exercised by §8.15 as written: add a small `staticCss` map (list + `'*'` + `_hover`) to the world or PARITY-02 must cite STATIC-01/02 instead of the world. Same for `compile-request.json`/`jsx-elements.json` (SYNC-04, PARITY-03).
- **Keyframes/font-faces** → F27/F28: world needs ≥1 `keyframes()` + animation token and ≥1 `font()`; assert they print in `@layer global` (deliberate F27 divergence) and leave DELTA-3 (`size-adjust`) for the absence list.

## 5. Out of scope (with reasons) + rg provenance

- **Panda v1 atomic cartography** — oracle A per D20 (`PLAN.md:212`); this report covers only the lib slice.
- **Core matrix non-CHAIN census** — oracle B per D20; matrix importers cited from `evidence/generated-folder-shape.md:90` without re-survey.
- **TESTS.md row verification** — "present" claims cite SPEC dialect/station sections; confirming each TESTS.md row is the parity author's job (PARITY-02 proof is the census run, `PLAN.md:953`).
- **`@reference-ui/types` semantics** — D19 deferred (`PLAN.md:211`); counted (11 importers) but not inventoried.
- **Engine internals / goldens** — RS stations cited by SPEC reference only; `atomic-claims.md` owns engine truth.
- **Book app / harness health / timing** — owned by `coverage-lib.md` §5 exclusions and `neo-state-2026-09-17.md`.
- **Sheet drift** — lib tree dated 2026-09-16; importer counts already drifted (react 89 vs 91, types 11 vs 13). Re-run the commands below before the W4 census.

Commands (workspace root `/Users/ryn/Developer/reference-ui`):

```bash
# zero-count families in the live sheet (all → 0; data-panda-theme → 2; .ref- stems → 90; lines → 27472)
S=packages/reference-lib/.reference-ui/styled/styles.css; wc -l $S
for p in 'dir=rtl' '@container' 'group-hover' ':where(.peer)' 'prefers-color-scheme' 'data-color-mode' '@scope' 'truncate' 'divide'; do printf "%s: " "$p"; rg -c -F "$p" $S; done
rg -c -F 'data-panda-theme' $S; rg -o '\.ref-[a-zA-Z0-9_-]+' $S | sort -u | wc -l
# importer census (→ 89 / 31 / 11 / 0) and zero-use APIs (all → 0)
rg -l "from '@reference-ui/react'" packages/reference-lib/src | wc -l
rg -l "from '@reference-ui/system'" packages/reference-lib/src | wc -l
rg -l "from '@reference-ui/types'" packages/reference-lib/src | wc -l
rg -l "from '@reference-ui/styled" packages/reference-lib/src | wc -l
for p in 'sva\(' '\bcva\(' 'css\.raw' 'textStyle' 'colorPalette' 'getRhythm'; do printf "%s: " "$p"; rg -l "$p" packages/reference-lib/src | wc -l; done
rg --no-filename "from '@reference-ui/system'" packages/reference-lib/src | sort | uniq -c
# delta zero-mention proof (all → no SPEC.md; _print/_motionReduce → cond; group/peer → cond+global)
cd packages/reference-neo/tests/cases
for p in 'file-selector' '_file' 'forced-colors' '@supports' 'nth-child' ':empty' ':visited' ':indeterminate' 'size-adjust' 'descent-override' 'focus_true' 'isolation_true' 'srOnly'; do printf "%s: " "$p"; rg -l "$p" . --glob 'SPEC.md' | tr '\n' ' '; echo; done
rg -l '_groupHover|groupHover|peerFocus|peer' --glob 'SPEC.md' .
```
