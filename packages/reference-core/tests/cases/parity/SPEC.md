# PARITY — the lib-shaped world

PARITY proves Core end to end against one world authored the way
`packages/reference-lib/src` is: tokens with light/dark leaves, `font()`,
`keyframes()`, ~8 `.ref-*` tag recipes via `globalCss()`, two `recipe()`s,
primitives, a field bezel with `data-slot`, and one `container: true` region
(PLAN §8.15). Four cases: the world syncs and paints in light and dark
(PARITY-01, carrying the 18 probes), the 43-row lib-family census passes
(PARITY-02), every consumer specifier resolves (PARITY-03), and no panda-isms
leak into the generated folder (PARITY-04). This group owns no `src/`; it
reads everything and edits nothing.

## The mini-lib world (the dialect)

The world authors strictly inside the proven dialect:
inline every style object literally — no ternaries, const refs, or spreads
in extraction positions (RS-14); no parent-combinator keys (RS-12), no
`& ~ &` (RS-11); `@supports` keys are in place with RS-15 (P5); keyframes
hand-write `var(--…)` (RS-16, world unchanged); no `_file`
(RS-17, world unchanged), boolean-attr macros (RS-19 is in place,
world unchanged), or hostless worlds (RS-5, world unchanged); no
F1-style slashes, scoped reset, or undispositioned F-items. Tags span button, input + bezel, file-or-range,
disclosure, table, link + `q`; a small `staticCss` map covers
F29 cardinality; the flip is `data-color-mode` only, never
`data-panda-theme`. RS-18 (recipe diagnostic locations) needs no world
avoidance — it is diagnostics-only.

## Proof basis (no reference-rs cases owned)

PARITY leans on every group's green cases, never on cases directly.
Blocked rows with RS owners are known-unproven, never absences: the census's
`(b)` table lists them, and it is empty. `& + &` is proven by probe P2 and
`red/abc` by probe F1.

## Rules

Colour mode is `data-color-mode` only; the matrix `data-panda-theme` pin is a recorded divergence (P1 + PARITY-04).

Panda bugs are not parity. P-DELTA-4 extends that rule with boolean leaks and dotted passthroughs.

Style-prop breakpoints use `@container` only; globalCss breakpoint keys print viewport `@media` (global/SPEC.md, Breakpoints).

`types/` is deferred; PARITY-03 re-checks the 13-importer caveat.

In-dialect micro-gaps are proven by PARITY-01 probes, not by new group rows.

## Approved absences — the union (G4)

PARITY-02's census list equals this table exactly: the union of group SPEC
approved-absence + out-of-scope entries (counts reconciled; `★` marks the ten approved absences whose group SPEC entry
carries an F, OOD or DELTA id) plus the parity-owned
P-DELTA-4. `(b)` blocked rows are known-unproven and never appear here.

| Group | n | Absence union (approved ‖ out-of-scope) |
| --- | ---: | --- |
| sync | 5+5 | types/ fourth package · font-registry.json · packaged retired reference-core types · styled/tokens\|themes\|extensions/ · Panda bugs ‖ panda.config + styled machinery · virtual/ · Vite/Webpack/CLI/session · mcp config · cva/css.raw |
| cond | 5+6 | rtl/_ltr/_rtl · @slot cartesian · custom conditions table · ★DELTA-1 forced-colors/@supports/(hover:hover) · ★DELTA-2 zero-count pseudos ‖ rtl wraps · @slot · conditions table · four-way dark · _themePrimary · hideFrom/hideBelow |
| token | 16+8 | colorPalette virtual · token() string helper · composite objects · themes JSON · :where(html) · hashed vars · ★decimal slash opacity prints 0.33% · ★F3 /half · ★OOD bp-conditioned values · ★OOD osDark:highCon · ★OOD forced-colors islands · ★OOD token() fallbacks · ★OOD percent cssVar · leading-zero numerics · flat-nested token miss · slash diagnostic wording ‖ semanticTokens · @slot OR · DEFAULT · strict hatches · token.var · text/layer/animation styles · asset tokens · circular refs |
| css | 7+6 | hideFrom/hideBelow · shared-class custom utils · @scope · token() · capital-W vendor keys · numerics lower to px · no autoprefixer ‖ prefix/hash · fromJSON wire · truncate · textStyle/animationStyle · divideX/Y · template-literal css |
| resp | 3+7 | @media breakpoints · hideFrom/hideBelow · {sizes.x} ‖ @breakpoint macro · rem epsilon · RTL×resp · named container statics · sort-mq · recipe resp variants (→RECIPE-08) · globalCss resp keys (→GLOBAL) |
| merge | 4+5 | red-then-blue · mergeProps · walkObject leaves · GHOST-04 ‖ sort comparators · hideFrom/hideBelow · shared className · token() · sva merge |
| recipe | 4+6 | sva slot recipes · cva name · _base inner layer · static expansion ‖ sva/slots layer · cva · nested layers · static combo expansion · staticCss.recipes · const-bound indirection |
| global | 8+8 | banner+var-dump · base global.css artifact · tokens-layer keyframes · comma-merge · colorPalette/size_md/leftover/dup-dark · data-theme rules in global · viewport breakpoints · @position-try ‖ themes JSON · :where(html)+@property · divideX/Y · static cardinality · groupHover/peerFocus · sva · token() · preflight |
| site | 9+7 | tagged templates · Vue/Svelte · compiled JSX · importMap · matchTag/PascalCase · token() inlining · css.raw · element-access refusal · computed-key refusal ‖ styled() factory · patterns pack · cva/sva · template-literal syntax · jsxFramework modes · strictTokens type-level · staticCss config |
| prim | 3+5 | Box/Flex/Grid · as · cx/splitCssProps ‖ styled()/factory · pattern fns · data-panda-theme/data-theme · liquid/forwardRef · sva on primitives |
| static | 4+5 | static recipes · static slots/patterns · colorPalette wildcards · named container statics ‖ cache/memo/bench · freeform condition strings · sva statics · text/layer statics · prefix/hash |
| layer | 6+4 | empty base/recipes bodies · recipes._base/slots inner · compositions layer · banner+var-dump · colorPalette atoms · ★F7 scoped reset ‖ custom layer names · LightningCSS five-layer · static recipe expansion · panda.config/global.css inputs |
| type | 6+6 | strict hatches · pattern+factory types · recipes d.ts + tokens.mjs/token() · styled global.d.ts · TokenCategory/ColorPalette unions · text/layer/animation+asset+formatTokenName+hashed ‖ @sm breakpoint keys · ConditionalValue variants · csstype dump · atomic names in d.ts · cva/css.raw · token.var/globalVars |
| ★ parity-owned | 1 | P-DELTA-4: boolean leaks (`.focus_true`, `.isolation_true`, …) + dotted passthroughs (`background: ui.panel.background`) — parity-owned extension of the rule that Panda bugs are not parity |

Group union: 158 entries (80 approved + 78 out-of-scope, incl. 10
`★`); census list = 159 with P-DELTA-4. strictTokens needs no new
line — type/SPEC.md already absents its hatch names. The `strict`
category list is wired (config → typegen) and is not a new absence.

## Out of scope (carried, never census input)

| Feature | Reason |
| --- | --- |
| Matrix mcp/session/virtual/watch suites | Tooling + daemon + mirror + watch loop; virtual/watch/types legs already in sync SPEC |
| Matrix reference (Tasty) suite | deferred leg, carried by sync SPEC |
| Matrix chain suite | Excluded |
| Engine-golden territory (ORDER/SHORT cases, namer escapes) | No browser case needed |
| Harness, playground, Book app | Not style behaviour |
