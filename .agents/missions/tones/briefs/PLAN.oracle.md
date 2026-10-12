# PLAN.oracle — tones: a named-opacity slice of the colour system

Reply with `STATUS: DONE` (or `STATUS: REFUSED`) as your first line.

Pinned commit: `7c4651378` (branch `public-release`). Read-only review of a
design before implementation. Argue from the code; open every file you cite.

## Objective (owner-ratified shape — review the details, not the shape)

Reference UI has **shades** (palette steps `blue.50 … blue.950`). Add **tones**:
a colour at a *named opacity*. Prior art: Arc
(`/Users/ryn/Developer/Platform/lib/arc/src/tokens/intensity.ts`,
`src/system/resolution/composeArcTint.ts`): ghost .04 · medium .10 · firm .14 ·
strong .18, colour × named alpha. Today the docs diagram kit fakes it with ~100
lines of `color-mix` literals (`packages/reference-docs/src/components/diagram/DiagramPanel.tsx`,
rules in `DESIGN.md` beside it).

Ratified:
1. New token category `tones`, declared through `tokens()`. The base system
   (`@reference-ui/lib`'s theme, which docs and consumers `extends`) ships
   ghost · medium · firm · strong. Projects override or extend.
2. It rides the existing opacity modifier. `blue.500/10` already resolves to
   `color-mix(in srgb, var(--colors-blue-500) 10%, transparent)`
   (`packages/reference-rs/modules/atomic/src/resolve/tokens/mod.rs`
   `split_opacity` / `format_color_mix`; stations `ATM-TOKEN-03`, `ATM-TOKEN-06`).
   The segment after `/` may now be a tone name: `bg="blue.500/medium"`. Numeric
   modifiers stay byte-for-byte; zero golden drift on existing stations.
3. **The property picks the amount.** A tone carries a value per *role*; medium
   is 10% on surfaces and 34% on lines. Defaults: surface 4/10/14/18, line
   22/34/46/58.
4. Blend with `transparent` (alpha), `in srgb`, like Arc.
5. Unknown tone name → diagnostic in the style of ATM-TOKEN-06's malformed-
   modifier warning, with a did-you-mean.
6. Colour props type-accept `<colourToken>/<toneName>` if typegen can express it.
7. Works through fan-out on external (prebuilt) components
   (`STYLE_PROP_EXTERNAL.md`, matrix `matrix/tests/chain/T17`): tone names
   resolve against the *consumer's* tokens.

## Proposed design (review this)

### A. Authoring (tokens)

```ts
// packages/reference-lib/src/core/theme/tones.ts (new; added to the
// base-system generator's TOKEN_FILES so lib_fixture/lib.json regenerates)
tokens({
  tones: {
    ghost:  { surface: { value: '4%' },  line: { value: '22%' } },
    medium: { surface: { value: '10%' }, line: { value: '34%' } },
    firm:   { surface: { value: '14%' }, line: { value: '46%' } },
    strong: { surface: { value: '18%' }, line: { value: '58%' } },
  },
})
// a project may add a flat tone (one amount for every role) or a dark override:
tokens({ tones: { hush: { value: '6%' }, medium: { surface: { value: '10%', dark: '12%' } } } })
```

No new lowering: `tones` is an open category; leaves become
`--tones-medium-surface`, `--tones-medium-line`, `--tones-hush` in `@layer
tokens` like any token (incl. `[data-color-mode=dark]` overrides).

### B. Resolution (atomic `resolve/tokens`)

- `path/<suffix>`: if `<suffix>` is digits (`%` optional) → unchanged numeric
  path. If `<suffix>` is an identifier `[A-Za-z][A-Za-z0-9_-]*` **and** `path`
  resolves (existing `lookup_entry`) to an entry of category `colors` → tone
  path. Otherwise behaviour is exactly today's (malformed-opacity warning when
  `malformed_opacity` says so, else passthrough). So `gridRow: 'header/footer'`,
  `font: '12px/normal'`, `aspectRatio` etc. cannot change.
- Tone lookup for (name N, role R): `tones.N.R` → `tones.N` (flat leaf) →
  `tones.N.surface` (a surface-only tone serves every role). Miss → new
  passthrough warning `ATM-W-UNKNOWN-TONE` ("unknown tone `mediun` in
  `blue.500/mediun`", help: did you mean `medium`; fix line naming
  `tokens({ tones: … })` or `/<0-100>`), value stays raw, mirroring
  `ATM-W-MALFORMED-OPACITY`.
- Emit **custom properties, not literals**:
  `color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-surface), transparent)`.
  Rationale: tones stay themeable (dark override, scoped re-declaration of
  `--tones-*`), consistent with colours already being `var()`s. Cost: the class
  is invalid-at-computed-value-time if `--tones-*` is undefined, which cannot
  happen when resolution succeeded against the same dictionary that prints
  `@layer tokens`.
- Brace interpolation `{colors.blue.500/medium}` inside composites
  (`resolve/tokens/interpolate.rs`): same tone path, role from the *outer*
  property. An unknown tone inside braces: proposal is the same
  `ATM-W-UNKNOWN-TONE` warning and fail closed like an unknown `{ref}` (drop the
  atom), since a raw `{…}` segment is invalid CSS.
- Negated tokens (`-{…}/x`), `staticCss`, CSS colour keywords
  (`white/medium`, `currentColor/medium`): not extended (numeric modifiers do
  not support keywords today either).

### C. Role map (point 3) — role is a fixed engine vocabulary: `surface`, `line`

Keyed by canonical property (aliases canonicalise through canon first):

- **line** — anything painted as an edge or stroke: every `border*Color` and
  `border`/`borderTop`/… composites, `outline`/`outlineColor`, `columnRuleColor`,
  `rowRuleColor`, `ruleColor`, `textDecorationColor`, `textEmphasisColor`,
  `stroke`/`strokeColor`, `webkitTextStroke*`, `caretColor`, `boxShadow` /
  `boxShadowColor`, `textShadow`/`textShadowColor`, and **`color` (text)** —
  glyphs are strokes; Arc's guidance is that tones are usually too faint for
  text, and the line amount is the less-wrong one.
- **surface** — areas and everything else: `background*`/`bg`, `fill`/`fillColor`,
  `accentColor`, `floodColor`, `lightingColor`, `stopColor`, `gradientFrom/Via/To`,
  `scrollbarColor`, `webkitTapHighlightColor`, unknown/custom properties (`--x`).

Projects choose amounts per role; they cannot add roles.

### D. Types (point 6, typegen `modules/typegen/src/emit/tokens.rs`, `style.rs`, `strict.rs`)

- Register `tones` as a known category (else `collect_token_categories` warns
  for every project). Emit `export type ToneToken = 'firm' | 'ghost' | 'medium' | 'strong'`
  from the **first path segment** of `tones.*` keys (not `medium.surface`).
- `export type TonedColorToken = \`${ColorToken}/${ToneToken}\``; colour props
  become `StylePropValue<ColorToken | TonedColorToken | (string & {})>`; strict
  colour props add `TonedColorToken` to `COLOR_VALUE_PARTS`. With no tones the
  aliases print `never` (core-category behaviour). Lib has roughly 300–400
  colour paths, so ~1.5k template members; we will measure `.d.ts` bytes and
  `tsc` time on the docs app before/after.

### E. External components (point 7)

No new mechanism: fan-out already resolves external wants with the consumer's
`BaseSystem`, so a consumer's custom tone resolves there; class stems are
value-constructive in both namers (`js/namer/value.ts`), so `bg_blue.500/medium`
meets. Proof: add a consumer-local tone (`t17ProbeTone`) and a toned probe on a
prebuilt component to `matrix/tests/chain/T17` (and/or a docs icon example),
plus an atomic station that compiles an external want with a custom tone.

### F. Stations (atomic SPEC.md, `tests/cases/ATM-TOKEN-*`)

New: happy path (`bg`/`borderColor` with `/medium` from one word → surface vs
line vars), per-role amounts across the role map incl. interpolated composite,
unknown-name diagnostic with suggestion, numeric modifier unchanged next to
tones in one sheet, custom tone via a station `baseSystem.json` (flat + per-role
+ dark override printed in `@layer tokens`). Intended drift: only goldens that
print the full lib `@layer tokens` (`ATM-SYS-01`) and typegen goldens.

## Questions

1. Role map: is `color` → line right, or should text be surface/excluded? Is
   `boxShadow` → line (rings) right versus drop shadows? Anything in canon's
   `COLOR_PROPERTIES` (`packages/reference-rs/modules/canon/src/css/color.rs`)
   misfiled? Should the role vocabulary stay closed at two?
2. Custom properties vs inlined literals: any hazard (cascade layers, portable
   `[data-layer]` token selectors in `modules/atomic/src/stylesheet/system_layers`,
   extends/layers composition, fan-out where the consumer's sheet must define
   `--tones-*`, `@property`, SSR) that should flip the choice?
3. Type size: is the template-literal union the right expression, and is there
   a cheaper typing (e.g. `` `${ColorToken}/${string}` ``) that keeps
   completion useful without the cross product? Any TS limit risk?
4. External path: anything in fan-out (`STYLE_PROP_EXTERNAL.md` §5,
   `extract/jsx`, the namers, `NEO-NAMER-01` differential gate) that would
   stem or resolve `/medium` differently on the two sides?
5. Unknown tone inside braces: warn+drop as proposed, or the existing
   `UnknownTokenReference` error?
6. Slicing: proposed order — (S1) base-system/lib tones tokens + fixture
   regen; (S2) atomic resolution + diagnostic + stations; (S3) typegen;
   (S4) T17 probe; (S5) docs migration + pages. Which slices deserve their own
   review, and what must be sequenced?

Return findings in the skill format (ID, severity, file:line, evidence,
recommendation, validation gap), a concrete answer to each question, and a
verdict. Do not edit any files.
