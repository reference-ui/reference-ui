import type { ReactNode } from 'react'
import { Div, css } from '@reference-ui/react'
import type {
  DiagramEmphasis,
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
 * so one literal serves both light and dark. `emphasis` is the intensity
 * vocabulary — subtle is the default; reach past it only when a panel earns it.
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
 * Tone surfaces: the family at 500 composited over the neutral panel, three
 * intensities each. Surface and hairline share one family; only the amount
 * changes, so the hue is identical at every intensity.
 */
const toneSurface: Record<TonefulTone, Record<DiagramEmphasis, string>> = {
  blue: {
    subtle: css({
      bg: 'color-mix(in oklab, var(--colors-blue-500) 8%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-blue-500) 30%, var(--colors-diagram-border))',
    }),
    moderate: css({
      bg: 'color-mix(in oklab, var(--colors-blue-500) 13%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-blue-500) 46%, var(--colors-diagram-border))',
    }),
    strong: css({
      bg: 'color-mix(in oklab, var(--colors-blue-500) 26%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-blue-500) 66%, var(--colors-diagram-border))',
    }),
  },
  green: {
    subtle: css({
      bg: 'color-mix(in oklab, var(--colors-green-500) 8%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-green-500) 30%, var(--colors-diagram-border))',
    }),
    moderate: css({
      bg: 'color-mix(in oklab, var(--colors-green-500) 13%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-green-500) 46%, var(--colors-diagram-border))',
    }),
    strong: css({
      bg: 'color-mix(in oklab, var(--colors-green-500) 26%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-green-500) 66%, var(--colors-diagram-border))',
    }),
  },
  amber: {
    subtle: css({
      bg: 'color-mix(in oklab, var(--colors-amber-500) 8%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-amber-500) 30%, var(--colors-diagram-border))',
    }),
    moderate: css({
      bg: 'color-mix(in oklab, var(--colors-amber-500) 13%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-amber-500) 46%, var(--colors-diagram-border))',
    }),
    strong: css({
      bg: 'color-mix(in oklab, var(--colors-amber-500) 26%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-amber-500) 66%, var(--colors-diagram-border))',
    }),
  },
  red: {
    subtle: css({
      bg: 'color-mix(in oklab, var(--colors-red-500) 8%, var(--colors-diagram-panel))',
      borderColor: 'color-mix(in oklab, var(--colors-red-500) 30%, var(--colors-diagram-border))',
    }),
    moderate: css({
      bg: 'color-mix(in oklab, var(--colors-red-500) 13%, var(--colors-diagram-panel))',
      borderColor: 'color-mix(in oklab, var(--colors-red-500) 46%, var(--colors-diagram-border))',
    }),
    strong: css({
      bg: 'color-mix(in oklab, var(--colors-red-500) 26%, var(--colors-diagram-panel))',
      borderColor: 'color-mix(in oklab, var(--colors-red-500) 66%, var(--colors-diagram-border))',
    }),
  },
  violet: {
    subtle: css({
      bg: 'color-mix(in oklab, var(--colors-violet-500) 8%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-violet-500) 30%, var(--colors-diagram-border))',
    }),
    moderate: css({
      bg: 'color-mix(in oklab, var(--colors-violet-500) 13%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-violet-500) 46%, var(--colors-diagram-border))',
    }),
    strong: css({
      bg: 'color-mix(in oklab, var(--colors-violet-500) 26%, var(--colors-diagram-panel))',
      borderColor:
        'color-mix(in oklab, var(--colors-violet-500) 66%, var(--colors-diagram-border))',
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
  emphasis?: DiagramEmphasis
  variant?: DiagramPanelVariant
  align?: DiagramPanelAlign
  className?: string
}

export function DiagramPanel({
  children,
  tone = 'neutral',
  emphasis = 'subtle',
  variant = 'fill',
  align = 'stretch',
  className,
}: DiagramPanelProps) {
  const surface =
    tone === 'neutral'
      ? variant === 'fill'
        ? panelNeutralFill
        : panelNeutralOutline
      : toneSurface[tone][emphasis]
  const composed = `${panelFrame} ${variant === 'fill' ? borderSolid : borderDashed} ${
    panelAlignClass[align]
  } ${surface}`
  return <Div className={className ? `${composed} ${className}` : composed}>{children}</Div>
}
