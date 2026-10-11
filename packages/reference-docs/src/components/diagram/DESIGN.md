# Diagram design — colour composition

How the docs diagram kit looks, and the rules we want to keep. The palette lives
in `diagram-theme.fragments.ts`; the surface treatment lives in `DiagramPanel.tsx`.
Everything else (`Diagram.tsx` types, `DiagramArrow`, the `specimen-*` files) is
structure or content.

## The environment

Every panel belongs to **one environment**: the midnight slate ramp.

| role | light | dark |
| --- | --- | --- |
| canvas | `slate.100` | `slate.950` |
| panel | `#ffffff` | `slate.900` |
| hairline | `slate.200` | `slate.800` |
| chip / inset | `slate.100` | `slate.800` |

A tone never replaces the environment — it is composited **over** it (below).

## Tone is meaning, intensity is loudness

Two orthogonal axes, both owned by the primitive, not the caller's judgement:

- **`tone`** — `neutral | blue | green | amber | red | violet`. What the panel
  *means*: blue builds, green generates/confirms, amber fences, red blocks,
  violet transforms, neutral structures.
- **`intensity`** — `ghost | medium | firm | strong`. How *loudly*. `medium` is
  the resting tint and the default.

The four intensities are Arc's `arcIntensity` vocabulary (ghost 4 · medium 10 ·
firm 14 · strong 18), kept local to the diagram kit rather than promoted to
Reference UI tokens. Agents write `tone="green"` and, only when a panel earns it,
`intensity="strong"`. The palette does not shout.

## Composition, not opaque colour

Opaque ramp steps (`blue.950`, `amber.950`, …) read as saturated slabs on the
slate environment — six giant colour fields. Instead we composite a **whisper**
of the family over the neutral panel:

```
surface:  color-mix(in oklab, var(--colors-<family>-500) N%, var(--colors-diagram-panel))
hairline: color-mix(in oklab, var(--colors-<family>-500) M%, var(--colors-diagram-border))
```

| intensity | surface N | hairline M |
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

**Use `in oklab`, never `in oklch`.** oklch interpolates hue around the wheel:
mixing a near-neutral (hue ~265) with amber (~70) swings through magenta, green
through cyan. oklab blends the a/b axes with no rotation, so amber stays amber.

`var(--colors-diagram-panel)` resolves per colour mode, so **one literal serves
both light and dark** — the surface tokens need no `value`/`dark` pair.

The toned surface is inherently a shade *lighter* than a neutral panel, because
the mix lands on `slate.900` rather than a darker base. That is the current open
question; see below.

## Ink rules

- A **toned** panel titles in the lighter shade of its own family
  (`diagram<Family>Text` = `X.400` dark / `X.600` light): blue titles on blue,
  green on green, amber on amber.
- A **neutral** panel titles near-white (`docsText`).
- **Body text is always near-white**; secondary copy is `docsMuted`. Tone is for
  the title and accents — never prose.

## Tone shades for sub-elements

A toned section tints its own visual elements rather than falling back to slate:

- **trays** (code blocks, checklist boxes) and **chips**:
  `color-mix(in oklab, var(--colors-<family>-500) 14%, var(--colors-diagram-chip))`
- **meters**: filled bar `X-500 70%` over the panel; empty track `X-500 16%`
  over the chip.
- **pills / badges** (`Static CSS`, `Rust + Oxc`, `Build time`) take the same 18%
  family composite.

A **neutral** section keeps slate trays. No tone, no tint.

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

1. **Toned base brightness.** Toned surfaces mix into `diagramPanel` (`slate.900`),
   so a toned panel is always a shade brighter than a neutral one. Consider
   mixing into `slate.950` instead, so a toned panel sits *darker* than neutral.
2. **`intensity` carries depth as well as loudness.** A panel stacked inside a
   stage uses `intensity="firm"` to read as depth — that is now the convention,
   not an anomaly. A dedicated `raised` variant would split the two axes if they
   ever need to move independently.
3. **Trays are hard-coded per family** (`trayBlue`, `trayGreen`). Add one per
   tone, or a general mechanism, when amber/violet sections appear.
4. **Body text in toned sections** is still `docsText`. Decide whether prose
   should pick up the tone at all (current answer: no).
5. **Stage badges** are neutral in neutral stages and tone-tinted in toned stages
   — confirm that is the intent for every stage.
