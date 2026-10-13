# Diagram design — colour composition

How the docs diagram kit looks, and the rules we want to keep. The palette lives
in `diagram-theme.fragments.ts`; the surface treatment lives in `DiagramPanel.tsx`.
Tones are core Reference UI now (`bg="blue.500/medium"`), so the kit spends them
rather than mixing its own. Everything else (`Diagram.tsx` types, `DiagramArrow`,
the `specimen-*` files) is structure or content.

## The environment

Every panel belongs to **one environment**: the midnight slate ramp.

| role | light | dark |
| --- | --- | --- |
| canvas | `slate.100` | `slate.950` |
| panel | `#ffffff` | `slate.900` |
| hairline | `slate.200` | `slate.800` |
| chip / inset | `slate.100` | `slate.800` |

A tone never replaces the environment — it is mixed **over** it (below).

## Tone is meaning, intensity is loudness

Two orthogonal axes, both owned by the primitive, not the caller's judgement:

- **`tone`** — `neutral | blue | green | amber | red | violet`. What the panel
  *means*: blue builds, green generates/confirms, amber fences, red blocks,
  violet transforms, neutral structures.
- **`intensity`** — `ghost | medium | firm | strong`. How *loudly*. `medium` is
  the resting tint and the default. These are the core tone names, so a panel
  and a docs page use the same word for the same strength.

Agents write `tone="green"` and, only when a panel earns it,
`intensity="strong"`. The palette does not shout.

## Composition, not opaque colour

Opaque ramp steps (`blue.950`, `amber.950`, …) read as saturated slabs on the
slate environment — six giant colour fields. Instead a tone mixes a **whisper** of
the family with transparent, so it lands over whatever sits behind the panel:

```
surface:  bg="blue.500/medium"           → 10%
hairline: borderColor="blue.500/medium"  → 34%
```

The property picks the amount: `bg` takes the surface value; borders, text and
strokes take the line value. The emitted rule is
`color-mix(in srgb, var(--colors-blue-500) var(--tones-medium-surface), transparent)`.

| intensity | surface | hairline (line) |
| --- | --- | --- |
| ghost | 4% | 22% |
| medium | 10% | 34% |
| firm | 14% | 46% |
| strong | 18% | 58% |

Hairlines climb in even twelve-point steps, so a tint stays legible as an edge
without becoming a line.

**The resting surface is `medium`.** It is the default, so a panel asks for a
tone and nothing else, and the whole kit sits at one tint. Context then decides
the rest, to taste: a panel *stacked inside* a stage steps up to `firm` so it
reads as depth, and `strong` is reserved for a surface that must read as
coloured.

**Mix in srgb, against transparent.** Tones use `in srgb`. One side of the mix is
transparent, so the colour comes from the family alone: `blue.500/medium` is
`blue.500` at 10% alpha, with no hue moving. srgb and oklab therefore give the same
result for tones. The oklab rule from the old opaque-panel composite only mattered
when two opaque colours were blended, which a tone never does. Never use oklch: it
interpolates hue around the wheel, so a near-neutral (hue ~265) mixed with amber
(~70) swings through magenta, and green through cyan.

**Toned surfaces are transparent-based.** A toned panel no longer lands on
`diagramPanel`; it shows what sits behind it. On the canvas that makes a toned
panel a shade *darker* than a neutral one in both modes: the canvas is darker than
the white panel in light, and slate.950 is darker than slate.900 in dark. A toned
panel nested in a stage composites over that stage's tint, so tints stack.

## Ink rules

- A **toned** panel titles in the lighter shade of its own family
  (`diagram<Family>Text` = `X.400` dark / `X.600` light): blue titles on blue,
  green on green, amber on amber.
- A **neutral** panel titles near-white (`docsText`).
- **Body text is always near-white**; secondary copy is `docsMuted`. Tone is for
  the title and accents — never prose.

## Tone shades for sub-elements

A toned section tints its own visual elements rather than falling back to slate.
Each one takes a core tone, so no element carries a hand-written tint:

- **trays** (code blocks, checklist boxes) and **chips**: `firm` (14%).
- **meters**: filled bar `solid`; empty track `firm`. The track was 16% and snaps
  to the nearest core step.
- **pills / badges** (`Static CSS`, `Rust + Oxc`, `Build time`) and stage numbers:
  `strong` (18%).
- **window dots**: `solid`.

`solid` is the one docs-only tone, declared in `diagram-theme.fragments.ts`. Its
70% fill has no core step, because the scale tops out at 18%. A **neutral**
section keeps slate trays. No tone, no tint.

## The frame / surface split (why it is built this way)

StyleProps compile to atomic classes, and two classes that set the same property
fight by stylesheet order, not call order. So a panel is assembled from classes
that each own **disjoint** properties:

```
frame        (border-width, radius, padding, flex, gap, colour-role)
+ surface    (bg + border-colour)
+ border-style (solid | dashed)
+ align      (align-items, text-align)
```

No class sets `background` twice, so composition is safe. Trays follow the same
pattern: a colourless shape class (`codeBlock`, `checkBox`, `chip`, `bar`) plus a
bg-only tray class (`trayNeutral` / `trayBlue` / `trayGreen`).

## Rules still to settle

1. **Toned base brightness — settled.** Toned surfaces are transparent-based (see
   Composition), so a toned panel sits darker than a neutral one, not lighter.
2. **`intensity` carries depth as well as loudness.** A panel stacked inside a stage
   uses `intensity="firm"` to read as depth — that is now the convention, not an
   anomaly. A dedicated `raised` variant would split the two axes if they ever need
   to move independently.
3. **Trays are hard-coded per family** (`trayBlue`, `trayGreen`). Add one per
   tone, or a general mechanism, when amber/violet sections appear.
4. **Body text in toned sections** is still `docsText`. Decide whether prose
   should pick up the tone at all (current answer: no).
5. **Stage badges** are neutral in neutral stages and tone-tinted in toned stages
   — confirm that is the intent for every stage.
