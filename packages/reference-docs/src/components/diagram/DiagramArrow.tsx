import { Div, Span, css } from '@reference-ui/react'
import type { DiagramDirection } from './Diagram'

/**
 * Diagram arrow: the connection. A fixed-length rail — a hairline shaft closed
 * by a solid triangular head — with the label set as a pill straddling the
 * shaft's centre. The rail length is one value for every arrow, labelled or
 * not, so a stack of arrows reads as one clean column instead of growing with
 * its content.
 *
 * The rail stays neutral; the pill borrows the panel surface and hairline, so
 * the label reads as a stop on the line and ties back to the panels it joins.
 * Every value is a static `css()` call site; the geometry is plain DOM so no
 * intrinsic-size prop can be dropped by the style engine.
 */

/** Total rail length, identical for every direction and every arrow. */
const RAIL = '4.5rem'
/** Hairline shaft thickness, across the flow. */
const SHAFT = '2px'
/** Head depth along the flow. */
const HEAD = '9px'
/** Head width across the flow. */
const HEAD_WIDE = '12px'

/*
 * Each rail repeats the shared frame verbatim: `css()` returns a class name,
 * not a style object, so spreading a base class would spread a string and drop
 * the frame — including the `position` the absolute shaft depends on.
 */
/* Vertical rails fix the height; width hugs the pill (floored at the head). */
const railDown = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
  flexShrink: '0',
  height: RAIL,
  minWidth: HEAD_WIDE,
})

const railUp = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
  flexShrink: '0',
  height: RAIL,
  minWidth: HEAD_WIDE,
})

/* Horizontal rails fix the width; a label narrower than the rail centres on it
 * and one wider overflows evenly into the gaps, so the rail length never drifts
 * with its content. */
const railRight = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
  flexShrink: '0',
  width: RAIL,
  minHeight: HEAD_WIDE,
})

const railLeft = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
  flexShrink: '0',
  width: RAIL,
  minHeight: HEAD_WIDE,
})

const railClass: Record<DiagramDirection, string> = {
  down: railDown,
  up: railUp,
  right: railRight,
  left: railLeft,
}

/* Shaft stops exactly where the head's base begins, so the two meet cleanly. */
const shaftDown = css({
  position: 'absolute',
  top: '0',
  bottom: HEAD,
  left: '50%',
  width: SHAFT,
  transform: 'translateX(-50%)',
  bg: 'diagramArrow',
  borderRadius: 'full',
})

const shaftUp = css({
  position: 'absolute',
  top: HEAD,
  bottom: '0',
  left: '50%',
  width: SHAFT,
  transform: 'translateX(-50%)',
  bg: 'diagramArrow',
  borderRadius: 'full',
})

const shaftRight = css({
  position: 'absolute',
  left: '0',
  right: HEAD,
  top: '50%',
  height: SHAFT,
  transform: 'translateY(-50%)',
  bg: 'diagramArrow',
  borderRadius: 'full',
})

const shaftLeft = css({
  position: 'absolute',
  left: HEAD,
  right: '0',
  top: '50%',
  height: SHAFT,
  transform: 'translateY(-50%)',
  bg: 'diagramArrow',
  borderRadius: 'full',
})

const shaftClass: Record<DiagramDirection, string> = {
  down: shaftDown,
  up: shaftUp,
  right: shaftRight,
  left: shaftLeft,
}

/*
 * Heads are CSS border triangles. `border-style: solid` switches on every
 * side, so each class pins all four widths: the unused side collapses to 0,
 * otherwise it paints a stray `currentColor` edge.
 */
const headDown = css({
  position: 'absolute',
  bottom: '0',
  left: '50%',
  width: '0',
  height: '0',
  borderStyle: 'solid',
  borderTopWidth: HEAD,
  borderTopColor: 'diagramArrow',
  borderRightWidth: '6px',
  borderRightColor: 'transparent',
  borderBottomWidth: '0',
  borderLeftWidth: '6px',
  borderLeftColor: 'transparent',
  transform: 'translateX(-50%)',
})

const headUp = css({
  position: 'absolute',
  top: '0',
  left: '50%',
  width: '0',
  height: '0',
  borderStyle: 'solid',
  borderBottomWidth: HEAD,
  borderBottomColor: 'diagramArrow',
  borderLeftWidth: '6px',
  borderLeftColor: 'transparent',
  borderRightWidth: '6px',
  borderRightColor: 'transparent',
  borderTopWidth: '0',
  transform: 'translateX(-50%)',
})

const headRight = css({
  position: 'absolute',
  right: '0',
  top: '50%',
  width: '0',
  height: '0',
  borderStyle: 'solid',
  borderLeftWidth: HEAD,
  borderLeftColor: 'diagramArrow',
  borderTopWidth: '6px',
  borderTopColor: 'transparent',
  borderBottomWidth: '6px',
  borderBottomColor: 'transparent',
  borderRightWidth: '0',
  transform: 'translateY(-50%)',
})

const headLeft = css({
  position: 'absolute',
  left: '0',
  top: '50%',
  width: '0',
  height: '0',
  borderStyle: 'solid',
  borderRightWidth: HEAD,
  borderRightColor: 'diagramArrow',
  borderTopWidth: '6px',
  borderTopColor: 'transparent',
  borderBottomWidth: '6px',
  borderBottomColor: 'transparent',
  borderLeftWidth: '0',
  transform: 'translateY(-50%)',
})

const headClass: Record<DiagramDirection, string> = {
  down: headDown,
  up: headUp,
  right: headRight,
  left: headLeft,
}

const pillClass = css({
  position: 'relative',
  bg: 'diagramPanel',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'diagramBorder',
  borderRadius: 'full',
  paddingX: '3r',
  paddingY: '1r',
  fontSize: 'sm',
  lineHeight: '1.2',
  color: 'diagramMuted',
  whiteSpace: 'nowrap',
})

export type DiagramArrowProps = {
  direction?: DiagramDirection
  label?: string
}

export function DiagramArrow({ direction = 'down', label }: DiagramArrowProps) {
  return (
    <Div className={railClass[direction]}>
      <Div className={shaftClass[direction]} />
      <Div className={headClass[direction]} />
      {label ? <Span className={pillClass}>{label}</Span> : null}
    </Div>
  )
}
