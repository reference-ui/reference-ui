import type { ReactNode } from 'react'
import { Div, css } from '@reference-ui/react'
import type { DiagramPanelAlign, DiagramPanelVariant, DiagramTone } from './Diagram'

/**
 * Diagram panel: the surface. Twelve precompiled tone-by-variant classes —
 * every value a static literal, so `ref sync` extracts each one. Props only
 * select; nothing dynamic reaches a style.
 *
 * Tone recipe: the ramp washed 12% over the panel surface, the hairline
 * folding the same ramp 40% into the panel border. Translucency keeps one
 * recipe legible in both color modes.
 */

const panelNeutralFill = css({
  bg: 'diagramPanel',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'diagramBorder',
  borderRadius: 'diagramPanel',
  padding: '5r',
  flex: '1 1 0',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  color: 'docsText',
})

const panelNeutralOutline = css({
  bg: 'transparent',
  borderWidth: '1px',
  borderStyle: 'dashed',
  borderColor: 'diagramBorder',
  borderRadius: 'diagramPanel',
  padding: '5r',
  flex: '1 1 0',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  color: 'docsText',
})

const panelBlueFill = css({
  bg: 'color-mix(in oklch, var(--colors-blue-500) 12%, var(--colors-diagram-panel))',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'color-mix(in oklch, var(--colors-blue-500) 40%, var(--colors-diagram-border))',
  borderRadius: 'diagramPanel',
  padding: '5r',
  flex: '1 1 0',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  color: 'docsText',
})

const panelBlueOutline = css({
  bg: 'color-mix(in oklch, var(--colors-blue-500) 12%, var(--colors-diagram-panel))',
  borderWidth: '1px',
  borderStyle: 'dashed',
  borderColor: 'color-mix(in oklch, var(--colors-blue-500) 40%, var(--colors-diagram-border))',
  borderRadius: 'diagramPanel',
  padding: '5r',
  flex: '1 1 0',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  color: 'docsText',
})

const panelGreenFill = css({
  bg: 'color-mix(in oklch, var(--colors-green-500) 12%, var(--colors-diagram-panel))',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'color-mix(in oklch, var(--colors-green-500) 40%, var(--colors-diagram-border))',
  borderRadius: 'diagramPanel',
  padding: '5r',
  flex: '1 1 0',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  color: 'docsText',
})

const panelGreenOutline = css({
  bg: 'color-mix(in oklch, var(--colors-green-500) 12%, var(--colors-diagram-panel))',
  borderWidth: '1px',
  borderStyle: 'dashed',
  borderColor: 'color-mix(in oklch, var(--colors-green-500) 40%, var(--colors-diagram-border))',
  borderRadius: 'diagramPanel',
  padding: '5r',
  flex: '1 1 0',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  color: 'docsText',
})

const panelAmberFill = css({
  bg: 'color-mix(in oklch, var(--colors-amber-500) 12%, var(--colors-diagram-panel))',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'color-mix(in oklch, var(--colors-amber-500) 40%, var(--colors-diagram-border))',
  borderRadius: 'diagramPanel',
  padding: '5r',
  flex: '1 1 0',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  color: 'docsText',
})

const panelAmberOutline = css({
  bg: 'color-mix(in oklch, var(--colors-amber-500) 12%, var(--colors-diagram-panel))',
  borderWidth: '1px',
  borderStyle: 'dashed',
  borderColor: 'color-mix(in oklch, var(--colors-amber-500) 40%, var(--colors-diagram-border))',
  borderRadius: 'diagramPanel',
  padding: '5r',
  flex: '1 1 0',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  color: 'docsText',
})

const panelRedFill = css({
  bg: 'color-mix(in oklch, var(--colors-red-500) 12%, var(--colors-diagram-panel))',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'color-mix(in oklch, var(--colors-red-500) 40%, var(--colors-diagram-border))',
  borderRadius: 'diagramPanel',
  padding: '5r',
  flex: '1 1 0',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  color: 'docsText',
})

const panelRedOutline = css({
  bg: 'color-mix(in oklch, var(--colors-red-500) 12%, var(--colors-diagram-panel))',
  borderWidth: '1px',
  borderStyle: 'dashed',
  borderColor: 'color-mix(in oklch, var(--colors-red-500) 40%, var(--colors-diagram-border))',
  borderRadius: 'diagramPanel',
  padding: '5r',
  flex: '1 1 0',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  color: 'docsText',
})

const panelVioletFill = css({
  bg: 'color-mix(in oklch, var(--colors-violet-500) 12%, var(--colors-diagram-panel))',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'color-mix(in oklch, var(--colors-violet-500) 40%, var(--colors-diagram-border))',
  borderRadius: 'diagramPanel',
  padding: '5r',
  flex: '1 1 0',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  color: 'docsText',
})

const panelVioletOutline = css({
  bg: 'color-mix(in oklch, var(--colors-violet-500) 12%, var(--colors-diagram-panel))',
  borderWidth: '1px',
  borderStyle: 'dashed',
  borderColor: 'color-mix(in oklch, var(--colors-violet-500) 40%, var(--colors-diagram-border))',
  borderRadius: 'diagramPanel',
  padding: '5r',
  flex: '1 1 0',
  minWidth: '0',
  display: 'flex',
  flexDirection: 'column',
  gap: '2r',
  color: 'docsText',
})

const panelClass: Record<DiagramTone, Record<DiagramPanelVariant, string>> = {
  neutral: { fill: panelNeutralFill, outline: panelNeutralOutline },
  blue: { fill: panelBlueFill, outline: panelBlueOutline },
  green: { fill: panelGreenFill, outline: panelGreenOutline },
  amber: { fill: panelAmberFill, outline: panelAmberOutline },
  red: { fill: panelRedFill, outline: panelRedOutline },
  violet: { fill: panelVioletFill, outline: panelVioletOutline },
}

/** Alignment touches only cross-axis props, so it layers over any panel class. */
const panelAlignClass: Record<DiagramPanelAlign, string> = {
  start: css({ alignItems: 'flex-start' }),
  center: css({ alignItems: 'center', textAlign: 'center' }),
  stretch: css({ alignItems: 'stretch' }),
}

export type DiagramPanelProps = {
  children: ReactNode
  tone?: DiagramTone
  variant?: DiagramPanelVariant
  align?: DiagramPanelAlign
  className?: string
}

export function DiagramPanel({
  children,
  tone = 'neutral',
  variant = 'fill',
  align = 'stretch',
  className,
}: DiagramPanelProps) {
  const composed = `${panelClass[tone][variant]} ${panelAlignClass[align]}`
  return <Div className={className ? `${composed} ${className}` : composed}>{children}</Div>
}
