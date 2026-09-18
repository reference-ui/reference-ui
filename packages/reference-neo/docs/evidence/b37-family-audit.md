# B37 family audit — shorthand-safe emission beyond border/outline

Read-only recon (2026-09-18). B37 landed border+outline decomposition with
const-ternary resolution (RS-37) but not the gotcha-family audit. This file
is that audit. The voyage log is captain-owned; findings land here.

Method: core behavior from `packages/reference-core` config + battery +
`landing-baseline-core/react-styles.css` artifact shapes; Neo/Atomic behavior
from committed stations (`ATM-SHORT-01..09`, rust `shorthands/tests.rs`) and
throwaway `/tmp` probes (`/tmp/b37-probe.mts`, `/tmp/b37-probe2.mts`,
`compileSync` + lib-system-spec fixture, uncommitted). Raw rule counts are
not compared — only emitted declaration shapes for identical inputs.

## 1. Battery inventory: what the core battery covers vs skips

Source: `packages/reference-core/src/system/panda/config/extensions/shorthands/shorthands.test.ts`
(38 `it` blocks, 99 `expect`s, 5 describes). The "48-row" label from the B37
slice does not match the committed file (38 `it`s); coverage below is from
the file itself — the count mismatch does not affect the verdicts.

Covered (props the `it`s touch): `border`, `borderTop`, `borderRight`,
`borderBottom`, `borderLeft`, `outline`. Behaviors: 6 permutations ×2
(border base + outline), partials (width/style/color alone + pairs),
hairlines, rhythm units/fractions, calc/min/max/clamp, thin/medium/thick,
color-mix/oklch, var() fallbacks, `none`, zero formats, 5 global keywords,
whole-value var()/token paths, factory-custom utilities, outline `auto`
(CSS UI 4) and the outline-`none` a11y ring.

Skipped: all six logical-axis utilities the same factory ships —
`borderInline`/`borderX`, `borderBlock`/`borderY`, `borderInlineStart`/
`borderStart`, `borderInlineEnd`/`borderEnd`, `borderBlockStart`,
`borderBlockEnd` (`border.ts:53-98`) — zero mentions in the battery file.
Skipped: every non-border/outline family (`background`, `flex`,
`textDecoration`, `font`, dimensionals, radius, `gap`, `grid`, `overflow`,
`place-*`, `transition`, `animation`, `columnRule`, `listStyle`,
`columns`, …). Core decomposes nothing outside border/outline:
`shorthands/index.ts:9-12` spreads only `borderShorthandUtilities` +
`outlineShorthandUtilities`.

## 2. Family × core × neo × verdict

`PARITY` = same emitted shape for identical input. `PARITY*` = shapes differ
only where Neo is provably safer with solo-computed-identical output (no
filing — a filing would demand making Neo worse). `GAP` = Neo diverges
unsafely → filed RS row in §3.

| # | Family (identical input) | Core emits | Neo/Atomic emits | Verdict | Evidence |
| --- | --- | --- | --- | --- | --- |
| 1 | `border` + 4 physical directionals, `1px solid [color]` | width+style (+color) longhands | width+style (+color) longhands | PARITY | core battery `shorthands.test.ts:123-537`; neo `ATM-SHORT-01/04/06/07`, `shorthands/tests.rs:161-204` |
| 2 | `outline`, incl `none` + `auto` | width+style; `none`→a11y ring+offset; `auto` style | same trio | PARITY | core `outline.ts:8-24`, battery `:539-727`; neo `ATM-SHORT-02`, `tests.rs:207-216`, `border.rs:43-56`. B37's 1 warning-only delta (voyage-log) has no committed doc — could not re-verify |
| 3 | `borderInline`/`borderBlock` (+`borderX`/`Y`), `1px solid` | **decomposed** (`borderInlineWidth`+`Style`, …) | **raw** `border-inline: 1px solid` / `border-block: 1px solid` (resets color to currentColor) | GAP → RS-38 | core `border.ts:53-68`; neo probe batch 1 (`bd-x_1px_solid`, `bd-y_1px_solid` raw); root: canon gives 2 axis-half longhands (`longhands.rs:39,89`), `border.rs:28-30` only routes len-3 |
| 4 | `borderInlineStart/End`, `borderBlockStart/End` (+`Start`/`End`), `1px solid` | decomposed | decomposed (4 width+style rules) | PARITY | core `border.ts:69-98`; neo probe batch 1 (`border-inline-start-width: 1px` + `-style: solid`, …) |
| 5 | `borderColor`/`Width`/`Style` multi-value (`red blue`, `1px 2px`, `solid dashed`) | raw (`border-color: red blue`) — no core utility | raw, same shapes | PARITY | mechanism: no core utility (`index.ts:9-12`); neo probe batch 1 (`bd-c_red_blue`, `bd-w_1px_2px`, `border-style_solid_dashed` raw) |
| 6 | `background`/`bg` (`red`, gradient) | raw (`background: …`) | raw, same shapes | PARITY | core baseline `:772,812,857`; neo probe batch 1 (`bg_red`, gradient raw). Both carry the reset gotcha; core README §5 prescribes `backgroundColor` for fills — same prescription covers Neo. Bonus: Neo prints `background-color` after `background` in both authorship orders (probe batch 2 `bg-order-a/b`), deterministic where core is authorship-ordered |
| 7 | `flex` (`1`, `1 1 0%`, `0 0 auto`, `auto`, `2 30px`) | `flex: 1 1 0%` for authored `1`; raw triple otherwise | **border-semantic mis-expansion**: `1`→lone `flex-grow: 1` (basis stays `auto`, core computes `0%`); `1 1 0%`→lone `flex-grow: 1`; `0 0 auto`→grow+basis (shrink dropped); `auto`→lone `flex-basis: auto`; `2 30px`→lone `flex-grow: 2` (basis dropped). Zero diagnostics | GAP → RS-39 (LIVE) | core baseline `:991` (from `field.ts:42` `flex: '1'`), `:5183` `.flex_1`, `:5371` `.flex_0_0_auto`; lib victims `Listbox.tsx:195`, `Showcase.book.tsx:114`, `Primitives.book.tsx:217`, `Splitter.tsx:468` (+dynamic `:48` unextractable); neo probe batches 1+2; root: `FLEX_LONGHANDS` len 3 (`longhands.rs:215`) routes into `border.rs:24-34` width/style/color classification |
| 8 | `flexFlow`, `gap`, `overflow`, `placeContent`, `transition`, `animation`, `grid`, `mask`, `borderImage`, `offset`, `textEmphasis` (multi-token) | raw (no core utility; e.g. `transition: …`, `gap: …`, `place-content: center`) | raw, same shapes | PARITY | core baseline `:5367` transition, `:5191` gap, `:518` place-content; neo probe batches 1+2 (all raw). `textDecorationColor` also prints after `textDecoration` deterministically (probe `textdec-order`) |
| 9 | `textDecoration` (`underline dotted`) | raw | raw, identical | PARITY | core baseline `:1493`; neo probe batch 1 (`text-decoration_underline_dotted`) |
| 10 | `font` | **token macro** (`fontFamily`+`fontWeight` preset), not the CSS shorthand | **same token macro** (`font::lower_font`) | PARITY (out of scope: macro prop, never the CSS `font` shorthand in either system) | core `extensions/api/font.ts:19-25` (`getFontPreset`); neo `resolve/mod.rs:86-88` |
| 11 | `margin`/`padding`/`inset` multi-token (`-4px 0`, `10px 20px`) | raw (`margin: -4px 0`) | **expands to 4 longhands** | PARITY* (Neo-safer; solo-computed-identical; mixed `p`+`pt` differs with Neo deterministic — SHORT-06 pins longhand-after-shorthand) | core baseline `:3052`; neo `ATM-SHORT-05` (`styles.css:583-586` four rules, spec pins shapes) |
| 12 | logical dimensional multi-token (`marginInline`, `paddingBlock`, `insetInline/Block`, `scrollMargin`, …) | raw (no core utility) | raw, same shapes | PARITY | mechanism + core single-token raws (baseline `:323` `padding-inline`, `py_5r`); neo probe batches 1+2 (`mx_1r_2r`, `py_1r_2r`, `inset-x_0_auto`, `scrm_1r_2r` raw) |
| 13 | radius pairs (`borderTopRadius`, …) | Panda corner expansion (RS-25 premise) | corner expansion, one value → both corners | PARITY | neo `ATM-SHORT-09`, `pair.rs:10-27`, `tests.rs:38-62`; real `borderRadius`/`borderTopLeftRadius` pass through (`tests.rs:147-158`; probe: `rounded_1r_2r` raw with per-token rhythm resolution) |
| 14 | `textGradient` | Panda clip trio (RS-22 premise) | clip trio | PARITY | neo `ATM-SHORT-08`, `resolve/mod.rs:99-101` (`gradient::lower`) |
| 15 | `columnRule`/`rowRule` (`1px solid red`) | raw (no core utility) | **decomposed** width/style/color (semantics genuinely are width/style/color) | PARITY* (accidentally-correct; solo-computed-identical; must stay pinned when border.rs is gated — see RS-40) | neo probe batch 2 (six correct rules) |
| 16 | other 3-longhand props (`columns`, `listStyle`, `gridTemplate`, `lineClamp`, `caret`, `fontSynthesis`, `marker`, `verticalAlign`, + webkit mirrors) | raw (no core utility) | **border-semantic mis-expansion, silent**: `lineClamp 2`→`max-lines: 2px` (invalid CSS); `gridTemplate 1fr 1fr`→`grid-template-areas: 1fr`; `caret red`→`caret-shape: red`; `listStyle square inside`→`list-style-image: square`; `columns 100px 3`→lone `column-width`; `fontSynthesis …`→`font-synthesis-small-caps: weight`; `verticalAlign baseline`→`baseline-source: baseline` | GAP → RS-40 (latent: no lib authorship) | canon len-3 tables (`longhands.rs:151-152,215,258-262,268-269`, …); neo probes batches 1+2; zero diagnostics; lib grep: no authorship |

Root cause shared by RS-39/RS-40: `border.rs:26-30` routes **any** prop
whose canon longhands number exactly three through border width/style/color
classification (`parser.rs:14-33`). The gate is a count, not a family.

## 3. Filed follow-ups (parity TESTS.md RS lane)

- **RS-38** — logical border-axis decomposition (`borderInline`/`borderBlock`
  + `borderX`/`Y` aliases). Input: `<Div borderInline="1px solid"
  borderInlineColor="blue.600" />` (+`borderBlock` twin). Expected: width+style
  longhands per `border.ts:53-68`, sibling color wins, no bare `border-inline:`
  reset. Latent (no lib authorship, no baseline lines). Suggested station:
  `ATM-SHORT-10`.
- **RS-39** — `flex` border-semantic mis-expansion (LIVE: `Listbox.tsx:195`,
  `field.ts:42`, `Showcase.book.tsx:114`, `Primitives.book.tsx:217`,
  `Splitter.tsx:468`). Input: `flex="1"`, `"1 1 0%"`, `"0 0 auto"`, `"auto"`,
  `"2 30px"`. Expected: core-shape emission (`flex: 1 1 0%` for `1` per
  baseline `:5183`, raw triple otherwise) — liaison to confirm whether the
  `1→1 1 0%` triple is Panda or pipeline behavior and match it. Suggested
  station: `ATM-SHORT-11`.
- **RS-40** — len-3 trap for non-border 3-longhand props (`columns`,
  `listStyle`, `gridTemplate`, `lineClamp`, `caret`, `fontSynthesis`,
  `marker`, `verticalAlign`, webkit mirrors). Input: one probe per prop
  (§2 #16). Expected: raw passthrough (core/Panda shape) except
  `columnRule`/`rowRule`, whose decomposition stays pinned. Gate `border.rs`
  on family (width/style/color longhand names), not on count. Latent.
  Suggested station: `ATM-SHORT-12`.

## 4. Notes

- No in-pass fix: RS-38 needs a canon/routing change (len-2 axis halves,
  not the B37 len-3 path); RS-39/40 need a family gate + a liaison decision
  on the flex triple. None is "trivially the same B37 code path", so: filed
  and stopped, per bounds.
- `font` full-shorthand values (`font="italic bold …"`) dump into the font
  macro in Neo — not filed: `font` is a token macro in both systems and lib
  never authors it.
- `borderRadius="1r 2r"` resolves rhythm per token in Neo; no core-shape
  evidence exists for that input (never authored) — PARITY by passthrough
  path, token-resolution caveat noted, not filed.
- Probes live only in `/tmp` (`b37-probe.mts`, `b37-probe2.mts`); no
  committed tests added, no lib/book edits, tree otherwise untouched.
