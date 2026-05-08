import { css } from '@reference-ui/react'
import { cssMatrixConstants } from './constants'

export const cardClass = css({
  padding: '1rem',
  borderRadius: '12px',
  borderWidth: '2px',
  borderStyle: 'solid',
})

export const componentHoverableClass = css({
  borderWidth: cssMatrixConstants.componentHoverBaseBorderTopWidth,
  borderStyle: 'solid',
  '&[data-component=card]:hover': {
    borderTopWidth: cssMatrixConstants.componentHoverActiveBorderTopWidth,
  },
})

export const hoverableClass = css({
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
})

export const nestedParentClass = css({
  '& [data-slot=inner]': {
    marginTop: '12px',
  },
})

export const positionedClass = css({
  position: 'relative',
  top: '4px',
  left: '8px',
  padding: '0.5rem',
})

export const statefulClass = css({
  borderWidth: '1px',
  borderStyle: 'solid',
})

export const containerProbeClass = css({
  padding: '0.25rem',
  fontSize: '1rem',
  '@container (min-width: 400px)': {
    padding: '1rem',
    fontSize: '1.125rem',
  },
})

export const viewportProbeClass = css({
  paddingTop: '0px',
  backgroundColor: 'transparent',
  color: 'transparent',
  '@media (min-width: 840px)': {
    paddingTop: cssMatrixConstants.viewportProbePadding,
    backgroundColor: cssMatrixConstants.viewportProbeBackground,
    color: cssMatrixConstants.viewportProbeForeground,
  },
})

export const cssMatrixClasses = {
  card: cardClass,
  componentHoverable: componentHoverableClass,
  hoverable: hoverableClass,
  nestedParent: nestedParentClass,
  positioned: positionedClass,
  stateful: statefulClass,
  containerProbe: containerProbeClass,
  viewportProbe: viewportProbeClass,
} as const