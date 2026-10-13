# Diagram design — colour composition

How the docs diagram kit looks, and the rules we want to keep. The palette lives
in `diagram-theme.fragments.ts`; the surface treatment lives in `DiagramPanel.tsx`.
Tones are core Reference UI (`bg="blue.500/medium"`), so the kit spends them
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

A tone never replaces the environment — it is mixed **over** the canvas (below).

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
tone and nothing else, and the whole kit sits at one tint.

**Mix in srgb, against transparent.** Tones use `in srgb`. One side of the mix is
transparent, so the colour comes from the family alone: `blue.500/medium` is
`blue.500` at 10% alpha, with no hue moving. srgb and oklab therefore give the same
result for tones (checked in the browser to within 0.0001 per channel). The oklab
rule from the old opaque-panel composite only mattered when two opaque colours were
blended, which a tone never does. Never use oklch: it interpolates hue around the
wheel, so a near-neutral (hue ~265) mixed with amber (~70) swings through magenta,
and green through cyan.

**A toned surface sits on the canvas.** It does not land on `diagramPanel`, so a
toned panel is a shade *darker* than a neutral one in both modes: the canvas is
darker than the white panel in light, and slate.950 is darker than slate.900 in
dark.

## Tints never sit on tints

A tint sits on the canvas and nowhere else. Inside a toned stage, everything is
neutral or inset:

- **Nested panels** are neutral cards (`diagramPanel`). A toned panel is never
  placed inside another toned panel, so a card's text never sits on a second tint.
- **Insets** — trays, code blocks, chips, pills and stage numbers — sit on
  `diagramChip`, toned section or not. The tone lives in the ink, not the fill.
- **Meters**: the track is a `firm` tint over the neutral card, and the filled
  segments use the docs-only `fill` tone (below).

A neutral stage keeps the same rules; nothing in it was tinted to begin with.

## Ink rules

- **Tone ink** titles a toned panel and its accents. Light steps to the 700 shade:
  `blue.700`, `red.700`, `violet.700` and `green.700`. Green text now sits only on
  neutral cards and insets. Amber titles a tinted panel, where 700 computes to about
  4.3:1, so amber takes `amber.800`. Dark stays at the 400 shade
  (`diagram<Family>Text`). Measured in the browser after this change: light has 152
  text leaves, none below 4.5:1, minimum 4.51 (green 700 labels on an inset chip);
  dark minimum 5.54.
- **Neutral titles** are near-white (`docsText`).
- **Body text is always near-white**; secondary copy is `diagramMuted`. Tone is for
  the title and accents — never prose.
- **`diagramMuted`** is gray.600 in light and gray.400 in dark. In light, the docs
  `docsMuted` (gray.500) falls to about 4.4:1 on the canvas and about 3.8:1 on a
  firm tint, so diagrams use their own secondary ink. Dark matches `docsMuted`.
- **Target:** every text leaf in a diagram clears 4.5:1 in both light and dark.

## Sub-element shades

- **trays, code blocks, chips, pills, stage numbers**: `diagramChip` (neutral inset).
- **meters**: the empty track is `firm`; the filled segments are `fill`.
- **window dots**: `fill`, on the neutral `windowRow` chip.

## The docs-only `fill` tone

`fill` is a docs-only tone (70% on both axes), declared in
`diagram-theme.fragments.ts`. It exists for near-solid marks — meter fills and
window dots — because the core scale stops at strong (18%). It is available to
any docs page that writes `blue.500/fill`, so use it for marks only, never for
text or panels.

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

No class sets `background` twice, so composition is safe. Insets follow the same
pattern: a colourless shape class (`codeBlock`, `checkBox`, `chip`, `bar`) plus a
bg-only inset class (`trayNeutral`).

## Rules still to settle

1. **Toned base brightness — settled.** Toned surfaces sit on the canvas (see
   Composition), so a toned panel sits darker than a neutral one, not lighter.
2. **Light-mode panel titles sit slightly below their pre-tones ratio (accepted).** On the
   slate-100 canvas, `docsText` titles on a medium stage fall from about 18:1 to
   about 16:1 — still far above 4.5:1. The only lever is the light canvas colour,
   which is the environment itself, so it is not changed here.
3. **Body text in toned sections** is still `docsText`. Decide whether prose
   should pick up the tone at all (current answer: no).
