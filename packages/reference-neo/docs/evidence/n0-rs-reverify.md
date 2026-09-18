# N0 oracle: RS-lane re-verify against the current engine

Question: do all 15 queued RS rows (PLAN §5.3) still reproduce against the
current engine, or has drift cleared/changed any?

Verdict: **13 reproduce verbatim, 1 changed (RS-14 core cleared in-engine,
no station yet), 1 half-cleared (RS-6 docs)**. Zero rows fully cleared.
SITE-01/02/03 engine halves are unblocked today; everything else holds.

Engine probed: `packages/reference-rs/dist/atomic.mjs` + `dist/native/
virtual-native.darwin-x64.node` (Sep 17 20:07; this checkout's node is
darwin-x64; `verify:native` flags only arm64/linux stale, x64 fresh).
Probes: throwaway `/tmp/n0-rs-reverify/probe*.mjs` + `/tmp/frozen.mjs`
via dist `compileSync` (legacy `{baseSystem, files}` and frozen
`{schemaVersion:1, spec, sourceRoot, include}` paths), reruns of
`/tmp/cond-batch4-r1/probe*.mjs`, `/tmp/neo-global-r1*.mjs`,
`/tmp/r1token/probe*.mjs`, and `pnpm agentrs v` for station counts.
No repo files created, modified, or deleted except this report.

## 1. Executive summary (12 lines)

- RS-14 changed: ternary/member/spread now emit one style plan per want on
  both request paths (e.g. ternary → 2 wants + 2 plans with declarations),
  pinned only by Rust unit tests (`extract/site_plan_tests.rs:1`, "RS-14",
  committed in HEAD); no ATM station; whole-object `css(styles)` still
  silent 0/0/0/0 as the lane text scoped (`site/TESTS.md:65-67`).
- RS-12/15/17/11/16/18/19/22/23/24/25/5 reproduce **verbatim** — same
  inputs, same wrong outputs, same diagnostics as the lane texts
  (`cond/TESTS.md:21-23`; `site/TESTS.md:48-91`; `global/TESTS.md:18-50`;
  `recipe/TESTS.md:38-61`; `token/TESTS.md:19`; `parity/TESTS.md:9-12`).
- RS-13 reproduces: `cases.test.ts` 111 failed / 13 passed (124); my
  ATM-COND-03 sample is format-only (expanded+quoted golden vs
  compact+unquoted emitter); fresh stations (COND-17/RECIPE-07/SCAN-01) green.
- RS-6 half-cleared: SPEC COND-03/08/LAYER-03 prose says `data-color-mode`
  (`atomic/SPEC.md:390-391,405-406,524`), `map.html` 3× color-mode / 0×
  `data-theme`; still stale: `map.html:544,840` (`@media`, 0× `@container`).
- RS-5 corroborated: SPEC `ATM-SITE-13` still `[ ]` (`atomic/SPEC.md:265`),
  no station folder, hostless `<Foo mt="4r"/>` extracts 1/1/1 with 0 diags.

## 2. Per-RS verdict table

| RS | Lane text | Verdict | One-line evidence |
| --- | --- | --- | --- |
| RS-5 | PLAN §5.3 one-liner (no group lane) | reproduces | hostless `<Foo mt="4r"/>` → 1 want/class/plan, 0 diags |
| RS-6 | PLAN §5.3 one-liner (docs) | changed (half cleared) | SPEC + color-mode cleared; `map.html:544,840` `@media` stale |
| RS-11 | `global/TESTS.md:18-50` | reproduces | comma output byte-identical to filed wrong CSS |
| RS-12 | `cond/TESTS.md:21` | reproduces | `'input:hover &'`, `':focus > &'` + variants → 0/0/0/0; comma control green |
| RS-13 | PLAN §5.3 one-liner (trust) | reproduces | 111/124 red; COND-03 sample format-only (layout + quoting) |
| RS-14 | `site/TESTS.md:48-71` | changed (core cleared) | ternary/member/spread → plans both paths; whole-object still 0/0/0/0 |
| RS-15 | `cond/TESTS.md:23` | reproduces | `@container` outside invalid `@supports`-in-selector; `@media` control correct |
| RS-16 | `token/TESTS.md:19` | reproduces | keyframes print `{colors.brand}`, `1r`/`4r` literally, 0 diags |
| RS-17 | `cond/TESTS.md:22` | reproduces | `_file` warns + drops; `::placeholder` only; `_checked` twins intact |
| RS-18 | `recipe/TESTS.md:38-61` | reproduces | both recipe errors bare `{severity,message}`, no file/line/column |
| RS-19 | `site/TESTS.md:73-91` | reproduces | `Bool(true)` want, 0 classes, "`true` is not valid CSS"; `container` control green |
| RS-22 | `parity/TESTS.md:9` | reproduces | `text-gradient: linear-gradient(var(--…), var(--…))`, refs resolve, property dead |
| RS-23 | `parity/TESTS.md:10` | reproduces | JSX `css={[...]}` → 0/0/0/0; single-object + call-array controls green |
| RS-24 | `parity/TESTS.md:11` | reproduces | `fontFace` array → "invalid baseSystem spec" error; single-object prints `@font-face` |
| RS-25 | `parity/TESTS.md:12` | reproduces | all six pairs emit `border-*-radius:` non-properties, 0 diags |

Counts above are wants/classes/plans/diagnostics unless noted.

## 3. Findings (input → expected → actual)

RS-5 — reproduces. Input `<Foo mt="4r" />` with no `@reference-ui/react`
import. Expected: no wants + missing-graph diagnostic. Actual: 1 want, class
`@reference-ui/lib__mt_4r` (`margin-top: calc(4 * var(--spacing-root))`),
1 plan, 0 diagnostics. SITE-01 shape (importless `<Div mt>`/`<Button color>`)
likewise extracts 2/2/2. The SPEC contradiction note still stands
(`atomic/SPEC.md:265-267`); no `ATM-SITE-13` folder exists.

RS-6 — changed (half cleared). SPEC prose: COND-03 (`atomic/SPEC.md:390-391`),
COND-08 (`:405-406`), LAYER-03 (`:524`) all say `data-color-mode`; remaining
`.dark`/`[data-panda-theme]` hits are deliberate-contrast notes (`:405`, `:840`).
`atomic/map.html`: 3× `data-color-mode`, 0× `data-theme` — cleared. Still
stale: `map.html:544` ("breakpoints to `@media`") and `map.html:840`
(`"sm" -> "@media (min-width: 640px)"`), with 0× `@container` in the file.

RS-11 — reproduces. Input `globalCss({ '.ref-stack > p, .ref-stack > ul':
{ margin: 0, '& ~ &': { marginTop: '10px' } } })`. Expected `:is()`-distributed
siblings. Actual: `.ref-stack > p, .ref-stack > ul ~ .ref-stack > p,
.ref-stack > ul { margin-top: 10px }` — byte-identical to the filed wrong
output (`global/TESTS.md:25-27`). Single-combinator (`.ref-stack > p ~
.ref-stack > p`) and comma-descendant (`.ref-a, .ref-b .ref-kid`) variants
also byte-identical (`:28-32`).

RS-12 — reproduces. Inputs `css({ 'input:hover &': { color: 'red.500' } })`,
`css({ 'input &': … })`, `css({ ':focus > &': … })` + no-space /
element-qualified / nested variants. Expected `input:hover .<class>` etc.
Actual: all 0/0/0/0 — zero wants, classes, plans, diagnostics. Control
`'&:focus, &:hover'` green: 1/1/1, sheet splits `:focus, :hover` on one class.

RS-13 — reproduces. `pnpm agentrs v modules/atomic/tests/cases.test.ts`:
111 failed / 13 passed (124); full `pnpm agentrs v atomic`: 112 failed /
59 passed (171). The 13 green include ATM-COND-17, ATM-RECIPE-07,
ATM-SCAN-01 (Sep-17 landings), so current emit matches fresh goldens. My
ATM-COND-03 sample: golden expanded multi-line with quoted
`[data-color-mode='dark']` (`output/styles.css:763`) vs engine compact
single-line `[data-color-mode=dark]` — semantically identical, format-only.
Per-file categorization remains RS-13's own job.

RS-14 — changed (core cleared, residual scope question). Ternary
`css({ color: flag ? 'cherry' : 'ocean' })`: expected one plan per want —
actual **2 wants + 2 classes + 2 plans**, plans carry declarations naming
the emitted utilities; verified on the legacy path AND the frozen path
(`{schemaVersion:1, spec, sourceRoot, include}` with sources on disk:
classes + plans `color=cherry, color=ocean, mt=gap`). Member `theme.primary`:
1/1/1. Spread `...rest` beside a literal sibling: 2/2/2. Whole-object
`css(styles)`: still 0/0/0/0, silent. Fix pinned only by `#[cfg(test)]` Rust
tests (`extract/site_plan_tests.rs`, wired at `extract/mod.rs:19-20`); no ATM
station folder. SITE-01/02/03 engine halves are satisfied as ticketed;
whole-object needs a captain scope ruling (lane text flagged it, `:65-67`).

RS-15 — reproduces. Input `css({ '@supports (display: grid)': { sm: {
'&:hover': { color: 'red.500' } } } })`. Expected `@supports` outside
`@container` with `:hover` on the selector. Actual: `@container (min-width:
640px)` outside `…c_red.500:@supports (display: grid):hover` — the at-rule
leaks into the selector, verbatim per the lane. Supports-alone, container-
outside, and hover-outside variants all mis-lower; `@media` control nests
correctly (`@media` → `@container` → `:hover`).

RS-16 — reproduces. Input `keyframes({ grow: { from: { backgroundColor:
'{colors.brand}', width: '1r' }, to: { … '4r' } } })`. Expected resolved
`var()` + rhythm calc. Actual: `@keyframes grow { from { background-color:
{colors.brand}; width: 1r; } to { … width: 4r; } }`, 0 diagnostics — verbatim.
(P13b: bare `brand` name also prints literally; hand-written `var(--…)` passes
through as the known workaround, not the claim.)

RS-17 — reproduces. Input `_placeholder` + `_file` + `_checked` colors.
Expected placeholder twins, `::file-selector-button` rule, checked twins.
Actual: warning `Unknown condition "_file"`, `_file` class dropped;
`…placeholder:c_red.500::placeholder` only (no `[data-placeholder]` twin);
`_checked` keeps `:is(:checked, [data-checked], [aria-checked=true],
[data-state="checked"])` — all verbatim. `_fileSelector` spelling also warns;
raw `'&::file-selector-button'` works as the author workaround, not the claim.

RS-18 — reproduces. Inputs `recipe(dyn)` (non-object) and duplicate
`className: 'dupBadge'`. Expected `file`/`line`/`column` on the error.
Actual: `{"severity":"error","message":"recipe(...) requires an inline
object literal as its first argument"}` and `{"severity":"error","message":
"Duplicate recipe className 'dupBadge'…"}` — bare, verbatim. Five bare
`Diagnostic::error` pushes remain (`extract/recipes/mod.rs:25,32,42,73,84`);
the `ATM-RECIPE-06/output/diagnostics.json` golden pins the bare shape.

RS-19 — reproduces. Input `<Div border />`. Expected border-macro utility +
plan. Actual: want `border:{Bool:true}`, 0 classes, 0 plans, warning
`` `border` value `true` is not valid CSS`` — verbatim. `<Div container />`
control greens (`container-type: inline-size` + plan). Refusal still pinned
deliberate (`resolve/mod.rs:282` `test_bool_want_emits_no_atom`).

RS-22 — reproduces. Input `css({ textGradient:
'linear-gradient({colors.red.200}, {colors.blue.300})' })`. Expected Panda
clip trio. Actual: `text-gradient: linear-gradient(var(--colors-red-200),
var(--colors-blue-300))` — refs resolve, dead property, 0 diags. Verbatim.

RS-23 — reproduces. Input `<Div css={[{ color: 'blue.300' },
{ backgroundColor: 'green.300' }]} />`. Expected both objects extracted.
Actual: 0/0/0/0. Single-object `css={{…}}` control (1/1/1) and `css([...])`
call control (2/2/2) both green — gap is JSX-prop-array extraction only,
verbatim.

RS-24 — reproduces. Input `fonts.display = { value, fontFace: [normalEntry,
italicEntry] }`. Expected two style-distinguished `@font-face` rules.
Actual: error diagnostic `"invalid baseSystem spec: base-system consumes
evaluated JSON only: invalid type: map, expected a string …"`, atomCount 0.
Single-object control prints `@font-face { font-family: Display; src:
url(/d.woff2); font-display: swap; font-style: normal; }` with the utility
green. Rust side still single `Option<FontFaceDefinition>`
(`base-system/src/fonts.rs:50`); Neo's `font()` already admits arrays
(`reference-neo/src/fragments/api/font.ts:28,37`).

RS-25 — reproduces. Input all six pair shorthands (`borderTopRadius`,
`borderBottomRadius`, `borderLeftRadius`, `borderRightRadius`,
`borderStartRadius`, `borderEndRadius` = `'2r'`). Expected corner expansion
painting 8px. Actual: `border-top-radius: calc(2 * var(--spacing-root))`
(and `-bottom/-left/-right/-start/-end-radius`), 6/6/6, 0 diagnostics —
all non-properties browsers drop, verbatim.

## 4. Implications for the N1 wave order

- **RS-14: start SITE-01/02/03 Neo slices at R2 now.** No Rust change is
  needed for the three waiting cases — the engine already emits wants,
  utilities, and resolving plans on both request paths. Remaining liaison
  work is (a) adopting `site_plan_tests.rs` into a real station (SPEC row +
  goldens, number at liaison's call) and (b) the whole-object scope ruling —
  neither blocks the Neo cooks.
- **RS-13 stays late but constrains verdicts, not work.** 111/124 red means
  no liaison slice gets a full-suite green until it lands — but N1 slices
  verify via behavior probes + their own new station goldens (the RS-8/9/10
  pattern, all green). Do NOT re-bless blindly: tree goldens are
  expanded+quoted while the emitter is compact+unquoted; RS-13's
  categorize-before-bless stands, with the two format dimensions (§3) as
  the starting hypothesis.
- **RS-6 shrinks to a two-line docs fix** (`atomic/map.html:544,840` `@media`
  → `@container`) plus a confirm pass. Docs-only; rides any wave or goes in
  parallel without the liaison.
- **Order otherwise unchanged.** RS-11/12/16/17/15/5/18/19/22/23/24/25 all
  reproduce exactly as ticketed; their liaison slices and waiting cases are
  unaffected by drift.
- **Engine hygiene at N1 start:** runners on this checkout load the fresh
  x64 `.node` (Sep 17 20:07); the arm64 and linux `.node` files are stale
  per `verify:native` — one rebuild at wave start heals them (ignored
  artifacts only, no source impact).

## 5. Out of scope

- Neo R2/R3 proofs for SITE-01/02/03 (behavioral plans verified; browser
  paint belongs to the cook + oracle, not N0).
- RS-13's per-file format-vs-semantic categorization and re-bless (only
  one diff sampled here plus the suite counts).
- The whole-object `css(styles)` scope ruling (captain decision; no
  station or Neo case currently claims the form).
- Archaeology of when the goldens were expanded+quoted or when the RS-14
  plan behavior landed (HEAD contains both).
- Non-atomic modules beyond the RS-24 shape check, browser checks, and any
  repo edits — this report is the only file written.
