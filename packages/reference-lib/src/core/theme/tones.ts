// Tone tokens: named surface/line mix amounts for `color/intensity` pairs.
// It takes nothing and emits the ghost/medium/firm/strong tone tree.
import { tokens } from '@reference-ui/system'

/**
 * Tones: a named opacity a colour is mixed with, used as `bg="blue.500/medium"`.
 * `surface` is the amount for areas (backgrounds, fills); `line` is the stronger
 * amount for edges and text (borders, outlines, strokes, rules). Values are
 * percentages of the colour mixed with transparent, so a theme retunes the
 * amount without touching the colour. Projects override or add tones with their
 * own `tokens({ tones })`.
 */
export const tones = {
  ghost: { surface: { value: '4%' }, line: { value: '22%' } },
  medium: { surface: { value: '10%' }, line: { value: '34%' } },
  firm: { surface: { value: '14%' }, line: { value: '46%' } },
  strong: { surface: { value: '18%' }, line: { value: '58%' } },
} as const

tokens({ tones })
