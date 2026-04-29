import { css } from '@reference-ui/react'
import { cssSelectorsMatrixConstants } from './constants'

export const descendantSelectorClass = css({
  '& [data-slot=inner]': {
    marginTop: cssSelectorsMatrixConstants.descendantMarginTop,
  },
})

export const hoverSelectorClass = css({
  textDecoration: 'none',
  '&:hover': {
    textDecoration: cssSelectorsMatrixConstants.hoverTextDecoration,
  },
})

export const selfAttributeSelectorClass = css({
  borderStyle: 'solid',
  '&[data-component=card]': {
    borderTopWidth: cssSelectorsMatrixConstants.selfAttributeBorderTopWidth,
  },
})

export const selfAttributeHoverSelectorClass = css({
  borderStyle: 'solid',
  '&[data-component=card]:hover': {
    borderTopWidth: cssSelectorsMatrixConstants.selfAttributeHoverBorderTopWidth,
  },
})

export const selfAttributeQuotedSelectorClass = css({
  borderStyle: 'solid',
  '&[data-component="card"]': {
    borderRightWidth: cssSelectorsMatrixConstants.selfAttributeQuotedBorderRightWidth,
  },
})

export const selfAttributeStateSelectorClass = css({
  borderStyle: 'solid',
  '&[data-component=card][data-state=open]': {
    borderLeftWidth: cssSelectorsMatrixConstants.selfAttributeStateBorderLeftWidth,
  },
})

export const cssSelectorsMatrixClasses = {
  descendantSelector: descendantSelectorClass,
  hoverSelector: hoverSelectorClass,
  selfAttribute: selfAttributeSelectorClass,
  selfAttributeHover: selfAttributeHoverSelectorClass,
  selfAttributeQuoted: selfAttributeQuotedSelectorClass,
  selfAttributeState: selfAttributeStateSelectorClass,
} as const