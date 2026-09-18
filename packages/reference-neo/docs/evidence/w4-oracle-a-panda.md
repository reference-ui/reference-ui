# W4 oracle A — Panda v1 atomic style-system gaps vs Neo's 124 green cases

Source location: every Panda v1 test the three corpus docs cite lives under
`vendor/panda-v1/packages/*/__tests__/` (sparse read-only vendoring of
`@pandacss/dev@1.12.1`); nothing lives under matrix fixtures or the pnpm
store (`find matrix packages -path '*panda*__tests__*' -name '*.test.ts'`
prints nothing). Counts below via `ls`/`rg`; commands quoted inline.

## 1. Executive summary

1. Neo is 124 green (`ls -d packages/reference-neo/tests/cases/*/NEO-* | wc -l`) with 12 blocked-on-rs rows and no case folder (`rg -c '^\| NEO-[A-Z]+-[0-9]+ .*blocked-on-rs' packages/reference-neo/tests/cases/*/TESTS.md` → `packages/reference-neo/tests/cases/cond/TESTS.md:10` ×4, `packages/reference-neo/tests/cases/global/TESTS.md:10`, `packages/reference-neo/tests/cases/recipe/TESTS.md:13`, `packages/reference-neo/tests/cases/site/TESTS.md:5` ×5 incl. `:17`–`:18`, `packages/reference-neo/tests/cases/token/TESTS.md:18`).
2. 8 blocked rows carry `[panda-v1]` evidence and are the headline gaps: parent combinators (`vendor/panda-v1/packages/core/__tests__/atomic-rule.test.ts:231`), `:focus > &` (`packages/reference-neo/tests/cases/cond/TESTS.md:15`), mixed `@supports` (`vendor/panda-v1/packages/core/__tests__/rule-processor.test.ts:1928`), `& ~ &` siblings (`vendor/panda-v1/packages/core/__tests__/global-css.test.ts:243`), ternary/const/spread (`vendor/panda-v1/packages/parser/__tests__/output.test.ts:878`), keyframe refs (`vendor/panda-v1/packages/generator/__tests__/generate-keyframes.test.ts:50`).
3. 10 silent gaps have no row and no SPEC absence: invalid `/abc` (`vendor/panda-v1/packages/core/__tests__/color-mix.test.ts:184`), decimal `0.33%` (`vendor/panda-v1/packages/core/__tests__/color-mix.test.ts:89`), `textGradient` (`vendor/panda-v1/packages/core/__tests__/gradient.test.ts:70`), array `css` prop (`vendor/panda-v1/packages/parser/__tests__/jsx.test.ts:529`), StyleProp `!` (zero prim hits; proposed `packages/reference-neo/docs/evidence/panda-v1-parser-config-corpus.md:302`), recipe first-child+responsive (`vendor/panda-v1/packages/core/__tests__/recipe-nesting.test.ts:55`), reset scope (`vendor/panda-v1/packages/generator/__tests__/generate-reset.test.ts:193`), union negatives (`vendor/panda-v1/packages/generator/__tests__/generate-token-dts.test.ts:37`), dark mix (`vendor/panda-v1/packages/generator/__tests__/generate-token.test.ts:870`), hyphenation (`vendor/panda-v1/packages/shared/src/hypenate-property.ts:6`).
4. `/half` opacity tokens (`vendor/panda-v1/packages/core/__tests__/color-mix.test.ts:229`) and breakpoint/condition token axes are out-of-dialect (`rg -i opacity packages/reference-neo/src/fragments/api/tokens.ts` → empty) but unlisted — the census needs absence rows, not silence (`packages/reference-neo/PLAN.md:642`).
5. All other ~155 vendor test files are proven green, recorded SPEC absences, or engine-golden territory (ORDER/SHORT stations, namer escapes) needing no browser case (§2 inventory).
6. PARITY consequence: author the mini-lib strictly inside the proven dialect (`packages/reference-neo/PLAN.md:952`) and disposition all 22 items in the PARITY-02 census (`packages/reference-neo/PLAN.md:953`) or G4's absence-equality check fails.

## 2. Inventory (panda test file → family → Neo case or GAP)

Families: CSS-CORE, COND, RESP, TOKEN, IMPORTANT, MERGE, LAYER, RECIPE,
STATIC, GLOBAL, KEYF, NAME, EXTRACT, JSXPROPS, CONFIG, TYPES, OUT (not
Reference's dialect), NA (plumbing/bench/fixture). GAP-B = blocked row
exists; GAP-S = silent (no row, no absence); ABS = recorded SPEC absence;
ENG = engine-golden territory, no browser case needed. All vendor paths
below are relative to `vendor/panda-v1/`.

### core/__tests__/ (33 files)

| Panda test file | Family | Neo case / disposition |
|---|---|---|
| `atomic-rule.test.ts` | COND/RESP/IMPORTANT | NEO-COND-01/02/03/04/09, NEO-RESP-01/02/03, NEO-CSS-03/08; **GAP-B** COND-05+COND-10 (RS-12); ABS RTL+hideFrom (COND/RESP SPECs) |
| `rule-processor.test.ts` | MERGE/COND/RECIPE/TOKEN | NEO-MERGE-03, NEO-CSS-04/05/11, NEO-COND-07, NEO-RECIPE-03; **GAP-B** COND-15 (RS-15); ABS truncate/hash/static-expansion |
| `style-decoder.test.ts` | CSS-CORE | NEO-TOKEN-01 (refs); rest ENG/OUT (hash wire) |
| `style-encoder.test.ts` | CSS-CORE | OUT (hash wire format, CSS SPEC) |
| `utility.test.ts` | TOKEN | NEO-TOKEN-08, NEO-CSS-04 (shapes); ABS colorPalette D14, hideFrom |
| `static-css.test.ts` | STATIC | NEO-STATIC-01/02/03, NEO-RECIPE-04, NEO-RESP-07; documented-not-proven: freeform `'.mobile &'` (STATIC SPEC), named `@container` (RESP SPEC, ATM-COND-16 golden); ABS cache/palette/slots |
| `conditions.test.ts` | COND | NEO-COND-08; ABS multi-block `@slot`, themes |
| `color-mix.test.ts` | TOKEN | NEO-TOKEN-03/04; **GAP-S** F1 invalid `/abc` (:184), F2 decimal `0.33%` (:89); F3 `/half` out-of-dialect-unlisted |
| `recipe.test.ts` | RECIPE | NEO-RECIPE-02/08/09; tooltip dark soup diverges by D1 (proven via RECIPE-04 dark arms) |
| `recipe-nesting.test.ts` | RECIPE | **GAP-S** F4 first-child+responsive (:55) |
| `atomic-recipe.test.ts` | RECIPE | Contrast: RECIPE-09 proves the Reference direction (variant class, not atoms) |
| `slot-recipe.test.ts` | RECIPE | ABS D9 |
| `global-css.test.ts` | GLOBAL | NEO-GLOBAL-01/03/05/07, NEO-MERGE-07; **GAP-B** GLOBAL-06 (RS-11); ABS divide |
| `global-fontface.test.ts` | GLOBAL | NEO-GLOBAL-08 |
| `global-vars.test.ts` | GLOBAL | ABS ( `:root`-vars shape; Neo uses data-color-mode islands) |
| `global-position-try.test.ts` | GLOBAL | ABS (not in authoring) |
| `serialize.test.ts` | TOKEN | NEO-TOKEN-01/12; NEO-TOKEN-02 (contrast: error, D13); ABS `token()` D15, divideY, `{sizes}`-in-query |
| `classname.test.ts` | NAME | NEO-CSS-08/09 |
| `prefix.test.ts` | NAME | ABS (no prefix/hash hooks) |
| `breakpoints.test.ts` | RESP | NEO-RESP-05/06 (px-epsilon `@container` form); NOTE `smOnly`≡`smToMd` equality unproven-trivial |
| `sort-mq.test.ts` | MERGE/RESP | NEO-RESP-06 |
| `sort-css.test.ts` | MERGE | ENG (ORDER stations pin print order; MERGE SPEC records) |
| `sort-style-rules.test.ts` | MERGE/RECIPE | NEO-RECIPE-04/10, NEO-LAYER-05 |
| `sort-at-rule.test.ts` | MERGE | NEO-RESP-06 (sheet order + cascade) |
| `composition.test.ts` | TOKEN/LAYER | ABS (no textStyles/animationStyles) |
| `gradient.test.ts` | CSS-CORE | NEO-CSS-06 (bgGradient refs); **GAP-S** F5 textGradient (:70) |
| `complex-rule.test.ts` | COND/RESP | NEO-RESP-04 |
| `custom-utility.test.ts` | CSS-CORE | ABS (no custom-utility registry) |
| `selectors.test.ts` | COND | Diverges by D1 (COND SPEC four-way row) |
| `stringify.test.ts` | CSS-CORE | ABS `@scope`; kebab-case implicit everywhere |
| `template-literal.test.ts` | OUT | ABS (SITE SPEC; ATM-SITE-12 refuses) |
| `file-matcher.test.ts` | OUT | ABS (importMap/matchTag anti-goals) |
| `import-map.test.ts` | OUT | ABS (Reference imports only) |
| helpers/benches (`fixture`, `create-anatomy`, 2 benches) | NA | n/a |

### parser/__tests__/ (27 files)

| Panda test file | Family | Neo case / disposition |
|---|---|---|
| `output.test.ts` | EXTRACT/JSXPROPS | NEO-MERGE-01 (multi-arg), NEO-PRIM-02 (:74), NEO-PRIM-04 (:2441), NEO-SITE-04 (aliases), NEO-SITE-12 anti-goal (:3057), NEO-CSS-08 (:2886 hatch part + D17); **GAP-B** SITE-01 (:878); ABS importMap/matchTag/palette/debug/staticCss |
| `preset-patterns.test.ts` | OUT | ABS (patterns pack) |
| `jsx.test.ts` | JSXPROPS | NEO-PRIM-02/03, NEO-SITE-10; **GAP-S** F6 array `css` prop (:529); NOTE const-ternary (:352) folds into SITE-01/RS-14 wait; ABS factory/runtimes/minimal/debug |
| `css-raw-edge-cases.test.ts` | EXTRACT | NEO-SITE-06 (fn spread closed door); ABS `css.raw` API |
| `pattern-raw-extraction.test.ts` | OUT | ABS |
| `css-raw-variants.test.ts` | OUT | ABS |
| `css-2.test.ts` | EXTRACT | NEO-SITE-04 (alias), NEO-SITE-05 (unimported differ) |
| `vue.test.ts` / `svelte.test.ts` / `svelte-runes.test.ts` | OUT | ABS (React 19 TSX only) |
| `css-raw-spread.test.ts` | EXTRACT | NEO-SITE-07 (cross-file shape); ABS `css.raw` API |
| `cva.test.ts` / `sva.test.ts` | OUT | ABS (Neo `recipe()`; D9) |
| `token.test.ts` | EXTRACT | ABS D15 |
| `namespace.test.ts` | EXTRACT | NEO-SITE-04 |
| `jsx-recipe.test.ts` | OUT | ABS (slots/dotted) |
| `import-map.test.ts` | OUT | ABS |
| `css.test.ts` | EXTRACT | NEO-COND-07/09 shapes (rtl part ABS) |
| `css-raw.test.ts` | OUT | ABS |
| `static-css.test.ts` (parser) | OUT | ABS (static recipe expansion) |
| `styled.test.ts` | OUT | ABS |
| `ast-dynamic.test.ts` | EXTRACT | ENG (config recipe calls) |
| `jsx-pattern.test.ts` / `patterns.test.ts` / `string-literal.test.ts` | OUT | ABS |
| `css-prop.test.ts` | JSXPROPS | NEO-SITE-10, NEO-PRIM-02 |
| `import.test.ts` | EXTRACT | NEO-SITE-04 (alias part); importMap part ABS |
| `fixture.ts` / bench | NA | n/a |

### extractor/__tests__/ (3 files)

| Panda test file | Family | Neo case / disposition |
|---|---|---|
| `extract.test.ts` | EXTRACT | NEO-SITE-05/06/08; **GAP-B** SITE-01/02/03 (RS-14 covers ternary arms, member access, identifier spread); NOTE unbox-conditions spread + template-interpolation access are ENG/R1 territory |
| `unbox.test.ts` | EXTRACT | Same as above (L4304 const map → SITE-02; L4328 nested spread → SITE-03) |
| `declarations-files.test.ts` | OUT | ABS (fragments eval in Node) |

### config/__tests__/ (12 files)

| Panda test file | Family | Neo case / disposition |
|---|---|---|
| `merge-config.test.ts` | CONFIG | NEO-SYNC-10 (contrast: later-wins, arrays replace) |
| `validate-config.test.ts` | CONFIG | NEO-SYNC-08 (contrast; Neo validator is its own 5-rule surface) |
| `bundle-config.test.ts` | CONFIG | Host-only (ui.config + esbuild); no case needed |
| `merge-presets` / `merge-hooks` / `preset-resolved-hook` | OUT | ABS (no presets/hooks) |
| tsconfig ×5 + `bundle-n-require` | NA | n/a plumbing |

### node/__tests__/ (5 files)

| Panda test file | Family | Neo case / disposition |
|---|---|---|
| `diff-engine.test.ts` | OUT | Outcome covered by NEO-SYNC-06/07 (artifact ids themselves are Panda internals) |
| `output-engine.test.ts` | OUT | NEO-SYNC-06/07 |
| `glob-dirname.test.ts` | CONFIG | NEO-SYNC-09 |
| `config-reload.test.ts` / `load-tsconfig.solution.test.ts` | NA | n/a (no watch mode; solution tsconfig unneeded) |

### generator/__tests__/ (20 files)

| Panda test file | Family | Neo case / disposition |
|---|---|---|
| `cleanup-selector.test.ts` | NA | ABS (plumbing) |
| `css-fn.test.ts` | NA | ENG (Neo plans differ from packed strings) |
| `generate-css-fn.test.ts` | TYPES | NEO-CSS-05 (null/false overloads); ABS template-literal `css`, `css.raw` |
| `generate-keyframes.test.ts` | KEYF | NEO-TOKEN-11 (authored keyframes in `global`); **GAP-B** TOKEN-13 (:50, RS-16) |
| `generate-pattern.test.ts` | OUT | ABS |
| `generate-prop-types.test.ts` | TYPES | ABS D17 (`WithEscapeHatch`/`ImportantMark`) |
| `generate-recipe.test.ts` | TYPES | NEO-TYPE-03 (contrast: plain unions, not `ConditionalValue`) |
| `generate-reset.test.ts` | LAYER | NEO-LAYER-04 (flag true/false); **GAP-S** F7 parent scope (:193) |
| `generate-style-props.test.ts` | TYPES | NEO-TYPE-01; ABS strict variant D17 |
| `generate-themes.test.ts` | OUT | ABS (brand packs; D1) |
| `generate-token-dts.test.ts` | TYPES | NEO-TYPE-02 (ColorToken); **GAP-S** F8 spacing negatives (:37) |
| `generate-token-js.test.ts` | OUT | ABS D15 (`token()`/`token.var`) |
| `generate-token.test.ts` | TOKEN/CSSVAR | NEO-TOKEN-05/06/07/08; ABS themes/composites/palette/multi-block/selector-OR/hashed/`:where(html)`; **GAP-S** F9 semantic dark mix (:870); NOTE gutter-`@media` + forced-colors out-of-dialect-unlisted, deep-trees ENG |
| `setup-artifacts.test.ts` | CONFIG | NEO-SYNC-02 (Neo's own §4.1 inventory) |
| `spec-*` ×4 + `split-css.test.ts` | OUT | ABS (studio/spec JSON) |

### token-dictionary/__tests__/ (19 files)

| Panda test file | Family | Neo case / disposition |
|---|---|---|
| `alias.test.ts` | TOKEN | NEO-TOKEN-06 |
| `color-mix.test.ts` | TOKEN | NEO-TOKEN-03/04; **GAP-S** F9 semantic `_dark` var map (shared with generate-token :870) |
| `color-palette.test.ts` | TOKEN | ABS D14 |
| `colors.test.ts` | TOKEN | Documented out-of-scope (`semanticTokens` shape; Reference uses light/dark leaves) |
| `default.test.ts` | TOKEN | ABS (no `DEFAULT` in `tokens()`) |
| `expand-references.test.ts` | TOKEN | NEO-TOKEN-01/12; NEO-TOKEN-02 (contrast); ABS `token()` fallbacks |
| `format-*` ×5 | NA | ENG views; ABS `formatTokenName` |
| `middleware.test.ts` | TOKEN | NEO-TOKEN-08; ABS hashed vars |
| `semantic-token.test.ts` | TOKEN | NEO-TOKEN-07 (decimals); NOTE nested `osDark:highCon` out-of-dialect-unlisted (no condition axis on leaves) |
| `spacing.test.ts` | TOKEN | NEO-TOKEN-08; NOTE breakpoint-conditioned values out-of-dialect-unlisted |
| `tokens.test.ts` | TOKEN | Covered piecewise by NEO-TOKEN-01..12 |
| `transform-asset/border/gradient/shadow` | TOKEN | ABS (composite token objects; authors write strings) |

### shared/__tests__/ (15 files) + source-only helpers

| Panda test file | Family | Neo case / disposition |
|---|---|---|
| `arbitrary-value.test.ts` | CSS-CORE | NEO-CSS-07 |
| `astish.test.ts` | OUT | ABS (not an author API) |
| `cache-map` / `deep-set` / `pick` / `split-props` / `traverse` / `split` | NA | n/a or trivially covered |
| `css-var.test.ts` | NAME | NEO-TOKEN-07; ABS hash; NOTE percent/`sizes` out-of-dialect |
| `esc.test.ts` | NAME | NEO-CSS-09, NEO-TOKEN-07 |
| `merge-props.test.ts` | MERGE | Outcome covered by NEO-MERGE-01/02/05 (SPEC records the mapping) |
| `property-priority.test.ts` | MERGE | NEO-MERGE-03 (outcome) |
| `slots.test.ts` | OUT | ABS D9 |
| `string-literal.test.ts` | OUT | ABS |
| `walk-object.test.ts` | MERGE | NEO-MERGE-08; divergence recorded (arrays are responsive, not leaves) |
| source-only `toResponsiveObject` / `isImportant` | RESP/IMPORTANT | NEO-RESP-02 / NEO-CSS-08 |
| source-only `hypenateProperty` | NAME | **GAP-S** F10 vendor hyphenation |
| source-only `toHash` / `sortConditions` | NA | ABS / ENG |

### preset-base + sandbox/codegen (1 + 20 files)

| Panda test file | Family | Neo case / disposition |
|---|---|---|
| `preset-base/utility.test.ts` | NA | Canon owns aliases (no case) |
| sandbox `css.test.ts` | CSS-CORE | NEO-CSS-07/09 (class-string shapes); NOTE token-in-condition unlisted-trivial |
| sandbox `cva` / `sva` / `slot-recipe` / `styled-factory` / frameworks ×8 | OUT | ABS (factory/patterns/frameworks) |
| sandbox `recipe.test.ts` | RECIPE | RECIPE group covers selection; NOTE bad-compound runtime error unlisted-trivial |
| sandbox `format-names` | NAME | NEO-CSS-09 |
| sandbox `jsx-minimal` / `jsx-none` / `strict*` ×3 | OUT | ABS (jsxModes; D17) |

## 3. Findings by family (input → expected output)

GAP-B items already have TESTS.md rows with RS owners — stated briefly with
the Panda input/expected for the W4 cartographer. GAP-S items are the new
findings; each needs a W4 disposition (mint row / SPEC absence / fold).

### B1. Parent combinators — GAP-B (NEO-COND-05 + NEO-COND-10, RS-12)

Panda `atomic-rule.test.ts:231`: input
`{ 'input:hover &': { bg: 'red400', fontSize: { sm: '14px', lg: '18px' } } }`
→ `input:hover .\[input\:hover_\&\]\:bg_red400 { background: red400 }` plus
sm/lg media twins. Panda `atomic-rule` "outlier": input
`{ ':focus > &': { color: 'white' } }` →
`:focus > .\[\:focus_\>_\&\]\:c_white { color: … }`.
Neo today: zero classes, zero diagnostics (R1 probes 05a–05d, 10a–10d;
`cond/TESTS.md:10`, `cond/TESTS.md:15`). Reference-dialect behavior
(keys are plain author input); must stay out of the mini-lib until RS-12
lands.

### B2. Mixed `@supports` + `@container` + `&:hover` — GAP-B (NEO-COND-15, RS-15)

Panda `rule-processor.test.ts:1928`: a three-step condition array
(`@media`, `@supports (display: flex)`, `&:hover`) nests at-rules outside
the hover selector and sorts deterministically against equivalent nested
keys. Neo today mis-lowers `@supports` into selector fragments
(`cond/TESTS.md:20`). Mini-lib must not use `@supports` keys.

### B3. `& ~ &` under a comma selector — GAP-B (NEO-GLOBAL-06, RS-11)

Panda `global-css.test.ts:243`: input
`{ 'body > p, body > ul': { '& ~ &': { marginTop: 10 } } }` →
`:is(body > p) ~ :is(body > p),body > ul ~ body > ul
{ margin-top: var(--spacing-10) }` (verified verbatim above).
Neo today has no `:is()`-sibling lowering (`global/TESTS.md:10`).
Mini-lib sibling gaps must use plain selectors until RS-11 lands.

### B4. Ternary arms / const objects / identifier spreads — GAP-B (NEO-SITE-01/02/03, RS-14)

Panda `output.test.ts:878` "runtime conditions": `css({ color: isHovered ?
"blue.100" : "red.100" })` extracts **both** arms as data plus `{}`.
Panda `unbox.test.ts:4304`: `const spacings = { md: 6 }` + `my:
spacings.md` → `my: 6`. Panda `unbox.test.ts:4328`: later nested spread
wins (`backgroundColor: "green.100"`). Per D11 Neo compiles both literal
arms at extract but currently emits utilities with no `stylePlans`, so
runtime `css()` returns `''` (`site/TESTS.md:5`, `site/TESTS.md:6`,
`site/TESTS.md:7`). The mini-lib must inline every style object literally
— no ternaries, no const indirection, no spreads in `css()`/StyleProps —
until RS-14 lands. (Also folds the NOTE in §2: JSX const-ternary
`jsx.test.ts:352` and member access ride the same RS row.)

### B5. Keyframe token refs + rhythm — GAP-B (NEO-TOKEN-13, RS-16)

Panda `generate-keyframes.test.ts:50`: `roll: { from: { h: '4' }, to: {
h: '8' } }` → `height: var(--sizes-4)` / `var(--sizes-8)` inside
`@keyframes`. Neo today prints `{colors.brand}` / `4r` literally with
zero diagnostics (`token/TESTS.md:18`). Mini-lib keyframes must use
hand-written `var(--…)` (the documented workaround), never token refs.

### B6. Non-Panda blocked rows (for the census, not this oracle)

NEO-COND-14 (`cond/TESTS.md:19`, lib twins; note its TESTS label "RS-14"
collides with PLAN's RS-14 — PLAN §5.3 relabels COND's to RS-17),
NEO-RECIPE-07 (`recipe/TESTS.md:13`, RS-18 locations), NEO-SITE-13/14
(`site/TESTS.md:17`, `site/TESTS.md:18`, RS-19/RS-5). No Panda cite; the
mini-lib must avoid `_file`, boolean-attr macros, and hostless worlds.

### S-findings (silent gaps — no row, no absence)

**F1. Invalid slash opacity passes through.** Panda
`color-mix.test.ts:184`: `css({ bg: 'red/abc' })` →
`.bg_red\/abc { background: red/abc }` (no color-mix; verified verbatim).
Slash opacity IS Reference dialect (NEO-TOKEN-03 proves `/40`), but no
case and no SPEC row says what `red/abc` does (passthrough? diagnostic?).
Needs a decision + row or absence.

**F2. Decimal slash quirk.** Panda `color-mix.test.ts:89`:
`css({ bg: 'red/0.33' })` → `color-mix(in srgb, red 0.33%, transparent)`
(note `0.33%`, almost certainly a Panda bug). Same disposition as F1;
likely an approved absence citing D7 (bugs are not parity).

**F3. Named opacity token `/half`.** Panda `color-mix.test.ts:229`:
`css({ bg: 'red/half' })` with `opacity.half = 0.5` →
`color-mix(in srgb, red 50%, transparent)`. Out-of-dialect: Neo's
`tokens()` surface has no opacity category
(`rg -i opacity packages/reference-neo/src/fragments/api/tokens.ts`
prints nothing). Recommend a one-line SPEC absence, not a case.

**F4. Recipe nested `&:first-child:hover` + responsive color.**
Panda `recipe-nesting.test.ts:55`: variant `sm` carries
`'&:first-child': { '&:hover': { color: { base: 'red.200', md:
'gray.300' } } }` → `.text--variant_sm:first-child:hover` in base AND
inside `@media (min-width: 48rem)` with the SAME class (no `md:` prefix).
`rg first-child packages/reference-neo/tests/cases/recipe/` (excluding
`.reference-ui`) prints nothing; RECIPE-09 proves only plain `_hover`
on a variant. In-dialect; mint a row or record why not.

**F5. `textGradient` clip.** Panda `gradient.test.ts:70`:
`css({ textGradient: 'linear-gradient({colors.red.200},
{colors.blue.300})' })` → background-image with resolved vars PLUS
`-webkit-background-clip: text; color: transparent`. Canon ships the
property (`packages/reference-rs/modules/canon/generate/overlay/extensions.ts:30`,
`packages/reference-rs/modules/canon/src/css/properties.rs:2443`) but
`rg textGradient` over case READMEs/specs prints nothing and CSS-06
covers only `linear-gradient()` refs. In-dialect; mint or absence.

**F6. Array `css` prop.** Panda `jsx.test.ts:529` "should extract array
css prop": `<styled.div css={[{ color: 'blue.300' },
{ backgroundColor: 'green.300' }]}>` extracts both objects. `rg
'css=\{\['` over case specs/worlds prints nothing; PRIM-02 proves only
single-object `css`. In-dialect (StyleProps host + `css` prop both
exist); mint or absence.

**F7. Reset parent scope.** Panda `generate-reset.test.ts:193`:
`preflight: { scope: '.pd-reset' }` prefixes every reset selector with
`.pd-reset`. NEO-LAYER-04 proves only flag true/false. Needs a decision:
is scoped reset in the dialect (mint) or out (absence)?

**F8. Spacing-union negatives.** Panda `generate-token-dts.test.ts:37`:
`SpacingToken` includes `"-1" … "-0.5" … "-gutter"`. NEO-TYPE-02 pins
only `ColorToken` + TS2322. The negative-value runtime is proven
(TOKEN-08); the union membership is not. Trivial TYPE row or a line in
TYPE-02's spec.

**F9. Semantic dark color-mix.** Panda `generate-token.test.ts:870`:
semantic mixes redeclare per condition (`.light` 32% vs `.dark` 50%).
NEO-TOKEN-03 proves base slash mix, NEO-TOKEN-05 proves islands; the
combination (mix *inside* a dark leaf) is unproven. One TOKEN row.

**F10. Vendor-property hyphenation.** Panda
`shared/src/hypenate-property.ts:6`: `WebkitBoxOrient` →
`webkit-box-orient`, `--foo` untouched, `msFoo` → `-ms-foo`.
NEO-CSS-11 proves only custom-prop casing; `rg -i webkit` over
`tests/cases/css` hits generated folders only. Trivial CSS row or ENG.

**Out-of-dialect-unlisted (recommend absence lines, never cases):**
breakpoint-conditioned token values (`spacing.test.ts` semantic spacing;
generate-token gutter `@media (min-width: 64rem)`), nested token
conditions (`semantic-token.test.ts:39` `osDark:highCon`), forced-colors
islands (`generate-token.test.ts:565`; `rg forced-colors
packages/reference-rs/modules/atomic/` prints nothing — no engine
preset), `token()` nested fallbacks beyond D15, percent cssVar
(`--sizes-100\%`; no `sizes` category). None has a lib author or a
`tokens()` surface axis.

## 4. Implications for the PARITY mini-lib world and census

`PLAN.md:943`–`955` (§8.15): one mini-lib world (tokens with light/dark,
`font()`, `keyframes()`, ~8 `.ref-*` tag recipes, two `recipe()`s,
primitives, a `data-slot` bezel, one `container: true` region) plus four
cases. D20 (`PLAN.md:212`) makes this report + oracle B (matrix
non-CHAIN) + oracle C (lib census) the cartography inputs.

**Authoring constraints on the mini-lib world (must hold until the RS
lane drains):** inline every style object literally (B4 — no ternaries,
const refs, or spreads in extraction positions); no parent-combinator or
parent-of-self keys (B1); no `@supports` keys (B2); no `& ~ &` self-
sibling selectors (B3); keyframes use hand-written `var(--…)` only (B5);
no `_file` / boolean-attr macros / hostless-patient worlds (B6); no
`red/abc`-style invalid slashes, `textGradient`, array `css` props,
StyleProp `!`, `:first-child` inside variants, or scoped reset (F1–F10)
until each is dispositioned. Everything the world DOES use must already
be green: islands + `_dark` (TOKEN-05, COND-04, PRIM-07), container
region (RESP-07), bezel (COND-07, GLOBAL-10), tag recipes (GLOBAL-01–05),
recipes (RECIPE-01–06/08/09/10).

**PARITY-02 family census:** the checked-in family table needs four
disjoint lists — (a) proven families → green case ids; (b) the 12
blocked rows with RS ids (NOT absences — G3 permits them, G4 must show
them as known-unproven, not silently missing); (c) the union of group
SPEC absence/out-of-scope rows (G4 at `PLAN.md:642` requires the census
absence list to equal exactly this union); (d) dispositions for the 22
items in §3 (8 Panda-blocked + 4 non-Panda-blocked + 10 silent). Today's
(c) is short: F3 + the five out-of-dialect-unlisted items need new SPEC
absence lines, and F1/F2/F4–F10 each need a row or an absence, or the
G4 equality check fails. Two already-documented soft spots to carry
verbatim into the census: freeform `'.mobile &'` static conditions are
"Not proven" (STATIC SPEC §6) and named `@container` has engine goldens
but no Neo surface (RESP SPEC).

**PARITY-01/03/04:** no new work implied — light/dark paint, the
specifier census, and the panda-ism `rg` ride on green cases (SYNC-05,
TYPE-01/06, GLOBAL-09). PARITY-04's forbidden list (`panda`,
`data-panda-theme`, `--made-with-panda`, `@pandacss`) is orthogonal to
this oracle's gaps.

## 5. Out of scope (with reasons)

Deliberate non-dialect (all already in group SPEC absence tables; the
census carries them, W4 mints nothing): slot recipes/`sva` (D9, zero lib
use); `cva` name (D3) and `styled()`/jsx factory (Neo primitives);
patterns pack incl. `divideX/Y`; `css.raw` (D16) and `token()` (D15);
`importMap`/`matchTag`/PascalCase guessing (anti-goal; SITE-05/12 prove
the refusal); `staticCss` *config shape* (STATIC proves the engine
form); template-literal syntax (ATM-SITE-12 refuses); `strictTokens`/
hatches (D17); Panda `themes` JSON + `[data-panda-theme]` (D1); virtual
`colorPalette` (D14); composite shadow/gradient/border/asset token
objects (lib has zero); prefix/hash/`formatTokenName` hooks; encoder
hash wire; `textStyles`/`layerStyles`; `@property` global-vars shape;
`@position-try`; `@scope`; config `conditions` table; multi-block
`@slot` cartesian (engine test shape); `hideFrom`/`hideBelow`, `truncate`
booleans, `debug` (Panda-only utilities); RTL/`_ltr` (zero lib hits);
viewport `@media` breakpoints (D8); Panda preflight spelling, `*`
var-dump, selector comma-merging (D7/format); studio/spec JSON,
artifacts, split-css, benches, diff/output internals, tsconfig plumbing,
bundle formats, config bundling, Svelte/Vue/compiled-JSX extraction,
framework style-contexts. Panda bugs (`.size_md{width:md}`, `{…}`
leftover class, duplicated dark semantics, `0.33%`-style quirks per F2)
are never parity (D7). Outside this oracle's beat by construction:
reference-core matrix non-CHAIN tests (oracle B), the lib-family census
(oracle C), `coverage-map.md` rows (emitted artifacts, already mapped),
and `@reference-ui/types`/Tasty (D19 deferred).
