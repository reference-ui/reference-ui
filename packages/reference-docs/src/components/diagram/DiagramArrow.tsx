import { Div, Span, Svg, css } from '@reference-ui/react'
import type { DiagramDirection } from './Diagram'

/**
 * Diagram arrow: the connection. A fixed shaft-plus-head glyph with an
 * optional short label — the verb of the handoff. Vertical arrows stack the
 * label past the glyph; horizontal arrows set it beside. Always self-centers
 * on the cross axis, so it sits quietly between stretched panels and rows.
 */

const arrowDownClass = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  alignSelf: 'center',
  flexShrink: '0',
  gap: '1r',
  minWidth: '0',
})

const arrowUpClass = css({
  display: 'flex',
  flexDirection: 'column-reverse',
  alignItems: 'center',
  alignSelf: 'center',
  flexShrink: '0',
  gap: '1r',
  minWidth: '0',
})

const arrowRightClass = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  alignSelf: 'center',
  flexShrink: '0',
  gap: '2r',
  minWidth: '0',
})

const arrowLeftClass = css({
  display: 'flex',
  flexDirection: 'row-reverse',
  alignItems: 'center',
  alignSelf: 'center',
  flexShrink: '0',
  gap: '2r',
  minWidth: '0',
})

const arrowClass: Record<DiagramDirection, string> = {
  down: arrowDownClass,
  up: arrowUpClass,
  right: arrowRightClass,
  left: arrowLeftClass,
}

const arrowLabelDown = css({
  fontSize: 'sm',
  color: 'docsMuted',
  textAlign: 'center',
  lineHeight: '1.4',
})

const arrowLabelUp = css({
  fontSize: 'sm',
  color: 'docsMuted',
  textAlign: 'center',
  lineHeight: '1.4',
})

const arrowLabelRight = css({
  fontSize: 'sm',
  color: 'docsMuted',
  textAlign: 'left',
  lineHeight: '1.4',
})

const arrowLabelLeft = css({
  fontSize: 'sm',
  color: 'docsMuted',
  textAlign: 'right',
  lineHeight: '1.4',
})

const arrowLabelClass: Record<DiagramDirection, string> = {
  down: arrowLabelDown,
  up: arrowLabelUp,
  right: arrowLabelRight,
  left: arrowLabelLeft,
}

type ArrowGlyph = {
  viewBox: string
  width: number
  height: number
  shaft: { x: number; y: number; width: number; height: number }
  head: string
}

/** Shaft-plus-head geometry per direction. Plain SVG attributes, safe to select at runtime. */
const arrowGlyph: Record<DiagramDirection, ArrowGlyph> = {
  down: {
    viewBox: '0 0 10 26',
    width: 10,
    height: 26,
    shaft: { x: 4, y: 0, width: 2, height: 17 },
    head: 'M1 17 L9 17 L5 25 Z',
  },
  up: {
    viewBox: '0 0 10 26',
    width: 10,
    height: 26,
    shaft: { x: 4, y: 9, width: 2, height: 17 },
    head: 'M1 9 L9 9 L5 1 Z',
  },
  right: {
    viewBox: '0 0 26 10',
    width: 26,
    height: 10,
    shaft: { x: 0, y: 4, width: 17, height: 2 },
    head: 'M17 1 L17 9 L25 5 Z',
  },
  left: {
    viewBox: '0 0 26 10',
    width: 26,
    height: 10,
    shaft: { x: 9, y: 4, width: 17, height: 2 },
    head: 'M9 1 L9 9 L1 5 Z',
  },
}

export type DiagramArrowProps = {
  direction?: DiagramDirection
  label?: string
}

export function DiagramArrow({ direction = 'down', label }: DiagramArrowProps) {
  const glyph = arrowGlyph[direction]
  return (
    <Div className={arrowClass[direction]}>
      <Svg
        viewBox={glyph.viewBox}
        width={glyph.width}
        height={glyph.height}
        color="diagramArrow"
        aria-hidden="true"
      >
        <rect
          x={glyph.shaft.x}
          y={glyph.shaft.y}
          width={glyph.shaft.width}
          height={glyph.shaft.height}
          fill="currentColor"
        />
        <path d={glyph.head} fill="currentColor" />
      </Svg>
      {label ? <Span className={arrowLabelClass[direction]}>{label}</Span> : null}
    </Div>
  )
}
