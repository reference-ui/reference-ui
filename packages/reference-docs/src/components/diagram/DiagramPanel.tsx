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
 * A tone is a core Reference UI tone (`blue.500/medium`): the family mixed with
 * transparent at a named amount. A toned panel is never an opaque slab, and it is
 * not painted over `diagramPanel`; it shows what sits behind it, so it still
 * belongs to the diagram's environment. The property picks the amount: `bg` takes
 * the surface value and `borderColor` takes the line value.
 *
 * Intensity is the core tone name: ghost 4 · medium 10 · firm 14 · strong 18.
 * `medium` is the resting tint, so a toned panel needs no intensity prop; reach
 * past it only when a panel earns it.
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
 * Tone surfaces: each class names its core tone once. `bg` reads the surface
 * amount and `borderColor` the line amount, so the hue is identical at every
 * intensity and the hairline climbs in even twelve-point steps (22 · 34 · 46 · 58).
 *
 * The convention: a resting surface is `medium`, which is the default, so a
 * panel asks for a tone and nothing else. A panel stacked inside a stage steps
 * up to `firm`; `strong` is for a surface that must read as coloured. Context
 * decides, to taste.
 */
const toneSurface: Record<TonefulTone, Record<DiagramIntensity, string>> = {
  blue: {
    ghost: css({ bg: 'blue.500/ghost', borderColor: 'blue.500/ghost' }),
    medium: css({ bg: 'blue.500/medium', borderColor: 'blue.500/medium' }),
    firm: css({ bg: 'blue.500/firm', borderColor: 'blue.500/firm' }),
    strong: css({ bg: 'blue.500/strong', borderColor: 'blue.500/strong' }),
  },
  green: {
    ghost: css({ bg: 'green.500/ghost', borderColor: 'green.500/ghost' }),
    medium: css({ bg: 'green.500/medium', borderColor: 'green.500/medium' }),
    firm: css({ bg: 'green.500/firm', borderColor: 'green.500/firm' }),
    strong: css({ bg: 'green.500/strong', borderColor: 'green.500/strong' }),
  },
  amber: {
    ghost: css({ bg: 'amber.500/ghost', borderColor: 'amber.500/ghost' }),
    medium: css({ bg: 'amber.500/medium', borderColor: 'amber.500/medium' }),
    firm: css({ bg: 'amber.500/firm', borderColor: 'amber.500/firm' }),
    strong: css({ bg: 'amber.500/strong', borderColor: 'amber.500/strong' }),
  },
  red: {
    ghost: css({ bg: 'red.500/ghost', borderColor: 'red.500/ghost' }),
    medium: css({ bg: 'red.500/medium', borderColor: 'red.500/medium' }),
    firm: css({ bg: 'red.500/firm', borderColor: 'red.500/firm' }),
    strong: css({ bg: 'red.500/strong', borderColor: 'red.500/strong' }),
  },
  violet: {
    ghost: css({ bg: 'violet.500/ghost', borderColor: 'violet.500/ghost' }),
    medium: css({ bg: 'violet.500/medium', borderColor: 'violet.500/medium' }),
    firm: css({ bg: 'violet.500/firm', borderColor: 'violet.500/firm' }),
    strong: css({ bg: 'violet.500/strong', borderColor: 'violet.500/strong' }),
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
