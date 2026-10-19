// Docs diagram kit: canvas, rows, columns, panels, and arrows.
// It takes ordinary Reference UI content and emits composed diagrams; every style is a
// static css() call site so ref sync can extract it. Props only select among precompiled
// classes, and the kit owns no content of its own.
import type { ReactNode } from 'react'
import { Div, css } from '@reference-ui/react'
import './diagram-theme.fragments'
import { DiagramArrow } from './DiagramArrow'
import { DiagramPanel } from './DiagramPanel'

/**
 * Docs diagram kit. Five pieces: Diagram is the canvas, Row and Column lay
 * out, Panel is the surface, Arrow connects. Content — text, code, icons,
 * pills — always comes from ordinary Reference UI components; this module
 * owns no content of its own.
 *
 * Every style below is a static `css()` call site so `ref sync` can extract
 * it. Props only select among precompiled classes; nothing dynamic ever
 * reaches a style prop or a `css()` object.
 */

export type DiagramGap = '2r' | '4r' | '6r'
export type DiagramAlign = 'start' | 'center' | 'end' | 'stretch'
export type DiagramTone = 'neutral' | 'blue' | 'green' | 'amber' | 'red' | 'violet'
export type DiagramIntensity = 'ghost' | 'medium' | 'firm' | 'strong'
export type DiagramDirection = 'down' | 'up' | 'right' | 'left'
export type DiagramPanelVariant = 'fill' | 'outline'
export type DiagramPanelAlign = 'start' | 'center' | 'stretch'

const canvasClass = css({
  bg: 'diagramCanvas',
  borderRadius: 'diagramCanvas',
  padding: '6r',
  display: 'flex',
  flexDirection: 'column',
  gap: '4r',
  overflowX: 'auto',
  color: 'docsText',
})

const rowClass = css({ display: 'flex', flexDirection: 'row' })
const columnClass = css({ display: 'flex', flexDirection: 'column' })

const gapClass: Record<DiagramGap, string> = {
  '2r': css({ gap: '2r' }),
  '4r': css({ gap: '4r' }),
  '6r': css({ gap: '6r' }),
}

const alignClass: Record<DiagramAlign, string> = {
  start: css({ alignItems: 'flex-start' }),
  center: css({ alignItems: 'center' }),
  end: css({ alignItems: 'flex-end' }),
  stretch: css({ alignItems: 'stretch' }),
}

type DiagramRootProps = {
  children: ReactNode
  className?: string
}

function DiagramRoot({ children, className }: DiagramRootProps) {
  return <Div className={className ? `${canvasClass} ${className}` : canvasClass}>{children}</Div>
}

type DiagramRowProps = {
  children: ReactNode
  gap?: DiagramGap
  align?: DiagramAlign
  className?: string
}

function DiagramRow({ children, gap = '4r', align = 'stretch', className }: DiagramRowProps) {
  const composed = `${rowClass} ${gapClass[gap]} ${alignClass[align]}`
  return <Div className={className ? `${composed} ${className}` : composed}>{children}</Div>
}

type DiagramColumnProps = {
  children: ReactNode
  gap?: DiagramGap
  align?: DiagramAlign
  className?: string
}

function DiagramColumn({ children, gap = '4r', align = 'stretch', className }: DiagramColumnProps) {
  const composed = `${columnClass} ${gapClass[gap]} ${alignClass[align]}`
  return <Div className={className ? `${composed} ${className}` : composed}>{children}</Div>
}

/**
 * The diagram compound. `Diagram` alone is the canvas; Row, Column, Panel,
 * and Arrow compose inside it. Nest freely — except a Diagram never nests
 * inside another Diagram.
 */
export const Diagram = Object.assign(DiagramRoot, {
  Row: DiagramRow,
  Column: DiagramColumn,
  Panel: DiagramPanel,
  Arrow: DiagramArrow,
})
