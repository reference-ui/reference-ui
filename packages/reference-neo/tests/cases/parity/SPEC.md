# PARITY — the lib-shaped world

PARITY proves Neo end to end against one world authored the way
`packages/reference-lib/src` is: tokens with light/dark leaves, `font()`,
`keyframes()`, ~8 `.ref-*` tag recipes via `globalCss()`, two `recipe()`s,
primitives, a field bezel with `data-slot`, and one `container: true` region
(PLAN §8.15). Four cases: the world syncs and paints in light and dark
(PARITY-01, carrying the 18 W4 probes), the 43-row lib-family census passes
(PARITY-02), every consumer specifier resolves (PARITY-03), and no panda-isms
leak into the generated folder (PARITY-04). This group owns no `src/`; it
reads everything and edits nothing.

## The mini-lib world (the dialect)

The world authors strictly inside the proven dialect (w4-synthesis §3):
inline every style object literally — no ternaries, const refs, or spreads
in extraction positions (RS-14); no parent-combinator keys (RS-12), no
`& ~ &` (RS-11); `@supports` keys landed with RS-15 (P5); keyframes
hand-write `var(--…)` (RS-16 landed, world unchanged); no `_file`
(RS-17 landed, world unchanged), boolean-attr macros (RS-19 landed,
world unchanged), or hostless worlds (RS-5 landed, world unchanged); no
F1-style slashes, scoped reset, or undispositioned F-items. Tags span button, input + bezel, file-or-range,
disclosure, table, link + `q` (oracle C §4); a small `staticCss` map covers
F29 cardinality; the flip is `data-color-mode` only, never
`data-panda-theme`. RS-18 (recipe diagnostic locations) needs no world
avoidance — it is diagnostics-only.

## Proof basis (no engine stations owned)

PARITY leans on every group's green cases, never on stations directly.
Known-unproven at W4 start (w4-synthesis §1 `(b)` — blocked rows with RS
owners, never absences): COND-05/10 (RS-12), COND-15 (RS-15), GLOBAL-06
(RS-11), SITE-01/02/03 (RS-14), TOKEN-13 (RS-16), COND-14 (RS-17),
RECIPE-07 (RS-18), SITE-13 (RS-19), SITE-14 (RS-5). Two R1 tasks stay open
for the parity cooks (w4-synthesis §4 2b): `& + &` (B-G2 → RS-20 or probe
P2) and `red/abc` (A-F1 → RS-21 or row-or-absence).

## Decisions

D1 (`data-color-mode` only; the matrix `data-panda-theme` pin is a recorded
divergence — P1 + PARITY-04). D7 (Panda bugs are not parity; extended here
by DELTA-4: boolean leaks + dotted passthroughs, captain auto-§3). D8
(`@container` only). D19 (`types/` deferred; PARITY-03 re-checks the
13-importer caveat). D20/D21 (W4 cartography sources; in-dialect micro-gaps
are proven by PARITY-01 probes, not new group rows).

## Approved absences — the union (G4)

PARITY-02's census list equals this table exactly: the union of group SPEC
approved-absence + out-of-scope entries (counts reconciled 2026-09-17, `★`
= W4 `(c)` line appended by this cartographer) plus the parity-owned
P-DELTA-4. `(b)` blocked rows are known-unproven and never appear here.

| Group | n | Absence union (approved ‖ out-of-scope) |
| --- | ---: | --- |
| sync | 5+5 | types/ pkg D19 · font-registry.json · packaged core types · styled/tokens\|themes\|extensions/ · D7 bugs ‖ panda.config + styled machinery · virtual/ · watch/Vite/Webpack/CLI/session · strict/layers/mcp config · cva/css.raw |
| cond | 5+6 | rtl/_ltr/_rtl · @slot cartesian · custom conditions table · ★DELTA-1 forced-colors/@supports/(hover:hover) · ★DELTA-2 zero-count pseudos ‖ rtl wraps · @slot · conditions table · four-way dark · _themePrimary · hideFrom/hideBelow |
| token | 16+8 | colorPalette D14 · token() D15 · composite objects · themes JSON · :where(html) · hashed vars · ★F2 0.33% D7 · ★F3 /half · ★OOD bp-conditioned values · ★OOD osDark:highCon · ★OOD forced-colors islands · ★OOD token() fallbacks · ★OOD percent cssVar · leading-zero numerics · flat-nested token miss · slash diagnostic wording ‖ semanticTokens · @slot OR · DEFAULT · strict hatches · token.var · text/layer/animation styles · asset tokens · circular refs |
| css | 7+6 | hideFrom/hideBelow · shared-class custom utils · @scope · token() · capital-W vendor keys · numerics lower to px · no autoprefixer ‖ prefix/hash · fromJSON wire · truncate · textStyle/animationStyle · divideX/Y · template-literal css |
| resp | 3+7 | @media breakpoints D8 · hideFrom/hideBelow · {sizes.x} ‖ @breakpoint macro · rem epsilon · RTL×resp · named container statics · sort-mq · recipe resp variants (→RECIPE-08) · globalCss resp keys (→GLOBAL) |
| merge | 4+5 | red-then-blue · mergeProps · walkObject leaves · GHOST-04 ‖ sort comparators · hideFrom/hideBelow · shared className · token() · sva merge |
| recipe | 4+6 | sva D9 · cva D3 · _base inner layer · static expansion ‖ sva/slots layer · cva · nested layers · static combo expansion · staticCss.recipes · const-bound indirection |
| global | 6+10 | banner+var-dump D7 · base global.css artifact D2 · tokens-layer keyframes · comma-merge · colorPalette/size_md/leftover/dup-dark D7 · data-theme rules in global ‖ themes JSON · :where(html)+@property · @position-try · divideX/Y · static cardinality · viewport breakpoints · groupHover/peerFocus · sva · token() · preflight |
| site | 9+7 | tagged templates · Vue/Svelte · compiled JSX · importMap · matchTag/PascalCase · token() inlining · css.raw · element-access refusal · computed-key refusal ‖ styled() factory · patterns pack · cva/sva · template-literal syntax · jsxFramework modes · strictTokens type-level · staticCss config |
| prim | 3+5 | Box/Flex/Grid · as · cx/splitCssProps ‖ styled()/factory · pattern fns · data-panda-theme/data-theme · liquid/forwardRef · sva on primitives |
| static | 4+5 | static recipes · static slots/patterns · colorPalette wildcards · named container statics ‖ cache/memo/bench · freeform condition strings · sva statics · text/layer statics · prefix/hash |
| layer | 6+4 | empty base/recipes bodies · recipes._base/slots inner · compositions layer · banner+var-dump D7 · colorPalette atoms · ★F7 scoped reset ‖ custom layer names · LightningCSS five-layer · static recipe expansion · panda.config/global.css inputs |
| type | 6+6 | strict hatches D17 · pattern+factory types · recipes d.ts + tokens.mjs/token() · styled global.d.ts · TokenCategory/ColorPalette unions · text/layer/animation+asset+formatTokenName+hashed ‖ bare sm keys · ConditionalValue variants · csstype dump · atomic names in d.ts · cva/css.raw · token.var/globalVars |
| ★ parity-owned | 1 | P-DELTA-4: boolean leaks (`.focus_true`, `.isolation_true`, …) + dotted passthroughs (`background: ui.panel.background`) — D7 extension, captain auto-§3 (w4-synthesis C-DELTA-4) |

Group union: 158 entries (78 approved + 80 out-of-scope, incl. 10 appended
`★`); census list = 159 with P-DELTA-4. B-G13 strictTokens needs no new
line — type/SPEC.md already absents it (D17).

## Out of scope (carried, never census input)

| Feature | Reason |
| --- | --- |
| Matrix mcp/session/virtual/watch suites | Tooling + daemon + mirror + watch loop (oracle B §5); virtual/watch/types legs already in sync SPEC |
| Matrix reference (Tasty) suite | D19 deferred leg, carried by sync SPEC |
| Matrix chain suite | Excluded per D20 |
| Engine-golden territory (ORDER/SHORT stations, namer escapes) | No browser case needed (oracle A §2 ENG) |
| Harness, playground, Book app | Not style behaviour |
