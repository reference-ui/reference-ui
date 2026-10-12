# Tones mission — living log

Tones: a colour at a named opacity (`bg="blue.500/medium"`), the second
concept beside shades. Owner-ratified shape; Oracle gate `PLAN.oracle`
(reports/) returned "findings (proceed)", all adopted.

## Decisions

- **Authoring.** `tokens({ tones: { medium: { surface: { value: '10%' }, line: { value: '34%' } } } })`.
  A flat leaf (`hush: { value: '6%' }`) serves every role. Values must be
  `<number>%` (light and dark); anything else is treated as an unknown tone
  (TONES-04). Lib's theme (`core/theme/tones.ts`) ships ghost 4/22, medium
  10/34, firm 14/46, strong 18/58 (surface/line).
- **Emit.** Custom properties: `color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-surface), transparent)`.
  Themeable, dark-overridable, scoped re-declarable (Oracle Q2).
- **Roles** (closed vocabulary, engine-keyed by canonical property):
  line = borders and border composites, outline, column/row/rule colours,
  text decoration and emphasis, stroke, caret, box/text shadow, `color`,
  `webkitTextFillColor`, and the webkit/moz mirrors of those; surface =
  everything else (background, fill, accent, flood, lighting, stop, gradient,
  scrollbar, tap highlight, msScrollbar*, fillImage/strokeImage, custom props).
  `boxShadow`/`textShadow`/`outline` composites are not canon colour props,
  so tones reach them only through braces (TONES-03).
- **Gate order** (TONES-05/01/06): whole-path hit → numeric → tone (base must
  be a `colors` entry, no leading `-`, not a CSS colour keyword) → today's
  behaviour. Lookup `tones.N.role` → `tones.N` → `tones.N.surface`.
- **Diagnostics.** Bare unknown tone: `ATM-W-UNKNOWN-TONE` warning, raw
  passthrough, did-you-mean over tone names. Braced unknown tone: existing
  `UnknownTokenReference` error with a tone-aware message, atom dropped
  (TONES-02).
- **Types.** `ToneToken` (first path segments), `TonedColorToken = \`${ColorToken}/${ToneToken}\``,
  added to colour props (open and strict); `Tokens.tones`.
- **External.** No new mechanism; T17 gains a consumer-local tone probe on a
  `color` (line role) prop (TONES-14).

## Slices

| id | scope | status |
| --- | --- | --- |
| S3 | typegen: tones category, ToneToken, TonedColorToken | |
| S1 | lib tones tokens, generator, fixture regen/re-freeze | |
| S2a | atomic resolution + ATM-W-UNKNOWN-TONE wiring | |
| S2b | ATM-TOKEN stations + SPEC + neo diag case | |
| S4 | T17 consumer tone probe | |
| S5 | docs: palette + colour pages, diagram migration | |

## Log
