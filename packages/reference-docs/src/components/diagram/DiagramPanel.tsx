import type { ReactNode } from 'react'
import { Div, css } from '@reference-ui/react'
import type {
  DiagramIntensity,
  DiagramPanelAlign,
  DiagramPanelVariant,
  DiagramTone,
} from './Diagram'

/**
 * Diagram panel: the surface. A frame carries the structure and nothing else;
 * a tone class carries the colour; a border style and an align class finish it.
 * Splitting them keeps the classes from fighting over the same property, and
 * every value stays a static literal so `ref sync` extracts each one.
 *
 * A tone is a whisper of its family composited over the neutral panel, never an
 * opaque slab, so a toned panel still belongs to the diagram's environment. The
 * composite is `color-mix(in oklab, …)` — oklch rotates hue, which swung amber
 * to magenta and green to cyan. `var(--colors-diagram-panel)` resolves per mode,
 * so one literal serves both light and dark.
 *
 * Intensity is local to the diagram and mirrors Arc's `arcIntensity` vocabulary
 * — ghost 4 · medium 10 · firm 14 · strong 18. `medium` is the resting tint, so
 * a toned panel needs no intensity prop; reach past it only when a panel earns
 * it. These are deliberately not Reference UI tokens yet.
 */

type TonefulTone = Exclude<DiagramTone, 'neutral'>

/* Structure only: no background or border colour, so any tone can layer on. */
const panelFrame = css({
  borderWidth: '1px',
  borderRadius: 'diagramPanel',
  padding: '5r',
  flex: '1 1 0',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  color: 'docsText',
})

const borderSolid = css({ borderStyle: 'solid' })
const borderDashed = css({ borderStyle: 'dashed' })

const panelNeutralFill = css({ bg: 'diagramPanel', borderColor: 'diagramBorder' })
const panelNeutralOutline = css({ bg: 'transparent', borderColor: 'diagramBorder' })

/*
 * Tone surfaces: the family at 500 composited over the neutral panel, four
 * intensities each. Surface and hairline share one family; only the amount
 * changes, so the hue is identical at every intensity.
 *
 * The convention: a resting surface is `medium`, which is the default, so a
 * panel asks for a tone and nothing else. A panel stacked inside a stage steps
 * up to `firm`; `strong` is for a surface that must read as coloured. Context
 * decides, to taste. Hairlines climb in even twelve-point steps so an edge
 * stays legible without becoming a line.
 */
const toneSurface: Record<TonefulTone, Record<DiagramIntensity, string>> = {
  blue: {
    ghost: css({
      bg: 'color-mix(in oklab, var(--colors-blue-500) 4%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-blue-500) 22%, var(--colors-diagram-border))',
    }),
    medium: css({
      bg: 'color-mix(in oklab, var(--colors-blue-500) 10%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-blue-500) 34%, var(--colors-diagram-border))',
    }),
    firm: css({
      bg: 'color-mix(in oklab, var(--colors-blue-500) 14%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-blue-500) 46%, var(--colors-diagram-border))',
    }),
    strong: css({
      bg: 'color-mix(in oklab, var(--colors-blue-500) 18%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-blue-500) 58%, var(--colors-diagram-border))',
    }),
  },
  green: {
    ghost: css({
      bg: 'color-mix(in oklab, var(--colors-green-500) 4%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-green-500) 22%, var(--colors-diagram-border))',
    }),
    medium: css({
      bg: 'color-mix(in oklab, var(--colors-green-500) 10%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-green-500) 34%, var(--colors-diagram-border))',
    }),
    firm: css({
      bg: 'color-mix(in oklab, var(--colors-green-500) 14%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-green-500) 46%, var(--colors-diagram-border))',
    }),
    strong: css({
      bg: 'color-mix(in oklab, var(--colors-green-500) 18%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-green-500) 58%, var(--colors-diagram-border))',
    }),
  },
  amber: {
    ghost: css({
      bg: 'color-mix(in oklab, var(--colors-amber-500) 4%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-amber-500) 22%, var(--colors-diagram-border))',
    }),
    medium: css({
      bg: 'color-mix(in oklab, var(--colors-amber-500) 10%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-amber-500) 34%, var(--colors-diagram-border))',
    }),
    firm: css({
      bg: 'color-mix(in oklab, var(--colors-amber-500) 14%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-amber-500) 46%, var(--colors-diagram-border))',
    }),
    strong: css({
      bg: 'color-mix(in oklab, var(--colors-amber-500) 18%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-amber-500) 58%, var(--colors-diagram-border))',
    }),
  },
  red: {
    ghost: css({
      bg: 'color-mix(in oklab, var(--colors-red-500) 4%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-red-500) 22%, var(--colors-diagram-border))',
    }),
    medium: css({
      bg: 'color-mix(in oklab, var(--colors-red-500) 10%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-red-500) 34%, var(--colors-diagram-border))',
    }),
    firm: css({
      bg: 'color-mix(in oklab, var(--colors-red-500) 14%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-red-500) 46%, var(--colors-diagram-border))',
    }),
    strong: css({
      bg: 'color-mix(in oklab, var(--colors-red-500) 18%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-red-500) 58%, var(--colors-diagram-border))',
    }),
  },
  violet: {
    ghost: css({
      bg: 'color-mix(in oklab, var(--colors-violet-500) 4%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-violet-500) 22%, var(--colors-diagram-border))',
    }),
    medium: css({
      bg: 'color-mix(in oklab, var(--colors-violet-500) 10%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-violet-500) 34%, var(--colors-diagram-border))',
    }),
    firm: css({
      bg: 'color-mix(in oklab, var(--colors-violet-500) 14%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-violet-500) 46%, var(--colors-diagram-border))',
    }),
    strong: css({
      bg: 'color-mix(in oklab, var(--colors-violet-500) 18%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-violet-500) 58%, var(--colors-diagram-border))',
    }),
  },
}

/** Alignment touches only cross-axis props, so it layers over any surface. */
const panelAlignClass: Record<DiagramPanelAlign, string> = {
  start: css({ alignItems: 'flex-start' }),
  center: css({ alignItems: 'center', textAlign: 'center' }),
  stretch: css({ alignItems: 'stretch' }),
}

export type DiagramPanelProps = {
  children: ReactNode
  tone?: DiagramTone
  intensity?: DiagramIntensity
  variant?: DiagramPanelVariant
  align?: DiagramPanelAlign
  className?: string
}

export function DiagramPanel({
  children,
  tone = 'neutral',
  intensity = 'medium',
  variant = 'fill',
  align = 'stretch',
  className,
}: DiagramPanelProps) {
  const surface =
    tone === 'neutral'
      ? variant === 'fill'
        ? panelNeutralFill
        : panelNeutralOutline
      : toneSurface[tone][intensity]
  const composed = `${panelFrame} ${variant === 'fill' ? borderSolid : borderDashed} ${
    panelAlignClass[align]
  } ${surface}`
  return <Div className={className ? `${composed} ${className}` : composed}>{children}</Div>
}
