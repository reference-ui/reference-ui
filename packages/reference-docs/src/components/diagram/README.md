# Diagram kit — colour composition

How docs diagrams look, and the rules that keep them coherent. Tones are core Reference UI (`bg="blue.500/medium"`), spent rather than mixed by hand.

## The environment

Every panel belongs to one environment: the midnight slate ramp.

| role | light | dark |
| ---- | ----- | ---- |
| canvas | `slate.100` | `slate.950` |
| panel | `#ffffff` | `slate.900` |
| hairline | `slate.200` | `slate.800` |
| chip / inset | `slate.100` | `slate.800` |

A tone never replaces the environment — it mixes over the canvas.

## Tone is meaning, intensity is loudness

- **tone** — `neutral | blue | green | amber | red | violet`. Blue builds, green generates/confirms, amber fences, red blocks, violet transforms, neutral structures.
- **intensity** — `ghost | medium | firm | strong`. `medium` is the resting tint and the default.

## Composition, not opaque colour

A tone mixes a whisper of the family with transparent over whatever sits behind the panel: `bg` takes the surface value, borders, text and strokes take the line value.

| intensity | surface | hairline (line) |
| --------- | ------- | --------------- |
| ghost | 4% | 22% |
| medium | 10% | 34% |
| firm | 14% | 46% |
| strong | 18% | 58% |

Mix in srgb, against transparent: one side of the mix is transparent, so the colour comes from the family alone with no hue moving. Never oklch — it interpolates hue around the wheel and swings near-neutrals through magenta or cyan. A toned surface sits on the canvas, so a toned panel reads darker than a neutral one in both modes.

## Tints never sit on tints

Nested panels are neutral cards; insets (trays, code blocks, chips, pills, stage numbers) sit on the neutral inset, toned section or not. Meter tracks are a `firm` tint; filled segments and window dots use the docs-only `fill` tone (70% both axes, for near-solid marks only — never text or panels).

## Ink rules

- Toned panels take tone ink on titles and accents: light steps to the 700 shade (`amber.800`, which needs the extra step for contrast); dark stays at 400.
- Neutral titles and all body text are near-white; secondary copy takes the diagram muted gray (own token, not the docs one — the docs gray falls below contrast on tints in light mode).
- Target: every text leaf clears 4.5:1 in both modes.

## Frame / surface split

A panel assembles from classes that each own disjoint properties (frame: border-width, radius, padding, flex, gap, colour-role; surface: bg + border-colour; border-style; align), because two classes that set the same property fight by stylesheet order, not call order. Insets follow the same pattern: a colourless shape plus a bg-only inset.
